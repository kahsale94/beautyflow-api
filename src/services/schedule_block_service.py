from typing import Sequence
from zoneinfo import ZoneInfo
from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime, time, timedelta

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from src.core import DataBaseDep
from src.models import ScheduleBlock
from src.models.appointment_model import AppointmentStatus
from src.models.business_feature_model import BusinessFeatureKey
from src.models.replacement_entitlement_model import ReplacementEntitlementReason
from src.models.schedule_block_model import ScheduleBlockStatus
from src.schemas import ScheduleBlockCreate, ScheduleBlockReallocationResponse, ScheduleBlockResponse
from src.services.scheduling_lock import acquire_schedule_lock, acquire_schedule_locks
from src.services.business_feature_service import BusinessFeatureService, get_business_feature_service
from src.services.notification_job_service import NotificationJobService, get_notification_job_service
from src.services.professional_assignment_service import (
    NoProfessionalCapacityError,
    ProfessionalAssignmentService,
)
from src.services.replacement_entitlement_service import (
    ReplacementEntitlementService,
    get_replacement_entitlement_service,
)
from src.repositories import (
    AppointmentRepository,
    AvailabilityRepository,
    BusinessRepository,
    ProfessionalRepository,
    ScheduleBlockRepository,
)


class ScheduleBlockNotFoundError(Exception):
    pass

class ScheduleBlockInvalidDatetimeError(Exception):
    pass

class ScheduleBlockInvalidDurationError(Exception):
    pass

class ScheduleBlockTimeConflictError(Exception):
    pass

class ScheduleBlockAppointmentConflictError(Exception):
    pass

class ScheduleBlockAlreadyCanceledError(Exception):
    pass

class ScheduleBlockBusinessNotFoundError(Exception):
    pass

class ScheduleBlockProfessionalNotFoundError(Exception):
    pass

class ScheduleBlockInvalidBusinessTimezoneError(Exception):
    pass

