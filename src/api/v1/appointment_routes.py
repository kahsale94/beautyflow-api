from fastapi import APIRouter, HTTPException

from src.dependecies import AppointmentServiceDep, BusinessScopeDep
from src.schemas import AppointmentCreate, AppointmentResponse, AppointmentUpdate
from src.services.appointment_service import ProfessionalNotAvailableError, AppointmentTimeConflictError, AppointmentNotFoundError

router = APIRouter(prefix="/appointments", tags=["Appointments"])

@router.get("/", response_model=list[AppointmentResponse])
def get_all_appointments(business_id: BusinessScopeDep, service: AppointmentServiceDep):
    return service.get_appointment(business_id)

@router.get("/{appointment_id}", response_model=AppointmentResponse)
def get_appointment_by_id(appointment_id: int, business_id: BusinessScopeDep, service: AppointmentServiceDep):
    try:
        return service.get_appointment(business_id=business_id, appointment_id=appointment_id)
    except AppointmentNotFoundError:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado!")
    
@router.get("/by-professional/{professional_id}", response_model=list[AppointmentResponse])
def get_appointments_by_professional(professional_id: int, business_id: BusinessScopeDep, service: AppointmentServiceDep):
    try:
        return service.get_appointment(business_id=business_id, professional_id=professional_id)
    except ProfessionalNotAvailableError:
        raise HTTPException(status_code=404, detail="Profissional não disponível!")
    except AppointmentNotFoundError:
        raise HTTPException(status_code=404, detail="Agendamentos não encontrado!")

@router.post("/", status_code=201, response_model=AppointmentResponse)
def create_appointment(data: AppointmentCreate, business_id: BusinessScopeDep, service: AppointmentServiceDep):
    try:
        return service.create_appointment(business_id, data)
    except ProfessionalNotAvailableError:
        raise HTTPException(status_code=404, detail="Profissional não disponível!")
    except AppointmentTimeConflictError:
        raise HTTPException(status_code=409, detail="Horário já ocupado!")
    except ValueError:
        raise HTTPException(status_code=400, detail="Intervalo inválido!")

@router.put("/{appointment_id}", response_model=AppointmentResponse)
def update_appointment(appointment_id: int, data: AppointmentUpdate, business_id: BusinessScopeDep, service: AppointmentServiceDep):
    try:
        return service.update_appointment(business_id, appointment_id, data)
    except AppointmentNotFoundError:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado!")
    except AppointmentTimeConflictError:
        raise HTTPException(status_code=409, detail="Horário já ocupado!")
    except ValueError:
        raise HTTPException(status_code=400, detail="Intervalo inválido!")

@router.delete("/{appointment_id}", status_code=204)
def delete_appointment(appointment_id: int, business_id: BusinessScopeDep, service: AppointmentServiceDep):
    try:
        service.delete_appointment(business_id, appointment_id)
    except AppointmentNotFoundError:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado!")