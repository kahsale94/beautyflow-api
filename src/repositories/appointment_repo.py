from datetime import datetime
from sqlalchemy import select
from sqlalchemy.orm import Session

from src.models import Appointment

class AppointmentRepository:

    def add(self, db: Session, appointment: Appointment):
        db.add(appointment)

    def delete(self, db: Session, appointment: Appointment):
        db.delete(appointment)

    def get_by_id(self, db: Session, appointment_id: int):
        return db.get(Appointment, appointment_id)
    
    def get_by_professional(self, db: Session, professional_id: int):
        stmt = select(Appointment).where(Appointment.professional_id == professional_id)
        return db.scalars(stmt).all()

    def get_by_business(self, db: Session, business_id: int):
        stmt = select(Appointment).where(Appointment.business_id == business_id)
        return db.scalars(stmt).all()

    def has_conflict(self, db: Session, business_id, professional_id: int, start: datetime, end: datetime, exclude_id: int | None = None) -> bool:
        stmt = select(Appointment).where(
            Appointment.business_id == business_id,
            Appointment.professional_id == professional_id,
            Appointment.start_datetime < end,
            Appointment.end_datetime > start,
        )

        if exclude_id:
            stmt = stmt.where(Appointment.id != exclude_id)

        return db.scalars(stmt).first() is not None