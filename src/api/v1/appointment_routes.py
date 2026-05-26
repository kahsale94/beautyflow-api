from datetime import datetime

from fastapi import APIRouter, HTTPException

from src.schemas import AppointmentCreate, AppointmentResponse, AppointmentUpdate
from src.dependecies import AppointmentServiceDep, BusinessScopeDep, SuperAdminDep, UserOrBusinessIntegrationDep
from src.services.appointment_service import (
    AppointmentAlreadyCanceledError, ProfessionalNotAvailableError, AppointmentTimeConflictError,
    AppointmentNotFoundError, AppointmentAlreadyCompletedError,  DatetimeFormatError, ProfessionalServiceMismatchError,
    ServiceNotAvailableError, ClientNotFoundError
)

router = APIRouter(prefix="/appointments", tags=["Appointments"])

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
    
    except AppointmentNotFoundError:
        raise HTTPException(status_code=404, detail="Nenhum agendamento encontrado!")

    except DatetimeFormatError:
        raise HTTPException(status_code=400, detail="Formato de data invalido! Envie timezone no datetime.")

    except ValueError:
        raise HTTPException(status_code=400, detail="Intervalo inválido!")

@router.get("/{appointment_id}", response_model=AppointmentResponse)
def get_appointment_by_id(appointment_id: int, business_id: BusinessScopeDep, service: AppointmentServiceDep, actor: UserOrBusinessIntegrationDep):
    try:
        return service.get_by_id(business_id, appointment_id)

    except AppointmentNotFoundError:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado!")

@router.post("/", status_code=201, response_model=AppointmentResponse)
def create_appointment(data: AppointmentCreate, business_id: BusinessScopeDep, service: AppointmentServiceDep, actor: UserOrBusinessIntegrationDep):
    try:
        return service.create(business_id, data)

    except ProfessionalNotAvailableError:
        raise HTTPException(status_code=404, detail="Profissional não disponível!")

    except ServiceNotAvailableError:
        raise HTTPException(status_code=404, detail="Serviço não disponível!")

    except ClientNotFoundError:
        raise HTTPException(status_code=404, detail="Cliente não encontrado!")

    except ProfessionalServiceMismatchError:
        raise HTTPException(status_code=400, detail="Este profissional não executa o serviço informado!")

    except AppointmentTimeConflictError:
        raise HTTPException(status_code=409, detail="Horário já ocupado!")

    except DatetimeFormatError:
        raise HTTPException(status_code=400, detail="Formato de data invalido! Envie no seguinte formato: 0000-00-00T00:00:00+-00:00")
    
    except ValueError:
        raise HTTPException(status_code=400, detail="Intervalo inválido!")

@router.put("/{appointment_id}", response_model=AppointmentResponse)
def update_appointment(appointment_id: int, data: AppointmentUpdate, business_id: BusinessScopeDep, service: AppointmentServiceDep, actor: UserOrBusinessIntegrationDep):
    try:
        return service.update(business_id, appointment_id, data)

    except AppointmentNotFoundError:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado!")

    except AppointmentAlreadyCanceledError:
        raise HTTPException(status_code=409, detail="Agendamento já cancelado!")

    except AppointmentAlreadyCompletedError:
        raise HTTPException(status_code=409, detail="Agendamento já concluído!")

    except ProfessionalNotAvailableError:
        raise HTTPException(status_code=404, detail="Profissional não disponível!")

    except ServiceNotAvailableError:
        raise HTTPException(status_code=404, detail="Serviço não disponível!")

    except ClientNotFoundError:
        raise HTTPException(status_code=404, detail="Cliente não encontrado!")

    except ProfessionalServiceMismatchError:
        raise HTTPException(status_code=400, detail="Este profissional não executa o serviço informado!")

    except AppointmentTimeConflictError:
        raise HTTPException(status_code=409, detail="Horário já ocupado!")

    except DatetimeFormatError:
        raise HTTPException(status_code=400, detail="Formato de data invalido! Envie no seguinte formato: 0000-00-00T00:00:00+-00:00")

    except ValueError:
        raise HTTPException(status_code=400, detail="Intervalo inválido!")

@router.patch("/{appointment_id}/complete", status_code=204)
def complete_appointment(appointment_id: int, business_id: BusinessScopeDep, service: AppointmentServiceDep, actor: UserOrBusinessIntegrationDep):
    try:
        service.complete(business_id, appointment_id)

    except AppointmentNotFoundError:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado!")

    except AppointmentAlreadyCompletedError:
        raise HTTPException(status_code=409, detail="Agendamento já concluído!")

    except AppointmentAlreadyCanceledError:
        raise HTTPException(status_code=409, detail="Agendamento já cancelado!")

@router.patch("/{appointment_id}/cancel", status_code=204)
def cancel_appointment(appointment_id: int, business_id: BusinessScopeDep, service: AppointmentServiceDep, actor: UserOrBusinessIntegrationDep):
    try:
        service.cancel(business_id, appointment_id)

    except AppointmentNotFoundError:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado!")

    except AppointmentAlreadyCanceledError:
        raise HTTPException(status_code=409, detail="Agendamento já cancelado!")

@router.delete("/{appointment_id}", status_code=204)
def delete_appointment(appointment_id: int, business_id: BusinessScopeDep, service: AppointmentServiceDep, super_admin: SuperAdminDep):
    try:
        service.delete(business_id, appointment_id)

    except AppointmentNotFoundError:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado!")