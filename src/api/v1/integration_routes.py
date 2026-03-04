from fastapi import APIRouter, HTTPException

from src.dependecies import IntegrationServiceDep, SuperAdminDep
from src.schemas import IntegrationCreate, IntegrationResponse, IntegrationUpdate
from src.services.integration_service import IntegrationNotFoundError, IntegrationAlreadyExistsError

router = APIRouter(prefix="/integration", tags=["Integrations"])

@router.get("/", response_model=list[IntegrationResponse])
def get_all_integration(service: IntegrationServiceDep, super_admin: SuperAdminDep):
    return service.get_integration()

@router.get("/{integration_id}", response_model=IntegrationResponse)
def get_integration(integration_id: int, service: IntegrationServiceDep, super_admin: SuperAdminDep):
    try:
        return service.get_integration(integration_id)
    except IntegrationNotFoundError:
        raise HTTPException(status_code=404, detail="Integração não encontrada!")

@router.post("/", status_code=201, response_model=IntegrationResponse)
def create_integration(data: IntegrationCreate, service: IntegrationServiceDep, super_admin: SuperAdminDep):
    try:
        return service.create_integration(data)
    except IntegrationAlreadyExistsError:
        raise HTTPException(status_code=409, detail="Integração já existe!")

@router.put("/{integration_id}", response_model=IntegrationResponse)
def update_integration(integration_id: int, data: IntegrationUpdate, service: IntegrationServiceDep, super_admin: SuperAdminDep):
    try:
        return service.update_integration(integration_id, data)
    except IntegrationNotFoundError:
        raise HTTPException(status_code=404, detail="Integração não encontrada!")

@router.delete("/{integration_id}", status_code=204)
def delete_integration(integration_id: int, service: IntegrationServiceDep, super_admin: SuperAdminDep):
    try:
        service.delete_integration(integration_id)
    except IntegrationNotFoundError:
        raise HTTPException(status_code=404, detail="Integração não encontrada!")