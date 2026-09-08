from typing import Sequence
from zoneinfo import ZoneInfo
from datetime import time, date, timedelta, datetime

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from src.core import DataBaseDep
from src.models import Availability
from src.schemas import (AvailabilityCreate, AvailabilityUpdate, AvailabilitySlotsResponse,
    AvailabilityCheckAndSuggestRequest, AvailabilityCheckAndSuggestResponse, AvailabilitySuggestionResponse,
    ProfessionalCapacityResponse, StudioAvailabilityCheckRequest, StudioAvailabilityCheckResponse,
)
from src.schemas.appointment_schema import AppointmentStatus
from src.repositories import (AvailabilityRepository, ProfessionalRepository, AppointmentRepository,
    ServiceRepository, ProfessionalServiceRepository, ScheduleBlockRepository, BusinessRepository
)
from src.models.business_feature_model import BusinessFeatureKey
from src.services.business_feature_service import BusinessFeatureService, get_business_feature_service
from src.services.professional_assignment_service import ProfessionalAssignmentService


class ProfessionalNotFoundError(Exception):
    pass

class ProfessionalUnavailableError(Exception):
    pass

class InvalidTimeRangeError(Exception):
    pass

class AvailabilityAlreadyExistsError(Exception):
    pass

class AvailabilityNotFoundError(Exception):
    pass

class ServiceNotFoundError(Exception):
    pass

class ProfessionalServiceMismatchError(Exception):
    pass

class DatetimeFormatError(Exception):
    pass

class BusinessNotAvailableForBookingError(Exception):
    pass

class CapacityBasedBookingDisabledError(Exception):
    pass

