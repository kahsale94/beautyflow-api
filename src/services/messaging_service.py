import logging
from dataclasses import dataclass
from typing import Any

from src.core import DataBaseDep
from src.models import WhatsAppConnectionStatus
from src.repositories import WhatsAppConnectionRepository
from src.repositories import ContactRepository
from src.services.conversation_ownership_service import ConversationOwnershipService
from src.services.whatsapp_connection_service import (
    WhatsAppProviderUnavailableError,
    get_whatsapp_connection_service,
)
from src.utils import normalize_phone


logger = logging.getLogger(__name__)


class WhatsAppMessagingUnavailableError(Exception):
    pass


class WhatsAppMessagingTenantError(Exception):
    pass


class WhatsAppMessagingOwnershipError(Exception):
    pass


@dataclass(frozen=True)
class WhatsAppMessageResult:
    provider: str
    external_message_id: str | None
    status: str

    def as_dict(self) -> dict[str, str | None]:
        return {
            "provider": self.provider,
            "external_message_id": self.external_message_id,
            "status": self.status,
        }


class MessagingService:
    def __init__(self, db, connection_repo, providers, contact_repo=None, ownership=None):
        self.db = db
        self.connection_repo = connection_repo
        self.providers = providers
        self.contact_repo = contact_repo
        self.ownership = ownership

    def _guard_ownership(
        self,
        business_id: int,
        connection,
        contact_id: int | None,
        *,
        to: str | None = None,
        recipient: str | None = None,
    ) -> None:
        if not self.contact_repo or not self.ownership:
            if contact_id is not None:
                raise WhatsAppMessagingOwnershipError()
            return
        if contact_id is not None:
            contact = self.contact_repo.get_by_id(self.db, business_id, contact_id)
        else:
            matches = self.contact_repo.find_by_identities(
                self.db,
                business_id,
                connection.provider,
                provider_user_id=recipient,
                wa_id=to,
                phone=to,
            )
            if len(matches) > 1:
                raise WhatsAppMessagingOwnershipError()
            contact = matches[0] if matches else None
            # Backward-compatible sends are allowed when no Contact exists yet.
            # Once an identity is known, every outbound path observes ownership.
            if contact is None:
                return
        if not contact or contact.whatsapp_connection_id != connection.id:
            raise WhatsAppMessagingTenantError()
        if contact.bot_policy == "HUMAN":
            raise WhatsAppMessagingOwnershipError()
        try:
            takeover_active = self.ownership.is_active_strict(business_id, connection.id, contact.id)
        except RuntimeError as exc:
            raise WhatsAppMessagingUnavailableError() from exc
        if takeover_active:
            raise WhatsAppMessagingOwnershipError()

    def _require_connection(self, business_id: int, integration_id: int):
        connection = self.connection_repo.get_by_business(
            self.db,
            business_id,
            integration_id,
        )
        if not connection:
            raise WhatsAppMessagingTenantError()
        if connection.status != WhatsAppConnectionStatus.connected.value:
            raise WhatsAppMessagingUnavailableError()
        provider = self.providers.get(connection.provider)
        if not provider or not provider.configured:
            raise WhatsAppProviderUnavailableError(connection.provider)
        return connection, provider

    @staticmethod
    def _message_id(payload: dict[str, Any]) -> str | None:
        direct = payload.get("message_id") or payload.get("messageId") or payload.get("id")
        if direct:
            return str(direct)
        key = payload.get("key")
        if isinstance(key, dict) and key.get("id"):
            return str(key["id"])
        data = payload.get("data")
        if isinstance(data, dict):
            return MessagingService._message_id(data)
        return None

    async def send_text(
        self,
        business_id: int,
        integration_id: int,
        *,
        to: str | None,
        text: str,
        recipient: str | None = None,
        contact_id: int | None = None,
    ) -> WhatsAppMessageResult:
        connection, provider = self._require_connection(business_id, integration_id)
        normalized_to = normalize_phone(to) if to else None
        self._guard_ownership(
            business_id,
            connection,
            contact_id,
            to=normalized_to,
            recipient=recipient,
        )
        if recipient:
            payload = await provider.send_text(connection, None, text, recipient=recipient)
        else:
            payload = await provider.send_text(connection, normalized_to, text)
        message_id = self._message_id(payload)
        logger.info(
            "whatsapp outbound provider=%s business_id=%s connection_id=%s operation=text external_message_id=%s",
            connection.provider,
            business_id,
            connection.id,
            message_id,
        )
        return WhatsAppMessageResult(connection.provider, message_id, "accepted")

    async def send_template(
        self,
        business_id: int,
        integration_id: int,
        *,
        to: str | None,
        name: str,
        language: str,
        body_parameters: list[str],
        recipient: str | None = None,
        contact_id: int | None = None,
    ) -> WhatsAppMessageResult:
        connection, provider = self._require_connection(business_id, integration_id)
        normalized_to = normalize_phone(to) if to else None
        self._guard_ownership(
            business_id,
            connection,
            contact_id,
            to=normalized_to,
            recipient=recipient,
        )
        if recipient:
            payload = await provider.send_template(connection, None, name, language, body_parameters, recipient=recipient)
        else:
            payload = await provider.send_template(connection, normalized_to, name, language, body_parameters)
        message_id = self._message_id(payload)
        logger.info(
            "whatsapp outbound provider=%s business_id=%s connection_id=%s operation=template external_message_id=%s",
            connection.provider,
            business_id,
            connection.id,
            message_id,
        )
        return WhatsAppMessageResult(connection.provider, message_id, "accepted")

    async def request_contact_info(
        self, business_id: int, integration_id: int, *, recipient: str,
        text: str, contact_id: int | None = None,
    ) -> WhatsAppMessageResult:
        connection, provider = self._require_connection(business_id, integration_id)
        self._guard_ownership(
            business_id,
            connection,
            contact_id,
            recipient=recipient,
        )
        if connection.provider != "covercut":
            raise ValueError("Solicitação de telefone exige CoverCut.")
        payload = await provider.request_contact_info(connection, recipient, text)
        return WhatsAppMessageResult(connection.provider, self._message_id(payload), "accepted")


def get_messaging_service(db: DataBaseDep):
    connection_service = get_whatsapp_connection_service(db)
    return MessagingService(
        db,
        WhatsAppConnectionRepository(),
        connection_service.providers,
        ContactRepository(),
        ConversationOwnershipService(),
    )
