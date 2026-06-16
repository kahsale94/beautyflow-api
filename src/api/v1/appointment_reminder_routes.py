from fastapi import APIRouter, HTTPException

from src.dependecies import AppointmentReminderServiceDep, IntegrationDep
from src.schemas import (
    AppointmentReminderClaimRequest,
    AppointmentReminderClaimResponse,
    AppointmentReminderFailedRequest,
    AppointmentReminderSentRequest,
)
from src.services.appointment_reminder_service import (
    AppointmentReminderInvalidStateError,
    AppointmentReminderNotFoundError,
)


router = APIRouter(prefix="/appointment-reminders", tags=["V1 ➔ Appointment Reminders"])


@router.post("/claim", response_model=AppointmentReminderClaimResponse)
def claim_appointment_reminders(
    integration: IntegrationDep,
    service: AppointmentReminderServiceDep,
    data: AppointmentReminderClaimRequest | None = None,
):
    reminders = service.claim_due(
        integration.id,
        limit=data.limit if data else None,
    )
    return {"reminders": reminders}


@router.post("/{reminder_id}/sent", status_code=204)
def mark_appointment_reminder_sent(
    reminder_id: int,
    data: AppointmentReminderSentRequest,
    integration: IntegrationDep,
    service: AppointmentReminderServiceDep,
):
    try:
        service.mark_sent(
            reminder_id,
            integration.id,
            external_message_id=data.external_message_id,
        )
    except AppointmentReminderNotFoundError:
        raise HTTPException(status_code=404, detail="Lembrete não encontrado!")
    except AppointmentReminderInvalidStateError:
        raise HTTPException(status_code=409, detail="Lembrete não está em processamento!")


@router.post("/{reminder_id}/failed", status_code=204)
def mark_appointment_reminder_failed(
    reminder_id: int,
    data: AppointmentReminderFailedRequest,
    integration: IntegrationDep,
    service: AppointmentReminderServiceDep,
):
    try:
        service.mark_failed(reminder_id, integration.id, data.error)
    except AppointmentReminderNotFoundError:
        raise HTTPException(status_code=404, detail="Lembrete não encontrado!")