class AvailabilityService:

    SLOT_STEP_MINUTES = 15
    WEEKDAYS = (
        "segunda-feira",
        "terça-feira",
        "quarta-feira",
        "quinta-feira",
        "sexta-feira",
        "sábado",
        "domingo",
    )

    def __init__(
        self,
        db: Session,
        availability_repo: AvailabilityRepository,
        professional_repo: ProfessionalRepository,
        appointment_repo: AppointmentRepository,
        service_repo: ServiceRepository,
        professional_service_repo: ProfessionalServiceRepository,
        schedule_block_repo: ScheduleBlockRepository,
        business_repo: BusinessRepository | None = None,
        business_feature_service: BusinessFeatureService | None = None,
        assignment_service: ProfessionalAssignmentService | None = None,
    ):
        self.db = db
        self.availability_repo = availability_repo
        self.professional_repo = professional_repo
        self.appointment_repo = appointment_repo
        self.service_repo = service_repo
        self.professional_service_repo = professional_service_repo
        self.schedule_block_repo = schedule_block_repo
        self.business_repo = business_repo
        self.business_feature_service = business_feature_service
        self.assignment_service = assignment_service

    def _validate_professional(self, business_id: int, professional_id: int):
        professional = self.professional_repo.get_by_id(self.db, business_id, professional_id)
        if (
            not professional
            or not professional.is_active
            or professional.business_id != business_id
        ):
            raise ProfessionalNotFoundError()
        
        return professional

    def _validate_service(self, business_id: int, service_id: int):
        service = self.service_repo.get_by_id(self.db, business_id, service_id)
        if (
            not service
            or not service.is_active
            or service.business_id != business_id
        ):
            raise ServiceNotFoundError()
        
        return service

    def _validate_booking_context(self, business_id: int, professional_id: int, service_id: int):
        professional = self._validate_professional(business_id, professional_id)
        service = self._validate_service(business_id, service_id)

        if not professional.business.booking_enabled:
            raise BusinessNotAvailableForBookingError()

        professional_service = self.professional_service_repo.get_by_ids(self.db, professional_id, service_id)

        if not professional_service:
            raise ProfessionalServiceMismatchError()

        return professional, service

    def _validate_time_range(self, start: time, end: time):
        if start >= end:
            raise InvalidTimeRangeError()

    def _combine_date_time(self, date: date, t: time, tz: ZoneInfo):
        return datetime.combine(date, t).replace(tzinfo=tz)

    def _align_to_slot(self, dt: datetime, slot_step_minutes: int):
        minute = dt.minute
        remainder = minute % slot_step_minutes

        if remainder == 0:
            return dt.replace(second=0, microsecond=0)

        delta = slot_step_minutes - remainder

        return (dt + timedelta(minutes=delta)).replace(second=0, microsecond=0)

    def _generate_slots(self, gap_start, gap_end, duration, slot_step_minutes: int, minimum_start: datetime | None = None):
        slots = []
    
        current = self._align_to_slot(gap_start, slot_step_minutes)
    
        while True:
            candidate_end = current + timedelta(minutes=duration)
    
            if candidate_end > gap_end:
                break
    
            if minimum_start is None or current >= minimum_start:
                slots.append(current.time())
    
            current += timedelta(minutes=slot_step_minutes)
    
        return slots

    def _build_gaps(self, start: datetime, end: datetime, busy_items: Sequence, tz: ZoneInfo):
        gaps = []
        cursor = start

        sorted_busy_items = sorted(busy_items, key=lambda item: item.start_datetime)

        for item in sorted_busy_items:
            item_start = item.start_datetime.astimezone(tz)
            item_end = item.end_datetime.astimezone(tz)

            if item_end <= start or item_start >= end:
                continue

            item_start = max(item_start, start)
            item_end = min(item_end, end)

            if cursor < item_start:
                gaps.append((cursor, item_start))

            cursor = max(cursor, item_end)

        if cursor < end:
            gaps.append((cursor, end))

        return gaps

    def _resolve_excluded_appointment_id(
        self,
        business_id: int,
        professional_id: int,
        exclude_appointment_id: int | None,
        client_id: int | None = None,
    ) -> int | None:
        if exclude_appointment_id is None:
            return None

        appointment = self.appointment_repo.get_by_id(self.db, business_id, exclude_appointment_id)
        if (
            not appointment
            or appointment.business_id != business_id
            or appointment.professional_id != professional_id
            or appointment.status != AppointmentStatus.scheduled
        ):
            return None

        if client_id is not None and appointment.client_id != client_id:
            return None

        return appointment.id

    def _get_slot_datetimes_for_date(
        self,
        business_id: int,
        professional,
        service,
        target_date: date,
        now: datetime,
        exclude_appointment_id: int | None = None,
    ):
        tz = ZoneInfo(professional.business.timezone)
        weekday = target_date.weekday()

        availability = self.availability_repo.get_by_professional_and_weekday(
            self.db,
            professional.id,
            weekday,
        )

        if (
            not availability
            or availability.professional_id != professional.id
            or availability.weekday != weekday
        ):
            return []

        start_dt = self._combine_date_time(target_date, availability.start_time, tz)
        end_dt = self._combine_date_time(target_date, availability.end_time, tz)

        start_of_day = start_dt.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = start_of_day + timedelta(days=1)

        appointments = self.appointment_repo.get_scheduled_by_professional_and_date(
            self.db,
            business_id,
            professional.id,
            start_of_day,
            end_of_day,
        )
        if exclude_appointment_id is not None:
            appointments = [item for item in appointments if item.id != exclude_appointment_id]

        schedule_blocks = self.schedule_block_repo.get_active_by_professional_and_date(
            self.db,
            business_id,
            professional.id,
            start_of_day,
            end_of_day,
        )

        gaps = self._build_gaps(start_dt, end_dt, [*appointments, *schedule_blocks], tz)

        slot_step_minutes = professional.business.slot_interval_minutes or self.SLOT_STEP_MINUTES
        minimum_notice_minutes = professional.business.minimum_notice_minutes or 0
        minimum_start = now + timedelta(minutes=minimum_notice_minutes)

        slot_times = []

        for gap_start, gap_end in gaps:
            slot_times.extend(
                self._generate_slots(
                    gap_start,
                    gap_end,
                    service.duration_minutes,
                    slot_step_minutes,
                    minimum_start if target_date == now.date() else None,
                )
            )

        return [self._combine_date_time(target_date, slot_time, tz) for slot_time in slot_times]

    def _build_suggestion(self, slot_start: datetime, duration_minutes: int):
        slot_end = slot_start + timedelta(minutes=duration_minutes)

        return AvailabilitySuggestionResponse(
            start_datetime=slot_start,
            end_datetime=slot_end,
            date=slot_start.date(),
            slot_time=slot_start.time(),
            weekday=self.WEEKDAYS[slot_start.weekday()],
        )

    def _studio_slot_datetimes_for_date(self, business_id: int, service, target_date: date, now: datetime):
        if not self.assignment_service:
            return []
        professionals = self.professional_repo.get_eligible_for_service(self.db, business_id, service.id)
        possible: set[datetime] = set()
        for professional in professionals:
            availability = self.availability_repo.get_by_professional_and_weekday(
                self.db,
                professional.id,
                target_date.weekday(),
            )
            if not availability:
                continue
            tz = now.tzinfo
            start_dt = self._combine_date_time(target_date, availability.start_time, tz)
            end_dt = self._combine_date_time(target_date, availability.end_time, tz)
            minimum_start = now + timedelta(minutes=professional.business.minimum_notice_minutes or 0)
            for slot_time in self._generate_slots(
                start_dt,
                end_dt,
                service.duration_minutes,
                professional.business.slot_interval_minutes or self.SLOT_STEP_MINUTES,
                minimum_start if target_date == now.date() else None,
            ):
                possible.add(self._combine_date_time(target_date, slot_time, tz))

        available = []
        for slot_start in sorted(possible):
            slot_end = slot_start + timedelta(minutes=service.duration_minutes)
            snapshot = self.assignment_service.snapshot(
                business_id,
                service.id,
                slot_start,
                slot_end,
                use_configured_capacity=True,
            )
            if snapshot.remaining_capacity > 0:
                available.append(slot_start)
        return available

    def check_studio_capacity(self, business_id: int, data: StudioAvailabilityCheckRequest):
        if not self.business_repo or not self.business_feature_service or not self.assignment_service:
            raise CapacityBasedBookingDisabledError()
        business = self.business_repo.get_by_id(self.db, business_id)
        if not business or business.id != business_id or not business.is_active:
            raise BusinessNotAvailableForBookingError()
        if not self.business_feature_service.is_enabled(
            business_id,
            BusinessFeatureKey.capacity_based_booking,
        ):
            raise CapacityBasedBookingDisabledError()
        if not business.booking_enabled:
            raise BusinessNotAvailableForBookingError()
        service = self._validate_service(business_id, data.service_id)
        if data.requested_start.tzinfo is None or data.requested_start.utcoffset() is None:
            raise DatetimeFormatError()

        tz = ZoneInfo(business.timezone)
        now = datetime.now(tz)
        requested_start = data.requested_start.astimezone(tz).replace(second=0, microsecond=0)
        requested_end = requested_start + timedelta(minutes=service.duration_minutes)
        max_date = now.date() + timedelta(days=business.maximum_schedule_days or 30)
        if requested_start.date() < now.date():
            raise ProfessionalUnavailableError()
        if requested_start.date() > max_date:
            raise AvailabilityNotFoundError()

        snapshot = self.assignment_service.snapshot(
            business_id,
            service.id,
            requested_start,
            requested_end,
            use_configured_capacity=True,
            exclude_appointment_id=data.exclude_appointment_id,
        )
        aligned = self._align_to_slot(requested_start, business.slot_interval_minutes or self.SLOT_STEP_MINUTES) == requested_start
        notice_ok = requested_start >= now + timedelta(minutes=business.minimum_notice_minutes or 0)
        available = aligned and notice_ok and snapshot.remaining_capacity > 0

        suggestions: list[AvailabilitySuggestionResponse] = []
        if not available:
            search_days = data.search_days_ahead if data.search_days_ahead is not None else business.maximum_schedule_days or 30
            search_days = min(search_days, business.maximum_schedule_days or 30)
            for offset in range(search_days + 1):
                target_date = requested_start.date() + timedelta(days=offset)
                if target_date > max_date:
                    break
                for slot_start in self._studio_slot_datetimes_for_date(business_id, service, target_date, now):
                    if slot_start == requested_start:
                        continue
                    suggestions.append(self._build_suggestion(slot_start, service.duration_minutes))
                    if len(suggestions) >= data.max_suggestions:
                        break
                if len(suggestions) >= data.max_suggestions:
                    break

        return StudioAvailabilityCheckResponse(
            requested_start=requested_start,
            requested_end=requested_end,
            weekday=self.WEEKDAYS[requested_start.weekday()],
            available=available,
            reason="requested_slot_available" if available else "requested_slot_unavailable",
            total_capacity=snapshot.total_capacity,
            occupied=snapshot.occupied,
            remaining_capacity=snapshot.remaining_capacity if aligned and notice_ok else 0,
            professionals=[
                ProfessionalCapacityResponse(
                    professional_id=item.professional_id,
                    capacity=item.capacity,
                    occupied=item.occupied,
                    remaining_capacity=item.remaining,
                )
                for item in snapshot.professionals
            ],
            suggestions=suggestions,
        )

    def get_all(self, business_id: int, professional_id: int):
        self._validate_professional(business_id, professional_id)

        result = self.availability_repo.get_by_professional(self.db, professional_id)
        if not all(item.professional_id == professional_id for item in result):
            raise AvailabilityNotFoundError()

        return result

    def get_by_weekday(self, business_id: int, professional_id: int, weekday: int):
        self._validate_professional(business_id, professional_id)

        result = self.availability_repo.get_by_professional_and_weekday(self.db, professional_id, weekday)
        if (
            not result
            or result.professional_id != professional_id
        ):
            raise AvailabilityNotFoundError()

        return result
    
    def get_slots(self, business_id: int, professional_id: int, service_id: int, date: date):
        professional, service = self._validate_booking_context(business_id, professional_id, service_id)

        tz = ZoneInfo(professional.business.timezone)
        now = datetime.now(tz)

        if date < now.date():
            raise ProfessionalUnavailableError()

        max_days = professional.business.maximum_schedule_days or 30
        max_date = now.date() + timedelta(days=max_days)

        if date > max_date:
            raise AvailabilityNotFoundError()

        weekday = date.weekday()
        availability = self.availability_repo.get_by_professional_and_weekday(self.db, professional_id, weekday)

        if (
            not availability
            or availability.professional_id != professional_id
            or availability.weekday != weekday
        ):
            raise AvailabilityNotFoundError()

        slot_datetimes = self._get_slot_datetimes_for_date(
            business_id,
            professional,
            service,
            date,
            now,
        )

        if not slot_datetimes:
            raise ProfessionalUnavailableError()

        return [AvailabilitySlotsResponse(slot_time=item.time()) for item in slot_datetimes]

    def check_and_suggest(self, business_id: int, data: AvailabilityCheckAndSuggestRequest):
        professional, service = self._validate_booking_context(
            business_id,
            data.professional_id,
            data.service_id,
        )

        if data.requested_start.tzinfo is None:
            raise DatetimeFormatError()

        tz = ZoneInfo(professional.business.timezone)
        now = datetime.now(tz)
        requested_start = data.requested_start.astimezone(tz).replace(second=0, microsecond=0)
        requested_end = requested_start + timedelta(minutes=service.duration_minutes)
        exclude_appointment_id = self._resolve_excluded_appointment_id(
            business_id,
            professional.id,
            data.exclude_appointment_id,
            data.client_id,
        )

        if requested_start.date() < now.date():
            raise ProfessionalUnavailableError()

        max_days = professional.business.maximum_schedule_days or 30
        max_date = now.date() + timedelta(days=max_days)

        if requested_start.date() > max_date:
            raise AvailabilityNotFoundError()

        requested_day_slots = self._get_slot_datetimes_for_date(
            business_id,
            professional,
            service,
            requested_start.date(),
            now,
            exclude_appointment_id,
        )

        if requested_start in requested_day_slots:
            return AvailabilityCheckAndSuggestResponse(
                requested_start=requested_start,
                requested_end=requested_end,
                available=True,
                reason="requested_slot_available",
                suggestions=[],
            )

        suggestions: list[AvailabilitySuggestionResponse] = []
        added_slots: set[datetime] = set()

        def add_suggestions(slot_datetimes: list[datetime]):
            for slot_start in slot_datetimes:
                if len(suggestions) >= data.max_suggestions:
                    break

                if slot_start in added_slots:
                    continue

                suggestions.append(
                    self._build_suggestion(
                        slot_start,
                        service.duration_minutes,
                    )
                )
                added_slots.add(slot_start)

        same_day_after_requested = [slot for slot in requested_day_slots if slot > requested_start]
        same_day_before_requested = [slot for slot in requested_day_slots if slot < requested_start]

        add_suggestions(same_day_after_requested)
        add_suggestions(same_day_before_requested)

        search_days_ahead = data.search_days_ahead if data.search_days_ahead is not None else max_days
        search_days_ahead = min(search_days_ahead, max_days)

        day_offset = 1
        while len(suggestions) < data.max_suggestions and day_offset <= search_days_ahead:
            target_date = requested_start.date() + timedelta(days=day_offset)

            if target_date > max_date:
                break

            slot_datetimes = self._get_slot_datetimes_for_date(
                business_id,
                professional,
                service,
                target_date,
                now,
                exclude_appointment_id,
            )

            add_suggestions(slot_datetimes)
            day_offset += 1

        return AvailabilityCheckAndSuggestResponse(
            requested_start=requested_start,
            requested_end=requested_end,
            available=False,
            reason="requested_slot_unavailable" if suggestions else "no_available_slots_found",
            suggestions=suggestions,
        )

    def create(self, business_id: int, data: AvailabilityCreate):
        self._validate_professional(business_id, data.professional_id)
        self._validate_time_range(data.start_time, data.end_time)

        availability = Availability(
            professional_id = data.professional_id,
            weekday = data.weekday,
            start_time = data.start_time,
            end_time = data.end_time,
        )

        self.availability_repo.add(self.db, availability)
        
        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise AvailabilityAlreadyExistsError()

        self.db.refresh(availability)

        return availability

    def update(self, business_id: int, professional_id: int, weekday: int, data: AvailabilityUpdate):
        self._validate_professional(business_id, professional_id)

        availability = self.get_by_weekday(business_id, professional_id, weekday)

        update_data = data.model_dump(exclude_unset=True)

        start = update_data.get("start_time", availability.start_time)
        end = update_data.get("end_time", availability.end_time)

        self._validate_time_range(start, end)

        for field, value in update_data.items():
            setattr(availability, field, value)
            
        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise AvailabilityAlreadyExistsError()
        
        self.db.refresh(availability)

        return availability

    def delete(self, business_id: int, professional_id: int, weekday: int):
        self._validate_professional(business_id, professional_id)

        availability = self.get_by_weekday(business_id, professional_id, weekday)

        self.availability_repo.delete(self.db, availability)
        self.db.commit()

        return

def get_availability_service(db: DataBaseDep):
    professional_repo = ProfessionalRepository()
    availability_repo = AvailabilityRepository()
    appointment_repo = AppointmentRepository()
    schedule_block_repo = ScheduleBlockRepository()
    feature_service = get_business_feature_service(db)
    assignment_service = ProfessionalAssignmentService(
        db,
        professional_repo,
        availability_repo,
        appointment_repo,
        schedule_block_repo,
    )
    return AvailabilityService(
        db,
        availability_repo,
        professional_repo,
        appointment_repo,
        ServiceRepository(),
        ProfessionalServiceRepository(),
        schedule_block_repo,
        BusinessRepository(),
        feature_service,
        assignment_service,
    )
