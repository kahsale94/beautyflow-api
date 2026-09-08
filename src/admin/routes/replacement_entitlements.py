from pydantic import ValidationError
from fastapi import APIRouter, Request

from src.dependecies import (
    AppointmentServiceDep,
    ClientServiceDep,
    ReplacementEntitlementServiceDep,
)
from src.models.replacement_entitlement_model import ReplacementEntitlementReason
from src.schemas import ReplacementEntitlementCreate
from src.services.replacement_entitlement_service import (
    ReplacementEntitlementFeatureDisabledError,
    ReplacementEntitlementIneligibleError,
    ReplacementEntitlementInvalidStateError,
    ReplacementEntitlementNotFoundError,
)
from src.utils import form_int, form_value

from ..dependencies import AdminSessionDep, validate_csrf
from ..templating import redirect_with_flash, render


router = APIRouter(prefix="/replacement-entitlements", tags=["Admin ➔ Replacement Entitlements"])


def _error_redirect(request: Request, exc: Exception):
    if isinstance(exc, ReplacementEntitlementFeatureDisabledError):
        message = "Ative reposições nos recursos da empresa."
    elif isinstance(exc, ReplacementEntitlementNotFoundError):
        message = "Reposição não encontrada."
    elif isinstance(exc, (ReplacementEntitlementInvalidStateError, ReplacementEntitlementIneligibleError)):
        message = "Este agendamento não pode gerar ou alterar uma reposição."
    else:
        message = str(exc) or "Não foi possível atualizar a reposição."
    return redirect_with_flash(
        "/admin/replacement-entitlements", message, "error", request=request
    )


@router.get("")
def replacement_entitlements_page(
    request: Request,
    replacement_service: ReplacementEntitlementServiceDep,
    appointment_service: AppointmentServiceDep,
    client_service: ClientServiceDep,
    session: AdminSessionDep,
):
    feature_enabled = True
    try:
        entitlements = replacement_service.list(session.business_id)
    except ReplacementEntitlementFeatureDisabledError:
        feature_enabled = False
        entitlements = []
    return render(
        request,
        "admin/replacement_entitlements/index.html",
        {
            "entitlements": entitlements,
            "appointments": {
                item.id: item for item in appointment_service.get_all(session.business_id)
            },
            "clients": {
                item.id: item for item in client_service.get_all(session.business_id)
            },
            "reasons": list(ReplacementEntitlementReason),
            "feature_enabled": feature_enabled,
        },
        session=session,
        active="replacement_entitlements",
    )


@router.post("")
async def grant_replacement_entitlement_action(
    request: Request,
    replacement_service: ReplacementEntitlementServiceDep,
    session: AdminSessionDep,
):
    await validate_csrf(request)
    form = await request.form()
    try:
        data = ReplacementEntitlementCreate(
            source_appointment_id=form_int(form, "source_appointment_id"),
            reason=form_value(form, "reason", "manual"),
        )
        replacement_service.grant_for_appointment(
            session.business_id, data.source_appointment_id, data.reason
        )
    except (ValidationError, ValueError, ReplacementEntitlementFeatureDisabledError,
            ReplacementEntitlementNotFoundError, ReplacementEntitlementIneligibleError) as exc:
        return _error_redirect(request, exc)
    return redirect_with_flash(
        "/admin/replacement-entitlements", "Reposição concedida.", request=request
    )


@router.post("/{entitlement_id}/forfeit")
async def forfeit_replacement_entitlement_action(
    entitlement_id: int,
    request: Request,
    replacement_service: ReplacementEntitlementServiceDep,
    session: AdminSessionDep,
):
    await validate_csrf(request)
    try:
        replacement_service.forfeit(session.business_id, entitlement_id)
    except Exception as exc:
        return _error_redirect(request, exc)
    return redirect_with_flash(
        "/admin/replacement-entitlements", "Reposição renunciada.", request=request
    )
