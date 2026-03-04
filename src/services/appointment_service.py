from datetime import timedelta, datetime
from sqlalchemy.orm import Session

from src.core import DataBaseDep
from src.models import Appointment
from src.schemas import AppointmentCreate, AppointmentUpdate
from src.repositories import AppointmentRepository, ProfessionalRepository, BusinessRepository, ServiceRepository, AvailabilityRepository

class ProfessionalNotAvailableError(Exception):
    pass

class ServiceNotAvailableError(Exception):
    pass

class AppointmentTimeConflictError(Exception):
    pass

class AppointmentNotFoundError(Exception):
    pass

class AppointmentService:

    def __init__(
        self,
        db: Session,
        service_repo: ServiceRepository,
        business_repo: BusinessRepository,
        appointment_repo: AppointmentRepository,
        availability_repo: AvailabilityRepository,
        professional_repo: ProfessionalRepository,
    ):
        self.db = db
        self.service_repo = service_repo
        self.business_repo = business_repo
        self.appointment_repo = appointment_repo
        self.availability_repo = availability_repo
        self.professional_repo = professional_repo

    def create_appointment(self, business_id: int, data: AppointmentCreate):
        professional = self.professional_repo.get_by_id(self.db, data.professional_id)
        if not professional or not professional.is_active or professional.business_id != business_id:
            raise ProfessionalNotAvailableError()

        service = self.service_repo.get_by_id(self.db, data.service_id)
        if not service or service.business_id != business_id or not service.is_active:
            raise ServiceNotAvailableError()
        
        if data.start_datetime < datetime.now(professional.business.timezone):
            raise ValueError()
        
        end_datetime = data.start_datetime + timedelta(minutes=service.duration_minutes)
        if data.start_datetime >= end_datetime:
            raise ValueError()
        
        weekday = data.start_datetime.weekday()
        availability = self.availability_repo.get_by_professional_and_weekday(self.db, data.professional_id, weekday)
        if not availability:
            raise ProfessionalNotAvailableError()
        
        start_time = data.start_datetime.time()
        end_time = end_datetime.time()
        if not availability.start_time <= start_time and end_time <= availability.end_time:
            raise ProfessionalNotAvailableError()

        if self.appointment_repo.has_conflict(self.db, business_id=business_id, professional_id=data.professional_id, start=data.start_datetime, end=end_datetime):
            raise AppointmentTimeConflictError()

        appointment = Appointment(
            client_id = data.client_id,
            professional_id = data.professional_id,
            service_id = data.service_id,
            business_id = business_id,
            start_datetime = data.start_datetime,
            end_datetime = end_datetime,
            status = "scheduled",
        )

        self.appointment_repo.add(self.db, appointment)
        self.db.commit()
        self.db.refresh(appointment)

        return appointment

    def get_appointment(self, business_id: int, appointment_id: int | None = None, professional_id: int | None = None):
        if appointment_id is None:
            if professional_id is None:
                return self.appointment_repo.get_by_business(self.db, business_id)
            
            professional = self.professional_repo.get_by_id(self.db, professional_id)
            if not professional or not professional.is_active or professional.business_id != business_id:
                raise ProfessionalNotAvailableError()
            
            appointment = self.appointment_repo.get_by_professional(self.db, professional_id)
        else:
            appointment = self.appointment_repo.get_by_id(self.db, appointment_id)

        if not appointment or appointment.business_id != business_id:
            raise AppointmentNotFoundError()

        return appointment

    def update_appointment(self, business_id: int, appointment_id: int, data: AppointmentUpdate):       
        appointment = self.appointment_repo.get_by_id(self.db, appointment_id)
        if not appointment or appointment.business_id != business_id:
            raise AppointmentNotFoundError()

        update_data = data.model_dump(exclude_unset=True)

        if "start_datetime" in update_data or "end_datetime" in update_data:

            start = update_data.get("start_datetime", appointment.start_datetime)
            end = update_data.get("end_datetime", appointment.end_datetime)

            if start >= end:
                raise ValueError()

            if self.appointment_repo.has_conflict(self.db, business_id=business_id, professional_id=appointment.professional_id, start=start, end=end, exclude_id=appointment.id):
                raise AppointmentTimeConflictError()

        for field, value in update_data.items():
            setattr(appointment, field, value)

        self.db.commit()
        self.db.refresh(appointment)

        return appointment

    def delete_appointment(self, business_id: int, appointment_id: int):
        appointment = self.appointment_repo.get_by_id(self.db, appointment_id)
        if not appointment or appointment.business_id != business_id:
            raise AppointmentNotFoundError()

        self.appointment_repo.delete(self.db, appointment)

        self.db.commit()

def get_appointment_service(db: DataBaseDep):
    return AppointmentService(
        db,
        ServiceRepository(),
        BusinessRepository(),
        AppointmentRepository(),
        ProfessionalRepository(),
    )