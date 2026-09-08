from types import SimpleNamespace

import pytest
from pydantic import ValidationError

from src.models import BusinessFeature, BusinessFeatureKey, BusinessType
from src.schemas import BusinessCreate
from src.schemas.business_feature_schema import BusinessFeatureUpdate, ReminderPolicyMode
from src.services.business_feature_service import (
    BusinessFeatureConfigError,
    BusinessFeatureNotFoundError,
    BusinessFeatureService,
)
from src.services.business_service import BusinessService


class FakeSession:
    def __init__(self):
        self.commits = 0

    def add(self, item):
        pass

    def commit(self):
        self.commits += 1

    def rollback(self):
        pass

    def refresh(self, item):
        pass


class BusinessRepo:
    def __init__(self, businesses):
        self.businesses = {item.id: item for item in businesses}
        self.added = []

    def get_by_id(self, db, business_id):
        return self.businesses.get(business_id)

    def get_by_exact_slug(self, db, slug):
        return None

    def add(self, db, business):
        self.added.append(business)


class FeatureRepo:
    def __init__(self, items=()):
        self.items = {(item.business_id, item.feature_key): item for item in items}

    def add(self, db, feature):
        self.items[(feature.business_id, feature.feature_key)] = feature

    def get_by_key(self, db, business_id, feature_key, for_update=False):
        return self.items.get((business_id, feature_key))

    def get_by_business(self, db, business_id):
        return [item for (owner_id, _), item in self.items.items() if owner_id == business_id]


class RecordingInvalidator:
    def __init__(self):
        self.phones = []

    def invalidate_business_context(self, phone):
        self.phones.append(phone)
        return 1


def business(business_id=1, phone="5511999999999"):
    return SimpleNamespace(id=business_id, phone=phone, is_active=True)


def test_existing_businesses_keep_optional_features_disabled_and_reminders_enabled():
    service = BusinessFeatureService(FakeSession(), FeatureRepo(), BusinessRepo([business()]), RecordingInvalidator())

    states = {item.feature_key: item for item in service.get_all(1)}

    assert states[BusinessFeatureKey.capacity_based_booking].enabled is False
    assert states[BusinessFeatureKey.recurring_schedules].enabled is False
    assert states[BusinessFeatureKey.replacement_classes].enabled is False
    assert states[BusinessFeatureKey.reminder_policy].enabled is True
    assert states[BusinessFeatureKey.reminder_policy].config == {"mode": ReminderPolicyMode.all.value}


def test_pilates_creation_persists_approved_feature_defaults():
    db = FakeSession()
    repository = BusinessRepo([])
    service = BusinessService(db, repository, cache_invalidator=RecordingInvalidator())

    created = service.create(
        BusinessCreate(
            name="Studio Movimento",
            type=BusinessType.pilates_studio,
            timezone="America/Sao_Paulo",
            phone="5511988887777",
        )
    )

    states = {item.feature_key: item for item in created.features}
    assert all(states[key].enabled for key in (
        BusinessFeatureKey.capacity_based_booking,
        BusinessFeatureKey.recurring_schedules,
        BusinessFeatureKey.replacement_classes,
        BusinessFeatureKey.trial_appointments,
        BusinessFeatureKey.professional_schedule_notifications,
    ))
    assert states[BusinessFeatureKey.capacity_based_booking].config == {"professional_assignment": "automatic"}
    assert states[BusinessFeatureKey.replacement_classes].config == {"expiration_days": 30}
    assert states[BusinessFeatureKey.reminder_policy].config == {"mode": "trial_and_replacement"}


def test_feature_updates_are_scoped_validated_and_invalidate_business_context():
    invalidator = RecordingInvalidator()
    repository = FeatureRepo()
    service = BusinessFeatureService(FakeSession(), repository, BusinessRepo([business()]), invalidator)

    result = service.set_feature(
        1,
        BusinessFeatureKey.replacement_classes,
        BusinessFeatureUpdate(enabled=True, config={"expiration_days": 45}),
    )

    assert result.enabled is True
    assert result.config == {"expiration_days": 45}
    assert invalidator.phones == ["5511999999999"]

    with pytest.raises(BusinessFeatureConfigError):
        service.set_feature(
            1,
            BusinessFeatureKey.capacity_based_booking,
            BusinessFeatureUpdate(config={"expiration_days": 30}),
        )

    with pytest.raises(BusinessFeatureNotFoundError):
        service.get_state(2, BusinessFeatureKey.replacement_classes)


def test_feature_config_contracts_reject_unknown_keys_and_invalid_limits():
    with pytest.raises(ValidationError):
        BusinessFeatureUpdate(config={"expiration_days": 0})

    with pytest.raises(ValidationError):
        BusinessFeatureUpdate(config={"arbitrary": True})
