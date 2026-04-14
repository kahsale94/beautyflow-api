from fastapi import APIRouter, HTTPException

from src.schemas import ProfessionalCreate, ProfessionalResponse, ProfessionalUpdate
from src.dependecies import ProfessionalServiceDep, BusinessScopeDep, AdminDep, SuperAdminDep
from src.services.professional_service import ProfessionalNotFoundError, ProfessionalAlreadyExistsError

router = APIRouter(prefix="/professionals", tags=["Professionals"])

@router.get("/", response_model=list[ProfessionalResponse])
def get_professionals(business_id: BusinessScopeDep, service: ProfessionalServiceDep, professional_name: str | None = None):
    try:
        if professional_name:
            return service.get_by_name(business_id, professional_name)
        
        return service.get_all(business_id)   
     
    except ProfessionalNotFoundError:
        raise HTTPException(status_code=404, detail= "Profissional(is) não encontrado(s)!")

@router.get("/{professional_id}", response_model=ProfessionalResponse)
def get_professional_by_id(professional_id: int, business_id: BusinessScopeDep, service: ProfessionalServiceDep):
    try:
        return service.get_by_id(business_id, professional_id)
    
    except ProfessionalNotFoundError:
        raise HTTPException(status_code=404, detail="Profissional não encontrado!")

@router.post("/", status_code=201, response_model=ProfessionalResponse)
def create_professional(data: ProfessionalCreate, business_id: BusinessScopeDep, service: ProfessionalServiceDep, admin: AdminDep):
    try:
        return service.create(business_id, data)
    
    except ProfessionalAlreadyExistsError:
        raise HTTPException(status_code=409, detail="Profissional já existe!")

@router.put("/{professional_id}", response_model=ProfessionalResponse)
def update_professional(professional_id: int, data: ProfessionalUpdate, business_id: BusinessScopeDep, service: ProfessionalServiceDep, admin: AdminDep):
    try:
        return service.update(business_id, professional_id, data)
    
    except ProfessionalNotFoundError:
        raise HTTPException(status_code=404, detail="Profissional não encontrado!")
    
@router.patch("/{professional_id}/deactivate", status_code=204)
def deactivate_professional(professional_id: int, business_id: BusinessScopeDep, service: ProfessionalServiceDep, admin: AdminDep):
    try:
        service.deactivate(business_id, professional_id)

    except ProfessionalNotFoundError:
        raise HTTPException(status_code=404, detail="Profissional não encontrado!")

@router.delete("/{professional_id}", status_code=204)
def delete_professional(professional_id: int, business_id: BusinessScopeDep, service: ProfessionalServiceDep, super_admin: SuperAdminDep):
    try:
        service.delete(business_id, professional_id)

    except ProfessionalNotFoundError:
        raise HTTPException(status_code=404, detail="Profissional não encontrado!")