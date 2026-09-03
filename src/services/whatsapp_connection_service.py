import logging
import re
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlsplit

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from src.clients import CovercutClient, CovercutConfigurationError
from src.core import (
    COVERCUT_API_BASE_URL,
    COVERCUT_API_KEY,
    COVERCUT_API_SECRET,
    COVERCUT_EXTERNAL_ID_PREFIX,
    COVERCUT_REQUEST_TIMEOUT_SECONDS,
    DataBaseDep,
    EVOLUTION_API_KEY,
    EVOLUTION_API_URL,
    EVOLUTION_REQUEST_TIMEOUT_SECONDS,
    WHATSAPP_DEFAULT_PROVIDER,
    WHATSAPP_ENABLED_PROVIDERS,
)
from src.models import WhatsAppConnection, WhatsAppConnectionStatus
from src.providers import (
    CovercutWhatsAppProvider,
    EvolutionWhatsAppProvider,
    ProviderConnectionResult,
    WhatsAppOperationContext,
    WhatsAppProvider,
)
from src.repositories import BusinessIntegrationRepository, WhatsAppConnectionRepository
from src.services.evolution_instance_service import get_evolution_instance_service


logger = logging.getLogger(__name__)


class WhatsAppConnectionNotFoundError(Exception):
    pass


class WhatsAppConnectionConflictError(Exception):
    pass


class WhatsAppProviderUnavailableError(Exception):
    pass


@dataclass(frozen=True)
class WhatsAppConnectionResult:
    provider: str
    connection_key: str
    status: str
    provider_status: str | None
    phone: str | None
    qr_code: str | None = None
    pairing_code: str | None = None
    onboarding_url: str | None = None

    def as_dict(self) -> dict[str, Any]:
        provider_connection_id = self.connection_key.partition(":")[2]
        onboarding_origin = None
        if self.onboarding_url:
            parsed = urlsplit(self.onboarding_url)
            if parsed.scheme == "https" and parsed.netloc:
                onboarding_origin = f"{parsed.scheme}://{parsed.netloc}"
        payload = {
            "provider": self.provider,
            "connection_key": self.connection_key,
            "provider_connection_id": provider_connection_id,
            "state": self.status,
            "status": self.status,
            "provider_status": self.provider_status,
            "connected": self.status == WhatsAppConnectionStatus.connected.value,
            "phone": self.phone,
            "qr_code": self.qr_code,
            "pairing_code": self.pairing_code,
            "onboarding_url": self.onboarding_url,
            "onboarding_origin": onboarding_origin,
        }
        if self.provider == "evolution":
            payload["instance_name"] = provider_connection_id
        return payload


