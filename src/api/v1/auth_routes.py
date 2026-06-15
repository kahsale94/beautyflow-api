from fastapi.security import OAuth2PasswordRequestForm
from fastapi import APIRouter, Body, Depends, Header, HTTPException, Request, Response

from src.security import RefreshRequest
from src.dependecies import AuthServiceDep, IntegrationDep
from src.services.auth_service import (BusinessNotFoundError, DeactivatedLinkError, DeactivatedUserError,
    IntegrationNotFoundError, InvalidCredentialError, InvalidTokenError,
)
from src.core import USER_REFRESH_COOKIE, USER_REFRESH_COOKIE_PATH, USER_REFRESH_COOKIE_SAMESITE, USER_REFRESH_COOKIE_SECURE, USER_REFRESH_TOKEN_EXPIRE_DAYS

router = APIRouter(prefix="/auth", tags=["V1 ➔ Auth"])

def _set_refresh_cookie(response: Response, refresh_token: str) -> None:
    response.set_cookie(
        USER_REFRESH_COOKIE,
        refresh_token,
        httponly=True,
        secure=USER_REFRESH_COOKIE_SECURE,
        samesite=USER_REFRESH_COOKIE_SAMESITE,
        path=USER_REFRESH_COOKIE_PATH,
        max_age=60 * 60 * 24 * USER_REFRESH_TOKEN_EXPIRE_DAYS,
    )

def _delete_refresh_cookie(response: Response) -> None:
    response.delete_cookie(USER_REFRESH_COOKIE, path=USER_REFRESH_COOKIE_PATH)

@router.post("/login")
def login_user(response: Response, service: AuthServiceDep, form_data: OAuth2PasswordRequestForm = Depends()):
    try:
        access_token, refresh_token = service.login(form_data.username, form_data.password)
        _set_refresh_cookie(response, refresh_token)

        return {
            "access_token": access_token,
            "token_type": "bearer",
        }

    except InvalidCredentialError:
        raise HTTPException(status_code=401, detail="Email ou senha inválidos!")

@router.post("/refresh")
def refresh_user_token(request: Request, response: Response, service: AuthServiceDep, data: RefreshRequest | None = Body(default=None)):
    if "refresh_token" in request.query_params:
        raise HTTPException(status_code=400, detail="Não envie refresh_token na URL.")

    refresh_token = request.cookies.get(USER_REFRESH_COOKIE)
    if not refresh_token and data is not None:
        refresh_token = data.refresh_token

    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token ausente!")

    try:
        result = service.refresh(RefreshRequest(refresh_token=refresh_token))
        _set_refresh_cookie(response, result.refresh_token)

        return {
            "access_token": result.access_token,
            "token_type": "bearer",
        }

    except InvalidTokenError:
        _delete_refresh_cookie(response)
        raise HTTPException(status_code=401, detail="Token inválido!")

    except DeactivatedUserError:
        _delete_refresh_cookie(response)
        raise HTTPException(status_code=401, detail="Usuário desativado!")

@router.post("/logout")
def logout_user(request: Request, response: Response, service: AuthServiceDep):
    refresh_token = request.cookies.get(USER_REFRESH_COOKIE)
    if refresh_token:
        service.revoke_refresh_token(refresh_token)

    _delete_refresh_cookie(response)
    return {"detail": "Logout realizado com sucesso."}

@router.post("/integration")
def login_integration(
    integration: IntegrationDep,
    service: AuthServiceDep,
    x_evolution_instance: str | None = Header(default=None, alias="X-Evolution-Instance"),
    x_business_phone: str | None = Header(default=None, alias="X-Business-Phone"),
):
    try:
        if x_evolution_instance:
            try:
                access_token = service.get_business_integration_token_by_instance(
                    x_evolution_instance,
                    integration.id,
                )
            except BusinessNotFoundError:
                if not x_business_phone:
                    raise
                access_token = service.get_business_integration_token(
                    x_business_phone,
                    integration.id,
                )
        elif x_business_phone:
            access_token = service.get_business_integration_token(
                x_business_phone,
                integration.id,
            )
        else:
            raise HTTPException(
                status_code=400,
                detail="X-Evolution-Instance obrigatório.",
            )

        return {
            "access_token": access_token,
            "token_type": "bearer",
        }

    except (IntegrationNotFoundError, BusinessNotFoundError, DeactivatedLinkError):
        raise HTTPException(status_code=401, detail="Credenciais de integração inválidas!")
