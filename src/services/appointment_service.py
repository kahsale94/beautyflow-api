from sqlalchemy.orm import Session
from src.models.appointment_model import Appointment
from src.schemas.appointment_schema import AppointmentCreate, AppointmentUpdate
from src.repositories.appointment_repo import AppointmentRepository
from src.repositories.professional_repo import ProfessionalRepository

class ProfessionalNotAvailableError(Exception):
    pass

class AppointmentTimeConflictError(Exception):
    pass

class AppointmentNotFoundError(Exception):
    pass

class AppointmentService:

    def __init__(self):
        self.appointment_repo = AppointmentRepository()
        self.professional_repo = ProfessionalRepository()

    def create_appointment(self, db: Session, data: AppointmentCreate):

        professional = self.professional_repo.get_by_id(db, data.professional_id)

        if not professional or not professional.is_active:
            raise ProfessionalNotAvailableError()

        if data.start_datetime >= data.end_datetime:
            raise ValueError()

        if self.appointment_repo.has_conflict(db, professional_id=data.professional_id, start=data.start_datetime, end=data.end_datetime):
            raise AppointmentTimeConflictError()

        appointment = Appointment(
            professional_id=data.professional_id,
            business_id=data.business_id,
            service_id=data.service_id,
            client_name=data.client_name,
            client_phone=data.client_phone,
            start_datetime=data.start_datetime,
            end_datetime=data.end_datetime,
            status="scheduled",
        )

        self.appointment_repo.add(db, appointment)

        db.commit()
        db.refresh(appointment)

        return appointment

    def get_appointment(self, db: Session, appointment_id: int | None = None):

        if appointment_id is None:
            return self.appointment_repo.get_all(db)

        appointment = self.appointment_repo.get_by_id(db, appointment_id)

        if not appointment:
            raise AppointmentNotFoundError()

        return appointment

    def update_appointment(self, db: Session, appointment_id: int, data: AppointmentUpdate):

        appointment = self.appointment_repo.get_by_id(db, appointment_id)

        if not appointment:
            raise AppointmentNotFoundError()

        update_data = data.model_dump(exclude_unset=True)

        if "start_datetime" in update_data or "end_datetime" in update_data:

            start = update_data.get("start_datetime", appointment.start_datetime)
            end = update_data.get("end_datetime", appointment.end_datetime)

            if start >= end:
                raise ValueError()

            if self.appointment_repo.has_conflict(db, professional_id=appointment.professional_id, start=start, end=end):
                raise AppointmentTimeConflictError()

        for field, value in update_data.items():
            setattr(appointment, field, value)

        db.commit()
        db.refresh(appointment)

        return appointment

    def delete_appointment(self, db: Session, appointment_id: int):

        appointment = self.appointment_repo.get_by_id(db, appointment_id)

        if not appointment:
            raise AppointmentNotFoundError()

        self.appointment_repo.delete(db, appointment)

        db.commit()