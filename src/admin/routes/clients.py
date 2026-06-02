from pydantic import ValidationError
from fastapi import APIRouter, Request

from src.utils import form_value
from src.dependecies import ClientServiceDep
from src.schemas import ClientCreate, ClientUpdate
from src.services.client_service import ClientAlreadyExistsError, ClientNotFoundError

from ..templating import render, redirect_with_flash
from ..dependencies import AdminSessionDep, validate_csrf

router = APIRouter(prefix="/clients", tags=["Admin ➔ Clients"])

@router.get("")
def clients_page(request: Request, service: ClientServiceDep, session: AdminSessionDep, q: str | None = None):
    clients = service.get_all(session.business_id)
    if q:
        q_lower = q.lower().strip()
        clients = [c for c in clients if q_lower in (c.name or "").lower() or q_lower in c.phone]

    return render(
        request,
        "admin/clients/index.html",
        {"clients": clients, "q": q or ""},
        session=session,
        active="clients",
    )

@router.post("")
async def create_client_action(request: Request, service: ClientServiceDep, session: AdminSessionDep):
    await validate_csrf(request)
    form = await request.form()
    try:
        data = ClientCreate(
            name=form_value(form, "name"),
            phone=form_value(form, "phone", ""),
        )
        service.create(session.business_id, data)

    except (ValidationError, ValueError):
        return redirect_with_flash("/admin/clients", "Dados inválidos. Confira nome e telefone.", "error")
    
    except ClientAlreadyExistsError:
        return redirect_with_flash("/admin/clients", "Cliente já cadastrado.", "error")

    return redirect_with_flash("/admin/clients", "Cliente criado com sucesso.")

@router.post("/{client_id}")
async def update_client_action(client_id: int, request: Request, service: ClientServiceDep, session: AdminSessionDep):
    await validate_csrf(request)
    form = await request.form()
    try:
        data = ClientUpdate(
            name=form_value(form, "name"),
            phone=form_value(form, "phone"),
        )
        service.update(session.business_id, client_id, data)

    except ValidationError:
        return redirect_with_flash("/admin/clients", "Dados inválidos.", "error")
    
    except ClientNotFoundError:
        return redirect_with_flash("/admin/clients", "Cliente não encontrado.", "error")
    
    except ClientAlreadyExistsError:
        return redirect_with_flash("/admin/clients", "Já existe cliente com esse telefone.", "error")

    return redirect_with_flash("/admin/clients", "Cliente atualizado com sucesso.")