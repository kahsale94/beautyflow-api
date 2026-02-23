from datetime import datetime
from sqlalchemy import select
from sqlalchemy.orm import Session
from src.models.appointment_model import Appointment

class AppointmentRepository:

    def add(self, db: Session, appointment: Appointment):
        db.add(appointment)

    def get_by_id(self, db: Session, appointment_id: int):
        return db.get(Appointment, appointment_id)

    def get_all(self, db: Session):
        stmt = select(Appointment)
        return db.scalars(stmt).all()

    def delete(self, db: Session, appointment: Appointment):
        db.delete(appointment)

    def has_conflict(self, db: Session, professional_id: int, start: datetime, end: datetime) -> bool:

        stmt = select(Appointment).where(
            Appointment.professional_id == professional_id,
            Appointment.start_datetime < end,
            Appointment.end_datetime > start
        )

        return db.scalars(stmt).first() is not None