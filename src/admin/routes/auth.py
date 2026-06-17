from fastapi import APIRouter, Form, Request
from fastapi.responses import RedirectResponse

from src.dependecies import AuthServiceDep
from src.services.auth_service import InvalidCredentialError
from src.core import (ADMIN_ACCESS_COOKIE, ADMIN_REFRESH_COOKIE, ADMIN_BUSINESS_COOKIE, ADMIN_COOKIE_PATH,
    ADMIN_COOKIE_SAMESITE, ADMIN_COOKIE_SECURE, USER_ACCESS_TOKEN_EXPIRE_MINUTES, USER_REFRESH_TOKEN_EXPIRE_DAYS,
)

from ..templating import render, redirect_with_flash
from ..dependencies import get_or_create_csrf_token, validate_csrf


router = APIRouter(tags=["Admin ➔ Auth"])

@router.get("/login")
def login_page(request: Request):
    csrf_token = get_or_create_csrf_token(request)

    return render(
        request,
        "admin/login.html",
        {"csrf_token": csrf_token},
        active="login",
    )

@router.post("/login")
async def login_action(request: Request, service: AuthServiceDep, email: str = Form(...),  password: str = Form(...)):
    await validate_csrf(request)
    try:
        access_token, refresh_token = service.login(email, password)

    except InvalidCredentialError:
        return redirect_with_flash("/admin/login", "Email ou senha inválidos.", "error", request = request)

    response = RedirectResponse("/admin/", status_code=303)
    response.delete_cookie(ADMIN_BUSINESS_COOKIE, path=ADMIN_COOKIE_PATH)
    response.set_cookie(
        ADMIN_ACCESS_COOKIE,
        access_token,
        httponly=True,
        secure=ADMIN_COOKIE_SECURE,
        samesite=ADMIN_COOKIE_SAMESITE,
        path=ADMIN_COOKIE_PATH,
        max_age=60 * USER_ACCESS_TOKEN_EXPIRE_MINUTES,
    )
    response.set_cookie(
        ADMIN_REFRESH_COOKIE,
        refresh_token,
        httponly=True,
        secure=ADMIN_COOKIE_SECURE,
        samesite=ADMIN_COOKIE_SAMESITE,
        path=ADMIN_COOKIE_PATH,
        max_age=60 * 60 * 24 * USER_REFRESH_TOKEN_EXPIRE_DAYS,
    )

    return response

@router.post("/logout")
async def logout_action(request: Request, service: AuthServiceDep):
    await validate_csrf(request)

    refresh_token = request.cookies.get(ADMIN_REFRESH_COOKIE)
    if refresh_token:
        service.revoke_refresh_token(refresh_token)

    response = RedirectResponse("/admin/login", status_code=303)
    response.delete_cookie(ADMIN_ACCESS_COOKIE, path=ADMIN_COOKIE_PATH)
    response.delete_cookie(ADMIN_REFRESH_COOKIE, path=ADMIN_COOKIE_PATH)
    response.delete_cookie(ADMIN_BUSINESS_COOKIE, path=ADMIN_COOKIE_PATH)

    return response
