from fastapi import APIRouter, HTTPException

from src.schemas import BusinessIntegrationResponse, BusinessIntegrationCreate, BusinessIntegrationUpdate
from src.dependecies import BusinessScopeDep, BusinessIntegrationServiceDep, SuperAdminDep
from src.services.business_integration_service import BusinessIntegrationNotFoundError, BusinessIntegrationAlreadyExistsError

router = APIRouter(prefix="/business-integration", tags=["Business Integrations"])

@router.get("/", response_model=list[BusinessIntegrationResponse])
def get_all_business_integration(business_id: BusinessScopeDep, service: BusinessIntegrationServiceDep, super_admin: SuperAdminDep):
    return service.get_business_integration(business_id)

@router.get("/{integration_id}", response_model=BusinessIntegrationResponse)
def get_all_business_integration(integration_id: int, business_id: BusinessScopeDep, service: BusinessIntegrationServiceDep, super_admin: SuperAdminDep):
    return service.get_business_integration(business_id, integration_id)

@router.post("/", status_code=201)
def create_business_integration(integration: BusinessIntegrationCreate, business_id: BusinessScopeDep, service: BusinessIntegrationServiceDep, super_admin: SuperAdminDep):
    try:
        return service.create_business_integration(business_id, integration)
    except BusinessIntegrationAlreadyExistsError:
        raise HTTPException(status_code=409, detail="Vínculo já existe!")

@router.put("/{integration_id}/config")
def update_config_business_integration(integration_id: int, data: BusinessIntegrationUpdate, business_id: BusinessScopeDep, service: BusinessIntegrationServiceDep, super_admin: SuperAdminDep):
    try:
        return service.update_config(business_id, integration_id, data)
    except BusinessIntegrationNotFoundError:
        raise HTTPException(status_code=404, detail="Vínculo não encontrado!")

@router.put("/{integration_id}/rotate-key")
def update_key(integration_id: int, business_id: BusinessScopeDep, service: BusinessIntegrationServiceDep, super_admin: SuperAdminDep):
    try:
        service.update_key(business_id, integration_id)
    except BusinessIntegrationNotFoundError:
        raise HTTPException(status_code=404, detail="Vínculo não encontrado!")
    
@router.put("/{integration_id}/deactivate", status_code=204)
def deactive_business_integration(integration_id: int, business_id: BusinessScopeDep, service: BusinessIntegrationServiceDep, super_admin: SuperAdminDep):
    try:
        return service.deactive_business_integration(business_id, integration_id)
    except BusinessIntegrationNotFoundError:
        raise HTTPException(status_code=404, detail="Vínculo não encontrado!")