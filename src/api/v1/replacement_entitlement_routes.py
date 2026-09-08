from fastapi import APIRouter, HTTPException

from src.dependecies import (
    AdminDep,
    BusinessScopeDep,
    ReplacementEntitlementServiceDep,
    UserOrBusinessIntegrationDep,
)
from src.models.replacement_entitlement_model import ReplacementEntitlementStatus
from src.schemas import (
    ReplacementBookingCreate,
    ReplacementEntitlementCreate,
    ReplacementEntitlementResponse,
    ReplacementUseResponse,
)
from src.services.appointment_service import (
    AppointmentBlockedByScheduleBlockError,
    AppointmentTimeConflictError,
    ProfessionalNotAvailableError,
)
from src.services.replacement_entitlement_service import (
    ReplacementEntitlementExpiredError,
    ReplacementEntitlementFeatureDisabledError,
    ReplacementEntitlementIneligibleError,
    ReplacementEntitlementInvalidStateError,
    ReplacementEntitlementNotFoundError,
)


router = APIRouter(prefix="/replacement-entitlements", tags=["V1 ➔ Replacement Entitlements"])


def _handle_error(exc: Exception) -> None:
    if isinstance(exc, ReplacementEntitlementNotFoundError):
        raise HTTPException(status_code=404, detail="Reposição não encontrada.")
    if isinstance(exc, ReplacementEntitlementFeatureDisabledError):
        raise HTTPException(status_code=403, detail="Reposições não estão habilitadas.")
    if isinstance(exc, ReplacementEntitlementExpiredError):
        raise HTTPException(status_code=409, detail="O prazo desta reposição expirou.")
    if isinstance(exc, (ReplacementEntitlementInvalidStateError, ReplacementEntitlementIneligibleError)):
        raise HTTPException(status_code=409, detail="Reposição indisponível para esta operação.")
    if isinstance(exc, (AppointmentTimeConflictError, AppointmentBlockedByScheduleBlockError)):
        raise HTTPException(status_code=409, detail="Não há capacidade para este horário.")
    if isinstance(exc, ProfessionalNotAvailableError):
        raise HTTPException(status_code=404, detail="Nenhum profissional elegível está disponível.")
    raise exc


@router.get("/", response_model=list[ReplacementEntitlementResponse])
def list_replacement_entitlements(
    business_id: BusinessScopeDep,
    service: ReplacementEntitlementServiceDep,
    actor: UserOrBusinessIntegrationDep,
    client_id: int | None = None,
    status: ReplacementEntitlementStatus | None = None,
):
    try:
        return service.list(business_id, client_id=client_id, status=status)
    except Exception as exc:
        _handle_error(exc)


@router.get("/{entitlement_id}", response_model=ReplacementEntitlementResponse)
def get_replacement_entitlement(
    entitlement_id: int,
    business_id: BusinessScopeDep,
    service: ReplacementEntitlementServiceDep,
    actor: UserOrBusinessIntegrationDep,
):
    try:
        return service.get(business_id, entitlement_id)
    except Exception as exc:
        _handle_error(exc)


@router.post("/", status_code=201, response_model=ReplacementEntitlementResponse)
def grant_replacement_entitlement(
    data: ReplacementEntitlementCreate,
    business_id: BusinessScopeDep,
    service: ReplacementEntitlementServiceDep,
    admin: AdminDep,
):
    try:
        return service.grant_for_appointment(
            business_id, data.source_appointment_id, data.reason
        )
    except Exception as exc:
        _handle_error(exc)


@router.post(
    "/from-client-cancellation/{appointment_id}",
    status_code=201,
    response_model=ReplacementEntitlementResponse,
)
def cancel_recurring_occurrence_with_replacement(
    appointment_id: int,
    business_id: BusinessScopeDep,
    service: ReplacementEntitlementServiceDep,
    actor: UserOrBusinessIntegrationDep,
):
    try:
        return service.grant_from_client_cancellation(business_id, appointment_id)
    except Exception as exc:
        _handle_error(exc)


@router.post("/{entitlement_id}/use", response_model=ReplacementUseResponse)
def use_replacement_entitlement(
    entitlement_id: int,
    data: ReplacementBookingCreate,
    business_id: BusinessScopeDep,
    service: ReplacementEntitlementServiceDep,
    actor: UserOrBusinessIntegrationDep,
):
    try:
        return service.use(business_id, entitlement_id, data)
    except Exception as exc:
        _handle_error(exc)


@router.post("/{entitlement_id}/forfeit", response_model=ReplacementEntitlementResponse)
def forfeit_replacement_entitlement(
    entitlement_id: int,
    business_id: BusinessScopeDep,
    service: ReplacementEntitlementServiceDep,
    admin: AdminDep,
):
    try:
        return service.forfeit(business_id, entitlement_id)
    except Exception as exc:
        _handle_error(exc)
