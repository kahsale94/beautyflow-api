from fastapi import APIRouter, HTTPException, Depends
from src.core.database import db_dependecy
from src.security.security import Security
from src.schemas import ServiceCreate, ServiceUpdate, ServiceResponse
from src.services.service_service import ServiceService, ServiceNotFoundError, BusinessNotFoundError

router = APIRouter(prefix="/services", tags=["Services"], dependencies=[Depends(Security.get_current_user)])

service = ServiceService()

@router.get("/", response_model=list[ServiceResponse])
def get_services(db: db_dependecy):
    return service.get_service(db)

@router.get("/{service_id}", response_model=ServiceResponse)
def get_service(service_id: int, db: db_dependecy):
    try:
        return service.get_service(db, service_id)
    except ServiceNotFoundError:
        raise HTTPException(status_code=404, detail="Service não encontrado!")

@router.post("/", status_code=201, response_model=ServiceResponse)
def create_service(data: ServiceCreate, db: db_dependecy):
    try:
        return service.create_service(db, data)
    except BusinessNotFoundError:
        raise HTTPException(status_code=404, detail="Business inválido ou inativo!")

@router.put("/{service_id}", response_model=ServiceResponse)
def update_service(service_id: int, data: ServiceUpdate, db: db_dependecy):
    try:
        return service.update_service(db, service_id, data)
    except ServiceNotFoundError:
        raise HTTPException(status_code=404, detail="Service não encontrado!")
    except BusinessNotFoundError:
        raise HTTPException(status_code=404, detail="Business inválido ou inativo!")

@router.delete("/{service_id}", status_code=204)
def delete_service(service_id: int, db: db_dependecy):
    try:
        service.delete_service(db, service_id)
    except ServiceNotFoundError:
        raise HTTPException(status_code=404, detail="Service não encontrado!")