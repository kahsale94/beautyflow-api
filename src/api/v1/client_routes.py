from fastapi import APIRouter, HTTPException

from src.schemas import ClientCreate, ClientUpdate, ClientResponse
from src.services.client_service import ClientNotFoundError, ClientAlreadyExistsError
from src.dependecies import ClientServiceDep, BusinessScopeDep, SuperAdminDep, AdminDep, UserOrBusinessIntegrationDep

router = APIRouter(prefix="/clients", tags=["V1 ➔ Clients"])

@router.get("/", response_model=list[ClientResponse])
def get_all_clients(business_id: BusinessScopeDep, service: ClientServiceDep, actor: UserOrBusinessIntegrationDep, client_phone: str | None = None):
    try:
        if client_phone:
            return service.get_by_phone(business_id, client_phone)
        
        return service.get_all(business_id)
    
    except ClientNotFoundError:
        raise HTTPException(status_code=404, detail="Cliente(s) não encontrado(s)")

@router.get("/{client_id}", response_model=ClientResponse)
def get_client(client_id: int, business_id: BusinessScopeDep, service: ClientServiceDep, actor: UserOrBusinessIntegrationDep):
    try:
        return service.get_by_id(business_id, client_id)
    
    except ClientNotFoundError:
        raise HTTPException(status_code=404, detail="Cliente não encontrado!")

@router.post("/", status_code=201, response_model=ClientResponse)
def create_client(data: ClientCreate, business_id: BusinessScopeDep, service: ClientServiceDep, actor: UserOrBusinessIntegrationDep):
    try:
        return service.create(business_id, data)
    
    except ClientAlreadyExistsError:
        raise HTTPException(status_code=409, detail="Cliente já cadastrado!")

    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc) or "Dados inválidos")

@router.patch("/{client_id}", response_model=ClientResponse)
def update_name(client_id: int, name: str, business_id: BusinessScopeDep, service: ClientServiceDep, actor: UserOrBusinessIntegrationDep):
    try:
        return service.new_name(business_id, client_id, name)
    
    except ClientNotFoundError:
        raise HTTPException(status_code=404, detail="Cliente não encontrado!")
    
    except ClientAlreadyExistsError:
        raise HTTPException(status_code=409, detail="Cliente já cadastrado!")

    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc) or "Dados inválidos")
    
@router.put("/{client_id}", response_model=ClientResponse)
def update_client(client_id: int, data: ClientUpdate, business_id: BusinessScopeDep, service: ClientServiceDep, admin: AdminDep):
    try:
        return service.update(business_id, client_id, data)
    
    except ClientNotFoundError:
        raise HTTPException(status_code=404, detail="Cliente não encontrado!")
    
    except ClientAlreadyExistsError:
        raise HTTPException(status_code=409, detail="Cliente já cadastrado!")

    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc) or "Dados inválidos")