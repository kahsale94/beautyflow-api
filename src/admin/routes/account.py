from pydantic import ValidationError
from fastapi import APIRouter, Request

from src.utils import form_value
from src.schemas import UserUpdate
from src.dependecies import UserServiceDep
from src.services.user_service import InvalidCurrentPasswordError, UserNotFoundError

from ..templating import render, redirect_with_flash
from ..dependencies import AdminSessionDep, validate_csrf

router = APIRouter(prefix="/account", tags=["Admin ➔ Account"])

@router.get("/password")
def change_password_page(request: Request, session: AdminSessionDep):
    return render(
        request,
        "admin/account/password.html",
        {},
        session=session,
        active="account",
    )

@router.post("/password")
async def change_password_action(request: Request, service: UserServiceDep, session: AdminSessionDep):
    await validate_csrf(request)
    form = await request.form()

    current_password = form_value(form, "current_password", "")
    new_password = form_value(form, "new_password", "")
    confirm_password = form_value(form, "confirm_password", "")

    if new_password != confirm_password:
        return redirect_with_flash(
            "/admin/account/password",
            "A confirmação da nova senha não confere.",
            "error",
            request = request,
        )

    try:
        UserUpdate(password=new_password)
        service.change_password(session.user.id, current_password, new_password)

    except ValidationError:
        return redirect_with_flash(
            "/admin/account/password",
            "A nova senha deve ter pelo menos 8 caracteres.",
            "error",
            request = request,
        )

    except InvalidCurrentPasswordError:
        return redirect_with_flash(
            "/admin/account/password",
            "Senha atual inválida.",
            "error",
            request = request,
        )

    except UserNotFoundError:
        return redirect_with_flash(
            "/admin/login",
            "Sessão inválida. Faça login novamente.",
            "error",
            request = request,
        )

    return redirect_with_flash("/admin/account/password", "Senha alterada com sucesso.", request=request)