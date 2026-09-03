from fastapi import APIRouter, HTTPException

from src.clients import (
    CovercutAPIError,
    CovercutAmbiguousSendError,
    CovercutConfigurationError,
    EvolutionAPIError,
    EvolutionAmbiguousSendError,
    EvolutionConfigurationError,
)
from src.dependecies import BusinessIntegrationDep, MessagingServiceDep
from src.schemas import WhatsAppMessageRequest, WhatsAppMessageResponse
from src.services.messaging_service import (
    WhatsAppMessagingTenantError,
    WhatsAppMessagingUnavailableError,
)
from src.services.whatsapp_connection_service import WhatsAppProviderUnavailableError


router = APIRouter(prefix="/whatsapp", tags=["V1 ➔ WhatsApp"])


@router.post("/messages", response_model=WhatsAppMessageResponse)
async def send_whatsapp_message(
    data: WhatsAppMessageRequest,
    actor: BusinessIntegrationDep,
    service: MessagingServiceDep,
):
    try:
        if data.type == "text":
            result = await service.send_text(
                actor.business_id,
                actor.integration_id,
                to=data.to,
                text=data.text or "",
            )
        else:
            template = data.template
            assert template is not None
            result = await service.send_template(
                actor.business_id,
                actor.integration_id,
                to=data.to,
                name=template.name,
                language=template.language,
                body_parameters=template.body_parameters,
            )
        return result.as_dict()
    except WhatsAppMessagingTenantError:
        raise HTTPException(status_code=404, detail="Conexão WhatsApp não encontrada.")
    except WhatsAppMessagingUnavailableError:
        raise HTTPException(status_code=409, detail="WhatsApp não está conectado.")
    except (WhatsAppProviderUnavailableError, CovercutConfigurationError, EvolutionConfigurationError):
        raise HTTPException(status_code=503, detail="Provider WhatsApp indisponível.")
    except (CovercutAmbiguousSendError, EvolutionAmbiguousSendError):
        raise HTTPException(
            status_code=503,
            detail="Estado do envio indeterminado; não repita automaticamente.",
        )
    except (CovercutAPIError, EvolutionAPIError):
        raise HTTPException(status_code=502, detail="Provider WhatsApp recusou o envio.")
    except ValueError:
        raise HTTPException(status_code=422, detail="Destinatário inválido.")
