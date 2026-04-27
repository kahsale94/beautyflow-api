from fastapi import APIRouter, HTTPException

from src.schemas import AppointmentCreate, AppointmentResponse, AppointmentUpdate
from src.dependecies import AppointmentServiceDep, BusinessScopeDep, SuperAdminDep
from src.services.appointment_service import (AppointmentAlreadyCanceledError, ProfessionalNotAvailableError, AppointmentTimeConflictError,
AppointmentNotFoundError, AppointmentAlreadyCompletedError, DatetimeFormatError)

router = APIRouter(prefix="/appointments", tags=["Appointments"])

@router.get("/", response_model=list[AppointmentResponse])
def get_all_appointments(business_id: BusinessScopeDep, service: AppointmentServiceDep, client_id: int | None = None, professional_id: int | None = None):
    try:
        if client_id:
            return service.get_by_professional(business_id, client_id)
        
        if professional_id:
            return service.get_by_professional(business_id, professional_id)
        
        return service.get_all(business_id)
    
    except AppointmentNotFoundError:
        raise HTTPException(status_code=404, detail="Nenhum agendamento encontrado!")

@router.get("/{appointment_id}", response_model=AppointmentResponse)
def get_appointment_by_id(appointment_id: int, business_id: BusinessScopeDep, service: AppointmentServiceDep):
    try:
        return service.get_by_id(business_id, appointment_id)

    except AppointmentNotFoundError:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado!")

@router.post("/", status_code=201, response_model=AppointmentResponse)
def create_appointment(data: AppointmentCreate, business_id: BusinessScopeDep, service: AppointmentServiceDep):
    try:
        return service.create(business_id, data)

    except ProfessionalNotAvailableError:
        raise HTTPException(status_code=404, detail="Profissional não disponível!")

    except AppointmentTimeConflictError:
        raise HTTPException(status_code=409, detail="Horário já ocupado!")

    except DatetimeFormatError:
        raise HTTPException(status_code=400, detail="Formato de data invalido! Envie no seguinte formato: 0000-00-00T00:00:00+-00:00")
    
    except ValueError:
        raise HTTPException(status_code=400, detail="Intervalo inválido!")

@router.put("/{appointment_id}", response_model=AppointmentResponse)
def update_appointment(appointment_id: int, data: AppointmentUpdate, business_id: BusinessScopeDep, service: AppointmentServiceDep):
    try:
        return service.update(business_id, appointment_id, data)

    except AppointmentNotFoundError:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado!")

    except AppointmentAlreadyCanceledError:
        raise HTTPException(status_code=409, detail="Agendamento já cancelado!")

    except AppointmentAlreadyCompletedError:
        raise HTTPException(status_code=409, detail="Agendamento já concluído!")

    except AppointmentTimeConflictError:
        raise HTTPException(status_code=409, detail="Horário já ocupado!")

    except ValueError:
        raise HTTPException(status_code=400, detail="Intervalo inválido!")

@router.patch("/{appointment_id}/complete", status_code=204)
def complete_appointment(appointment_id: int, business_id: BusinessScopeDep, service: AppointmentServiceDep):
    try:
        service.complete(business_id, appointment_id)

    except AppointmentNotFoundError:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado!")

    except AppointmentAlreadyCompletedError:
        raise HTTPException(status_code=409, detail="Agendamento já concluído!")

    except AppointmentAlreadyCanceledError:
        raise HTTPException(status_code=409, detail="Agendamento já cancelado!")

@router.patch("/{appointment_id}/cancel", status_code=204)
def cancel_appointment(appointment_id: int, business_id: BusinessScopeDep, service: AppointmentServiceDep):
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