from fastapi import APIRouter, HTTPException

from src.dependecies import ClientServiceDep, BusinessScopeDep
from src.schemas import ClientCreate, ClientUpdate, ClientResponse
from src.services.client_service import ClientNotFoundError, ClientAlreadyExistsError

router = APIRouter(prefix="/clients", tags=["Clients"])

@router.get("/", response_model=list[ClientResponse])
def get_all_clients(business_id: BusinessScopeDep, service: ClientServiceDep):
    return service.get_client(business_id)

@router.get("/{client_id}", response_model=ClientResponse)
def get_client_by_id(client_id: int, business_id: BusinessScopeDep, service: ClientServiceDep):
    try:
        return service.get_client(business_id=business_id, client_id=client_id)
    except ClientNotFoundError:
        raise HTTPException(status_code=404, detail="Cliente não encontrado!")
    
@router.get("/by-phone/{client_phone}", response_model=ClientResponse)
def get_client_by_phone(client_phone: str, business_id: BusinessScopeDep, service: ClientServiceDep):
    try:
        return service.get_client(business_id=business_id, client_phone=client_phone)
    except ClientNotFoundError:
        raise HTTPException(status_code=404, detail="Cliente não encontrado!")

@router.post("/", status_code=201, response_model=ClientResponse)
def create_client(data: ClientCreate, business_id: BusinessScopeDep, service: ClientServiceDep):
    try:
        return service.create_client(business_id, data)
    except ClientAlreadyExistsError:
        raise HTTPException(status_code=409, detail="Cliente já cadastrado!")

@router.put("/{client_id}", response_model=ClientResponse)
def update_client(client_id: int, data: ClientUpdate, business_id: BusinessScopeDep, service: ClientServiceDep):
    try:
        return service.update_client(business_id, client_id, data)
    except ClientNotFoundError:
        raise HTTPException(status_code=404, detail="Cliente não encontrado!")
    except ClientAlreadyExistsError:
        raise HTTPException(status_code=409, detail="Cliente já cadastrado!")

@router.delete("/{client_id}", status_code=204)
def delete_client(client_id: int, business_id: BusinessScopeDep, service: ClientServiceDep):
    try:
        service.delete_client(business_id, client_id)
    except ClientNotFoundError:
        raise HTTPException(status_code=404, detail="Cliente não encontrado!")