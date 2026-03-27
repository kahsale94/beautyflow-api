from fastapi import APIRouter, HTTPException

from src.dependecies import IntegrationServiceDep, SuperAdminDep
from src.services.integration_service import IntegrationNotFoundError, IntegrationAlreadyExistsError
from src.schemas import IntegrationCreate, IntegrationResponse, IntegrationUpdate, IntegrationCreateResponse

router = APIRouter(prefix="/integration", tags=["Integrations"])

@router.get("/", response_model=list[IntegrationResponse])
def get_all_integrations(service: IntegrationServiceDep, super_admin: SuperAdminDep):
    try:
        return service.get_all()
    except IntegrationNotFoundError:
        raise HTTPException(status_code=404, detail="Nenhuma integração cadastrada!")

@router.get("/{integration_id}", response_model=IntegrationResponse)
def get_integration_by_id(integration_id: int, service: IntegrationServiceDep, super_admin: SuperAdminDep):
    try:
        return service.get_by_id(integration_id)
    
    except IntegrationNotFoundError:
        raise HTTPException(status_code=404, detail="Integração não encontrada!")

@router.get("/by-name/{integration_name}", response_model=IntegrationResponse)
def get_integration_by_name(integration_name: str, service: IntegrationServiceDep, super_admin: SuperAdminDep):
    try:
        return service.get_by_name(integration_name)
    
    except IntegrationNotFoundError:
        raise HTTPException(status_code=404, detail="Integração não encontrada!")

@router.post("/", status_code=201, response_model=IntegrationCreateResponse)
def create_integration(data: IntegrationCreate, service: IntegrationServiceDep, super_admin: SuperAdminDep):
    try:
        return service.create(data)
    
    except IntegrationAlreadyExistsError:
        raise HTTPException(status_code=409, detail="Integração já existe!")

@router.put("/{integration_id}", response_model=IntegrationResponse)
def update_integration(integration_id: int, data: IntegrationUpdate, service: IntegrationServiceDep, super_admin: SuperAdminDep):
    try:
        return service.update(integration_id, data)
    
    except IntegrationNotFoundError:
        raise HTTPException(status_code=404, detail="Integração não encontrada!")
    
@router.patch("/{integration_id}/deactivate", status_code=204)
def deactivate_integration(integration_id: int, service: IntegrationServiceDep, super_admin: SuperAdminDep):
    try:
        service.deactivate(integration_id)

    except IntegrationNotFoundError:
        raise HTTPException(status_code=404, detail="Integração não encontrada!")

    return

@router.delete("/{integration_id}", status_code=204)
def delete_integration(integration_id: int, service: IntegrationServiceDep, super_admin: SuperAdminDep):
    try:
        service.delete(integration_id)

    except IntegrationNotFoundError:
        raise HTTPException(status_code=404, detail="Integração não encontrada!")
    
    return