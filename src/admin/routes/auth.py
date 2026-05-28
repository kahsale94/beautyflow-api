from fastapi import APIRouter, Form, Request
from fastapi.responses import RedirectResponse

from src.dependecies import AuthServiceDep
from src.services.auth_service import InvalidCredentialError
from src.core import ADMIN_ACCESS_COOKIE, ADMIN_REFRESH_COOKIE, ADMIN_COOKIE_SAMESITE, ADMIN_COOKIE_SECURE

from ..templating import render, redirect_with_flash
from ..dependencies import get_or_create_csrf_token, validate_csrf

router = APIRouter()

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
        return redirect_with_flash("/admin/login", "Email ou senha inválidos.", "error")

    response = RedirectResponse("/admin", status_code=303)
    response.set_cookie(
        ADMIN_ACCESS_COOKIE,
        access_token,
        httponly=True,
        secure=ADMIN_COOKIE_SECURE,
        samesite=ADMIN_COOKIE_SAMESITE,
        path="/admin",
    )
    response.set_cookie(
        ADMIN_REFRESH_COOKIE,
        refresh_token,
        httponly=True,
        secure=ADMIN_COOKIE_SECURE,
        samesite=ADMIN_COOKIE_SAMESITE,
        path="/admin",
    )

    return response

@router.post("/logout")
async def logout_action(request: Request):
    await validate_csrf(request)
    response = RedirectResponse("/admin/login", status_code=303)
    response.delete_cookie(ADMIN_ACCESS_COOKIE, path="/admin")
    response.delete_cookie(ADMIN_REFRESH_COOKIE, path="/admin")

    return response