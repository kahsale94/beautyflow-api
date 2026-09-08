from fastapi import APIRouter, HTTPException

from src.clients import CovercutAmbiguousSendError, EvolutionAmbiguousSendError
from src.dependecies import (
    AdminDep,
    BusinessScopeDep,
    IntegrationDep,
    MessagingServiceDep,
    NotificationJobServiceDep,
)
from src.schemas import (
    NotificationJobClaimRequest,
    NotificationJobClaimResponse,
    NotificationJobFailedRequest,
    NotificationJobSentRequest,
    ProfessionalNoAppointmentsRequest,
)
from src.services.messaging_service import (
    WhatsAppMessagingTenantError,
    WhatsAppMessagingUnavailableError,
)
from src.services.notification_job_service import (
    NotificationJobFeatureDisabledError,
    NotificationJobInvalidStateError,
    NotificationJobNotFoundError,
)


router = APIRouter(prefix="/notification-jobs", tags=["V1 ➔ Notification Jobs"])


@router.post("/claim", response_model=NotificationJobClaimResponse)
def claim_notification_jobs(
    integration: IntegrationDep,
    service: NotificationJobServiceDep,
    data: NotificationJobClaimRequest | None = None,
):
    return {"jobs": service.claim_due(integration.id, data.limit if data else 20)}


@router.post("/professional-no-appointments", status_code=202)
def queue_professionals_without_appointments(
    data: ProfessionalNoAppointmentsRequest,
    business_id: BusinessScopeDep,
    service: NotificationJobServiceDep,
    admin: AdminDep,
):
    try:
        return {"queued": service.queue_professionals_without_appointments(business_id, data.date)}
    except NotificationJobFeatureDisabledError:
        raise HTTPException(status_code=403, detail="Notificações de profissionais estão desabilitadas.")
    except NotificationJobNotFoundError:
        raise HTTPException(status_code=404, detail="Empresa não encontrada.")


@router.post("/{job_id}/dispatch")
async def dispatch_notification_job(
    job_id: int,
    integration: IntegrationDep,
    service: NotificationJobServiceDep,
    messaging_service: MessagingServiceDep,
):
    try:
        payload = service.get_processing_payload(job_id, integration.id)
        if not payload["recipient_phone"]:
            service.mark_failed(job_id, integration.id, "recipient_phone_missing")
            raise HTTPException(status_code=422, detail="Destinatário não possui telefone.")
        result = await messaging_service.send_text(
            payload["business_id"],
            integration.id,
            to=payload["recipient_phone"],
            text=payload["message"],
        )
        service.mark_sent(job_id, integration.id, result.external_message_id)
        return result.as_dict()
    except (CovercutAmbiguousSendError, EvolutionAmbiguousSendError):
        service.mark_indeterminate(job_id, integration.id)
        raise HTTPException(status_code=503, detail="Envio indeterminado; reconciliação manual necessária.")
    except (WhatsAppMessagingTenantError, WhatsAppMessagingUnavailableError):
        service.mark_failed(job_id, integration.id, "whatsapp_connection_unavailable")
        raise HTTPException(status_code=409, detail="WhatsApp não está conectado.")
    except NotificationJobNotFoundError:
        raise HTTPException(status_code=404, detail="Notificação não encontrada.")
    except NotificationJobInvalidStateError:
        raise HTTPException(status_code=409, detail="Notificação não está em processamento.")
    except HTTPException:
        raise
    except Exception as exc:
        service.mark_failed(job_id, integration.id, exc.__class__.__name__)
        raise HTTPException(status_code=502, detail="Provider recusou a notificação.")


@router.post("/{job_id}/sent", status_code=204)
def mark_notification_job_sent(
    job_id: int,
    data: NotificationJobSentRequest,
    integration: IntegrationDep,
    service: NotificationJobServiceDep,
):
    try:
        service.mark_sent(job_id, integration.id, data.external_message_id)
    except NotificationJobNotFoundError:
        raise HTTPException(status_code=404, detail="Notificação não encontrada.")
    except NotificationJobInvalidStateError:
        raise HTTPException(status_code=409, detail="Notificação não está em processamento.")


@router.post("/{job_id}/failed", status_code=204)
def mark_notification_job_failed(
    job_id: int,
    data: NotificationJobFailedRequest,
    integration: IntegrationDep,
    service: NotificationJobServiceDep,
):
    try:
        service.mark_failed(job_id, integration.id, data.error)
    except NotificationJobNotFoundError:
        raise HTTPException(status_code=404, detail="Notificação não encontrada.")
