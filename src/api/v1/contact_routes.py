from fastapi import APIRouter, HTTPException, Response, status

from src.dependecies import BusinessIntegrationDep, ContactServiceDep
from src.schemas import ContactIdentityRequest, ContactOwnershipResponse, ContactTakeoverRequest
from src.services.contact_service import ContactConnectionError, ContactIdentityConflictError, ContactNotFoundError


router = APIRouter(prefix="/whatsapp/contacts", tags=["V1 ➔ WhatsApp Contacts"])


@router.post("/resolve", response_model=ContactOwnershipResponse)
def resolve_contact(data: ContactIdentityRequest, actor: BusinessIntegrationDep, service: ContactServiceDep):
    try:
        connection = service.require_connection(actor.business_id, data.connection_key)
        if connection.integration_id != actor.integration_id:
            raise ContactConnectionError()
        contact = service.resolve(
            business_id=actor.business_id,
            connection=connection,
            provider_user_id=data.provider_user_id,
            parent_provider_user_id=data.parent_provider_user_id,
            wa_id=data.wa_id,
            phone=data.phone,
            username=data.username,
            name=data.name,
            saved=data.saved,
        )
        return service.ownership_result(contact, connection)
    except ContactConnectionError:
        raise HTTPException(status_code=404, detail="Conexão WhatsApp não encontrada.")
    except ContactIdentityConflictError:
        raise HTTPException(status_code=409, detail="Identidades pertencem a contatos diferentes.")
    except ValueError:
        raise HTTPException(status_code=422, detail="Identidade do contato inválida.")


@router.post("/{contact_id}/takeover", status_code=status.HTTP_204_NO_CONTENT)
def activate_takeover(contact_id: int, data: ContactTakeoverRequest, actor: BusinessIntegrationDep, service: ContactServiceDep):
    try:
        contact = service.get(actor.business_id, contact_id)
        if not contact.whatsapp_connection_id:
            raise ContactConnectionError()
        connection = service.connection_repo.get_by_business(service.db, actor.business_id, actor.integration_id)
        if not connection or connection.id != contact.whatsapp_connection_id:
            raise ContactConnectionError()
        service.ownership.activate(
            actor.business_id, connection.id, contact.id, data.source,
            connection_key=connection.connection_key, conversation_key=data.conversation_key,
        )
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except ContactNotFoundError:
        raise HTTPException(status_code=404, detail="Contato não encontrado.")
    except ContactConnectionError:
        raise HTTPException(status_code=409, detail="Contato não possui conexão WhatsApp.")
    except RuntimeError:
        raise HTTPException(status_code=503, detail="Controle de atendimento indisponível.")


@router.delete("/{contact_id}/takeover", status_code=status.HTTP_204_NO_CONTENT)
def clear_takeover(contact_id: int, actor: BusinessIntegrationDep, service: ContactServiceDep):
    try:
        contact = service.get(actor.business_id, contact_id)
        if not contact.whatsapp_connection_id:
            raise ContactConnectionError()
        connection = service.connection_repo.get_by_business(
            service.db, actor.business_id, actor.integration_id
        )
        if not connection or connection.id != contact.whatsapp_connection_id:
            raise ContactConnectionError()
        service.ownership.clear(actor.business_id, connection.id, contact.id)
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except ContactNotFoundError:
        raise HTTPException(status_code=404, detail="Contato não encontrado.")
    except ContactConnectionError:
        raise HTTPException(status_code=409, detail="Contato não possui conexão WhatsApp.")
    except RuntimeError:
        raise HTTPException(status_code=503, detail="Controle de atendimento indisponível.")
