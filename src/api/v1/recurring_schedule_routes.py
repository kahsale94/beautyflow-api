from fastapi import APIRouter, HTTPException

from src.dependecies import (
    AdminDep,
    BusinessScopeDep,
    IntegrationDep,
    RecurringScheduleServiceDep,
    UserOrBusinessIntegrationDep,
)
from src.models.recurring_schedule_model import RecurringScheduleStatus
from src.schemas import (
    RecurringMaterializationResponse,
    RecurringMaterializationSweepResponse,
    RecurringScheduleCreate,
    RecurringScheduleResponse,
    RecurringScheduleUpdate,
)
from src.services.recurring_schedule_service import (
    RecurringScheduleFeatureDisabledError,
    RecurringScheduleInvalidStateError,
    RecurringScheduleNotFoundError,
    RecurringScheduleRelatedEntityError,
)


router = APIRouter(prefix="/recurring-schedules", tags=["V1 ➔ Recurring Schedules"])


def _handle_error(exc: Exception) -> None:
    if isinstance(exc, RecurringScheduleNotFoundError):
        raise HTTPException(status_code=404, detail="Horário recorrente não encontrado.")
    if isinstance(exc, RecurringScheduleFeatureDisabledError):
        raise HTTPException(status_code=403, detail="Horários recorrentes não estão habilitados.")
    if isinstance(exc, RecurringScheduleRelatedEntityError):
        raise HTTPException(status_code=422, detail="Cliente ou serviço inválido para esta empresa.")
    if isinstance(exc, RecurringScheduleInvalidStateError):
        raise HTTPException(status_code=409, detail="Operação incompatível com o estado da recorrência.")
    if isinstance(exc, ValueError):
        raise HTTPException(status_code=422, detail=str(exc))
    raise exc


@router.post("/materialize-due", response_model=RecurringMaterializationSweepResponse)
def materialize_due_recurring_schedules(
    integration: IntegrationDep,
    service: RecurringScheduleServiceDep,
):
    return service.materialize_due_for_integration(integration.id)


@router.get("/", response_model=list[RecurringScheduleResponse])
def list_recurring_schedules(
    business_id: BusinessScopeDep,
    service: RecurringScheduleServiceDep,
    actor: UserOrBusinessIntegrationDep,
    client_id: int | None = None,
    status: RecurringScheduleStatus | None = None,
):
    try:
        return service.list(business_id, client_id=client_id, status=status)
    except Exception as exc:
        _handle_error(exc)


@router.get("/{series_id}", response_model=RecurringScheduleResponse)
def get_recurring_schedule(
    series_id: int,
    business_id: BusinessScopeDep,
    service: RecurringScheduleServiceDep,
    actor: UserOrBusinessIntegrationDep,
):
    try:
        return service.get(business_id, series_id)
    except Exception as exc:
        _handle_error(exc)


@router.post("/", status_code=201, response_model=RecurringScheduleResponse)
def create_recurring_schedule(
    data: RecurringScheduleCreate,
    business_id: BusinessScopeDep,
    service: RecurringScheduleServiceDep,
    actor: UserOrBusinessIntegrationDep,
):
    try:
        return service.create(business_id, data)
    except Exception as exc:
        _handle_error(exc)


@router.put("/{series_id}", response_model=RecurringScheduleResponse)
def update_recurring_schedule(
    series_id: int,
    data: RecurringScheduleUpdate,
    business_id: BusinessScopeDep,
    service: RecurringScheduleServiceDep,
    actor: UserOrBusinessIntegrationDep,
):
    try:
        return service.update(business_id, series_id, data)
    except Exception as exc:
        _handle_error(exc)


@router.post("/{series_id}/pause", response_model=RecurringScheduleResponse)
def pause_recurring_schedule(
    series_id: int,
    business_id: BusinessScopeDep,
    service: RecurringScheduleServiceDep,
    actor: UserOrBusinessIntegrationDep,
):
    try:
        return service.pause(business_id, series_id)
    except Exception as exc:
        _handle_error(exc)


@router.post("/{series_id}/resume", response_model=RecurringScheduleResponse)
def resume_recurring_schedule(
    series_id: int,
    business_id: BusinessScopeDep,
    service: RecurringScheduleServiceDep,
    actor: UserOrBusinessIntegrationDep,
):
    try:
        return service.resume(business_id, series_id)
    except Exception as exc:
        _handle_error(exc)


@router.post("/{series_id}/cancel", response_model=RecurringScheduleResponse)
def cancel_recurring_schedule(
    series_id: int,
    business_id: BusinessScopeDep,
    service: RecurringScheduleServiceDep,
    actor: UserOrBusinessIntegrationDep,
):
    try:
        return service.cancel(business_id, series_id)
    except Exception as exc:
        _handle_error(exc)


@router.post("/{series_id}/materialize", response_model=RecurringMaterializationResponse)
def materialize_recurring_schedule(
    series_id: int,
    business_id: BusinessScopeDep,
    service: RecurringScheduleServiceDep,
    admin: AdminDep,
):
    try:
        return service.materialize(business_id, series_id)
    except Exception as exc:
        _handle_error(exc)