class ScheduleBlockService:
    SCHEDULE_BLOCK_OVERLAP_CONSTRAINT = "ex_schedule_blocks_business_professional_time_conflict"

    def __init__(
        self,
        db: Session,
        schedule_block_repo: ScheduleBlockRepository,
        appointment_repo: AppointmentRepository,
        professional_repo: ProfessionalRepository,
        business_repo: BusinessRepository,
        assignment_service: ProfessionalAssignmentService | None = None,
        feature_service: BusinessFeatureService | None = None,
        replacement_service: ReplacementEntitlementService | None = None,
        notification_service: NotificationJobService | None = None,
    ):
        self.db = db
        self.schedule_block_repo = schedule_block_repo
        self.appointment_repo = appointment_repo
        self.professional_repo = professional_repo
        self.business_repo = business_repo
        self.assignment_service = assignment_service
        self.feature_service = feature_service
        self.replacement_service = replacement_service
        self.notification_service = notification_service

    def _get_integrity_constraint_name(self, exc: IntegrityError) -> str | None:
        try:
            orig = exc.orig
            if orig and hasattr(orig, "diag"):
                diag = getattr(orig, "diag")
                if diag and hasattr(diag, "constraint_name"):
                    return diag.constraint_name
            return None
        except Exception:
            return None

    def _commit_or_raise_conflict(self) -> None:
        try:
            self.db.commit()
        except IntegrityError as exc:
            self.db.rollback()

            constraint_name = self._get_integrity_constraint_name(exc)
            if constraint_name == self.SCHEDULE_BLOCK_OVERLAP_CONSTRAINT:
                raise ScheduleBlockTimeConflictError() from exc

            raise

    def _get_business_or_raise(self, business_id: int):
        business = self.business_repo.get_by_id(self.db, business_id)
        if not business or not business.is_active:
            raise ScheduleBlockBusinessNotFoundError()
        
        return business

    def _get_business_timezone(self, business_id: int) -> ZoneInfo:
        business = self._get_business_or_raise(business_id)
        try:
            return ZoneInfo(business.timezone)
        
        except Exception as exc:
            raise ScheduleBlockInvalidBusinessTimezoneError() from exc

    def _validate_professional(self, business_id: int, professional_id: int):
        professional = self.professional_repo.get_by_id(self.db, business_id, professional_id)
        if (
            not professional
            or not professional.is_active
            or professional.business_id != business_id
        ):
            raise ScheduleBlockProfessionalNotFoundError()

        return professional

    def _normalize_datetime(self, value: datetime, business_tz: ZoneInfo) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ScheduleBlockInvalidDatetimeError()
        
        return value.astimezone(business_tz).replace(second=0, microsecond=0)

    def _duration_to_minutes(self, duration_hours: Decimal | None) -> int:
        if duration_hours is None or duration_hours <= 0:
            raise ScheduleBlockInvalidDurationError()

        duration_minutes = int((duration_hours * Decimal("60")).quantize(Decimal("1"), rounding=ROUND_HALF_UP))
        if duration_minutes <= 0:
            raise ScheduleBlockInvalidDurationError()

        return duration_minutes

    def _build_period(self, business_id: int, data: ScheduleBlockCreate) -> tuple[datetime, datetime]:
        business_tz = self._get_business_timezone(business_id)
        start_datetime = self._normalize_datetime(data.start_datetime, business_tz)

        if data.all_day:
            start_datetime = datetime.combine(start_datetime.date(), time.min).replace(tzinfo=business_tz)
            end_datetime = start_datetime + timedelta(days=1)
            return start_datetime, end_datetime

        duration_minutes = self._duration_to_minutes(data.duration_hours)
        end_datetime = start_datetime + timedelta(minutes=duration_minutes)

        if start_datetime >= end_datetime:
            raise ScheduleBlockInvalidDurationError()

        return start_datetime, end_datetime

    def _ensure_no_conflicts(self, business_id: int, professional_id: int, start_datetime: datetime, end_datetime: datetime) -> None:
        acquire_schedule_lock(self.db, business_id, professional_id)

        scheduled_appointments = self.appointment_repo.get_scheduled_overlapping(
            self.db,
            business_id,
            professional_id,
            start_datetime,
            end_datetime,
        )
        if scheduled_appointments:
            raise ScheduleBlockAppointmentConflictError()

        active_blocks = self.schedule_block_repo.get_active_by_professional_period(
            self.db,
            business_id,
            professional_id,
            start_datetime,
            end_datetime,
        )
        if active_blocks:
            raise ScheduleBlockTimeConflictError()

    def _convert(self, schedule_block: ScheduleBlock, business_tz: ZoneInfo) -> ScheduleBlockResponse:
        return ScheduleBlockResponse(
            id=schedule_block.id,
            business_id=schedule_block.business_id,
            professional_id=schedule_block.professional_id,
            start_datetime=schedule_block.start_datetime.astimezone(business_tz),
            end_datetime=schedule_block.end_datetime.astimezone(business_tz),
            all_day=schedule_block.all_day,
            reason=schedule_block.reason,
            status=schedule_block.status,
            created_at=schedule_block.created_at,
        )

    def _validate_return(self, block_or_list: ScheduleBlock | Sequence[ScheduleBlock], business_tz: ZoneInfo) -> list[ScheduleBlockResponse] | ScheduleBlockResponse:
        if isinstance(block_or_list, list):
            return [self._convert(item, business_tz) for item in block_or_list]

        return self._convert(block_or_list, business_tz)  # type: ignore[arg-type]

    def _get_block_or_raise(self, business_id: int, schedule_block_id: int) -> ScheduleBlock:
        result = self.schedule_block_repo.get_by_id(self.db, business_id, schedule_block_id)
        if not result or result.business_id != business_id:
            raise ScheduleBlockNotFoundError()
        
        return result

    def get_by_id(self, business_id: int, schedule_block_id: int):
        block = self._get_block_or_raise(business_id, schedule_block_id)
        business_tz = self._get_business_timezone(business_id)

        return self._validate_return(block, business_tz)

    def get_by_period(self, business_id: int, start_datetime: datetime, end_datetime: datetime, professional_id: int | None = None):
        business_tz = self._get_business_timezone(business_id)
        start_datetime = self._normalize_datetime(start_datetime, business_tz)
        end_datetime = self._normalize_datetime(end_datetime, business_tz)

        if start_datetime >= end_datetime:
            raise ValueError()

        if professional_id is not None:
            self._validate_professional(business_id, professional_id)

        result = self.schedule_block_repo.get_active_by_business_period(
            self.db,
            business_id,
            start_datetime,
            end_datetime,
            professional_id,
        )

        return self._validate_return(result, business_tz)

    def create(self, business_id: int, data: ScheduleBlockCreate):
        self._validate_professional(business_id, data.professional_id)
        start_datetime, end_datetime = self._build_period(business_id, data)
        self._ensure_no_conflicts(business_id, data.professional_id, start_datetime, end_datetime)

        schedule_block = ScheduleBlock(
            business_id=business_id,
            professional_id=data.professional_id,
            start_datetime=start_datetime,
            end_datetime=end_datetime,
            all_day=data.all_day,
            reason=data.reason,
            status=ScheduleBlockStatus.active,
        )

        self.schedule_block_repo.add(self.db, schedule_block)
        self._commit_or_raise_conflict()
        self.db.refresh(schedule_block)

        business_tz = self._get_business_timezone(business_id)
        
        return self._validate_return(schedule_block, business_tz)

    def _format_period(self, value: datetime, business_tz: ZoneInfo) -> str:
        weekdays = (
            "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira",
            "sexta-feira", "sábado", "domingo",
        )
        local = value.astimezone(business_tz)
        return f"{weekdays[local.weekday()]}, {local:%d/%m/%Y}, às {local:%H:%M}"

    def create_with_reallocation(
        self, business_id: int, data: ScheduleBlockCreate
    ) -> ScheduleBlockReallocationResponse:
        target_professional = self._validate_professional(business_id, data.professional_id)
        self._get_business_or_raise(business_id)
        business_tz = self._get_business_timezone(business_id)
        start_datetime, end_datetime = self._build_period(business_id, data)
        professionals = list(self.professional_repo.get_by_business(self.db, business_id))
        acquire_schedule_locks(
            self.db,
            business_id,
            [professional.id for professional in professionals],
        )

        active_blocks = self.schedule_block_repo.get_active_by_professional_period(
            self.db, business_id, data.professional_id, start_datetime, end_datetime
        )
        if active_blocks:
            raise ScheduleBlockTimeConflictError()
        affected = sorted(
            self.appointment_repo.get_scheduled_overlapping(
                self.db,
                business_id,
                data.professional_id,
                start_datetime,
                end_datetime,
                for_update=True,
            ),
            key=lambda item: (item.start_datetime, item.id),
        )

        block = ScheduleBlock(
            business_id=business_id,
            professional_id=data.professional_id,
            start_datetime=start_datetime,
            end_datetime=end_datetime,
            all_day=data.all_day,
            reason=data.reason,
            status=ScheduleBlockStatus.active,
        )
        self.schedule_block_repo.add(self.db, block)

        reassigned: list[int] = []
        canceled: list[int] = []
        entitlements: list[int] = []
        candidate_ids = {
            professional.id
            for professional in professionals
            if professional.id != data.professional_id
        }
        use_capacity = bool(
            self.feature_service
            and self.feature_service.is_enabled(
                business_id, BusinessFeatureKey.capacity_based_booking
            )
        )
        by_id = {professional.id: professional for professional in professionals}

        for appointment in affected:
            assignment = None
            if self.assignment_service and candidate_ids:
                try:
                    assignment = self.assignment_service.assign(
                        business_id,
                        appointment.service_id,
                        appointment.start_datetime.astimezone(business_tz),
                        appointment.end_datetime.astimezone(business_tz),
                        use_configured_capacity=use_capacity,
                        professional_ids=candidate_ids,
                        exclude_appointment_id=appointment.id,
                    )
                except NoProfessionalCapacityError:
                    assignment = None

            period_label = self._format_period(appointment.start_datetime, business_tz)
            payload = {
                "appointment_id": appointment.id,
                "date": appointment.start_datetime.astimezone(business_tz).date().isoformat(),
                "weekday": period_label.split(",", 1)[0],
            }
            if assignment:
                appointment.professional_id = assignment.professional_id
                appointment.capacity_slot = assignment.capacity_slot
                reassigned.append(appointment.id)
                if self.notification_service:
                    new_professional = by_id[assignment.professional_id]
                    self.notification_service.enqueue_professional_event(
                        business_id,
                        target_professional,
                        "professional_appointment_removed",
                        f"professional_removed:{appointment.id}:{data.professional_id}",
                        f"O atendimento de {period_label} foi retirado da sua agenda.",
                        appointment_id=appointment.id,
                        payload=payload,
                    )
                    self.notification_service.enqueue_professional_event(
                        business_id,
                        new_professional,
                        "professional_appointment_assigned",
                        f"professional_assigned:{appointment.id}:{assignment.professional_id}",
                        f"Um atendimento de {period_label} foi atribuído à sua agenda.",
                        appointment_id=appointment.id,
                        payload=payload,
                    )
                continue

            appointment.status = AppointmentStatus.canceled
            canceled.append(appointment.id)
            if self.replacement_service and self.feature_service and self.feature_service.is_enabled(
                business_id, BusinessFeatureKey.replacement_classes
            ) and appointment.replacement_entitlement_id is None:
                entitlement = self.replacement_service.grant_for_appointment(
                    business_id,
                    appointment.id,
                    ReplacementEntitlementReason.professional_unavailable,
                    commit=False,
                )
                entitlements.append(entitlement.id)
                payload["replacement_entitlement_id"] = entitlement.id
            if self.notification_service:
                self.notification_service.enqueue_client_event(
                    business_id,
                    appointment.client,
                    "client_appointment_canceled",
                    f"client_canceled_by_block:{appointment.id}",
                    f"Seu atendimento de {period_label} foi cancelado por indisponibilidade de agenda.",
                    appointment_id=appointment.id,
                    payload=payload,
                )
                self.notification_service.enqueue_professional_event(
                    business_id,
                    target_professional,
                    "professional_appointment_canceled",
                    f"professional_canceled:{appointment.id}:{data.professional_id}",
                    f"O atendimento de {period_label} foi cancelado por indisponibilidade.",
                    appointment_id=appointment.id,
                    payload=payload,
                )

        try:
            self.db.flush()
            self._commit_or_raise_conflict()
        except Exception:
            self.db.rollback()
            raise
        self.db.refresh(block)
        return ScheduleBlockReallocationResponse(
            block=self._convert(block, business_tz),
            reassigned_appointment_ids=reassigned,
            canceled_appointment_ids=canceled,
            replacement_entitlement_ids=entitlements,
        )

    def cancel(self, business_id: int, schedule_block_id: int):
        schedule_block = self._get_block_or_raise(business_id, schedule_block_id)

        if schedule_block.status == ScheduleBlockStatus.canceled:
            raise ScheduleBlockAlreadyCanceledError()

        schedule_block.status = ScheduleBlockStatus.canceled
        self._commit_or_raise_conflict()

        return

def get_schedule_block_service(db: DataBaseDep):
    appointment_repo = AppointmentRepository()
    professional_repo = ProfessionalRepository()
    schedule_block_repo = ScheduleBlockRepository()
    feature_service = get_business_feature_service(db)
    assignment_service = ProfessionalAssignmentService(
        db,
        professional_repo,
        AvailabilityRepository(),
        appointment_repo,
        schedule_block_repo,
    )
    return ScheduleBlockService(
        db,
        schedule_block_repo,
        appointment_repo,
        professional_repo,
        BusinessRepository(),
        assignment_service,
        feature_service,
        get_replacement_entitlement_service(db),
        get_notification_job_service(db),
    )
