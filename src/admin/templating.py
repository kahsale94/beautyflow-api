import json
import hashlib
from datetime import datetime
from functools import lru_cache
from pathlib import Path
from zoneinfo import ZoneInfo
from urllib.parse import quote, unquote

from fastapi import Request
from fastapi.templating import Jinja2Templates
from fastapi.responses import RedirectResponse, Response

from .dependencies import AdminSession
from src.core import (ADMIN_ACCESS_COOKIE, ADMIN_BUSINESS_COOKIE, ADMIN_COOKIE_PATH, ADMIN_COOKIE_SAMESITE,
    ADMIN_COOKIE_SECURE, ADMIN_CSRF_COOKIE, ADMIN_FLASH_COOKIE, ADMIN_REFRESH_COOKIE, USER_ACCESS_TOKEN_EXPIRE_MINUTES, USER_REFRESH_TOKEN_EXPIRE_DAYS
)

DEFAULT_ADMIN_TIMEZONE = "America/Sao_Paulo"
STATIC_ROOT = Path(__file__).resolve().parents[1] / "static"

WEEKDAYS = [
    (0, "Segunda-feira"),
    (1, "Terça-feira"),
    (2, "Quarta-feira"),
    (3, "Quinta-feira"),
    (4, "Sexta-feira"),
    (5, "Sábado"),
    (6, "Domingo"),
]

ADMIN_LABELS = {
    "scheduled": "Agendado",
    "canceled": "Cancelado",
    "cancelled": "Cancelado",
    "completed": "Concluído",
    "pending": "Pendente",
    "processing": "Enviando",
    "sent": "Enviado",
    "failed": "Falhou",
    "skipped": "Ignorado",
    "appointment_upcoming": "Automático",
    "appointment_manual": "Manual",
    "active": "Ativo",
    "inactive": "Inativo",
    "open": "Conectado",
    "connected": "Conectado",
    "connecting": "Aguardando conexão",
    "creating": "Criando instância",
    "close": "Desconectado",
    "disconnected": "Desconectado",
    "missing": "Ausente",
    "error": "Erro",
    "not_configured": "Não configurado",
    "super_admin": "Superadministrador",
    "admin": "Administrador",
    "user": "Usuário",
    "barbershop": "Barbearia",
    "salon": "Salão de beleza",
    "clinic": "Clínica",
}

templates = Jinja2Templates(directory="src/templates")

@lru_cache(maxsize=64)
def static_version(path: str) -> str:
    asset_path = (STATIC_ROOT / path).resolve()

    try:
        asset_path.relative_to(STATIC_ROOT.resolve())
        return hashlib.sha256(asset_path.read_bytes()).hexdigest()[:12]
    except (OSError, ValueError):
        return "missing"

templates.env.globals["static_version"] = static_version

def safe_timezone(timezone_name: str | None):
    try:
        return ZoneInfo(timezone_name or DEFAULT_ADMIN_TIMEZONE)
    except Exception:
        return ZoneInfo(DEFAULT_ADMIN_TIMEZONE)

def _coerce_datetime(value, timezone_name: str | None = None) -> datetime | None:
    if value is None:
        return None

    if isinstance(value, str):
        try:
            value = datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return None

    if not isinstance(value, datetime):
        return None

    tz = safe_timezone(timezone_name)
    if value.tzinfo is None:
        return value.replace(tzinfo=tz)
    return value.astimezone(tz)

def datetime_br(value, timezone_name: str | None = None) -> str:
    parsed = _coerce_datetime(value, timezone_name)
    return parsed.strftime("%d/%m/%Y %H:%M") if parsed else ""

def datetime_time(value, timezone_name: str | None = None) -> str:
    parsed = _coerce_datetime(value, timezone_name)
    return parsed.strftime("%H:%M") if parsed else ""

def datetime_input(value, timezone_name: str | None = None) -> str:
    parsed = _coerce_datetime(value, timezone_name)
    return parsed.strftime("%Y-%m-%dT%H:%M") if parsed else ""

templates.env.filters["datetime_br"] = datetime_br
templates.env.filters["datetime_time"] = datetime_time
templates.env.filters["datetime_input"] = datetime_input

def admin_label(value) -> str:
    raw_value = getattr(value, "value", value)
    normalized = str(raw_value or "").strip().lower()
    return ADMIN_LABELS.get(normalized, normalized.replace("_", " ").capitalize())

templates.env.filters["admin_label"] = admin_label

def attach_csrf_cookie(response: Response, csrf_token: str) -> None:
    response.set_cookie(
        ADMIN_CSRF_COOKIE,
        csrf_token,
        httponly=True,
        secure=ADMIN_COOKIE_SECURE,
        samesite=ADMIN_COOKIE_SAMESITE,
        path=ADMIN_COOKIE_PATH,
    )

def attach_admin_access_cookie(response: Response, access_token: str) -> None:
    response.set_cookie(
        ADMIN_ACCESS_COOKIE,
        access_token,
        httponly=True,
        secure=ADMIN_COOKIE_SECURE,
        samesite=ADMIN_COOKIE_SAMESITE,
        path=ADMIN_COOKIE_PATH,
        max_age=60 * USER_ACCESS_TOKEN_EXPIRE_MINUTES,
    )

def attach_admin_refresh_cookie(response: Response, refresh_token: str) -> None:
    response.set_cookie(
        ADMIN_REFRESH_COOKIE,
        refresh_token,
        httponly=True,
        secure=ADMIN_COOKIE_SECURE,
        samesite=ADMIN_COOKIE_SAMESITE,
        path=ADMIN_COOKIE_PATH,
        max_age=60 * 60 * 24 * USER_REFRESH_TOKEN_EXPIRE_DAYS,
    )

def attach_refreshed_admin_cookies(request: Request, response: Response) -> None:
    refreshed_token = getattr(request.state, "admin_refreshed_access_token", None)
    if refreshed_token:
        attach_admin_access_cookie(response, refreshed_token)

    refreshed_refresh_token = getattr(request.state, "admin_refreshed_refresh_token", None)
    if refreshed_refresh_token:
        attach_admin_refresh_cookie(response, refreshed_refresh_token)

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
    response = templates.TemplateResponse(
        request,
        template_name,
        context,
        status_code=status_code,
    )
    response.delete_cookie(ADMIN_FLASH_COOKIE, path="/admin")

    if session:
        attach_csrf_cookie(response, session.csrf_token)
    elif context.get("csrf_token"):
        attach_csrf_cookie(response, context["csrf_token"])

    attach_refreshed_admin_cookies(request, response)

    return response

def redirect_with_flash(url: str, message: str | None = None, category: str = "success", status_code: int = 303, request: Request | None = None):
    response = RedirectResponse(url=url, status_code=status_code)

    if message:
        set_flash(response, message, category)

    if request:
        attach_refreshed_admin_cookies(request, response)

    return response
