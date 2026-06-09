from datetime import datetime

from fastapi import APIRouter, HTTPException

from src.dependecies import AdminDep, BusinessScopeDep, ScheduleBlockServiceDep
from src.schemas import ScheduleBlockCreate, ScheduleBlockResponse
from src.services.schedule_block_service import (ScheduleBlockAlreadyCanceledError, ScheduleBlockAppointmentConflictError,
    ScheduleBlockInvalidBusinessTimezoneError, ScheduleBlockInvalidDatetimeError, ScheduleBlockInvalidDurationError,
    ScheduleBlockNotFoundError, ScheduleBlockProfessionalNotFoundError, ScheduleBlockTimeConflictError,
)

router = APIRouter(prefix="/schedule-blocks", tags=["V1 ➔ Schedule Blocks"])


def _handle_schedule_block_errors(exc: Exception):
    if isinstance(exc, ScheduleBlockProfessionalNotFoundError):
        raise HTTPException(status_code=404, detail="Profissional não encontrado!")

    if isinstance(exc, ScheduleBlockNotFoundError):
        raise HTTPException(status_code=404, detail="Fechamento de agenda não encontrado!")

    if isinstance(exc, ScheduleBlockInvalidDatetimeError):
        raise HTTPException(status_code=400, detail="Formato de data invalido! Envie timezone no datetime.")

    if isinstance(exc, ScheduleBlockInvalidDurationError):
        raise HTTPException(status_code=400, detail="Quantidade de horas inválida!")

    if isinstance(exc, ScheduleBlockInvalidBusinessTimezoneError):
        raise HTTPException(status_code=500, detail="Timezone da empresa está inválido. Corrija o cadastro da empresa.")

    if isinstance(exc, ScheduleBlockAppointmentConflictError):
        raise HTTPException(status_code=409, detail="Já existe agendamento nesse período!")

    if isinstance(exc, ScheduleBlockTimeConflictError):
        raise HTTPException(status_code=409, detail="Agenda já fechada nesse período!")

    if isinstance(exc, ScheduleBlockAlreadyCanceledError):
        raise HTTPException(status_code=409, detail="Fechamento de agenda já cancelado!")

    if isinstance(exc, ValueError):
        raise HTTPException(status_code=400, detail="Intervalo inválido!")

    raise exc


@router.get("/", response_model=list[ScheduleBlockResponse])
def get_schedule_blocks(business_id: BusinessScopeDep, service: ScheduleBlockServiceDep, admin: AdminDep,
    start_datetime: datetime, end_datetime: datetime, professional_id: int | None = None):
    try:
        return service.get_by_period(business_id, start_datetime, end_datetime, professional_id)

    except (ScheduleBlockProfessionalNotFoundError, ScheduleBlockInvalidDatetimeError,
        ScheduleBlockInvalidBusinessTimezoneError, ValueError,
    ) as exc:
        _handle_schedule_block_errors(exc)

@router.get("/{schedule_block_id}", response_model=ScheduleBlockResponse)
def get_schedule_block_by_id(schedule_block_id: int, business_id: BusinessScopeDep, service: ScheduleBlockServiceDep, admin: AdminDep):
    try:
        return service.get_by_id(business_id, schedule_block_id)

    except (ScheduleBlockNotFoundError, ScheduleBlockInvalidBusinessTimezoneError) as exc:
        _handle_schedule_block_errors(exc)

@router.post("/", status_code=201, response_model=ScheduleBlockResponse)
def create_schedule_block(data: ScheduleBlockCreate, business_id: BusinessScopeDep, service: ScheduleBlockServiceDep, admin: AdminDep):
    try:
        return service.create(business_id, data)

    except (ScheduleBlockProfessionalNotFoundError, ScheduleBlockInvalidDatetimeError, ScheduleBlockInvalidDurationError,
        ScheduleBlockInvalidBusinessTimezoneError, ScheduleBlockAppointmentConflictError, ScheduleBlockTimeConflictError, ValueError,
    ) as exc:
        _handle_schedule_block_errors(exc)


@router.patch("/{schedule_block_id}/cancel", status_code=204)
def cancel_schedule_block(schedule_block_id: int, business_id: BusinessScopeDep, service: ScheduleBlockServiceDep, admin: AdminDep):
    try:
        service.cancel(business_id, schedule_block_id)

    except (ScheduleBlockNotFoundError, ScheduleBlockAlreadyCanceledError) as exc:
        _handle_schedule_block_errors(exc)
