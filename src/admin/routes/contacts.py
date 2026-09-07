from math import ceil

from fastapi import APIRouter, Request

from src.dependecies import ContactServiceDep, WhatsAppConnectionServiceDep
from src.services.contact_service import ContactNotFoundError
from src.services.whatsapp_connection_service import WhatsAppConnectionNotFoundError

from ..dependencies import AdminSessionDep, validate_csrf
from ..templating import redirect_with_flash, render


router = APIRouter(prefix="/contacts", tags=["Admin ➔ Contacts"])


@router.get("")
def contacts_page(
    request: Request,
    service: ContactServiceDep,
    session: AdminSessionDep,
    q: str | None = None,
    policy: str | None = None,
    provider: str | None = None,
    saved: str | None = None,
    page: int = 1,
):
    page = max(1, page)
    page_size = 50
    saved_filter = None if saved not in {"yes", "no"} else saved == "yes"
    items, total = service.contact_repo.list_page(
        service.db,
        session.business_id,
        page=page,
        page_size=page_size,
        query=q,
        policy=policy if policy in service.POLICIES else None,
        provider=provider if provider in {"covercut", "evolution"} else None,
        saved=saved_filter,
    )
    takeover = service.ownership.active_map(
        session.business_id,
        [(item.whatsapp_connection_id, item.id) for item in items if item.whatsapp_connection_id],
    )
    return render(
        request,
        "admin/contacts/index.html",
        {
            "contacts": items,
            "takeover": takeover,
            "q": q or "",
            "policy": policy or "",
            "provider": provider or "",
            "saved": saved or "",
            "page": page,
            "pages": max(1, ceil(total / page_size)),
            "total": total,
        },
        session=session,
        active="contacts",
    )


@router.post("/{contact_id}/policy")
async def update_policy(contact_id: int, request: Request, service: ContactServiceDep, session: AdminSessionDep):
    await validate_csrf(request)
    form = await request.form()
    try:
        service.set_policy(session.business_id, contact_id, str(form.get("policy") or ""))
    except (ContactNotFoundError, ValueError):
        return redirect_with_flash("/admin/contacts", "Contato ou política inválida.", "error", request=request)
    return redirect_with_flash("/admin/contacts", "Política do contato atualizada.", request=request)


@router.post("/bulk-policy")
async def bulk_policy(request: Request, service: ContactServiceDep, session: AdminSessionDep):
    await validate_csrf(request)
    form = await request.form()
    try:
        contact_ids = [int(value) for value in form.getlist("contact_ids")]
        if not contact_ids:
            raise ValueError()
        count = service.set_policy_bulk(session.business_id, contact_ids, str(form.get("policy") or ""))
    except (ContactNotFoundError, ValueError):
        return redirect_with_flash("/admin/contacts", "Seleção ou política inválida.", "error", request=request)
    return redirect_with_flash("/admin/contacts", f"Política atualizada em {count} contatos.", request=request)


@router.post("/{contact_id}/resume")
async def resume_bot(contact_id: int, request: Request, service: ContactServiceDep, session: AdminSessionDep):
    await validate_csrf(request)
    try:
        contact = service.get(session.business_id, contact_id)
        if not contact.whatsapp_connection_id:
            raise ValueError()
        service.ownership.clear(session.business_id, contact.whatsapp_connection_id, contact.id)
    except (ContactNotFoundError, ValueError, RuntimeError):
        return redirect_with_flash("/admin/contacts", "Não foi possível retomar o bot.", "error", request=request)
    return redirect_with_flash("/admin/contacts", "Bot retomado para este contato.", request=request)


@router.post("/sync")
async def sync_contacts(request: Request, service: WhatsAppConnectionServiceDep, session: AdminSessionDep):
    await validate_csrf(request)
    try:
        await service.request_contact_sync(session.business_id)
    except Exception:
        return redirect_with_flash("/admin/contacts", "Não foi possível iniciar a sincronização.", "error", request=request)
    return redirect_with_flash("/admin/contacts", "Sincronização solicitada à CoverCut.", request=request)
