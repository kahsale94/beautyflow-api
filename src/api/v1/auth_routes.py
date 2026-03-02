from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm

from src.core import DataBaseDep
from src.security import RefreshRequest
from src.dependecies import AuthServiceDep
from src.services.auth_service import DeactivatedUserError, InvalidCredentialError, InvalidTokenError

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/login")
def login(db: DataBaseDep, service: AuthServiceDep, form_data: OAuth2PasswordRequestForm = Depends()):
    try:
        access_token, refresh_token = service.login(
            db=db,
            email=form_data.username,
            password=form_data.password,
        )

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
        }

    except InvalidCredentialError:
        raise HTTPException(status_code=401, detail="Email ou senha inválidos!")

@router.post("/refresh")
def refresh_token(db: DataBaseDep, service: AuthServiceDep, data: RefreshRequest):
    try:
        new_access_token = service.refresh(db, data)

        return {
            "access_token": new_access_token,
            "token_type": "bearer",
        }

    except InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido!")
    
    except DeactivatedUserError:
        raise HTTPException(status_code=401, detail="Usuário Desativado!")
