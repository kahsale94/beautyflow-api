import json
from urllib.parse import quote, unquote

from fastapi import Request
from fastapi.templating import Jinja2Templates
from fastapi.responses import RedirectResponse, Response

from .dependencies import AdminSession
from src.core import ADMIN_CSRF_COOKIE, ADMIN_FLASH_COOKIE, ADMIN_BUSINESS_COOKIE, ADMIN_COOKIE_SECURE, ADMIN_COOKIE_SAMESITE, ADMIN_COOKIE_PATH

WEEKDAYS = [
    (0, "Segunda-feira"),
    (1, "Terça-feira"),
    (2, "Quarta-feira"),
    (3, "Quinta-feira"),
    (4, "Sexta-feira"),
    (5, "Sábado"),
    (6, "Domingo"),
]

templates = Jinja2Templates(directory="src/templates")

def attach_csrf_cookie(response: Response, csrf_token: str) -> None:
    response.set_cookie(
        ADMIN_CSRF_COOKIE,
        csrf_token,
        httponly=True,
        secure=ADMIN_COOKIE_SECURE,
        samesite=ADMIN_COOKIE_SAMESITE,
        path=ADMIN_COOKIE_PATH,
    )

def set_business_cookie(response: Response, business_id: int) -> None:
    response.set_cookie(
        ADMIN_BUSINESS_COOKIE,
        str(business_id),
        httponly=True,
        secure=ADMIN_COOKIE_SECURE,
        samesite=ADMIN_COOKIE_SAMESITE,
        path=ADMIN_COOKIE_PATH,
    )

def set_flash(response: Response, message: str, category: str = "success") -> None:
    payload = quote(json.dumps({"message": message, "category": category}))
    response.set_cookie(
        ADMIN_FLASH_COOKIE,
        payload,
        max_age=10,
        httponly=True,
        secure=ADMIN_COOKIE_SECURE,
        samesite=ADMIN_COOKIE_SAMESITE,
        path=ADMIN_COOKIE_PATH,
    )

def pop_flash(request: Request) -> dict | None:
    raw = request.cookies.get(ADMIN_FLASH_COOKIE)
    if not raw:
        return None
    
    try:
        return json.loads(unquote(raw))
    
    except Exception:
        return None

def render(request: Request, template_name: str, context: dict | None = None, *, session: AdminSession | None = None, active: str = "", status_code: int = 200):
    context = context or {}
    context.update(
        {
            "request": request,
            "session": session,
            "active": active,
            "csrf_token": session.csrf_token if session else context.get("csrf_token"),
            "flash": pop_flash(request),
            "weekdays": WEEKDAYS,
        }
    )
    response = templates.TemplateResponse(template_name, context, status_code=status_code)
    response.delete_cookie(ADMIN_FLASH_COOKIE, path="/admin")
    if session:
        attach_csrf_cookie(response, session.csrf_token)
    elif context.get("csrf_token"):
        attach_csrf_cookie(response, context["csrf_token"])

    return response

def redirect_with_flash(url: str, message: str | None = None, category: str = "success", status_code: int = 303):
    response = RedirectResponse(url=url, status_code=status_code)
    if message:
        set_flash(response, message, category)

    return response