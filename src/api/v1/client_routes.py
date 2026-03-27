from fastapi import APIRouter, HTTPException

from src.schemas import ClientCreate, ClientUpdate, ClientResponse
from src.services.client_service import ClientNotFoundError, ClientAlreadyExistsError
from src.dependecies import ClientServiceDep, BusinessScopeDep, SuperAdminDep, AdminDep

router = APIRouter(prefix="/client", tags=["Clients"])

@router.get("/", response_model=list[ClientResponse])
def get_all_clients(business_id: BusinessScopeDep, service: ClientServiceDep):
    return service.get_all(business_id)

@router.get("/{client_id}", response_model=ClientResponse)
def get_client(client_id: int, business_id: BusinessScopeDep, service: ClientServiceDep):
    try:
        return service.get_by_id(business_id, client_id)
    
    except ClientNotFoundError:
        raise HTTPException(status_code=404, detail="Cliente não encontrado!")
    
@router.get("/by-phone/{client_phone}", response_model=ClientResponse)
def get_client_by_phone(client_phone: str, business_id: BusinessScopeDep, service: ClientServiceDep):
    try:
        return service.get_by_phone(business_id, client_phone)
    
    except ClientNotFoundError:
        raise HTTPException(status_code=404, detail="Cliente não encontrado!")

@router.post("/", status_code=201, response_model=ClientResponse)
def create_client(data: ClientCreate, business_id: BusinessScopeDep, service: ClientServiceDep, admin: AdminDep):
    try:
        return service.create(business_id, data)
    
    except ClientAlreadyExistsError:
        raise HTTPException(status_code=409, detail="Cliente já cadastrado!")

@router.put("/{client_id}", response_model=ClientResponse)
def update_client(client_id: int, data: ClientUpdate, business_id: BusinessScopeDep, service: ClientServiceDep, admin: AdminDep):
    try:
        return service.update(business_id, client_id, data)
    
    except ClientNotFoundError:
        raise HTTPException(status_code=404, detail="Cliente não encontrado!")
    
    except ClientAlreadyExistsError:
        raise HTTPException(status_code=409, detail="Cliente já cadastrado!")

@router.delete("/{client_id}", status_code=204)
def delete_client(client_id: int, business_id: BusinessScopeDep, service: ClientServiceDep, super_admin: SuperAdminDep):
    try:
        service.delete(business_id, client_id)

    except ClientNotFoundError:
        raise HTTPException(status_code=404, detail="Cliente não encontrado!")
    
    return