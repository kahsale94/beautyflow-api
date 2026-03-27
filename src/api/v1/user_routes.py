from fastapi import APIRouter, HTTPException

from src.dependecies import UserServiceDep, CurrentUserDep, SuperAdminDep, AdminDep, BusinessScopeDep
from src.services.user_service import UserAlreadyExistsError, UserNotFoundError
from src.schemas import UserCreate, UserResponse, UserUpdate

router = APIRouter(prefix="/user", tags=["Users"])

@router.get("/me", response_model=UserResponse)
def get_me(current_user: CurrentUserDep):
    return current_user

@router.get("/", response_model=list[UserResponse])
def get_all_users(business_id: BusinessScopeDep, service: UserServiceDep, admin: AdminDep):
    return service.get_all(business_id)

@router.get("/{user_id}", response_model=UserResponse)
def get_user_by_id(user_id: int, business_id: BusinessScopeDep, service: UserServiceDep, admin: AdminDep):
    try:
        return service.get_by_id(business_id, user_id)
    
    except UserNotFoundError:
        raise HTTPException(status_code=404, detail="Usuário não encontrado!")

@router.get("/by-email/{user_email}", response_model=UserResponse)
def get_user_by_email(user_email: str, business_id: BusinessScopeDep, service: UserServiceDep, admin: AdminDep):
    try:
        return service.get_by_email(business_id, user_email)
    
    except UserNotFoundError:
        raise HTTPException(status_code=404, detail="Usuário não encontrado!")

@router.post("/", response_model=UserResponse, status_code=201)
def create_user(business_id: BusinessScopeDep, data: UserCreate, service: UserServiceDep, super_admin: SuperAdminDep):
    try:
        return service.create(business_id, data)
    
    except UserAlreadyExistsError:
        raise HTTPException(status_code=409, detail="Email já cadastrado!")
    
@router.put("/{user_id}", response_model=UserResponse)
def update_user(user_id: int, data: UserUpdate, business_id: BusinessScopeDep, service: UserServiceDep, super_admin: SuperAdminDep):
    try:
        return service.update(business_id, user_id, data)
    
    except UserNotFoundError:
        raise HTTPException(status_code=404, detail="Usuário não encontrado!")
    
@router.patch("/{user_id}/deactivate", status_code=204)
def deactivate_user(user_id: int, business_id: BusinessScopeDep, service: UserServiceDep, super_admin: SuperAdminDep):
    try:
        service.deactivate(business_id, user_id)

    except UserNotFoundError:
        raise HTTPException(status_code=404, detail="Usuário não encontrado!")

    return
    
@router.delete("/{user_id}", status_code=204)
def delete_user(user_id: int, business_id: BusinessScopeDep, service: UserServiceDep, super_admin: SuperAdminDep):
    try:
        service.delete(business_id, user_id)

    except UserNotFoundError:
        raise HTTPException(status_code=404, detail="Usuário não encontrado!")
    
    return