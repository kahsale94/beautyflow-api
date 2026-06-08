import hmac
import hashlib
import secrets
from typing import Annotated
from dataclasses import dataclass

from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, Request

from src.models import Business, User
from src.models.user_model import UserRole
from src.security import RefreshRequest, TokenManager, UserContext
from src.services.auth_service import AuthService, DeactivatedUserError, InvalidTokenError, get_auth_service
from src.core import ADMIN_ACCESS_COOKIE, ADMIN_BUSINESS_COOKIE, ADMIN_CSRF_COOKIE, ADMIN_REFRESH_COOKIE, USER_SECRET_KEY, get_db

@dataclass(frozen=True)
class AdminSession:
    user: UserContext
    business_id: int
    csrf_token: str
    refreshed_access_token: str | None = None
    refreshed_refresh_token: str | None = None

    @property
    def is_super_admin(self) -> bool:
        return self.user.role == UserRole.super_admin

def _redirect(location: str) -> None:
    raise HTTPException(status_code=303, headers={"Location": location})

def _csrf_signature(raw: str) -> str:
    return hmac.new(
        USER_SECRET_KEY.encode("utf-8"),
        raw.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

def create_csrf_token() -> str:
    raw = secrets.token_urlsafe(32)
    return f"{raw}.{_csrf_signature(raw)}"

def is_valid_csrf_token(token: str | None) -> bool:
    if not token or "." not in token:
        return False
    raw, signature = token.rsplit(".", 1)
    expected = _csrf_signature(raw)
    return hmac.compare_digest(signature, expected)

def get_or_create_csrf_token(request: Request) -> str:
    token = request.cookies.get(ADMIN_CSRF_COOKIE)
    if is_valid_csrf_token(token):
        return token  # type: ignore[return-value]
    return create_csrf_token()

async def validate_csrf(request: Request) -> None:
    form = await request.form()
    form_token = form.get("_csrf_token")
    cookie_token = request.cookies.get(ADMIN_CSRF_COOKIE)

    if not form_token or not cookie_token:
        raise HTTPException(status_code=403, detail="CSRF token ausente.")

    if str(form_token) != cookie_token or not is_valid_csrf_token(cookie_token):
        raise HTTPException(status_code=403, detail="CSRF token inválido.")

def _refresh_admin_access_token(request: Request, service: AuthService) -> str:
    refresh_token = request.cookies.get(ADMIN_REFRESH_COOKIE)
    if not refresh_token:
        _redirect("/admin/login")

    try:
        result = service.refresh(
            RefreshRequest(refresh_token=refresh_token)
        )

    except Exception as e:
        _redirect("/admin/login")

    request.state.admin_refreshed_access_token = result.access_token
    request.state.admin_refreshed_refresh_token = result.refresh_token

    return result.access_token

def get_current_admin_session(request: Request, db: Session = Depends(get_db), auth_service: AuthService = Depends(get_auth_service)) -> AdminSession:
    token = request.cookies.get(ADMIN_ACCESS_COOKIE)
    if not token:
        token = _refresh_admin_access_token(request, auth_service)

    try:
        payload = TokenManager.decode(token)  # type: ignore[arg-type]
    except Exception as e:
        token = _refresh_admin_access_token(request, auth_service)
        try:
            payload = TokenManager.decode(token)
        except Exception as e:
            _redirect("/admin/login")

    if payload.get("type") != "user" or payload.get("token_type") != "access":
        _redirect("/admin/login")

    try:
        user_id = int(payload.get("sub"))
    except Exception:
        _redirect("/admin/login")

    user = db.get(User, user_id)
    if not user or not user.is_active:
        _redirect("/admin/login")

    if user.role not in {UserRole.admin, UserRole.super_admin}:
        raise HTTPException(status_code=403, detail="Acesso restrito ao administrador.")

    csrf_token = get_or_create_csrf_token(request)

    if user.role == UserRole.super_admin:
        is_business_selection_page = request.url.path.startswith("/admin/businesses")
        business_id_query = request.query_params.get("business_id")
        business_id_cookie = request.cookies.get(ADMIN_BUSINESS_COOKIE)
        business_id_value = business_id_query or business_id_cookie

        if not business_id_value:
            if is_business_selection_page:
                business_id = 0
            else:
                _redirect("/admin/businesses")
        else:
            try:
                business_id = int(business_id_value)
            except (TypeError, ValueError):
                if is_business_selection_page:
                    business_id = 0
                else:
                    _redirect("/admin/businesses")
            else:
                selected_business = db.get(Business, business_id) if business_id > 0 else None
                if business_id <= 0 or not selected_business or not selected_business.is_active:
                    if is_business_selection_page:
                        business_id = 0
                    else:
                        _redirect("/admin/businesses")
    else:
        if user.business_id is None:
            raise HTTPException(status_code=403, detail="Usuário sem empresa vinculada.")
        business_id = user.business_id

    refreshed_access_token = getattr(request.state, "admin_refreshed_access_token", None)
    refreshed_refresh_token = getattr(request.state, "admin_refreshed_refresh_token", None)

    return AdminSession(
        user=UserContext(
            type="user",
            id=user.id,
            email=user.email,
            role=user.role,
            business_id=user.business_id,
            is_active=user.is_active,
        ),
        business_id=business_id,
        csrf_token=csrf_token,
        refreshed_access_token=refreshed_access_token,
        refreshed_refresh_token=refreshed_refresh_token,
    )

def require_super_admin_session(session: AdminSession = Depends(get_current_admin_session)) -> AdminSession:
    if not session.is_super_admin:
        raise HTTPException(status_code=403, detail="Ação permitida apenas para super admin.")
    return session

AdminSessionDep = Annotated[AdminSession, Depends(get_current_admin_session)]
SuperAdminSessionDep = Annotated[AdminSession, Depends(require_super_admin_session)]