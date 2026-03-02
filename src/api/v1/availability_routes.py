from fastapi import APIRouter, HTTPException

from src.dependecies import AvailabilityServiceDep, BusinessScopeDep
from src.schemas import AvailabilityCreate, AvailabilityUpdate, AvailabilityResponse
from src.services.availability_service import ProfessionalNotFoundError, InvalidTimeRangeError, AvailabilityAlreadyExistsError, AvailabilityNotFoundError

router = APIRouter(prefix="/availabilities", tags=["Availabilities"])

@router.get("/{professional_id}", response_model=list[AvailabilityResponse])
def get_all_availability(professional_id: int, business_id: BusinessScopeDep, service: AvailabilityServiceDep):
    try:
        return service.get_availability(business_id, professional_id)
    except AvailabilityNotFoundError:
        raise HTTPException(status_code=404, detail="Disponibilidade nao encontrada!")
    
@router.get("/{professional_id}/{weekday}", response_model=AvailabilityResponse)
def get_availability_by_weekday(professional_id: int, weekday: int, business_id: BusinessScopeDep, service: AvailabilityServiceDep):
    try:
        return service.get_availability(business_id, professional_id, weekday)
    except AvailabilityNotFoundError:
        raise HTTPException(status_code=404, detail="Disponibilidade nao encontrada!")

@router.post("/", status_code=201, response_model=AvailabilityResponse)
def create_availability(data: AvailabilityCreate, business_id: BusinessScopeDep, service: AvailabilityServiceDep):
    try:
        return service.create_availability(business_id, data)
    except ProfessionalNotFoundError:
        raise HTTPException(status_code=404, detail="Professional nao encontrado!")
    except AvailabilityAlreadyExistsError:
        raise HTTPException(status_code=409, detail="Disponibilidade já cadastrada para este dia.")
    except InvalidTimeRangeError:
        raise HTTPException(status_code=400, detail="Intervalo de tempo invalido!")

@router.put("/{professional_id}", response_model=AvailabilityResponse)
def update_availability(professional_id: int, data: AvailabilityUpdate, business_id: BusinessScopeDep, service: AvailabilityServiceDep):
    try:
        return service.update_availability(business_id, professional_id, data)
    except AvailabilityNotFoundError:
        raise HTTPException(status_code=404, detail="Disponibilidade nao encontrada!")
    except AvailabilityAlreadyExistsError:
        raise HTTPException(status_code=409, detail="Disponibilidade já cadastrada para este dia!")
    except InvalidTimeRangeError:
        raise HTTPException(status_code=400, detail="Intervalo de tempo invalido!")

@router.delete("/{professional_id}", status_code=204)
def delete_availability(professional_id: int, business_id: BusinessScopeDep, service: AvailabilityServiceDep):
    try:
        service.delete_availability(business_id, professional_id)
    except AvailabilityNotFoundError:
        raise HTTPException(status_code=404, detail="Disponibilidade nao encontrada!")