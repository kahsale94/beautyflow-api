from zoneinfo import ZoneInfo
from datetime import time, date, timedelta, datetime
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from src.core import DataBaseDep
from src.models import Availability
from src.schemas import AvailabilityCreate, AvailabilityUpdate
from src.repositories import AvailabilityRepository, ProfessionalRepository, AppointmentRepository, ServiceRepository

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

class ProfessionalUnavailableError(Exception):
    pass

class ServiceNotFoundError(Exception):
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
    ):
        self.db = db
        self.availability_repo = availability_repo
        self.professional_repo = professional_repo
        self.appointment_repo = appointment_repo
        self.service_repo = service_repo

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

    def _validate_time_range(self, start: time, end: time):
        if start >= end:
            raise InvalidTimeRangeError()

    def _combine_date_time(self, date: date, t: time, tz: ZoneInfo):
        return datetime.combine(date, t).replace(tzinfo=tz)

    def _align_to_slot(self, dt: datetime):
        minute = dt.minute
        remainder = minute % self.SLOT_STEP_MINUTES

        if remainder == 0:
            return dt.replace(second=0, microsecond=0)

        delta = self.SLOT_STEP_MINUTES - remainder

        return (dt + timedelta(minutes=delta)).replace(second=0, microsecond=0)

    def _build_gaps(self, start: datetime, end: datetime, appointments: list):
        gaps = []
        cursor = start

        for appt in appointments:
            if cursor < appt.start_datetime:
                gaps.append((cursor, appt.start_datetime))

            cursor = max(cursor, appt.end_datetime)

        if cursor < end:
            gaps.append((cursor, end))

        return gaps

    def _generate_slots(self, gap_start, gap_end, duration, minimum_start: datetime | None = None):
        slots = []

        current = self._align_to_slot(gap_start)

        while True:
            candidate_end = current + timedelta(minutes=duration)

            if candidate_end > gap_end:
                break

            if minimum_start is None or current >= minimum_start:
                slots.append(current.time())

            current += timedelta(minutes=self.SLOT_STEP_MINUTES)

        return slots

    def get_all(self, business_id: int, professional_id: int):
        self._validate_professional(business_id, professional_id)

        result = self.availability_repo.get_by_professional(self.db, professional_id)
        if (
            not result
            or not all(item.professional_id == professional_id for item in result)
        ):
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
        professional = self._validate_professional(business_id, professional_id)
        service = self._validate_service(business_id, service_id)

        tz = ZoneInfo(professional.business.timezone)
        now = datetime.now(tz)

        weekday = date.weekday()

        availability = self.availability_repo.get_by_professional_and_weekday(self.db, professional_id, weekday)

        if not availability:
            raise AvailabilityNotFoundError()

        start_dt = self._combine_date_time(date, availability.start_time, tz)
        end_dt = self._combine_date_time(date, availability.end_time, tz)

        start_of_day = start_dt.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = start_of_day + timedelta(days=1)

        appointments = self.appointment_repo.get_scheduled_by_professional_and_date(
            self.db,
            business_id,
            professional_id,
            start_of_day,
            end_of_day,
        )

        gaps = self._build_gaps(start_dt, end_dt, appointments)

        slot_times = []

        for gap_start, gap_end in gaps:
            slot_times.extend(
                self._generate_slots(
                    gap_start,
                    gap_end,
                    service.duration_minutes,
                    now if date == now.date() else None,
                )
            )

        if not slot_times:
            raise ProfessionalUnavailableError()

        return slot_times

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
        ServiceRepository()
    )