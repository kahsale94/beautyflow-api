from fastapi import APIRouter, HTTPException, Depends
from src.core.database import db_dependecy
from src.security.security import Security
from src.schemas import AppointmentCreate, AppointmentResponse, AppointmentUpdate
from src.services.appointment_service import AppointmentService, ProfessionalNotAvailableError, AppointmentTimeConflictError, AppointmentNotFoundError

router = APIRouter(prefix="/appointments", tags=["Appointments"], dependencies=[Depends(Security.get_current_user)])

service = AppointmentService()

@router.get("/", response_model=list[AppointmentResponse])
def get_appointments(db: db_dependecy):
    return service.get_appointment(db)

@router.get("/{appointment_id}", response_model=AppointmentResponse)
def get_appointment(appointment_id: int, db: db_dependecy):
    try:
        return service.get_appointment(db, appointment_id)
    except AppointmentNotFoundError:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado!")

@router.post("/", status_code=201, response_model=AppointmentResponse)
def create_appointment(data: AppointmentCreate, db: db_dependecy):
    try:
        return service.create_appointment(db, data)
    except ProfessionalNotAvailableError:
        raise HTTPException(status_code=404, detail="Profissional não disponível!")
    except AppointmentTimeConflictError:
        raise HTTPException(status_code=409, detail="Horário já ocupado!")
    except ValueError:
        raise HTTPException(status_code=400, detail="Intervalo inválido!")

@router.put("/{appointment_id}", response_model=AppointmentResponse)
def update_appointment(appointment_id: int, data: AppointmentUpdate, db: db_dependecy):
    try:
        return service.update_appointment(db, appointment_id, data)
    except AppointmentNotFoundError:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado!")
    except AppointmentTimeConflictError:
        raise HTTPException(status_code=409, detail="Horário já ocupado!")
    except ValueError:
        raise HTTPException(status_code=400, detail="Intervalo inválido!")

@router.delete("/{appointment_id}", status_code=204)
def delete_appointment(appointment_id: int, db: db_dependecy):
    try:
        service.delete_appointment(db, appointment_id)
    except AppointmentNotFoundError:
        raise HTTPException(status_code=404, detail="Agendamento não encontrado!")