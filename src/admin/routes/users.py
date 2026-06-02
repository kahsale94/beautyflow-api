from pydantic import ValidationError
from fastapi import APIRouter, Request

from src.utils import form_value
from src.dependecies import UserServiceDep
from src.models.user_model import UserRole
from src.schemas import UserCreate, UserUpdate
from src.services.user_service import UserAlreadyExistsError, UserNotFoundError

from ..templating import render, redirect_with_flash
from ..dependencies import AdminSessionDep, SuperAdminSessionDep, validate_csrf

router = APIRouter(prefix="/users", tags=["Admin ➔ Users"])

@router.get("")
def users_page(request: Request, service: UserServiceDep, session: AdminSessionDep, q: str | None = None):
    users = service.get_all(session.business_id)
    if q:
        q_lower = q.lower().strip()
        users = [
            item for item in users
            if q_lower in item.email.lower()
            or q_lower in item.role.value.lower()
            or q_lower in ("ativo" if item.is_active else "inativo")
        ]

    return render(
        request,
        "admin/users/index.html",
        {"users": users, "roles": [UserRole.admin, UserRole.user], "q": q or ""},
        session=session,
        active="users",
    )

@router.post("")
async def create_user_action(request: Request, service: UserServiceDep, session: SuperAdminSessionDep):
    await validate_csrf(request)
    form = await request.form()

    try:
        data = UserCreate(
            email=form_value(form, "email", ""),
            password=form_value(form, "password", ""),
            role=form_value(form, "role", UserRole.user.value),
        )
        service.create(session.business_id, data)

    except ValidationError:
        return redirect_with_flash("/admin/users", "Dados inválidos para usuário.", "error")
    
    except UserAlreadyExistsError:
        return redirect_with_flash("/admin/users", "Email já cadastrado.", "error")
    
    return redirect_with_flash("/admin/users", "Usuário criado com sucesso.")

@router.post("/{user_id}")
async def update_user_action(user_id: int, request: Request, service: UserServiceDep, session: SuperAdminSessionDep):
    await validate_csrf(request)
    form = await request.form()
    password = form_value(form, "password")

    try:
        update_payload = {
            "email": form_value(form, "email"),
            "role": form_value(form, "role"),
        }
        if password:
            update_payload["password"] = password
        data = UserUpdate(**update_payload)
        service.update(session.business_id, user_id, data)

    except ValidationError:
        return redirect_with_flash("/admin/users", "Dados inválidos.", "error")
    
    except UserNotFoundError:
        return redirect_with_flash("/admin/users", "Usuário não encontrado.", "error")
    
    except UserAlreadyExistsError:
        return redirect_with_flash("/admin/users", "Email já cadastrado.", "error")
    
    return redirect_with_flash("/admin/users", "Usuário atualizado.")

@router.post("/{user_id}/deactivate")
async def deactivate_user_action(user_id: int, request: Request, service: UserServiceDep, session: SuperAdminSessionDep):
    await validate_csrf(request)

    try:
        service.deactivate(session.business_id, user_id)

    except UserNotFoundError:
        return redirect_with_flash("/admin/users", "Usuário não encontrado.", "error")
    
    return redirect_with_flash("/admin/users", "Usuário desativado.")