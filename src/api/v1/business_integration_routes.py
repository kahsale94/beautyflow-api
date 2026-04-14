from fastapi import APIRouter, HTTPException

from src.schemas import BusinessIntegrationResponse, BusinessIntegrationCreate, BusinessIntegrationUpdate
from src.dependecies import BusinessScopeDep, BusinessIntegrationServiceDep, SuperAdminDep, BusinessIntegrationDep
from src.services.business_integration_service import BusinessIntegrationNotFoundError, BusinessIntegrationAlreadyExistsError

router = APIRouter(prefix="/business-integrations", tags=["Business Integrations"])

@router.get("/config", response_model=BusinessIntegrationResponse)
def get_my_config(actor: BusinessIntegrationDep, service: BusinessIntegrationServiceDep):
    return service.get_by_ids(actor.business_id, actor.integration_id)

@router.get("/", response_model=list[BusinessIntegrationResponse])
def get_business_integrations(business_id: BusinessScopeDep, service: BusinessIntegrationServiceDep, super_admin: SuperAdminDep):
    try:
        return service.get_all(business_id)
    
    except BusinessIntegrationNotFoundError:
        raise HTTPException(status_code=404, detail="Nenhum vínculo encontrado!")

@router.get("/{integration_id}", response_model=BusinessIntegrationResponse)
def get_business_integration_by_id(integration_id: int, business_id: BusinessScopeDep, service: BusinessIntegrationServiceDep, super_admin: SuperAdminDep):
    try:
        return service.get_by_ids(business_id, integration_id)

    except BusinessIntegrationNotFoundError:
        raise HTTPException(status_code=404, detail="Vínculo não encontrado!")

@router.post("/", status_code=201, response_model=BusinessIntegrationResponse)
def create_business_integration(data: BusinessIntegrationCreate, business_id: BusinessScopeDep, service: BusinessIntegrationServiceDep, super_admin: SuperAdminDep):
    try:
        return service.create(business_id, data)

    except BusinessIntegrationAlreadyExistsError:
        raise HTTPException(status_code=409, detail="Vínculo já existe!")

@router.patch("/{integration_id}/config", response_model=BusinessIntegrationResponse)
def update_config_business_integration(integration_id: int, data: BusinessIntegrationUpdate, business_id: BusinessScopeDep, service: BusinessIntegrationServiceDep, super_admin: SuperAdminDep):
    try:
        return service.update_config(business_id, integration_id, data)

    except BusinessIntegrationNotFoundError:
        raise HTTPException(status_code=404, detail="Vínculo não encontrado!")

@router.patch("/{integration_id}/deactivate", status_code=204)
def deactivate_business_integration(integration_id: int, business_id: BusinessScopeDep, service: BusinessIntegrationServiceDep, super_admin: SuperAdminDep):
    try:
        service.deactivate(business_id, integration_id)

    except BusinessIntegrationNotFoundError:
        raise HTTPException(status_code=404, detail="Vínculo não encontrado!")

@router.delete("/{integration_id}", status_code=204)
def delete_business_integration(integration_id: int, business_id: BusinessScopeDep, service: BusinessIntegrationServiceDep, super_admin: SuperAdminDep):
    try:
        service.delete(business_id, integration_id)

    except BusinessIntegrationNotFoundError:
        raise HTTPException(status_code=404, detail="Vínculo não encontrado!")