class WhatsAppConnectionService:
    def __init__(
        self,
        db: Session,
        business_integration_repo: BusinessIntegrationRepository,
        connection_repo: WhatsAppConnectionRepository,
        providers: dict[str, WhatsAppProvider],
        enabled_providers: set[str],
        default_provider: str,
        external_id_prefix: str,
    ):
        self.db = db
        self.business_integration_repo = business_integration_repo
        self.connection_repo = connection_repo
        self.providers = providers
        self.enabled_providers = enabled_providers
        self.default_provider = default_provider
        prefix = re.sub(r"[^a-zA-Z0-9_.-]+", "-", external_id_prefix.strip())
        self.external_id_prefix = prefix.strip("-._") or "beautyflow"

    def get_for_business(
        self,
        business_id: int,
        integration_id: int | None = None,
    ) -> WhatsAppConnection | None:
        return self.connection_repo.get_by_business(self.db, business_id, integration_id)

    def _require_link(self, business_id: int, integration_id: int):
        link = self.business_integration_repo.get_by_ids(self.db, business_id, integration_id)
        if not link or not getattr(link, "business", None):
            raise WhatsAppConnectionNotFoundError()
        return link

    def _provider_name(self, link, connection: WhatsAppConnection | None) -> str:
        if connection:
            return connection.provider
        config = link.config if isinstance(getattr(link, "config", None), dict) else {}
        provider = str(config.get("whatsapp_provider") or self.default_provider).strip().lower()
        if provider not in self.enabled_providers:
            raise WhatsAppProviderUnavailableError(provider)
        return provider

    def _provider(self, provider_name: str) -> WhatsAppProvider:
        provider = self.providers.get(provider_name)
        if provider_name not in self.enabled_providers or provider is None or not provider.configured:
            raise WhatsAppProviderUnavailableError(provider_name)
        return provider

    def _context(self, link, connection: WhatsAppConnection | None) -> WhatsAppOperationContext:
        business = link.business
        external_reference = (
            connection.external_reference
            if connection and connection.external_reference
            else f"{self.external_id_prefix}:business:{business.id}"
        )
        return WhatsAppOperationContext(
            business_id=business.id,
            integration_id=link.integration_id,
            business_name=business.name,
            external_reference=external_reference,
            connection=connection,
        )

    def _save_result(
        self,
        link,
        connection: WhatsAppConnection | None,
        result: ProviderConnectionResult,
    ) -> WhatsAppConnection:
        collision = self.connection_repo.get_by_provider_connection_id(
            self.db,
            result.provider,
            result.provider_connection_id,
        )
        if collision and (connection is None or collision.id != connection.id):
            raise WhatsAppConnectionConflictError()

        now = datetime.now(timezone.utc)
        if connection is None:
            connection = WhatsAppConnection(
                business_id=link.business_id,
                integration_id=link.integration_id,
                provider=result.provider,
                provider_connection_id=result.provider_connection_id,
            )
            self.connection_repo.add(self.db, connection)
        elif connection.provider != result.provider:
            raise WhatsAppConnectionConflictError()

        connection.provider_connection_id = result.provider_connection_id
        connection.provider_account_id = result.provider_account_id or connection.provider_account_id
        connection.external_reference = result.external_reference or connection.external_reference
        connection.business_account_id = result.business_account_id or connection.business_account_id
        connection.phone = result.phone or connection.phone
        connection.status = result.status
        connection.provider_status = result.provider_status
        if result.metadata:
            connection.provider_metadata = {**(connection.provider_metadata or {}), **result.metadata}
        if result.status == WhatsAppConnectionStatus.connected.value:
            connection.connected_at = connection.connected_at or now
            connection.disconnected_at = None
        elif result.status == WhatsAppConnectionStatus.disconnected.value:
            connection.disconnected_at = now
        connection.updated_at = now

        try:
            self.db.commit()
            self.db.refresh(connection)
        except IntegrityError as exc:
            self.db.rollback()
            raise WhatsAppConnectionConflictError() from exc

        logger.info(
            "whatsapp lifecycle provider=%s business_id=%s connection_id=%s status=%s",
            connection.provider,
            connection.business_id,
            connection.id,
            connection.status,
        )
        return connection

    @staticmethod
    def _to_result(connection: WhatsAppConnection, provider_result: ProviderConnectionResult | None = None) -> WhatsAppConnectionResult:
        return WhatsAppConnectionResult(
            provider=connection.provider,
            connection_key=connection.connection_key,
            status=connection.status,
            provider_status=connection.provider_status,
            phone=connection.phone,
            qr_code=provider_result.qr_code if provider_result else None,
            pairing_code=provider_result.pairing_code if provider_result else None,
            onboarding_url=provider_result.onboarding_url if provider_result else None,
        )

    @property
    def configured(self) -> bool:
        return any(
            name in self.enabled_providers and provider.configured
            for name, provider in self.providers.items()
        )

    def configured_for(self, business_id: int, integration_id: int) -> bool:
        link = self._require_link(business_id, integration_id)
        connection = self.get_for_business(business_id, integration_id)
        try:
            return self._provider(self._provider_name(link, connection)).configured
        except WhatsAppProviderUnavailableError:
            return False

    async def provision(self, business_id: int, integration_id: int) -> WhatsAppConnectionResult:
        link = self._require_link(business_id, integration_id)
        connection = self.get_for_business(business_id, integration_id)
        provider = self._provider(self._provider_name(link, connection))
        provider_result = await provider.start_connection(self._context(link, connection))
        connection = self._save_result(link, connection, provider_result)
        return self._to_result(connection, provider_result)

    async def refresh_status(self, business_id: int, integration_id: int) -> WhatsAppConnectionResult:
        link = self._require_link(business_id, integration_id)
        connection = self.get_for_business(business_id, integration_id)
        if not connection:
            raise WhatsAppConnectionNotFoundError()
        provider = self._provider(connection.provider)
        provider_result = await provider.get_connection_status(self._context(link, connection))
        connection = self._save_result(link, connection, provider_result)
        return self._to_result(connection, provider_result)

    async def refresh_qr_code(self, business_id: int, integration_id: int) -> WhatsAppConnectionResult:
        link = self._require_link(business_id, integration_id)
        connection = self.get_for_business(business_id, integration_id)
        if not connection:
            raise WhatsAppConnectionNotFoundError()
        provider = self._provider(connection.provider)
        refresh = getattr(provider, "refresh_qr_code", None)
        if refresh is None:
            raise WhatsAppProviderUnavailableError(connection.provider)
        provider_result = await refresh(self._context(link, connection))
        connection = self._save_result(link, connection, provider_result)
        return self._to_result(connection, provider_result)

    async def disconnect(self, business_id: int, integration_id: int) -> WhatsAppConnectionResult:
        link = self._require_link(business_id, integration_id)
        connection = self.get_for_business(business_id, integration_id)
        if not connection:
            raise WhatsAppConnectionNotFoundError()
        provider = self._provider(connection.provider)
        provider_result = await provider.disconnect(self._context(link, connection))
        connection = self._save_result(link, connection, provider_result)
        return self._to_result(connection, provider_result)

    async def remove(self, business_id: int, integration_id: int) -> None:
        link = self._require_link(business_id, integration_id)
        connection = self.get_for_business(business_id, integration_id)
        if not connection:
            raise WhatsAppConnectionNotFoundError()
        provider = self._provider(connection.provider)
        await provider.remove(self._context(link, connection))
        self.connection_repo.delete(self.db, connection)
        self.db.commit()


def get_whatsapp_connection_service(db: DataBaseDep):
    evolution_service = get_evolution_instance_service(db)
    covercut_client = CovercutClient(
        COVERCUT_API_BASE_URL,
        COVERCUT_API_KEY,
        COVERCUT_API_SECRET,
        timeout_seconds=COVERCUT_REQUEST_TIMEOUT_SECONDS,
    )
    providers: dict[str, WhatsAppProvider] = {
        "evolution": EvolutionWhatsAppProvider(
            evolution_service,
            evolution_service.client,
        ),
        "covercut": CovercutWhatsAppProvider(covercut_client),
    }
    return WhatsAppConnectionService(
        db,
        BusinessIntegrationRepository(),
        WhatsAppConnectionRepository(),
        providers,
        set(WHATSAPP_ENABLED_PROVIDERS),
        WHATSAPP_DEFAULT_PROVIDER,
        COVERCUT_EXTERNAL_ID_PREFIX,
    )
