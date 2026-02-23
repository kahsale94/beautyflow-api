from fastapi import APIRouter, Depends, HTTPException
from src.core.database import db_dependecy
from src.security.security import Security
from src.schemas import UserCreate, UserResponse
from src.services.user_service import UserService, UserAlreadyExistsError, UserNotFoundError

router = APIRouter(prefix="/users", tags=["Users"])

service = UserService()

@router.get("/me", response_model=UserResponse)
def perfil(user=Depends(Security.get_current_user)):
    return user

@router.get("/", response_model=list[UserResponse], dependencies=[Depends(Security.get_current_user)])
def get_users(db: db_dependecy):
    return service.get_user(db=db)

@router.get("/{user_id}", response_model=UserResponse, dependencies=[Depends(Security.get_current_user)])
def get_user(user_id: int, db: db_dependecy):
    try:
        return service.get_user(db=db, user_id=user_id)
    except UserNotFoundError:
        raise HTTPException(status_code=404, detail="Usuário não encontrado!")

@router.get("/{user_email}", response_model=list[UserResponse], dependencies=[Depends(Security.get_current_user)])
def get_user(user_email, db: db_dependecy):
    try:
        return service.get_user(db=db, user_email=user_email)
    except UserNotFoundError:
        raise HTTPException(status_code=404, detail="Usuário não encontrado!")

@router.post("/", response_model=UserResponse, status_code=201)
def create_user(data: UserCreate, db: db_dependecy):
    try:
        return service.create_user(db, data)
    except UserAlreadyExistsError:
        raise HTTPException(status_code=409, detail="Email já cadastrado!")