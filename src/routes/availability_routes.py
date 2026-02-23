from fastapi import APIRouter, HTTPException, Depends
from src.core.database import db_dependecy
from src.security.security import Security
from src.schemas import AvailabilityCreate, AvailabilityUpdate, AvailabilityResponse
from src.services.availability_service import AvailabilityService, ProfessionalNotFoundError, InvalidTimeRangeError, AvailabilityAlreadyExistsError, AvailabilityNotFoundError

router = APIRouter(prefix="/availabilities", tags=["Availabilities"], dependencies=[Depends(Security.get_current_user)])

service = AvailabilityService()

@router.get("/", response_model=list[AvailabilityResponse])
def get_availabilities(db: db_dependecy):
    return service.get_availability(db)

@router.get("/{availability_id}", response_model=AvailabilityResponse)
def get_availability(availability_id: int, db: db_dependecy):
    try:
        return service.get_availability(db, availability_id)
    except AvailabilityNotFoundError:
        raise HTTPException(status_code=404, detail="Disponibilidade nao encontrada!")

@router.post("/", status_code=201, response_model=AvailabilityResponse)
def create_availability(data: AvailabilityCreate, db: db_dependecy):
    try:
        return service.create_availability(db, data)
    except ProfessionalNotFoundError:
        raise HTTPException(status_code=404, detail="Professional nao encontrado!")
    except AvailabilityAlreadyExistsError:
        raise HTTPException(status_code=409, detail="Disponibilidade já cadastrada para este dia.")
    except InvalidTimeRangeError:
        raise HTTPException(status_code=400, detail="Intervalo de tempo invalido!")

@router.put("/{availability_id}", response_model=AvailabilityResponse)
def update_availability(availability_id: int, data: AvailabilityUpdate, db: db_dependecy):
    try:
        return service.update_availability(db, availability_id, data)
    except AvailabilityNotFoundError:
        raise HTTPException(status_code=404, detail="Disponibilidade nao encontrada!")
    except AvailabilityAlreadyExistsError:
        raise HTTPException(status_code=409, detail="Disponibilidade já cadastrada para este dia.")
    except InvalidTimeRangeError:
        raise HTTPException(status_code=400, detail="Intervalo de tempo invalido!")

@router.delete("/{availability_id}", status_code=204)
def delete_availability(availability_id: int, db: db_dependecy):
    try:
        service.delete_availability(db, availability_id)
    except AvailabilityNotFoundError:
        raise HTTPException(status_code=404, detail="Disponibilidade nao encontrada!")