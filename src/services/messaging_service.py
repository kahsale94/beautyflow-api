import logging
from dataclasses import dataclass
from typing import Any

from src.core import DataBaseDep
from src.models import WhatsAppConnectionStatus
from src.repositories import WhatsAppConnectionRepository
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
    def __init__(self, db, connection_repo, providers):
        self.db = db
        self.connection_repo = connection_repo
        self.providers = providers

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
        to: str,
        text: str,
    ) -> WhatsAppMessageResult:
        connection, provider = self._require_connection(business_id, integration_id)
        recipient = normalize_phone(to)
        payload = await provider.send_text(connection, recipient, text)
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
        to: str,
        name: str,
        language: str,
        body_parameters: list[str],
    ) -> WhatsAppMessageResult:
        connection, provider = self._require_connection(business_id, integration_id)
        recipient = normalize_phone(to)
        payload = await provider.send_template(
            connection,
            recipient,
            name,
            language,
            body_parameters,
        )
        message_id = self._message_id(payload)
        logger.info(
            "whatsapp outbound provider=%s business_id=%s connection_id=%s operation=template external_message_id=%s",
            connection.provider,
            business_id,
            connection.id,
            message_id,
        )
        return WhatsAppMessageResult(connection.provider, message_id, "accepted")


def get_messaging_service(db: DataBaseDep):
    connection_service = get_whatsapp_connection_service(db)
    return MessagingService(
        db,
        WhatsAppConnectionRepository(),
        connection_service.providers,
    )
