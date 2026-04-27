from datetime import datetime
from sqlalchemy import select
from sqlalchemy.orm import Session

from src.models import Appointment
from src.schemas.appointment_schema import AppointmentStatus

class AppointmentRepository:

    def add(self, db: Session, appointment: Appointment):
        db.add(appointment)

    def delete(self, db: Session, appointment: Appointment):
        db.delete(appointment)

    def get_scheduled_by_professional_and_date(self, db: Session, business_id: int, professional_id: int, start_of_day: datetime, end_of_day: datetime):
        stmt = (select(Appointment).where(
            Appointment.business_id == business_id,
            Appointment.professional_id == professional_id,
            Appointment.status == AppointmentStatus.scheduled,
            Appointment.start_datetime < end_of_day,
            Appointment.end_datetime > start_of_day,
        )
            .order_by(Appointment.start_datetime)
        )
        return db.scalars(stmt).all()

    def get_by_id(self, db: Session, business_id: int, appointment_id: int):
        stmt = select(Appointment).where(
            Appointment.business_id == business_id,
            Appointment.id == appointment_id,
        )
        return db.scalars(stmt).one_or_none()

    def get_by_client(self, db: Session, business_id: int, client_id: int):
        stmt = select(Appointment).where(
            Appointment.business_id == business_id,
            Appointment.client_id == client_id,
        )
        return db.scalars(stmt).all()
    
    def get_by_professional(self, db: Session, business_id: int, professional_id: int):
        stmt = select(Appointment).where(
            Appointment.business_id == business_id,
            Appointment.professional_id == professional_id,
        )
        return db.scalars(stmt).all()

    def get_by_business(self, db: Session, business_id: int):
        stmt = select(Appointment).where(
            Appointment.business_id == business_id,
        )
        return db.scalars(stmt).all()