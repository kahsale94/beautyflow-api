from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session

from src.core import DataBaseDep
from src.models import Appointment, ReplacementEntitlement
from src.models.appointment_model import AppointmentStatus
from src.models.business_feature_model import BusinessFeatureKey
from src.models.replacement_entitlement_model import (
    ReplacementEntitlementReason,
    ReplacementEntitlementStatus,
)
from src.repositories import (
    AppointmentRepository,
    BusinessRepository,
    ReplacementEntitlementRepository,
)
from src.schemas import AppointmentCreate
from src.schemas.replacement_entitlement_schema import (
    ReplacementBookingCreate,
    ReplacementEntitlementResponse,
    ReplacementUseResponse,
)
from src.services.appointment_service import AppointmentService, get_appointment_service
from src.services.business_feature_service import BusinessFeatureService, get_business_feature_service


class ReplacementEntitlementNotFoundError(Exception):
    pass


class ReplacementEntitlementFeatureDisabledError(Exception):
    pass


class ReplacementEntitlementInvalidStateError(Exception):
    pass


class ReplacementEntitlementExpiredError(Exception):
    pass


class ReplacementEntitlementIneligibleError(Exception):
    pass


class ReplacementEntitlementService:
    def __init__(
        self,
        db: Session,
        entitlement_repo: ReplacementEntitlementRepository,
        appointment_repo: AppointmentRepository,
        business_repo: BusinessRepository,
        feature_service: BusinessFeatureService,
        appointment_service: AppointmentService,
    ):
        self.db = db
        self.entitlement_repo = entitlement_repo
        self.appointment_repo = appointment_repo
        self.business_repo = business_repo
        self.feature_service = feature_service
        self.appointment_service = appointment_service

    def _require_feature(self, business_id: int) -> None:
        if not self.feature_service.is_enabled(business_id, BusinessFeatureKey.replacement_classes):
            raise ReplacementEntitlementFeatureDisabledError()

    def _business(self, business_id: int):
        business = self.business_repo.get_by_id(self.db, business_id)
        if not business or business.id != business_id or not business.is_active:
            raise ReplacementEntitlementNotFoundError()
        return business

    def _response(self, entitlement: ReplacementEntitlement) -> ReplacementEntitlementResponse:
        replacement = getattr(entitlement, "replacement_appointment", None)
        return ReplacementEntitlementResponse(
            id=entitlement.id,
            business_id=entitlement.business_id,
            client_id=entitlement.client_id,
            source_appointment_id=entitlement.source_appointment_id,
            replacement_appointment_id=replacement.id if replacement else None,
            status=entitlement.status,
            expires_at=entitlement.expires_at,
            reason=entitlement.reason,
            created_at=entitlement.created_at,
            used_at=entitlement.used_at,
        )

    def _expire_if_due(self, entitlement: ReplacementEntitlement, now: datetime) -> bool:
        if (
            entitlement.status == ReplacementEntitlementStatus.available
            and entitlement.expires_at <= now
        ):
            entitlement.status = ReplacementEntitlementStatus.expired
            return True
        return False

    def expire_due(self, business_id: int) -> int:
        self._require_feature(business_id)
        self._business(business_id)
        expired = self.entitlement_repo.get_expired_available(
            self.db, business_id, datetime.now(timezone.utc)
        )
        for entitlement in expired:
            entitlement.status = ReplacementEntitlementStatus.expired
        if expired:
            self.db.commit()
        return len(expired)

    def list(
        self,
        business_id: int,
        *,
        client_id: int | None = None,
        status: ReplacementEntitlementStatus | None = None,
    ) -> list[ReplacementEntitlementResponse]:
        self.expire_due(business_id)
        return [
            self._response(item)
            for item in self.entitlement_repo.get_by_business(
                self.db, business_id, client_id=client_id, status=status
            )
        ]

    def get(self, business_id: int, entitlement_id: int) -> ReplacementEntitlementResponse:
        self._require_feature(business_id)
        entitlement = self.entitlement_repo.get_by_id(
            self.db, business_id, entitlement_id, for_update=True
        )
        if not entitlement or entitlement.business_id != business_id:
            raise ReplacementEntitlementNotFoundError()
        changed = self._expire_if_due(entitlement, datetime.now(timezone.utc))
        if changed:
            self.db.commit()
        return self._response(entitlement)

    def _build_locked(
        self,
        business_id: int,
        source: Appointment,
        reason: ReplacementEntitlementReason,
        *,
        now: datetime,
    ) -> ReplacementEntitlement:
        if source.business_id != business_id or source.status == AppointmentStatus.no_show:
            raise ReplacementEntitlementIneligibleError()
        existing = self.entitlement_repo.get_by_source(
            self.db, business_id, source.id, for_update=True
        )
        if existing:
            return existing
        config = self.feature_service.get_config(
            business_id, BusinessFeatureKey.replacement_classes
        )
        entitlement = ReplacementEntitlement(
            business_id=business_id,
            client_id=source.client_id,
            source_appointment_id=source.id,
            status=ReplacementEntitlementStatus.available,
            expires_at=now + timedelta(days=int(config["expiration_days"])),
            reason=reason,
        )
        self.entitlement_repo.add(self.db, entitlement)
        self.db.flush()
        return entitlement

    def grant_for_appointment(
        self,
        business_id: int,
        source_appointment_id: int,
        reason: ReplacementEntitlementReason,
        *,
        commit: bool = True,
    ) -> ReplacementEntitlementResponse:
        self._require_feature(business_id)
        self._business(business_id)
        source = self.appointment_repo.get_by_id(
            self.db, business_id, source_appointment_id, for_update=True
        )
        if not source:
            raise ReplacementEntitlementNotFoundError()
        entitlement = self._build_locked(
            business_id, source, reason, now=datetime.now(timezone.utc)
        )
        if commit:
            self.db.commit()
            self.db.refresh(entitlement)
        return self._response(entitlement)

    def grant_from_client_cancellation(
        self,
        business_id: int,
        source_appointment_id: int,
    ) -> ReplacementEntitlementResponse:
        self._require_feature(business_id)
        business = self._business(business_id)
        source = self.appointment_repo.get_by_id(
            self.db, business_id, source_appointment_id, for_update=True
        )
        if not source:
            raise ReplacementEntitlementNotFoundError()
        existing = self.entitlement_repo.get_by_source(
            self.db, business_id, source.id, for_update=True
        )
        if existing:
            return self._response(existing)
        if (
            source.status != AppointmentStatus.scheduled
            or source.series_id is None
            or source.replacement_entitlement_id is not None
            or not business.allow_client_cancel
        ):
            raise ReplacementEntitlementIneligibleError()
        business_tz = ZoneInfo(business.timezone)
        now_local = datetime.now(business_tz)
        deadline = source.start_datetime.astimezone(business_tz) - timedelta(
            hours=business.cancel_limit_hours or 0
        )
        if now_local > deadline:
            raise ReplacementEntitlementIneligibleError()

        source.status = AppointmentStatus.canceled
        self.appointment_service._skip_pending_reminders(
            source.id, reason="client_cancellation_with_replacement"
        )
        entitlement = self._build_locked(
            business_id,
            source,
            ReplacementEntitlementReason.client_cancellation,
            now=datetime.now(timezone.utc),
        )
        self.db.commit()
        self.db.refresh(entitlement)
        return self._response(entitlement)

    def use(
        self,
        business_id: int,
        entitlement_id: int,
        data: ReplacementBookingCreate,
    ) -> ReplacementUseResponse:
        self._require_feature(business_id)
        self._business(business_id)
        entitlement = self.entitlement_repo.get_by_id(
            self.db, business_id, entitlement_id, for_update=True
        )
        if not entitlement or entitlement.business_id != business_id:
            raise ReplacementEntitlementNotFoundError()
        now = datetime.now(timezone.utc)
        if self._expire_if_due(entitlement, now):
            self.db.commit()
            raise ReplacementEntitlementExpiredError()
        if entitlement.status != ReplacementEntitlementStatus.available:
            raise ReplacementEntitlementInvalidStateError()

        source = self.appointment_repo.get_by_id(
            self.db, business_id, entitlement.source_appointment_id
        )
        if not source or source.client_id != entitlement.client_id:
            raise ReplacementEntitlementIneligibleError()
        appointment = self.appointment_service.create(
            business_id,
            AppointmentCreate(
                client_id=entitlement.client_id,
                professional_id=data.professional_id,
                service_id=source.service_id,
                start_datetime=data.start_datetime,
            ),
            replacement_entitlement_id=entitlement.id,
            force_automatic=True,
            commit=False,
        )
        entitlement.status = ReplacementEntitlementStatus.used
        entitlement.used_at = now
        self.db.commit()
        model = self.appointment_repo.get_by_id(self.db, business_id, appointment.id)
        self.db.refresh(entitlement)
        return ReplacementUseResponse(
            entitlement=self._response(entitlement),
            appointment=self.appointment_service._validate_return(
                model, ZoneInfo(self._business(business_id).timezone)
            ),
        )

    def forfeit(self, business_id: int, entitlement_id: int) -> ReplacementEntitlementResponse:
        self._require_feature(business_id)
        entitlement = self.entitlement_repo.get_by_id(
            self.db, business_id, entitlement_id, for_update=True
        )
        if not entitlement:
            raise ReplacementEntitlementNotFoundError()
        if entitlement.status != ReplacementEntitlementStatus.available:
            raise ReplacementEntitlementInvalidStateError()
        entitlement.status = ReplacementEntitlementStatus.forfeited
        self.db.commit()
        return self._response(entitlement)


def get_replacement_entitlement_service(db: DataBaseDep):
    return ReplacementEntitlementService(
        db,
        ReplacementEntitlementRepository(),
        AppointmentRepository(),
        BusinessRepository(),
        get_business_feature_service(db),
        get_appointment_service(db),
    )
