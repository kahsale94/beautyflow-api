from fastapi import APIRouter, HTTPException

from src.schemas import BusinessCreate, BusinessResponse, BusinessUpdate
from src.dependecies import BusinessScopeDep, BusinessServiceDep, SuperAdminDep
from src.services.business_service import BusinessNotFoundError, BusinessAlreadyExistsError

router = APIRouter(prefix="/business", tags=["Businesses"])

@router.get("/me", response_model=BusinessResponse)
def get_my_business(business_id: BusinessScopeDep, service: BusinessServiceDep):
    return service.get_by_id(business_id)

@router.get("/", response_model=list[BusinessResponse])
def get_all_business(service: BusinessServiceDep, super_admin: SuperAdminDep):
    return service.get_all()

@router.get("/{business_id}", response_model=BusinessResponse)
def get_business_by_id(business_id: int, service: BusinessServiceDep, super_admin: SuperAdminDep):
    try:
        return service.get_by_id(business_id)

    except BusinessNotFoundError:
        raise HTTPException(status_code=404, detail="Empresa não encontrada!")

@router.get("/by-name/{business_name}", response_model=BusinessResponse)
def get_business_by_name(business_name: str, service: BusinessServiceDep, super_admin: SuperAdminDep):
    try:
        return service.get_by_name(business_name)

    except BusinessNotFoundError:
        raise HTTPException(status_code=404, detail="Empresa não encontrada!")

@router.post("/", status_code=201, response_model=BusinessResponse)
def create_business(data: BusinessCreate, service: BusinessServiceDep, super_admin: SuperAdminDep):
    try:
        return service.create(data)

    except BusinessAlreadyExistsError:
        raise HTTPException(status_code=409, detail="Empresa já existe!")

@router.put("/{business_id}", response_model=BusinessResponse)
def update_business(business_id: int, data: BusinessUpdate, service: BusinessServiceDep, super_admin: SuperAdminDep):
    try:
        return service.update(business_id, data)

    except BusinessNotFoundError:
        raise HTTPException(status_code=404, detail="Empresa não encontrada!")

@router.patch("/{business_id}/deactivate", status_code=204)
def deactivate_business(business_id: int, service: BusinessServiceDep, super_admin: SuperAdminDep):
    try:
        service.deactivate(business_id)

    except BusinessNotFoundError:
        raise HTTPException(status_code=404, detail="Empresa não encontrada!")

    return

@router.delete("/{business_id}", status_code=204)
def delete_business(business_id: int, service: BusinessServiceDep, super_admin: SuperAdminDep):
    try:
        service.delete(business_id)

    except BusinessNotFoundError:
        raise HTTPException(status_code=404, detail="Empresa não encontrada!")

    return