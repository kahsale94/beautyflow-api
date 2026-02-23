from fastapi import APIRouter, HTTPException, Depends
from src.core.database import db_dependecy
from src.security.security import Security
from src.schemas import ProfessionalCreate, ProfessionalResponse, ProfessionalUpdate
from src.services.professional_service import ProfessionalService, ProfessionalNotFoundError, BusinessNotFoundError

router = APIRouter(prefix="/professionals", tags=["Professionals"], dependencies=[Depends(Security.get_current_user)])

service = ProfessionalService()

@router.get("/", response_model=list[ProfessionalResponse])
def get_professionals(db: db_dependecy):
    return service.get_professional(db)

@router.get("/{professional_id}", response_model=ProfessionalResponse)
def get_professional(professional_id: int, db: db_dependecy):
    try:
        return service.get_professional(db, professional_id)
    except ProfessionalNotFoundError:
        raise HTTPException(status_code=404, detail="Profissional não encontrado!")

@router.post("/", status_code=201, response_model=ProfessionalResponse)
def create_professional(data: ProfessionalCreate, db: db_dependecy):
    try:
        return service.create_professional(db, data)
    except BusinessNotFoundError:
        raise HTTPException(status_code=404, detail="Empresa inválida ou inativa!")

@router.put("/{professional_id}", response_model=ProfessionalResponse)
def update_professional(professional_id: int, data: ProfessionalUpdate, db: db_dependecy):
    try:
        return service.update_professional(db, professional_id, data)
    except ProfessionalNotFoundError:
        raise HTTPException(status_code=404, detail="Profissional não encontrado!")
    except BusinessNotFoundError:
        raise HTTPException(status_code=404, detail="Empresa inválida ou inativa!")

@router.delete("/{professional_id}", status_code=204)
def delete_professional(professional_id: int, db: db_dependecy):
    try:
        service.delete_professional(db, professional_id)
    except ProfessionalNotFoundError:
        raise HTTPException(status_code=404, detail="Profissional não encontrado!")