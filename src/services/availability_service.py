from datetime import time
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from src.core import DataBaseDep
from src.models import Availability
from src.schemas import AvailabilityCreate, AvailabilityUpdate
from src.repositories import AvailabilityRepository, ProfessionalRepository

class ProfessionalNotFoundError(Exception):
    pass

class InvalidTimeRangeError(Exception):
    pass

class AvailabilityAlreadyExistsError(Exception):
    pass

class AvailabilityNotFoundError(Exception):
    pass

class AvailabilityService:

    def __init__(
        self,
        db: Session,
        availability_repo: AvailabilityRepository,
        professional_repo: ProfessionalRepository,
    ):
        self.db = db
        self.availability_repo = availability_repo
        self.professional_repo = professional_repo

    def _get_valid_professional(self, business_id: int, professional_id: int):
        professional = self.professional_repo.get_by_id(self.db, business_id, professional_id)
        if (
            not professional
            or not professional.is_active
            or professional.business_id != business_id
        ):
            raise ProfessionalNotFoundError()

        return professional

    def _validate_time_range(self, start: time, end: time):
        if start >= end:
            raise InvalidTimeRangeError()

    def get_all(self, business_id: int, professional_id: int):
        self._get_valid_professional(business_id, professional_id)

        result = self.availability_repo.get_by_professional(self.db, professional_id)
        if (
            not result
            or not all(item.professional_id == professional_id for item in result)
        ):
            raise AvailabilityNotFoundError()

        return result

    def get_by_weekday(self, business_id: int, professional_id: int, weekday: int):
        self._get_valid_professional(business_id, professional_id)

        result = self.availability_repo.get_by_professional_and_weekday(self.db, professional_id, weekday)
        if (
            not result
            or result.professional_id != professional_id
        ):
            raise AvailabilityNotFoundError()

        return result

    def create(self, business_id: int, data: AvailabilityCreate):
        self._get_valid_professional(business_id, data.professional_id)

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
        self._get_valid_professional(business_id, professional_id)

        availability = self.get_by_weekday(self.db, business_id, professional_id, weekday)

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
        self._get_valid_professional(business_id, professional_id)

        availability = self.get_by_weekday(self.db, business_id, professional_id, weekday)

        self.availability_repo.delete(self.db, availability)
        self.db.commit()

        return

def get_availability_service(db: DataBaseDep):
    return AvailabilityService(
        db,
        AvailabilityRepository(),
        ProfessionalRepository(),
    )