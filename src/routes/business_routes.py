from fastapi import APIRouter, HTTPException, Depends
from src.core.database import db_dependecy
from src.security.security import Security
from src.schemas import BusinessCreate, BusinessResponse, BusinessUpdate
from src.services.business_service import BusinessService, BusinessNotFoundError, BusinessAlreadyExistsError

router = APIRouter(prefix="/businesses", tags=["Businesses"], dependencies=[Depends(Security.get_current_user)])

service = BusinessService()

@router.get("/", response_model=list[BusinessResponse])
def get_businesses(db: db_dependecy):
    return service.get_business(db)

@router.get("/{business_id}", response_model=BusinessResponse)
def get_business(business_id: int, db: db_dependecy):
    try:
        return service.get_business(db, business_id)
    except BusinessNotFoundError:
        raise HTTPException(status_code=404, detail="Business não encontrado!")

@router.post("/", status_code=201, response_model=BusinessResponse)
def create_business(data: BusinessCreate, db: db_dependecy):
    try:
        return service.create_business(db, data)
    except BusinessAlreadyExistsError:
        raise HTTPException(status_code=409, detail="Business já existe!")

@router.put("/{business_id}", response_model=BusinessResponse)
def update_business(business_id: int, data: BusinessUpdate, db: db_dependecy):
    try:
        return service.update_business(db, business_id, data)
    except BusinessNotFoundError:
        raise HTTPException(status_code=404, detail="Business não encontrado!")

@router.delete("/{business_id}", status_code=204)
def delete_business(business_id: int, db: db_dependecy):
    try:
        service.delete_business(db, business_id)
    except BusinessNotFoundError:
        raise HTTPException(status_code=404, detail="Business não encontrado!")