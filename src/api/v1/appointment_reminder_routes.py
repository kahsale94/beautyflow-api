from fastapi import APIRouter, HTTPException

from src.clients import CovercutAmbiguousSendError, EvolutionAmbiguousSendError
from src.dependecies import AppointmentReminderServiceDep, IntegrationDep, MessagingServiceDep
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
from src.services.messaging_service import (
    WhatsAppMessagingTenantError,
    WhatsAppMessagingUnavailableError,
)


router = APIRouter(prefix="/appointment-reminders", tags=["V1 ➔ Appointment Reminders"])


@router.post("/claim", response_model=AppointmentReminderClaimResponse)
def claim_appointment_reminders(integration: IntegrationDep, service: AppointmentReminderServiceDep, data: AppointmentReminderClaimRequest | None = None):
    reminders = service.claim_due(
        integration.id,
        limit=data.limit if data else None,
    )

    return {"reminders": reminders}


@router.post("/{reminder_id}/dispatch")
async def dispatch_appointment_reminder(
    reminder_id: int,
    integration: IntegrationDep,
    service: AppointmentReminderServiceDep,
    messaging_service: MessagingServiceDep,
):
    try:
        payload = service.get_processing_payload(reminder_id, integration.id)
        outbound = payload["outbound"]
        business_id = payload["business"]["id"]
        if outbound["type"] == "template":
            template = outbound["template"]
            result = await messaging_service.send_template(
                business_id,
                integration.id,
                to=outbound["to"],
                name=template["name"],
                language=template["language"],
                body_parameters=template["body_parameters"],
            )
        else:
            result = await messaging_service.send_text(
                business_id,
                integration.id,
                to=outbound["to"],
                text=outbound["text"],
            )
        service.mark_sent(reminder_id, integration.id, result.external_message_id)
        return result.as_dict()
    except (CovercutAmbiguousSendError, EvolutionAmbiguousSendError):
        service.mark_indeterminate(reminder_id, integration.id)
        raise HTTPException(
            status_code=503,
            detail="Envio indeterminado; reconciliação manual necessária.",
        )
    except (WhatsAppMessagingTenantError, WhatsAppMessagingUnavailableError):
        service.mark_failed(reminder_id, integration.id, "whatsapp_connection_unavailable")
        raise HTTPException(status_code=409, detail="WhatsApp não está conectado.")
    except AppointmentReminderNotFoundError:
        raise HTTPException(status_code=404, detail="Lembrete não encontrado!")
    except AppointmentReminderInvalidStateError:
        raise HTTPException(status_code=409, detail="Lembrete não está em processamento!")
    except Exception as exc:
        service.mark_failed(reminder_id, integration.id, exc.__class__.__name__)
        raise HTTPException(status_code=502, detail="Provider WhatsApp recusou o lembrete.")

@router.post("/{reminder_id}/sent", status_code=204)
def mark_appointment_reminder_sent(reminder_id: int, data: AppointmentReminderSentRequest, integration: IntegrationDep, service: AppointmentReminderServiceDep):
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
def mark_appointment_reminder_failed(reminder_id: int, data: AppointmentReminderFailedRequest, integration: IntegrationDep, service: AppointmentReminderServiceDep):
    try:
        service.mark_failed(reminder_id, integration.id, data.error)

    except AppointmentReminderNotFoundError:
        raise HTTPException(status_code=404, detail="Lembrete não encontrado!")
