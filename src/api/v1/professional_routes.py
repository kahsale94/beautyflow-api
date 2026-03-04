from fastapi import APIRouter, HTTPException

from src.dependecies import ProfessionalServiceDep, BusinessScopeDep, AdminDep
from src.schemas import ProfessionalCreate, ProfessionalResponse, ProfessionalUpdate
from src.services.professional_service import ProfessionalNotFoundError

router = APIRouter(prefix="/professional", tags=["Professionals"])

@router.get("/", response_model=list[ProfessionalResponse])
def get_all_professionals(business_id: BusinessScopeDep, service: ProfessionalServiceDep):
    return service.get_professional(business_id)

@router.get("/{professional_id}", response_model=ProfessionalResponse)
def get_professional_by_id(professional_id: int, business_id: BusinessScopeDep, service: ProfessionalServiceDep):
    try:
        return service.get_professional(business_id, professional_id)
    except ProfessionalNotFoundError:
        raise HTTPException(status_code=404, detail="Profissional não encontrado!")

@router.post("/", status_code=201, response_model=ProfessionalResponse)
def create_professional(data: ProfessionalCreate, business_id: BusinessScopeDep, service: ProfessionalServiceDep, admin: AdminDep):
    return service.create_professional(business_id, data)

@router.put("/{professional_id}", response_model=ProfessionalResponse)
def update_professional(professional_id: int, data: ProfessionalUpdate, business_id: BusinessScopeDep, service: ProfessionalServiceDep, admin: AdminDep):
    try:
        return service.update_professional(business_id, professional_id, data)
    except ProfessionalNotFoundError:
        raise HTTPException(status_code=404, detail="Profissional não encontrado!")

@router.delete("/{professional_id}", status_code=204)
def delete_professional(professional_id: int, business_id: BusinessScopeDep, service: ProfessionalServiceDep, admin: AdminDep):
    try:
        service.delete_professional(business_id, professional_id)
    except ProfessionalNotFoundError:
        raise HTTPException(status_code=404, detail="Profissional não encontrado!")