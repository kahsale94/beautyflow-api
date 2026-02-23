from sqlalchemy.orm import Session
from src.models.availability_model import Availability
from src.schemas.availability_schema import AvailabilityCreate, AvailabilityUpdate
from src.repositories.availability_repo import AvailabilityRepository
from src.repositories.professional_repo import ProfessionalRepository

class ProfessionalNotFoundError(Exception):
    pass

class InvalidTimeRangeError(Exception):
    pass

class AvailabilityAlreadyExistsError(Exception):
    pass

class AvailabilityNotFoundError(Exception):
    pass

class AvailabilityService:

    def __init__(self):
        self.availability_repo = AvailabilityRepository()
        self.professional_repo = ProfessionalRepository()

    def create_availability(self, db: Session, data: AvailabilityCreate):

        professional = self.professional_repo.get_by_id(db, data.professional_id)

        if not professional or not professional.is_active:
            raise ProfessionalNotFoundError()

        if data.start_time >= data.end_time:
            raise InvalidTimeRangeError()

        existing = self.availability_repo.get_by_professional_and_weekday(db, data.professional_id, data.weekday)

        if existing:
            raise AvailabilityAlreadyExistsError()

        availability = Availability(**data.model_dump())

        self.availability_repo.add(db, availability)

        db.commit()
        db.refresh(availability)

        return availability

    def get_availability(self, db: Session, availability_id: int | None = None):
        
        if availability_id is None:
            return self.availability_repo.get_all(db)

        availability = self.availability_repo.get_by_id(db, availability_id)

        if not availability:
            raise AvailabilityNotFoundError()

        return availability

    def update_availability(self, db: Session, availability_id: int, data: AvailabilityUpdate):

        availability = self.availability_repo.get_by_id(db, availability_id)

        if not availability:
            raise AvailabilityNotFoundError()

        update_data = data.model_dump(exclude_unset=True)

        if "start_time" in update_data or "end_time" in update_data:

            start = update_data.get("start_time", availability.start_time)
            end = update_data.get("end_time", availability.end_time)

            if start >= end:
                raise InvalidTimeRangeError()

        if "weekday" in update_data:

            existing = self.availability_repo.get_by_professional_and_weekday(db, availability.professional_id, update_data["weekday"])

            if existing and existing.id != availability.id:
                raise AvailabilityAlreadyExistsError()

        for field, value in update_data.items():
            setattr(availability, field, value)

        db.commit()
        db.refresh(availability)

        return availability

    def delete_availability(self, db: Session, availability_id: int):

        availability = self.availability_repo.get_by_id(db, availability_id)

        if not availability:
            raise AvailabilityNotFoundError()

        self.availability_repo.delete(db, availability)

        db.commit()