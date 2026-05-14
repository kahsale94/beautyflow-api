from datetime import date
from fastapi import APIRouter, HTTPException

from src.schemas import AvailabilityCreate, AvailabilityUpdate, AvailabilityResponse, AvailabilitySlotsResponse
from src.dependecies import AvailabilityServiceDep, BusinessScopeDep, SuperAdminDep, UserOrBusinessIntegrationDep
from src.services.availability_service import ProfessionalNotFoundError, InvalidTimeRangeError, AvailabilityAlreadyExistsError, AvailabilityNotFoundError, ProfessionalUnavailableError, ServiceNotFoundError

router = APIRouter(prefix="/availabilities", tags=["Availabilities"])

@router.get("/", response_model=list[AvailabilitySlotsResponse])
def get_availability_slots(professional_id: int, service_id: int, date: date, business_id: BusinessScopeDep, service: AvailabilityServiceDep, actor: UserOrBusinessIntegrationDep):
    try:
        return service.get_slots(business_id, professional_id, service_id, date)

    except ProfessionalNotFoundError:
        raise HTTPException(status_code=404, detail="Professional não encontrado!")

    except ServiceNotFoundError:
        raise HTTPException(status_code=404, detail="Serviço não encontrado!")

    except AvailabilityNotFoundError:
        raise HTTPException(status_code=404, detail="Profissional não trabalha nesse dia!")

    except ProfessionalUnavailableError:
        raise HTTPException(status_code=404, detail="Profissional indisponivel!")

@router.get("/{professional_id}", response_model=list[AvailabilityResponse])
def get_availabilities(professional_id: int, business_id: BusinessScopeDep, service: AvailabilityServiceDep, actor: UserOrBusinessIntegrationDep, weekday: int | None = None):
    try:
        if weekday:
            return service.get_by_weekday(business_id, professional_id, weekday)
        
        return service.get_all(business_id, professional_id)

    except AvailabilityNotFoundError:
        raise HTTPException(status_code=404, detail="Disponibilidade não encontrada!")

@router.post("/", status_code=201, response_model=AvailabilityResponse)
def create_availability(data: AvailabilityCreate, business_id: BusinessScopeDep, service: AvailabilityServiceDep, actor: UserOrBusinessIntegrationDep):
    try:
        return service.create(business_id, data)

    except ProfessionalNotFoundError:
        raise HTTPException(status_code=404, detail="Professional não encontrado!")

    except AvailabilityAlreadyExistsError:
        raise HTTPException(status_code=409, detail="Disponibilidade já cadastrada para este dia.")

    except InvalidTimeRangeError:
        raise HTTPException(status_code=400, detail="Intervalo de tempo invalido!")

@router.put("/{professional_id}", response_model=AvailabilityResponse)
def update_availability(professional_id: int, weekday: int, data: AvailabilityUpdate, business_id: BusinessScopeDep, service: AvailabilityServiceDep, actor: UserOrBusinessIntegrationDep):
    try:
        return service.update(business_id, professional_id, weekday, data)

    except AvailabilityNotFoundError:
        raise HTTPException(status_code=404, detail="Disponibilidade não encontrada!")

    except AvailabilityAlreadyExistsError:
        raise HTTPException(status_code=409, detail="Disponibilidade já cadastrada para este dia!")

    except InvalidTimeRangeError:
        raise HTTPException(status_code=400, detail="Intervalo de tempo invalido!")

@router.delete("/{professional_id}", status_code=204)
def delete_availability(professional_id: int, weekday: int, business_id: BusinessScopeDep, service: AvailabilityServiceDep, super_admin: SuperAdminDep):
    try:
        service.delete(business_id, professional_id, weekday)

    except AvailabilityNotFoundError:
        raise HTTPException(status_code=404, detail="Disponibilidade não encontrada!")