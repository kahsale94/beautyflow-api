from fastapi import APIRouter, HTTPException

from src.dependecies import ServiceServiceDep, BusinessScopeDep
from src.schemas import ServiceCreate, ServiceUpdate, ServiceResponse
from src.services.service_service import ServiceNotFoundError

router = APIRouter(prefix="/service", tags=["Services"])

@router.get("/", response_model=list[ServiceResponse])
def get_all_services(business_id: BusinessScopeDep, service: ServiceServiceDep):
    return service.get_service(business_id)

@router.get("/{service_id}", response_model=ServiceResponse)
def get_service_by_id(service_id: int, business_id: BusinessScopeDep, service: ServiceServiceDep):
    try:
        return service.get_service(business_id, service_id)
    except ServiceNotFoundError:
        raise HTTPException(status_code=404, detail="Serviço não encontrado!")

@router.post("/", status_code=201, response_model=ServiceResponse)
def create_service(data: ServiceCreate, business_id: BusinessScopeDep, service: ServiceServiceDep):
    return service.create_service(business_id, data)

@router.put("/{service_id}", response_model=ServiceResponse)
def update_service(service_id: int, data: ServiceUpdate, business_id: BusinessScopeDep, service: ServiceServiceDep):
    try:
        return service.update_service(business_id, service_id, data)
    except ServiceNotFoundError:
        raise HTTPException(status_code=404, detail="Serviço não encontrado!")

@router.delete("/{service_id}", status_code=204)
def delete_service(service_id: int, business_id: BusinessScopeDep, service: ServiceServiceDep):
    try:
        service.delete_service(business_id, service_id)
    except ServiceNotFoundError:
        raise HTTPException(status_code=404, detail="Serviço não encontrado!")