from sqlalchemy import select
from sqlalchemy.orm import Session

from src.models import Availability

class AvailabilityRepository:

    def add(self, db: Session, availability: Availability):
        db.add(availability)

    def delete(self, db: Session, availability: Availability):
        db.delete(availability)

    def get_by_professional(self, db: Session, professional_id: int):
        stmt = select(Availability).where(Availability.professional_id == professional_id)
        return db.scalars(stmt).all()

    def get_by_professional_and_weekday(self, db: Session, professional_id: int, weekday: int):

        stmt = select(Availability).where(
            Availability.professional_id == professional_id,
            Availability.weekday == weekday,
        )

        return db.scalars(stmt).one_or_none()