from typing import Sequence
from zoneinfo import ZoneInfo
from datetime import time, date, timedelta, datetime

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from src.core import DataBaseDep
from src.models import Availability, Appointment
from src.schemas import (AvailabilityCreate, AvailabilityUpdate, AvailabilitySlotsResponse,
    AvailabilityCheckAndSuggestRequest, AvailabilityCheckAndSuggestResponse, AvailabilitySuggestionResponse,
)
from src.repositories import (AvailabilityRepository, ProfessionalRepository, AppointmentRepository,
    ServiceRepository, ProfessionalServiceRepository
)

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

class AvailabilityService:

    SLOT_STEP_MINUTES = 15

    def __init__(
        self,
        db: Session,
        availability_repo: AvailabilityRepository,
        professional_repo: ProfessionalRepository,
        appointment_repo: AppointmentRepository,
        service_repo: ServiceRepository,
        professional_service_repo: ProfessionalServiceRepository,
    ):
        self.db = db
        self.availability_repo = availability_repo
        self.professional_repo = professional_repo
        self.appointment_repo = appointment_repo
        self.service_repo = service_repo
        self.professional_service_repo = professional_service_repo

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

        professional_service = self.professional_service_repo.get_by_ids(
            self.db,
            professional_id,
            service_id,
        )

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

    def _build_gaps(self, start: datetime, end: datetime, appointments: Sequence[Appointment], tz: ZoneInfo):
        gaps = []
        cursor = start
    
        for appt in appointments:
            appt_start = appt.start_datetime.astimezone(tz)
            appt_end = appt.end_datetime.astimezone(tz)
    
            if cursor < appt_start:
                gaps.append((cursor, appt_start))
    
            cursor = max(cursor, appt_end)
    
        if cursor < end:
            gaps.append((cursor, end))
    
        return gaps

    def _get_slot_datetimes_for_date(self, business_id: int, professional, service, target_date: date, now: datetime):
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

        gaps = self._build_gaps(start_dt, end_dt, appointments, tz)

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
    return AvailabilityService(
        db,
        AvailabilityRepository(),
        ProfessionalRepository(),
        AppointmentRepository(),
        ServiceRepository(),
        ProfessionalServiceRepository(),
    )