from typing import Sequence
from zoneinfo import ZoneInfo
from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime, time, timedelta

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from src.core import DataBaseDep
from src.models import ScheduleBlock
from src.models.schedule_block_model import ScheduleBlockStatus
from src.schemas import ScheduleBlockCreate, ScheduleBlockResponse
from src.services.scheduling_lock import acquire_schedule_lock
from src.repositories import AppointmentRepository, BusinessRepository, ProfessionalRepository, ScheduleBlockRepository


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
    ):
        self.db = db
        self.schedule_block_repo = schedule_block_repo
        self.appointment_repo = appointment_repo
        self.professional_repo = professional_repo
        self.business_repo = business_repo

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

    def cancel(self, business_id: int, schedule_block_id: int):
        schedule_block = self._get_block_or_raise(business_id, schedule_block_id)

        if schedule_block.status == ScheduleBlockStatus.canceled:
            raise ScheduleBlockAlreadyCanceledError()

        schedule_block.status = ScheduleBlockStatus.canceled
        self._commit_or_raise_conflict()

        return

def get_schedule_block_service(db: DataBaseDep):
    return ScheduleBlockService(
        db,
        ScheduleBlockRepository(),
        AppointmentRepository(),
        ProfessionalRepository(),
        BusinessRepository(),
    )
