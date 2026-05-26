from fastapi import APIRouter, HTTPException

from src.schemas import ProfessionalServiceCreate, ProfessionalServiceResponse
from src.dependecies import BusinessScopeDep, AdminDep, UserOrBusinessIntegrationDep, ProfessionalServiceLinkServiceDep
from src.services.professional_service_link_service import (ProfessionalServiceLinkAlreadyExistsError,
    ProfessionalServiceLinkInvalidBusinessError, ProfessionalServiceLinkNotFoundError
)

router = APIRouter(prefix="/professional-services", tags=["Professional Services"])

@router.get("/professionals/{professional_id}", response_model=list[ProfessionalServiceResponse])
def get_services_by_professional(professional_id: int, business_id: BusinessScopeDep, service: ProfessionalServiceLinkServiceDep, actor: UserOrBusinessIntegrationDep):
    try:
        return service.get_by_professional(business_id, professional_id)
    
    except ProfessionalServiceLinkInvalidBusinessError:
        raise HTTPException(status_code=404, detail="Profissional não encontrado ou não pertence à empresa!")

@router.get("/services/{service_id}", response_model=list[ProfessionalServiceResponse])
def get_professionals_by_service(service_id: int, business_id: BusinessScopeDep, service: ProfessionalServiceLinkServiceDep, actor: UserOrBusinessIntegrationDep):
    try:
        return service.get_by_service(business_id, service_id)
    
    except ProfessionalServiceLinkInvalidBusinessError:
        raise HTTPException(status_code=404, detail="Serviço não encontrado ou não pertence à empresa!")

@router.post("/", status_code=201, response_model=ProfessionalServiceResponse)
def create_professional_service_link(data: ProfessionalServiceCreate, business_id: BusinessScopeDep, service: ProfessionalServiceLinkServiceDep, admin: AdminDep):
    try:
        return service.create(business_id, data)
    
    except ProfessionalServiceLinkInvalidBusinessError:
        raise HTTPException(status_code=404, detail="Profissional ou serviço não encontrado para esta empresa!")
    
    except ProfessionalServiceLinkAlreadyExistsError:
        raise HTTPException(status_code=409, detail="Profissional já está vinculado a este serviço!")

@router.delete("/professionals/{professional_id}/services/{service_id}", status_code=204)
def delete_professional_service_link(professional_id: int, service_id: int, business_id: BusinessScopeDep, service: ProfessionalServiceLinkServiceDep, admin: AdminDep):
    try:
        service.delete(business_id, professional_id, service_id)

    except ProfessionalServiceLinkInvalidBusinessError:
        raise HTTPException(status_code=404, detail="Profissional ou serviço não encontrado para esta empresa!")
    
    except ProfessionalServiceLinkNotFoundError:
        raise HTTPException(status_code=404, detail="Vínculo não encontrado!")