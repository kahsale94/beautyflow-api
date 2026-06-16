import re
import logging
from typing import Any
from dataclasses import dataclass
from datetime import datetime, timezone

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from src.clients import EvolutionAPIError, EvolutionClient
from src.core import (DataBaseDep, EVOLUTION_API_KEY, EVOLUTION_API_URL, EVOLUTION_INSTANCE_PREFIX,
    EVOLUTION_REQUEST_TIMEOUT_SECONDS, EVOLUTION_WEBHOOK_URL, N8N_WEBHOOK_HEADER, N8N_WEBHOOK_SECRET,
)
from src.models import EvolutionInstance
from src.repositories import BusinessIntegrationRepository, EvolutionInstanceRepository

logger = logging.getLogger(__name__)

class EvolutionInstanceNotFoundError(Exception):
    pass

class EvolutionInstanceConflictError(Exception):
    pass

class EvolutionWebhookConfigurationError(Exception):
    pass


@dataclass(frozen=True)
class EvolutionConnectionResult:
    instance_name: str
    state: str
    qr_code: str | None = None
    pairing_code: str | None = None
    phone: str | None = None

    def as_dict(self) -> dict[str, Any]:
        return {
            "instance_name": self.instance_name,
            "state": self.state,
            "connected": self.state == "open",
            "qr_code": self.qr_code,
            "pairing_code": self.pairing_code,
            "phone": self.phone,
        }


