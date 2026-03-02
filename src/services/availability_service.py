from sqlalchemy.orm import Session

from src.models import Availability
from src.core import DataBaseDep
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

    def create_availability(self, business_id: int, data: AvailabilityCreate):
        professional = self.professional_repo.get_by_id(self.db, data.professional_id)
        if not professional or not professional.is_active or professional.business_id != business_id:
            raise ProfessionalNotFoundError()

        if data.start_time >= data.end_time:
            raise InvalidTimeRangeError()

        existing = self.availability_repo.get_by_professional_and_weekday(self.db, data.professional_id, data.weekday)

        if existing:
            raise AvailabilityAlreadyExistsError()

        availability = Availability(
            professional_id=data.professional_id,
            weekday=data.weekday,
            start_time=data.start_time,
            end_time=data.end_time,
        )

        self.availability_repo.add(self.db, availability)

        self.db.commit()
        self.db.refresh(availability)

        return availability

    def get_availability(self, business_id: int, professional_id: int, weekday: int | None = None):
        professional = self.professional_repo.get_by_id(self.db, professional_id)
        if not professional or not professional.is_active or professional.business_id != business_id:
            raise ProfessionalNotFoundError()
        
        if weekday is None:
            availability = self.availability_repo.get_by_professional(self.db, professional_id)
        else:
            availability = self.availability_repo.get_by_professional_and_weekday(self.db, professional_id, weekday)

        if not availability:
            raise AvailabilityNotFoundError()
        
        return availability

    def update_availability(self, business_id: int, professional_id: int, data: AvailabilityUpdate):
        professional = self.professional_repo.get_by_id(self.db, professional_id)
        if not professional or not professional.is_active or professional.business_id != business_id:
            raise ProfessionalNotFoundError()
        
        availability = self.availability_repo.get_by_professional(self.db, professional_id)
        if not availability:
            raise AvailabilityNotFoundError()

        update_data = data.model_dump(exclude_unset=True)

        if "start_time" in update_data or "end_time" in update_data:

            start = update_data.get("start_time", availability.start_time)
            end = update_data.get("end_time", availability.end_time)

            if start >= end:
                raise InvalidTimeRangeError()

        if "weekday" in update_data:

            existing = self.availability_repo.get_by_professional_and_weekday(self.db, availability.professional_id, update_data["weekday"])

            if existing and (existing.professional_id != availability.professional_id or existing.weekday != availability.weekday):
                raise AvailabilityAlreadyExistsError()

        for field, value in update_data.items():
            setattr(availability, field, value)

        self.db.commit()
        self.db.refresh(availability)

        return availability

    def delete_availability(self, business_id: int, professional_id: int):
        professional = self.professional_repo.get_by_id(self.db, professional_id)
        if not professional or not professional.is_active or professional.business_id != business_id:
            raise ProfessionalNotFoundError()
        
        availability = self.availability_repo.get_by_professional(self.db, professional_id)
        if not availability:
            raise AvailabilityNotFoundError()

        self.availability_repo.delete(self.db, availability)

        self.db.commit()

def get_availability_service(db: DataBaseDep):
    return AvailabilityService(
        db,
        AvailabilityRepository(),
        ProfessionalRepository(),
    )