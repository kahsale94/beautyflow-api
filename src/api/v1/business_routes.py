from fastapi import APIRouter, HTTPException

from src.dependecies import BusinessScopeDep, BusinessServiceDep, SuperAdminDep
from src.schemas import BusinessCreate, BusinessResponse, BusinessUpdate
from src.services.business_service import BusinessNotFoundError, BusinessAlreadyExistsError

router = APIRouter(prefix="/businesses", tags=["Businesses"])

@router.get("/me", response_model=BusinessResponse)
def get_my_business(business_id: BusinessScopeDep, service: BusinessServiceDep):
    return service.get_business(business_id)

@router.get("/", response_model=list[BusinessResponse])
def get_all_business(super_admin: SuperAdminDep, service: BusinessServiceDep):
    return service.get_business()

@router.get("/{business_id}", response_model=BusinessResponse)
def get_business_by_id(business_id: int, super_admin: SuperAdminDep, service: BusinessServiceDep):
    try:
        return service.get_business(business_id)
    except BusinessNotFoundError:
        raise HTTPException(status_code=404, detail="Empresa não encontrada!")

@router.post("/", status_code=201, response_model=BusinessResponse)
def create_business(data: BusinessCreate, super_admin: SuperAdminDep, service: BusinessServiceDep):
    try:
        return service.create_business(data)
    except BusinessAlreadyExistsError:
        raise HTTPException(status_code=409, detail="Empresa já existe!")

@router.put("/{business_id}", response_model=BusinessResponse)
def update_business(business_id: int, data: BusinessUpdate, super_admin: SuperAdminDep, service: BusinessServiceDep):
    try:
        return service.update_business(business_id, data)
    except BusinessNotFoundError:
        raise HTTPException(status_code=404, detail="Empresa não encontrada!")

@router.delete("/{business_id}", status_code=204)
def delete_business(business_id: int, super_admin: SuperAdminDep, service: BusinessServiceDep):
    try:
        service.delete_business(business_id)
    except BusinessNotFoundError:
        raise HTTPException(status_code=404, detail="Empresa não encontrada!")