class EvolutionInstanceService:
    MAX_INSTANCE_NAME_LENGTH = 100

    def __init__(
        self,
        db: Session,
        business_integration_repo: BusinessIntegrationRepository,
        evolution_instance_repo: EvolutionInstanceRepository,
        client: EvolutionClient,
        instance_prefix: str,
        webhook_url: str | None,
        webhook_header: str | None,
        webhook_secret: str | None,
    ):
        self.db = db
        self.business_integration_repo = business_integration_repo
        self.evolution_instance_repo = evolution_instance_repo
        self.client = client
        self.instance_prefix = self._normalize_prefix(instance_prefix)
        self.webhook_url = webhook_url or ""
        self.webhook_header = webhook_header or ""
        self.webhook_secret = webhook_secret or ""

    @property
    def configured(self) -> bool:
        return bool(
            self.client.configured
            and self.webhook_url
            and self.webhook_header
            and self.webhook_secret
        )

    @staticmethod
    def _normalize_prefix(prefix: str) -> str:
        normalized = re.sub(r"[^a-z0-9_-]+", "-", (prefix or "beautyflow").strip().lower())
        return normalized.strip("-_") or "beautyflow"

    @staticmethod
    def _normalize_business_slug(slug: str | None) -> str:
        normalized = re.sub(r"[^a-z0-9-]+", "-", (slug or "").strip().lower())
        return re.sub(r"-+", "-", normalized).strip("-")

    def _business_slug_from_link(self, link, business_id: int) -> str:
        business = getattr(link, "business", None)
        slug = self._normalize_business_slug(getattr(business, "slug", None))
        return slug or "business"

    def _instance_name(self, business_id: int, business_slug: str) -> str:
        slug = self._normalize_business_slug(business_slug) or "business"
        suffix = f"-{business_id}"
        instance_name = f"{self.instance_prefix}-{slug}{suffix}"

        if len(instance_name) <= self.MAX_INSTANCE_NAME_LENGTH:
            return instance_name

        max_prefix_length = self.MAX_INSTANCE_NAME_LENGTH - len(suffix) - 2
        prefix = self.instance_prefix[:max_prefix_length].strip("-_") or "beautyflow"
        max_slug_length = self.MAX_INSTANCE_NAME_LENGTH - len(prefix) - len(suffix) - 1
        slug = slug[:max_slug_length].rstrip("-") or "business"
        return f"{prefix}-{slug}{suffix}"

    def _require_link(self, business_id: int, integration_id: int):
        link = self.business_integration_repo.get_by_ids(self.db, business_id, integration_id)
        if not link:
            raise EvolutionInstanceNotFoundError()
        return link

    def _require_instance(self, business_id: int, integration_id: int | None = None) -> EvolutionInstance:
        instance = self.evolution_instance_repo.get_by_business(self.db, business_id)
        if not instance or (integration_id is not None and instance.integration_id != integration_id):
            raise EvolutionInstanceNotFoundError()
        return instance

    def _save(self, instance: EvolutionInstance) -> None:
        instance.updated_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(instance)

    def get_for_business(self, business_id: int):
        return self.evolution_instance_repo.get_by_business(self.db, business_id)

    def _create_local_instance(self, business_id: int, integration_id: int, instance_name: str) -> EvolutionInstance:
        instance = EvolutionInstance(
            business_id=business_id,
            integration_id=integration_id,
            instance_name=instance_name,
            state="creating",
        )
        self.evolution_instance_repo.add(self.db, instance)

        try:
            self.db.commit()
        except IntegrityError as exc:
            self.db.rollback()
            existing = self.evolution_instance_repo.get_by_business(self.db, business_id)
            if existing and existing.integration_id == integration_id:
                return existing
            raise EvolutionInstanceConflictError() from exc

        self.db.refresh(instance)
        return instance

    @staticmethod
    def _extract_state(payload: dict[str, Any], default: str = "connecting") -> str:
        instance = payload.get("instance")
        if isinstance(instance, dict):
            return str(instance.get("state") or instance.get("status") or default).lower()
        return str(payload.get("state") or payload.get("status") or default).lower()

    @staticmethod
    def _extract_instance_id(payload: dict[str, Any]) -> str | None:
        instance = payload.get("instance")
        if not isinstance(instance, dict):
            return None
        value = instance.get("instanceId") or instance.get("id")
        return str(value) if value else None

    @classmethod
    def _payload_dicts(cls, payload: Any):
        if isinstance(payload, list):
            for item in payload:
                yield from cls._payload_dicts(item)
            return

        if not isinstance(payload, dict):
            return

        yield payload
        for key in ("instance", "data", "connectionStatus"):
            nested = payload.get(key)
            if isinstance(nested, (dict, list)):
                yield from cls._payload_dicts(nested)

    @classmethod
    def _extract_phone(cls, payload: Any) -> str | None:
        for source in cls._payload_dicts(payload):
            for key in ("ownerJid", "wuid", "number", "phone", "connectedNumber"):
                candidate = source.get(key)
                digits = "".join(character for character in str(candidate or "") if character.isdigit())
                if len(digits) >= 8:
                    return digits
        return None

    @staticmethod
    def _extract_qr(payload: dict[str, Any]) -> tuple[str | None, str | None]:
        qrcode = payload.get("qrcode")
        source = qrcode if isinstance(qrcode, dict) else payload
        qr_code = source.get("base64") if isinstance(source, dict) else None
        pairing_code = source.get("pairingCode") if isinstance(source, dict) else None
        return (
            str(qr_code) if qr_code else None,
            str(pairing_code) if pairing_code else None,
        )

    async def _configure_webhook(self, instance_name: str) -> None:
        if not self.configured:
            raise EvolutionWebhookConfigurationError()
        await self.client.set_webhook(
            instance_name,
            self.webhook_url,
            self.webhook_header,
            self.webhook_secret,
        )

    async def _refresh_instance_phone(self, instance: EvolutionInstance) -> None:
        try:
            payload = await self.client.fetch_instances(instance_name=instance.instance_name)
        except EvolutionAPIError as exc:
            logger.warning(
                "Could not fetch Evolution instance details for %s: status %s",
                instance.instance_name,
                exc.status_code,
            )
            return

        instance.phone = self._extract_phone(payload) or instance.phone

    async def provision(self, business_id: int, integration_id: int) -> EvolutionConnectionResult:
        if not self.configured:
            raise EvolutionWebhookConfigurationError()

        link = self._require_link(business_id, integration_id)
        instance = self.evolution_instance_repo.get_by_business(self.db, business_id)

        if instance and instance.integration_id != integration_id:
            raise EvolutionInstanceConflictError()
        if not instance:
            business_slug = self._business_slug_from_link(link, business_id)
            instance = self._create_local_instance(
                business_id,
                integration_id,
                self._instance_name(business_id, business_slug),
            )

        payload: dict[str, Any]
        try:
            payload = await self.client.connection_state(instance.instance_name)
        except EvolutionAPIError as exc:
            if exc.status_code != 404:
                instance.state = "error"
                self._save(instance)
                raise
            payload = await self.client.create_instance(instance.instance_name)
            instance.instance_id = self._extract_instance_id(payload)

        await self._configure_webhook(instance.instance_name)

        state = self._extract_state(payload)
        qr_code, pairing_code = self._extract_qr(payload)
        if state != "open" and not qr_code:
            connection_payload = await self.client.connect_instance(instance.instance_name)
            qr_code, pairing_code = self._extract_qr(connection_payload)
            state = self._extract_state(connection_payload, state)

        instance.state = state
        instance.phone = self._extract_phone(payload) or instance.phone
        if state == "open":
            await self._refresh_instance_phone(instance)
            instance.connected_at = instance.connected_at or datetime.now(timezone.utc)
        self._save(instance)

        return EvolutionConnectionResult(
            instance_name=instance.instance_name,
            state=instance.state,
            qr_code=qr_code,
            pairing_code=pairing_code,
            phone=instance.phone,
        )

    async def refresh_status(self, business_id: int, integration_id: int) -> EvolutionConnectionResult:
        self._require_link(business_id, integration_id)
        instance = self._require_instance(business_id, integration_id)

        try:
            payload = await self.client.connection_state(instance.instance_name)
            instance.state = self._extract_state(payload, instance.state)
            instance.phone = self._extract_phone(payload) or instance.phone
        except EvolutionAPIError as exc:
            if exc.status_code != 404:
                raise
            instance.state = "missing"

        if instance.state == "open":
            await self._refresh_instance_phone(instance)
            instance.connected_at = instance.connected_at or datetime.now(timezone.utc)
        self._save(instance)

        return EvolutionConnectionResult(
            instance_name=instance.instance_name,
            state=instance.state,
            phone=instance.phone,
        )

    async def refresh_qr_code(self, business_id: int, integration_id: int) -> EvolutionConnectionResult:
        self._require_link(business_id, integration_id)
        instance = self._require_instance(business_id, integration_id)
        await self._configure_webhook(instance.instance_name)

        payload = await self.client.connect_instance(instance.instance_name)
        qr_code, pairing_code = self._extract_qr(payload)
        instance.state = self._extract_state(payload, "connecting")
        self._save(instance)

        return EvolutionConnectionResult(
            instance_name=instance.instance_name,
            state=instance.state,
            qr_code=qr_code,
            pairing_code=pairing_code,
            phone=instance.phone,
        )

    async def logout(self, business_id: int, integration_id: int) -> EvolutionConnectionResult:
        self._require_link(business_id, integration_id)
        instance = self._require_instance(business_id, integration_id)
        await self.client.logout_instance(instance.instance_name)
        instance.state = "close"
        self._save(instance)

        return EvolutionConnectionResult(
            instance_name=instance.instance_name,
            state=instance.state,
            phone=instance.phone,
        )

    async def delete(self, business_id: int, integration_id: int) -> None:
        self._require_link(business_id, integration_id)
        instance = self._require_instance(business_id, integration_id)

        try:
            await self.client.delete_instance(instance.instance_name)
        except EvolutionAPIError as exc:
            if exc.status_code != 404:
                raise

        self.evolution_instance_repo.delete(self.db, instance)
        self.db.commit()


def get_evolution_instance_service(db: DataBaseDep):
    client = EvolutionClient(EVOLUTION_API_URL, EVOLUTION_API_KEY, timeout_seconds=EVOLUTION_REQUEST_TIMEOUT_SECONDS)
    return EvolutionInstanceService(
        db,
        BusinessIntegrationRepository(),
        EvolutionInstanceRepository(),
        client,
        EVOLUTION_INSTANCE_PREFIX,
        EVOLUTION_WEBHOOK_URL,
        N8N_WEBHOOK_HEADER,
        N8N_WEBHOOK_SECRET,
    )
