from zoneinfo import ZoneInfo
from datetime import timedelta, datetime

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from src.core import DataBaseDep
from src.models import Appointment
from src.schemas.appointment_schema import AppointmentStatus
from src.schemas import AppointmentCreate, AppointmentUpdate, AppointmentResponse
from src.repositories import AppointmentRepository, ProfessionalRepository, ServiceRepository, AvailabilityRepository, ClientRepository, BusinessRepository

class ProfessionalNotAvailableError(Exception):
    pass

class ServiceNotAvailableError(Exception):
    pass

class ClientNotFoundError(Exception):
    pass

class AppointmentTimeConflictError(Exception):
    pass

class AppointmentNotFoundError(Exception):
    pass

class AppointmentAlreadyCompletedError(Exception):
    pass

class AppointmentAlreadyCanceledError(Exception):
    pass

class DatetimeFormatError(Exception):
    pass

class AppointmentService:
    APPOINTMENT_OVERLAP_CONSTRAINT = "ex_appointments_business_professional_time_conflict"

    def __init__(
        self,
        db: Session,
        appointment_repo: AppointmentRepository,
        professional_repo: ProfessionalRepository,
        service_repo: ServiceRepository,
        availability_repo: AvailabilityRepository,
        client_repo: ClientRepository,
        business_repo: BusinessRepository,
    ):
        self.db = db
        self.appointment_repo = appointment_repo
        self.professional_repo = professional_repo
        self.service_repo = service_repo
        self.availability_repo = availability_repo
        self.client_repo = client_repo
        self.business_repo = business_repo

    def _get_integrity_constraint_name(self, exc: IntegrityError) -> str | None:
        try:
            return exc.orig.diag.constraint_name
        except Exception:
            return None

    def _commit_or_raise_conflict(self) -> None:
        try:
            self.db.commit()
        except IntegrityError as exc:
            self.db.rollback()

            constraint_name = self._get_integrity_constraint_name(exc)
            if constraint_name == self.APPOINTMENT_OVERLAP_CONSTRAINT:
                raise AppointmentTimeConflictError() from exc

            raise

    def _get_business_timezone(self, business_id: int) -> ZoneInfo:
        business = self.business_repo.get_by_id(self.db, business_id)
        if not business:
            raise AppointmentNotFoundError()
        
        return ZoneInfo(business.timezone)

    def _validate_professional(self, business_id: int, professional_id: int):
        professional = self.professional_repo.get_by_id(self.db, business_id, professional_id)
        if (
            not professional
            or not professional.is_active
            or professional.business_id != business_id
        ):
            raise ProfessionalNotAvailableError()

        return professional
    
    def _validate_client(self, business_id: int, client_id: int):
        client = self.client_repo.get_by_id(self.db, business_id, client_id)
        if (
            not client
            or client.business_id != business_id
        ):
            raise ClientNotFoundError()

        return client

    def _validate_appointment(self, business_id: int, client_id: int, professional_id: int, service_id: int, start_datetime: datetime) -> datetime:
        self._validate_client(business_id, client_id)
        self._validate_professional(business_id, professional_id)

        service = self.service_repo.get_by_id(self.db, business_id, service_id)
        if (
            not service
            or not service.is_active
            or service.business_id != business_id
        ):
            raise ServiceNotAvailableError()
        
        if start_datetime.tzinfo is None:
            raise DatetimeFormatError()
        
        business_tz = self._get_business_timezone(business_id)
        now = datetime.now(business_tz)
        if start_datetime < now:
            raise ValueError()

        end_datetime = start_datetime + timedelta(minutes=service.duration_minutes)
        weekday = start_datetime.weekday()

        availability = self.availability_repo.get_by_professional_and_weekday(self.db, professional_id, weekday)
        if not availability:
            raise ProfessionalNotAvailableError()

        start_time = start_datetime.time()
        end_time = end_datetime.time()

        if not (availability.start_time <= start_time and end_time <= availability.end_time):
            raise ProfessionalNotAvailableError()

        return end_datetime
    
    def _validate_return(self, appointment_or_list: Appointment | list[Appointment], business_tz: ZoneInfo) -> AppointmentResponse | list[AppointmentResponse]:
        def _convert(appointment: Appointment):
            return AppointmentResponse(
                id = appointment.id,
                client_id = appointment.client_id,
                professional_id = appointment.professional_id,
                service_id = appointment.service_id,
                business_id = appointment.business_id,
                start_datetime = appointment.start_datetime.astimezone(business_tz),
                end_datetime = appointment.end_datetime.astimezone(business_tz),
                created_at = appointment.created_at,
                status = appointment.status,
            )

        if isinstance(appointment_or_list, list):
            return [_convert(item) for item in appointment_or_list]

        return _convert(appointment_or_list)
    
    def _get_appointment_or_raise(self, business_id: int, appointment_id: int) -> Appointment:
        result = self.appointment_repo.get_by_id(self.db, business_id, appointment_id)
        if (
            not result
            or result.business_id != business_id
        ):
            raise AppointmentNotFoundError()
        
        return result

    def get_all(self, business_id: int):
        result = self.appointment_repo.get_by_business(self.db, business_id)
        if (
            not result
            or not all(item.business_id == business_id for item in result)
        ):
            raise AppointmentNotFoundError()

        business_tz = self._get_business_timezone(business_id)
        return self._validate_return(result, business_tz)

    def get_by_id(self, business_id: int, appointment_id: int):
        result = self.appointment_repo.get_by_id(self.db, business_id, appointment_id)
        if (
            not result
            or result.business_id != business_id
        ):
            raise AppointmentNotFoundError()

        business_tz = self._get_business_timezone(business_id)
        return self._validate_return(result, business_tz)

    def get_by_client(self, business_id: int, client_id: int):
        self._validate_client(business_id, client_id)
        
        result = self.appointment_repo.get_by_client(self.db, business_id, client_id)
        if (
            not result
            or not all(item.client_id == client_id for item in result)
            or not all(item.business_id == business_id for item in result)
        ):
            raise AppointmentNotFoundError()

        business_tz = self._get_business_timezone(business_id)
        return self._validate_return(result, business_tz)
    
    def get_by_professional(self, business_id: int, professional_id: int):
        self._validate_professional(business_id, professional_id)
        
        result = self.appointment_repo.get_by_professional(self.db, business_id, professional_id)
        if (
            not result
            or not all(item.professional_id == professional_id for item in result)
            or not all(item.business_id == business_id for item in result)
        ):
            raise AppointmentNotFoundError()

        business_tz = self._get_business_timezone(business_id)
        return self._validate_return(result, business_tz)

    def create(self, business_id: int, data: AppointmentCreate):
        end_datetime = self._validate_appointment(business_id, data.client_id, data.professional_id, data.service_id, data.start_datetime)

        appointment = Appointment(
            business_id = business_id,
            client_id = data.client_id,
            professional_id = data.professional_id,
            service_id = data.service_id,
            start_datetime = data.start_datetime,
            end_datetime = end_datetime,
            status = AppointmentStatus.scheduled,
        )

        self.appointment_repo.add(self.db, appointment)
        self._commit_or_raise_conflict()
        self.db.refresh(appointment)

        business_tz = self._get_business_timezone(business_id)
        return self._validate_return(appointment, business_tz)

    def update(self, business_id: int, appointment_id: int, data: AppointmentUpdate):
        appointment = self._get_appointment_or_raise(business_id, appointment_id)

        if appointment.status == AppointmentStatus.canceled:
            raise AppointmentAlreadyCanceledError()

        if appointment.status == AppointmentStatus.completed:
            raise AppointmentAlreadyCompletedError()

        update_data = data.model_dump(exclude_unset=True)

        final_client = update_data.get("client_id", appointment.client_id)
        final_professional = update_data.get("professional_id", appointment.professional_id)
        final_service = update_data.get("service_id", appointment.service_id)
        final_start = update_data.get("start_datetime", appointment.start_datetime)

        end_datetime = self._validate_appointment(business_id, final_client, final_professional, final_service, final_start)

        appointment.client_id = final_client
        appointment.professional_id = final_professional
        appointment.service_id = final_service
        appointment.start_datetime = final_start
        appointment.end_datetime = end_datetime

        self._commit_or_raise_conflict()
        self.db.refresh(appointment)

        business_tz = self._get_business_timezone(business_id)
        return self._validate_return(appointment, business_tz)

    def complete(self, business_id: int, appointment_id: int):
        appointment = self._get_appointment_or_raise(business_id, appointment_id)

        if appointment.status == AppointmentStatus.canceled:
            raise AppointmentAlreadyCanceledError()

        if appointment.status == AppointmentStatus.completed:
            raise AppointmentAlreadyCompletedError()

        appointment.status = AppointmentStatus.completed
        self._commit_or_raise_conflict()

        return

    def cancel(self, business_id: int, appointment_id: int):
        appointment = self._get_appointment_or_raise(business_id, appointment_id)

        if appointment.status == AppointmentStatus.canceled:
            raise AppointmentAlreadyCanceledError()

        appointment.status = AppointmentStatus.canceled
        self._commit_or_raise_conflict()

        return

    def delete(self, business_id: int, appointment_id: int):
        appointment = self._get_appointment_or_raise(business_id, appointment_id)

        self.appointment_repo.delete(self.db, appointment)
        self._commit_or_raise_conflict()

        return

def get_appointment_service(db: DataBaseDep):
    return AppointmentService(
        db,
        AppointmentRepository(),
        ProfessionalRepository(),
        ServiceRepository(),
        AvailabilityRepository(),
        ClientRepository(),
        BusinessRepository(),
    )