from typing import Any

from pydantic import BaseModel, ValidationError
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from src.core import DataBaseDep
from src.models import BusinessFeature
from src.models.business_feature_model import BusinessFeatureKey
from src.repositories import BusinessFeatureRepository, BusinessRepository
from src.schemas.business_feature_schema import (
    BusinessFeatureResponse,
    BusinessFeatureUpdate,
    CapacityBasedBookingConfig,
    EmptyFeatureConfig,
    ReminderPolicyConfig,
    ReminderPolicyMode,
    ReplacementClassesConfig,
)
from src.services.redis_cache_invalidator import RedisCacheInvalidator


class BusinessFeatureNotFoundError(Exception):
    pass


class BusinessFeatureConfigError(ValueError):
    pass


FEATURE_CONFIG_MODELS: dict[BusinessFeatureKey, type[BaseModel]] = {
    BusinessFeatureKey.capacity_based_booking: CapacityBasedBookingConfig,
    BusinessFeatureKey.recurring_schedules: EmptyFeatureConfig,
    BusinessFeatureKey.replacement_classes: ReplacementClassesConfig,
    BusinessFeatureKey.trial_appointments: EmptyFeatureConfig,
    BusinessFeatureKey.professional_schedule_notifications: EmptyFeatureConfig,
    BusinessFeatureKey.reminder_policy: ReminderPolicyConfig,
}


def default_feature_config(feature_key: BusinessFeatureKey) -> dict[str, Any]:
    model = FEATURE_CONFIG_MODELS[feature_key]()
    return model.model_dump(mode="json")


def pilates_feature_defaults() -> list[BusinessFeature]:
    enabled_keys = (
        BusinessFeatureKey.capacity_based_booking,
        BusinessFeatureKey.recurring_schedules,
        BusinessFeatureKey.replacement_classes,
        BusinessFeatureKey.trial_appointments,
        BusinessFeatureKey.professional_schedule_notifications,
    )
    features = [
        BusinessFeature(feature_key=key, enabled=True, config=default_feature_config(key))
        for key in enabled_keys
    ]
    features.append(
        BusinessFeature(
            feature_key=BusinessFeatureKey.reminder_policy,
            enabled=True,
            config=ReminderPolicyConfig(mode=ReminderPolicyMode.trial_and_replacement).model_dump(mode="json"),
        )
    )
    return features


class BusinessFeatureService:
    def __init__(
        self,
        db: Session,
        feature_repo: BusinessFeatureRepository,
        business_repo: BusinessRepository,
        cache_invalidator: RedisCacheInvalidator | None = None,
    ):
        self.db = db
        self.feature_repo = feature_repo
        self.business_repo = business_repo
        self.cache_invalidator = cache_invalidator or RedisCacheInvalidator()

    @staticmethod
    def parse_key(feature_key: BusinessFeatureKey | str) -> BusinessFeatureKey:
        try:
            return feature_key if isinstance(feature_key, BusinessFeatureKey) else BusinessFeatureKey(feature_key)
        except ValueError as exc:
            raise BusinessFeatureNotFoundError() from exc

    @staticmethod
    def validate_config(feature_key: BusinessFeatureKey, config: BaseModel | dict[str, Any] | None) -> dict[str, Any]:
        raw = config.model_dump(mode="json") if isinstance(config, BaseModel) else (config or {})
        try:
            return FEATURE_CONFIG_MODELS[feature_key].model_validate(raw).model_dump(mode="json")
        except ValidationError as exc:
            raise BusinessFeatureConfigError(str(exc)) from exc

    def _get_business_or_raise(self, business_id: int):
        business = self.business_repo.get_by_id(self.db, business_id)
        if not business or business.id != business_id:
            raise BusinessFeatureNotFoundError()
        return business

    def get_model(self, business_id: int, feature_key: BusinessFeatureKey | str) -> BusinessFeature | None:
        key = self.parse_key(feature_key)
        self._get_business_or_raise(business_id)
        return self.feature_repo.get_by_key(self.db, business_id, key)

    def get_state(self, business_id: int, feature_key: BusinessFeatureKey | str) -> BusinessFeatureResponse:
        key = self.parse_key(feature_key)
        feature = self.get_model(business_id, key)
        default_enabled = key == BusinessFeatureKey.reminder_policy
        return BusinessFeatureResponse(
            feature_key=key,
            enabled=feature.enabled if feature else default_enabled,
            config=self.validate_config(key, feature.config if feature else None),
        )

    def get_all(self, business_id: int) -> list[BusinessFeatureResponse]:
        self._get_business_or_raise(business_id)
        persisted = {
            item.feature_key: item
            for item in self.feature_repo.get_by_business(self.db, business_id)
        }
        return [
            BusinessFeatureResponse(
                feature_key=key,
                enabled=persisted[key].enabled if key in persisted else key == BusinessFeatureKey.reminder_policy,
                config=self.validate_config(key, persisted[key].config if key in persisted else None),
            )
            for key in BusinessFeatureKey
        ]

    def is_enabled(self, business_id: int, feature_key: BusinessFeatureKey | str) -> bool:
        return self.get_state(business_id, feature_key).enabled

    def get_config(self, business_id: int, feature_key: BusinessFeatureKey | str) -> dict[str, Any]:
        return self.get_state(business_id, feature_key).config

    def set_feature(
        self,
        business_id: int,
        feature_key: BusinessFeatureKey | str,
        data: BusinessFeatureUpdate,
    ) -> BusinessFeatureResponse:
        key = self.parse_key(feature_key)
        business = self._get_business_or_raise(business_id)
        feature = self.feature_repo.get_by_key(self.db, business_id, key, for_update=True)
        current_config = feature.config if feature else default_feature_config(key)
        config = self.validate_config(key, data.config if data.config is not None else current_config)

        if feature is None:
            feature = BusinessFeature(
                business_id=business_id,
                feature_key=key,
                enabled=data.enabled if data.enabled is not None else key == BusinessFeatureKey.reminder_policy,
                config=config,
            )
            self.feature_repo.add(self.db, feature)
        else:
            if data.enabled is not None:
                feature.enabled = data.enabled
            feature.config = config

        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise BusinessFeatureConfigError("Não foi possível salvar a configuração do recurso.")

        self.db.refresh(feature)
        self.cache_invalidator.invalidate_business_context(business.phone)
        return BusinessFeatureResponse(
            feature_key=feature.feature_key,
            enabled=feature.enabled,
            config=self.validate_config(key, feature.config),
        )


def get_business_feature_service(db: DataBaseDep):
    return BusinessFeatureService(
        db,
        BusinessFeatureRepository(),
        BusinessRepository(),
        RedisCacheInvalidator(),
    )
