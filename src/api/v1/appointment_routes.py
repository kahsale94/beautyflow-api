from datetime import datetime

from fastapi import APIRouter, HTTPException

from src.schemas import AppointmentCreate, AppointmentResponse, AppointmentUpdate
from src.dependecies import AppointmentServiceDep, BusinessScopeDep, UserOrBusinessIntegrationDep
from src.services.appointment_service import (AppointmentAlreadyCanceledError, AppointmentAlreadyCompletedError, AppointmentInvalidSlotIntervalError,
    AppointmentMaximumScheduleWindowError, AppointmentMinimumNoticeError, AppointmentNotFoundError, AppointmentTimeConflictError,  BusinessNotAvailableForBookingError,
    ClientNotFoundError, DatetimeFormatError, InvalidBusinessTimezoneError, ProfessionalNotAvailableError, ProfessionalServiceMismatchError, ServiceNotAvailableError,
)

router = APIRouter(prefix="/appointments", tags=["V1 ➔ Appointments"])

def _handle_booking_rule_errors(exc: Exception):
    if isinstance(exc, BusinessNotAvailableForBookingError):
        raise HTTPException(status_code=403, detail="Agendamento desabilitado para esta empresa!")
    
    if isinstance(exc, AppointmentMinimumNoticeError):
        raise HTTPException(status_code=400, detail="Horário não respeita a antecedência mínima de agendamento!")
    
    if isinstance(exc, AppointmentMaximumScheduleWindowError):
        raise HTTPException(status_code=400, detail="Horário excede a janela máxima de agendamento!")
    
    if isinstance(exc, AppointmentInvalidSlotIntervalError):
        raise HTTPException(status_code=400, detail="Horário não está alinhado ao intervalo de agenda da empresa!")
    
    if isinstance(exc, InvalidBusinessTimezoneError):
        raise HTTPException(status_code=500, detail="Timezone da empresa está inválido. Corrija o cadastro da empresa.")
    
    if isinstance(exc, ProfessionalNotAvailableError):
        raise HTTPException(status_code=404, detail="Profissional não disponível!")

    if isinstance(exc, ServiceNotAvailableError):
        raise HTTPException(status_code=404, detail="Serviço não disponível!")

    if isinstance(exc, ClientNotFoundError):
        raise HTTPException(status_code=404, detail="Cliente não encontrado!")

    if isinstance(exc, ProfessionalServiceMismatchError):
        raise HTTPException(status_code=400, detail="Este profissional não executa o serviço informado!")

    if isinstance(exc, AppointmentTimeConflictError):
        raise HTTPException(status_code=409, detail="Horário já ocupado!")

    if isinstance(exc, DatetimeFormatError):
        raise HTTPException(status_code=400, detail="Formato de data invalido! Envie no seguinte formato: 0000-00-00T00:00:00+-00:00")
    
    if isinstance(exc, ValueError):
        raise HTTPException(status_code=400, detail=str(exc) or "Intervalo inválido!")
    
    if isinstance(exc, AppointmentNotFoundError):
        raise HTTPException(status_code=404, detail="Agendamento não encontrado!")
    
    if isinstance(exc, AppointmentAlreadyCanceledError):
        raise HTTPException(status_code=409, detail="Agendamento já cancelado!")

    if isinstance(exc, AppointmentAlreadyCompletedError):
        raise HTTPException(status_code=409, detail="Agendamento já concluído!")
    
    raise exc

@router.get("/", response_model=list[AppointmentResponse])
def get_all_appointments(business_id: BusinessScopeDep, service: AppointmentServiceDep, actor: UserOrBusinessIntegrationDep,
    client_id: int | None = None, professional_id: int | None = None, start_datetime: datetime | None = None,  end_datetime: datetime | None = None):
    try:
        if start_datetime is not None or end_datetime is not None:
            if start_datetime is None or end_datetime is None:
                raise HTTPException(status_code=400, detail="start_datetime e end_datetime devem ser enviados juntos!")

            return service.get_by_period(business_id, start_datetime, end_datetime, professional_id)

        if client_id is not None:
            return service.get_by_client(business_id, client_id)
        
        if professional_id is not None:
            return service.get_by_professional(business_id, professional_id)
        
        return service.get_all(business_id)
    
    except (InvalidBusinessTimezoneError, DatetimeFormatError, ValueError) as exc:
        _handle_booking_rule_errors(exc)

@router.get("/{appointment_id}", response_model=AppointmentResponse)
def get_appointment_by_id(appointment_id: int, business_id: BusinessScopeDep, service: AppointmentServiceDep, actor: UserOrBusinessIntegrationDep):
    try:
        return service.get_by_id(business_id, appointment_id)
    
    except (AppointmentNotFoundError, InvalidBusinessTimezoneError) as exc:
        _handle_booking_rule_errors(exc)

@router.post("/", status_code=201, response_model=AppointmentResponse)
def create_appointment(data: AppointmentCreate, business_id: BusinessScopeDep, service: AppointmentServiceDep, actor: UserOrBusinessIntegrationDep):
    try:
        return service.create(business_id, data)
    
    except (BusinessNotAvailableForBookingError, AppointmentMinimumNoticeError, AppointmentMaximumScheduleWindowError,
            AppointmentInvalidSlotIntervalError, InvalidBusinessTimezoneError, ProfessionalNotAvailableError,
            ServiceNotAvailableError, ClientNotFoundError, ProfessionalServiceMismatchError,
            AppointmentTimeConflictError, DatetimeFormatError, ValueError,
    ) as exc:
        _handle_booking_rule_errors(exc)

@router.put("/{appointment_id}", response_model=AppointmentResponse)
def update_appointment(appointment_id: int, data: AppointmentUpdate, business_id: BusinessScopeDep, service: AppointmentServiceDep, actor: UserOrBusinessIntegrationDep):
    try:
        return service.update(business_id, appointment_id, data)

    except (BusinessNotAvailableForBookingError, AppointmentMinimumNoticeError, AppointmentMaximumScheduleWindowError,
        AppointmentInvalidSlotIntervalError, InvalidBusinessTimezoneError, AppointmentNotFoundError,
        AppointmentAlreadyCanceledError, AppointmentAlreadyCompletedError, ProfessionalNotAvailableError,
        ServiceNotAvailableError, ClientNotFoundError, ProfessionalServiceMismatchError,
        AppointmentTimeConflictError, DatetimeFormatError, ValueError,
    ) as exc:
        _handle_booking_rule_errors(exc)

@router.patch("/{appointment_id}/complete", status_code=204)
def complete_appointment(appointment_id: int, business_id: BusinessScopeDep, service: AppointmentServiceDep, actor: UserOrBusinessIntegrationDep):
    try:
        service.complete(business_id, appointment_id)

    except (AppointmentNotFoundError, AppointmentAlreadyCompletedError, AppointmentAlreadyCanceledError) as exc:
        _handle_booking_rule_errors(exc)

@router.patch("/{appointment_id}/cancel", status_code=204)
def cancel_appointment(appointment_id: int, business_id: BusinessScopeDep, service: AppointmentServiceDep, actor: UserOrBusinessIntegrationDep):
    try:
        service.cancel(business_id, appointment_id)

    except (AppointmentNotFoundError, AppointmentAlreadyCompletedError, AppointmentAlreadyCanceledError) as exc:
        _handle_booking_rule_errors(exc)