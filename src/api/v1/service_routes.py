from fastapi import APIRouter, HTTPException

from src.schemas import ServiceCreate, ServiceUpdate, ServiceResponse
from src.services.service_service import ServiceNotFoundError, ServiceAlreadyExistsError
from src.dependecies import ServiceServiceDep, BusinessScopeDep, AdminDep, SuperAdminDep, UserOrBusinessIntegrationDep

router = APIRouter(prefix="/services", tags=["Services"])

@router.get("/", response_model=list[ServiceResponse])
def get_services(business_id: BusinessScopeDep, service: ServiceServiceDep, actor: UserOrBusinessIntegrationDep, service_name: str | None = None):
    try:
        if service_name:
            return service.get_by_name(business_id, service_name)
        return service.get_all(business_id)
    
    except ServiceNotFoundError:
        raise HTTPException(status_code=404, detail="Serviço(s) não encontrado(s)!")

@router.get("/{service_id}", response_model=ServiceResponse)
def get_service_by_id(service_id: int, business_id: BusinessScopeDep, service: ServiceServiceDep, actor: UserOrBusinessIntegrationDep):
    try:
        return service.get_by_id(business_id, service_id)
    
    except ServiceNotFoundError:
        raise HTTPException(status_code=404, detail="Serviço não encontrado!")

@router.post("/", status_code=201, response_model=ServiceResponse)
def create_service(data: ServiceCreate, business_id: BusinessScopeDep, service: ServiceServiceDep, admin: AdminDep):
    try:
        return service.create(business_id, data)
    
    except ServiceAlreadyExistsError:
        raise HTTPException(status_code=409, detail="Serviço já existe!")

@router.put("/{service_id}", response_model=ServiceResponse)
def update_service(service_id: int, data: ServiceUpdate, business_id: BusinessScopeDep, service: ServiceServiceDep, admin: AdminDep):
    try:
        return service.update(business_id, service_id, data)
    
    except ServiceNotFoundError:
        raise HTTPException(status_code=404, detail="Serviço não encontrado!")
    
@router.patch("/{service_id}/deactivate", status_code=204)
def deactivate_service(service_id: int, business_id: BusinessScopeDep, service: ServiceServiceDep, admin: AdminDep):
    try:
        service.deactivate(business_id, service_id)

    except ServiceNotFoundError:
        raise HTTPException(status_code=404, detail="Serviço não encontrado!")

@router.delete("/{service_id}", status_code=204)
def delete_service(service_id: int, business_id: BusinessScopeDep, service: ServiceServiceDep, super_admin: SuperAdminDep):
    try:
        service.delete(business_id, service_id)

    except ServiceNotFoundError:
        raise HTTPException(status_code=404, detail="Serviço não encontrado!")