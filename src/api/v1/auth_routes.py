from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm

from src.security import RefreshRequest
from src.dependecies import AuthServiceDep, IntegrationDep, BusinessScopeDep
from src.services.auth_service import DeactivatedUserError, InvalidCredentialError, InvalidTokenError, DeactivatedLinkError

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/login")
def login_user(service: AuthServiceDep, form_data: OAuth2PasswordRequestForm = Depends()):
    try:
        access_token, refresh_token = service.login(
            email = form_data.username,
            password = form_data.password,
        )

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
        }

    except InvalidCredentialError:
        raise HTTPException(status_code=401, detail="Email ou senha inválidos!")

@router.post("/refresh")
def refresh_token(data: RefreshRequest, service: AuthServiceDep):
    try:
        new_access_token = service.refresh(data)

        return {
            "access_token": new_access_token,
            "token_type": "bearer",
        }

    except InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido!")
    
    except DeactivatedUserError:
        raise HTTPException(status_code=401, detail="Usuário desativado!")
    
@router.post("/integration")
def login_integration(business_phone: BusinessScopeDep, integration: IntegrationDep, service: AuthServiceDep):
    try:
        access_token = service.get_business_integration_token(
            business_phone = business_phone,
            integration_id = integration.id,
            token = integration.token,
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
        }
    
    except DeactivatedLinkError:
        raise HTTPException(status_code=401, detail="Vínculo inválido!")
    
    except InvalidCredentialError:
        raise HTTPException(status_code=401, detail="Token inválido!")