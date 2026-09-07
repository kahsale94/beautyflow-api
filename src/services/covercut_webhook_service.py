import base64
import hashlib
import hmac
import json
import logging
from datetime import datetime, timezone
from typing import Any

import httpx
from sqlalchemy.exc import IntegrityError

from src.clients import CovercutClient
from src.core import (
    COVERCUT_API_BASE_URL,
    COVERCUT_API_KEY,
    COVERCUT_API_SECRET,
    COVERCUT_MEDIA_MAX_BYTES,
    COVERCUT_MESSAGE_WEBHOOK_SECRET,
    COVERCUT_N8N_WEBHOOK_URL,
    COVERCUT_REQUEST_TIMEOUT_SECONDS,
    COVERCUT_SAAS_WEBHOOK_SECRET,
    WHATSAPP_BOT_AGENT_NAME,
    DataBaseDep,
    N8N_WEBHOOK_HEADER,
    N8N_WEBHOOK_SECRET,
)
from src.models import WhatsAppConnectionStatus, WhatsAppWebhookEvent
from src.repositories import (
    BusinessIntegrationRepository,
    BusinessRepository,
    WhatsAppConnectionRepository,
    WhatsAppWebhookEventRepository,
)
from src.services.contact_service import ContactIdentityConflictError, get_contact_service
from src.services.conversation_ownership_service import ConversationOwnershipService


logger = logging.getLogger(__name__)


class CovercutWebhookAuthenticationError(Exception):
    pass


class CovercutWebhookConfigurationError(Exception):
    pass


class CovercutWebhookPayloadError(Exception):
    pass


class CovercutWebhookConflictError(Exception):
    pass


def verify_covercut_signature(raw_body: bytes, signature: str | None, secret: str | None) -> None:
    if not secret:
        raise CovercutWebhookConfigurationError()
    normalized_signature = str(signature or "").strip().lower()
    if normalized_signature.startswith("sha256="):
        normalized_signature = normalized_signature[7:]
    if len(normalized_signature) != 64:
        raise CovercutWebhookAuthenticationError()
    expected = hmac.new(secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, normalized_signature):
        raise CovercutWebhookAuthenticationError()


def parse_covercut_timestamp(value: str | None) -> datetime:
    """Validate syntax only; CoverCut retries are not documented with an expiry window."""
    timestamp = str(value or "").strip()
    if not timestamp:
        raise CovercutWebhookAuthenticationError()
    try:
        if timestamp.isdigit():
            parsed = datetime.fromtimestamp(int(timestamp), tz=timezone.utc)
        else:
            parsed = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
    except (OverflowError, ValueError):
        raise CovercutWebhookAuthenticationError()
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


def validate_covercut_timestamp(value: str | None) -> None:
    parse_covercut_timestamp(value)


class CovercutWebhookService:
    SUPPORTED_MESSAGE_TYPES = {"text", "audio", "contacts"}

    def __init__(
        self,
        db,
        connection_repo,
        event_repo,
        business_repo,
        covercut_client,
        *,
        message_secret: str | None,
        saas_secret: str | None,
        n8n_webhook_url: str | None,
        n8n_webhook_header: str | None,
        n8n_webhook_secret: str | None,
        media_max_bytes: int,
        transport: httpx.AsyncBaseTransport | None = None,
        business_integration_repo=None,
        contact_service=None,
        ownership_service=None,
        bot_agent_name: str = "Beautyflow",
    ):
        self.db = db
        self.connection_repo = connection_repo
        self.event_repo = event_repo
        self.business_repo = business_repo
        self.business_integration_repo = business_integration_repo
        self.covercut_client = covercut_client
        self.message_secret = message_secret
        self.saas_secret = saas_secret
        self.n8n_webhook_url = n8n_webhook_url or ""
        self.n8n_webhook_header = n8n_webhook_header or ""
        self.n8n_webhook_secret = n8n_webhook_secret or ""
        self.media_max_bytes = media_max_bytes
        self.transport = transport
        self.contact_service = contact_service
        self.ownership_service = ownership_service
        self.bot_agent_name = bot_agent_name.strip().casefold()

    @staticmethod
    def _payload(raw_body: bytes) -> dict[str, Any]:
        try:
            payload = json.loads(raw_body)
        except (UnicodeDecodeError, json.JSONDecodeError) as exc:
            raise CovercutWebhookPayloadError() from exc
        if not isinstance(payload, dict):
            raise CovercutWebhookPayloadError()
        return payload

    @staticmethod
    def _hash(value: bytes | str) -> str:
        data = value if isinstance(value, bytes) else value.encode("utf-8")
        return hashlib.sha256(data).hexdigest()

    def _claim_event(
        self,
        *,
        deduplication_source: str,
        raw_body: bytes,
        event_type: str,
        external_event_id: str,
        connection=None,
    ) -> tuple[WhatsAppWebhookEvent, bool]:
        deduplication_key = self._hash(deduplication_source)
        payload_sha256 = self._hash(raw_body)
        existing = self.event_repo.get_by_deduplication_key(
            self.db,
            deduplication_key,
            for_update=True,
        )
        if existing:
            if existing.payload_sha256 != payload_sha256:
                raise CovercutWebhookConflictError()
            if existing.status == "failed":
                existing.status = "processing"
                existing.updated_at = datetime.now(timezone.utc)
                self.db.commit()
                return existing, True
            return existing, False

        event = WhatsAppWebhookEvent(
            connection_id=getattr(connection, "id", None),
            business_id=getattr(connection, "business_id", None),
            provider="covercut",
            event_type=event_type[:64] or "unknown",
            external_event_id=external_event_id[:255] or payload_sha256,
            deduplication_key=deduplication_key,
            payload_sha256=payload_sha256,
            status="processing",
        )
        self.event_repo.add(self.db, event)
        try:
            self.db.commit()
            self.db.refresh(event)
        except IntegrityError:
            self.db.rollback()
            existing = self.event_repo.get_by_deduplication_key(self.db, deduplication_key)
            if not existing or existing.payload_sha256 != payload_sha256:
                raise CovercutWebhookConflictError()
            return existing, False
        return event, True

    def _finish_event(self, event: WhatsAppWebhookEvent, status: str, connection=None) -> None:
        if connection:
            event.connection_id = connection.id
            event.business_id = connection.business_id
        event.status = status
        event.updated_at = datetime.now(timezone.utc)
        self.db.commit()

    @staticmethod
    def _status_event_is_stale(connection, timestamp: str | None) -> bool:
        incoming = parse_covercut_timestamp(timestamp)
        metadata = connection.provider_metadata or {}
        current_value = metadata.get("status_event_at")
        if current_value:
            try:
                if incoming < parse_covercut_timestamp(str(current_value)):
                    return True
            except CovercutWebhookAuthenticationError:
                pass
        connection.provider_metadata = {
            **metadata,
            "status_event_at": incoming.astimezone(timezone.utc).isoformat(),
        }
        return False

    async def _forward_to_n8n(self, payload: dict[str, Any]) -> None:
        if not self.n8n_webhook_url or not self.n8n_webhook_header or not self.n8n_webhook_secret:
            raise CovercutWebhookConfigurationError()
        try:
            async with httpx.AsyncClient(timeout=15, transport=self.transport) as client:
                response = await client.post(
                    self.n8n_webhook_url,
                    headers={self.n8n_webhook_header: self.n8n_webhook_secret},
                    json=payload,
                )
                response.raise_for_status()
        except httpx.HTTPError as exc:
            raise CovercutWebhookConfigurationError() from exc

    @staticmethod
    def _media_id(message: dict[str, Any]) -> str | None:
        audio = message.get("audio")
        if isinstance(audio, dict) and audio.get("id"):
            return str(audio["id"])
        media = message.get("media")
        if isinstance(media, dict) and media.get("id"):
            return str(media["id"])
        return None

    @staticmethod
    def _contact_payload(payload: dict[str, Any], message: dict[str, Any]) -> dict[str, Any]:
        contact = payload.get("contact") if isinstance(payload.get("contact"), dict) else {}
        return {
            "provider_user_id": contact.get("user_id") or message.get("from_user_id") or payload.get("from_user_id"),
            "parent_provider_user_id": contact.get("parent_user_id"),
            "wa_id": contact.get("wa_id"),
            "phone": contact.get("phone_number") or payload.get("from_number"),
            "username": contact.get("username"),
            "name": contact.get("name") or contact.get("full_name") or contact.get("first_name"),
        }

    @staticmethod
    def _sync_records(payload: dict[str, Any]) -> list[dict[str, Any]]:
        candidates = [payload.get("contacts"), payload.get("data"), payload.get("smb_app_state_sync")]
        for candidate in candidates:
            if isinstance(candidate, list):
                return [item for item in candidate if isinstance(item, dict)]
            if isinstance(candidate, dict):
                records = candidate.get("contacts") or candidate.get("users")
                if isinstance(records, list):
                    return [item for item in records if isinstance(item, dict)]
        return []

    def _is_human_echo(self, payload: dict[str, Any], message: dict[str, Any]) -> bool:
        source = str(payload.get("echo_source") or message.get("echo_source") or "").strip().lower()
        if source == "phone":
            return True
        agent = str(message.get("agent_name") or payload.get("agent_name") or "").strip()
        return source == "api" and bool(agent) and agent.casefold() != self.bot_agent_name

    async def handle_message(
        self,
        raw_body: bytes,
        *,
        signature: str | None,
        timestamp: str | None,
    ) -> dict[str, Any]:
        verify_covercut_signature(raw_body, signature, self.message_secret)
        validate_covercut_timestamp(timestamp)
        payload = self._payload(raw_body)
        event_type = str(payload.get("event") or "unknown").lower()
        message = payload.get("message") if isinstance(payload.get("message"), dict) else {}
        external_event_id = str(message.get("id") or payload.get("id") or self._hash(raw_body))
        phone_number_id = str(payload.get("from_number_id") or "")
        connection = (
            self.connection_repo.get_by_provider_connection_id(
                self.db,
                "covercut",
                phone_number_id,
            )
            if phone_number_id
            else None
        )
        event, claimed = self._claim_event(
            deduplication_source=(
                f"covercut:message:{phone_number_id or 'unknown'}:{event_type}:{external_event_id}"
            ),
            raw_body=raw_body,
            event_type=event_type,
            external_event_id=external_event_id,
            connection=connection,
        )
        if not claimed:
            return {"accepted": True, "duplicate": True}

        if not connection:
            self._finish_event(event, "ignored")
            logger.warning(
                "covercut webhook ignored event=%s reason=unknown_number payload_sha256=%s",
                event_type,
                event.payload_sha256,
            )
            return {"accepted": True, "ignored": "unknown_number"}

        business = self.business_repo.get_by_id(self.db, connection.business_id)
        active_link = (
            self.business_integration_repo.get_by_ids(
                self.db,
                connection.business_id,
                connection.integration_id,
            )
            if self.business_integration_repo
            else True
        )
        if not business or not active_link:
            self._finish_event(event, "ignored", connection)
            return {"accepted": True, "ignored": "inactive_tenant"}

        if event_type == "account_update":
            update = payload.get("account_update") if isinstance(payload.get("account_update"), dict) else {}
            provider_status = str(update.get("event") or "unknown")
            if self._status_event_is_stale(connection, timestamp):
                self._finish_event(event, "ignored", connection)
                return {"accepted": True, "ignored": "stale_status"}
            if provider_status == "ACCOUNT_OFFBOARDED":
                connection.status = WhatsAppConnectionStatus.disconnected.value
                connection.disconnected_at = datetime.now(timezone.utc)
            elif provider_status == "ACCOUNT_RECONNECTED":
                connection.status = WhatsAppConnectionStatus.connected.value
                connection.connected_at = datetime.now(timezone.utc)
                connection.disconnected_at = None
            connection.provider_status = provider_status
            self._finish_event(event, "processed", connection)
            return {"accepted": True, "status_updated": True}

        if event_type == "smb_app_state_sync":
            if not self.contact_service:
                self._finish_event(event, "ignored", connection)
                return {"accepted": True, "ignored": "contact_service_unavailable"}
            synced = self.contact_service.sync_contacts(
                connection.business_id, connection, self._sync_records(payload)
            )
            self._finish_event(event, "processed", connection)
            return {"accepted": True, "contacts_synced": synced}

        if event_type == "user_id_update":
            raw_updates = payload.get("user_id_update")
            updates = raw_updates if isinstance(raw_updates, list) else [raw_updates] if isinstance(raw_updates, dict) else []
            if not self.contact_service or not updates:
                self._finish_event(event, "ignored", connection)
                return {"accepted": True, "ignored": "invalid_user_id_update"}
            updated_contacts = []
            try:
                for update in updates:
                    user_id = update.get("user_id") if isinstance(update.get("user_id"), dict) else {}
                    parent_user_id = update.get("parent_user_id") if isinstance(update.get("parent_user_id"), dict) else {}
                    previous = str(user_id.get("previous") or update.get("previous_user_id") or update.get("previous") or "")
                    current = str(user_id.get("current") or update.get("current_user_id") or update.get("current") or "")
                    if not previous or not current:
                        raise ContactIdentityConflictError()
                    updated_contacts.append(self.contact_service.update_provider_user_id(
                        connection.business_id,
                        connection,
                        previous,
                        current,
                        update.get("wa_id"),
                        previous_parent=parent_user_id.get("previous"),
                        current_parent=parent_user_id.get("current"),
                    ))
            except ContactIdentityConflictError:
                self._finish_event(event, "failed", connection)
                raise CovercutWebhookConflictError()
            self._finish_event(event, "processed", connection)
            return {"accepted": True, "contact_id": updated_contacts[0].id, "contacts_updated": len(updated_contacts), "user_id_updated": True}

        if event_type == "history":
            self._finish_event(event, "ignored", connection)
            return {"accepted": True, "ignored": "history_not_live"}

        direction = "outbound" if event_type == "echo" else str(payload.get("direction") or "inbound").lower()
        message_type = str(message.get("type") or "unknown").lower()
        if event_type not in {"message", "echo"} or message_type not in self.SUPPORTED_MESSAGE_TYPES:
            self._finish_event(event, "ignored", connection)
            return {"accepted": True, "ignored": "non_live_or_unsupported"}

        if event_type == "echo" and not self.contact_service:
            self._finish_event(event, "ignored", connection)
            return {"accepted": True, "ignored": "bot_or_unknown_echo"}

        identity = self._contact_payload(payload, message)
        shared_contacts = message.get("contacts") if isinstance(message.get("contacts"), list) else []
        if direction == "inbound" and message_type == "contacts" and shared_contacts:
            shared = shared_contacts[0] if isinstance(shared_contacts[0], dict) else {}
            if shared.get("origin") == "contact_request" and identity.get("provider_user_id"):
                phones = shared.get("phones") if isinstance(shared.get("phones"), list) else []
                phone_record = phones[0] if phones and isinstance(phones[0], dict) else {}
                identity["phone"] = phone_record.get("phone") or identity.get("phone")
                identity["wa_id"] = phone_record.get("wa_id") or identity.get("wa_id")

        resolved_contact = None
        if self.contact_service:
            try:
                resolved_contact = self.contact_service.resolve(
                    business_id=connection.business_id,
                    connection=connection,
                    **identity,
                    source="inbound",
                )
            except (ValueError, ContactIdentityConflictError):
                self._finish_event(event, "failed", connection)
                raise CovercutWebhookConflictError()
        elif not identity.get("phone") and not identity.get("wa_id"):
            self._finish_event(event, "ignored", connection)
            return {"accepted": True, "ignored": "sender_identity_missing"}

        if direction != "inbound":
            if resolved_contact and self.ownership_service and self._is_human_echo(payload, message):
                self.ownership_service.activate(
                    connection.business_id, connection.id, resolved_contact.id,
                    str(payload.get("echo_source") or message.get("echo_source") or "api_human"),
                    connection_key=connection.connection_key,
                    conversation_key=f"contact:{resolved_contact.id}",
                )
                self._finish_event(event, "processed", connection)
                return {"accepted": True, "human_takeover": True, "contact_id": resolved_contact.id}
            self._finish_event(event, "ignored", connection)
            return {"accepted": True, "ignored": "bot_or_unknown_echo"}

        if resolved_contact and self.ownership_service:
            takeover = self.ownership_service.is_active(connection.business_id, connection.id, resolved_contact.id)
            if resolved_contact.bot_policy == "HUMAN" or takeover:
                self._finish_event(event, "ignored", connection)
                return {"accepted": True, "ignored": "human_owned", "contact_id": resolved_contact.id}

        normalized_message: dict[str, Any] = {
            "id": external_event_id,
            "type": "text" if message_type == "contacts" else message_type,
            "text": (
                "Meu telefone foi compartilhado."
                if message_type == "contacts"
                else message.get("text") if message_type == "text" else None
            ),
        }
        if isinstance(normalized_message["text"], dict):
            normalized_message["text"] = normalized_message["text"].get("body")

        if message_type == "audio":
            media_id = self._media_id(message)
            if not media_id:
                self._finish_event(event, "ignored", connection)
                return {"accepted": True, "ignored": "media_id_missing"}
            try:
                media, mime_type = await self.covercut_client.get_media(
                    phone_number_id=connection.provider_connection_id,
                    media_id=media_id,
                    max_bytes=self.media_max_bytes,
                )
            except Exception:
                self._finish_event(event, "failed", connection)
                raise
            normalized_message["audio"] = {
                "media_id": media_id,
                "mime_type": mime_type,
                "base64": base64.b64encode(media).decode("ascii"),
            }

        normalized = {
            "schema_version": 1,
            "provider": "covercut",
            "timestamp": timestamp,
            "connection_key": connection.connection_key,
            "business_id": connection.business_id,
            "integration_id": connection.integration_id,
            "event_id": external_event_id,
            "contact": {
                "id": getattr(resolved_contact, "id", None),
                "client_id": getattr(resolved_contact, "client_id", None),
                "policy": getattr(resolved_contact, "bot_policy", "AUTO"),
                "phone": getattr(resolved_contact, "phone", None) or identity.get("phone") or identity.get("wa_id"),
                "wa_id": getattr(resolved_contact, "wa_id", None) or identity.get("wa_id"),
                "name": getattr(resolved_contact, "name", None) or identity.get("name"),
                "user_id": getattr(resolved_contact, "provider_user_id", None) or identity.get("provider_user_id"),
                "parent_user_id": getattr(resolved_contact, "parent_provider_user_id", None) or identity.get("parent_provider_user_id"),
                "username": getattr(resolved_contact, "username", None) or identity.get("username"),
            },
            "message": normalized_message,
        }
        try:
            await self._forward_to_n8n(normalized)
        except Exception:
            self._finish_event(event, "indeterminate", connection)
            logger.exception(
                "covercut webhook forward indeterminate business_id=%s connection_id=%s event_id=%s",
                connection.business_id,
                connection.id,
                external_event_id,
            )
            raise

        self._finish_event(event, "processed", connection)
        logger.info(
            "covercut webhook processed business_id=%s connection_id=%s event_id=%s type=%s",
            connection.business_id,
            connection.id,
            external_event_id,
            message_type,
        )
        return {"accepted": True, "forwarded": True}

    async def handle_saas(
        self,
        raw_body: bytes,
        *,
        signature: str | None,
        timestamp: str | None,
        event_header: str | None = None,
    ) -> dict[str, Any]:
        verify_covercut_signature(raw_body, signature, self.saas_secret)
        validate_covercut_timestamp(timestamp)
        payload = self._payload(raw_body)
        event_type = str(payload.get("event") or "unknown").lower()
        if event_header is not None and event_type != event_header.strip().lower():
            raise CovercutWebhookPayloadError()
        data = payload.get("data") if isinstance(payload.get("data"), dict) else {}
        external_reference = str(data.get("external_id") or "")
        numbers = data.get("numbers") if isinstance(data.get("numbers"), list) else []
        number = numbers[0] if len(numbers) == 1 and isinstance(numbers[0], dict) else {}
        phone_number_id = str(number.get("phone_number_id") or "")
        external_event_id = (
            f"{external_reference}:{phone_number_id}"
            if external_reference or phone_number_id
            else self._hash(raw_body)
        )

        connection = (
            self.connection_repo.get_by_external_reference(
                self.db,
                "covercut",
                external_reference,
                for_update=True,
            )
            if external_reference
            else None
        )
        event, claimed = self._claim_event(
            deduplication_source=f"covercut:saas:{event_type}:{external_event_id}",
            raw_body=raw_body,
            event_type=event_type,
            external_event_id=external_event_id,
            connection=connection,
        )
        if not claimed:
            return {"accepted": True, "duplicate": True}

        if event_type != "saas_customer_connected" or not connection or not phone_number_id:
            self._finish_event(event, "ignored", connection)
            return {"accepted": True, "ignored": "unknown_or_invalid_saas_event"}

        business = self.business_repo.get_by_id(self.db, connection.business_id)
        active_link = (
            self.business_integration_repo.get_by_ids(
                self.db,
                connection.business_id,
                connection.integration_id,
            )
            if self.business_integration_repo
            else True
        )
        if not business or not active_link:
            self._finish_event(event, "ignored", connection)
            return {"accepted": True, "ignored": "inactive_tenant"}

        account_id = str(data.get("sub_customer_id") or "")
        if connection.provider_account_id and account_id and account_id != connection.provider_account_id:
            self._finish_event(event, "ignored", connection)
            raise CovercutWebhookConflictError()

        collision = self.connection_repo.get_by_provider_connection_id(
            self.db,
            "covercut",
            phone_number_id,
        )
        if collision and collision.id != connection.id:
            self._finish_event(event, "ignored", connection)
            raise CovercutWebhookConflictError()

        if self._status_event_is_stale(connection, timestamp):
            self._finish_event(event, "ignored", connection)
            return {"accepted": True, "ignored": "stale_status"}

        connection.provider_connection_id = phone_number_id
        connection.provider_account_id = account_id or connection.provider_account_id
        connection.business_account_id = str(data.get("waba_id") or "") or None
        connection.phone = str(number.get("display_phone_number") or "") or None
        connection.status = WhatsAppConnectionStatus.connected.value
        connection.provider_status = str(number.get("status") or "active")
        connection.connected_at = datetime.now(timezone.utc)
        connection.disconnected_at = None
        connection.provider_metadata = {
            **(connection.provider_metadata or {}),
            "saas_webhook_reconciled": True,
        }
        self._finish_event(event, "processed", connection)
        logger.info(
            "covercut saas connected business_id=%s connection_id=%s",
            connection.business_id,
            connection.id,
        )
        return {"accepted": True, "connected": True}


def get_covercut_webhook_service(db: DataBaseDep):
    client = CovercutClient(
        COVERCUT_API_BASE_URL,
        COVERCUT_API_KEY,
        COVERCUT_API_SECRET,
        timeout_seconds=COVERCUT_REQUEST_TIMEOUT_SECONDS,
        bot_agent_name=WHATSAPP_BOT_AGENT_NAME,
    )
    return CovercutWebhookService(
        db,
        WhatsAppConnectionRepository(),
        WhatsAppWebhookEventRepository(),
        BusinessRepository(),
        client,
        message_secret=COVERCUT_MESSAGE_WEBHOOK_SECRET,
        saas_secret=COVERCUT_SAAS_WEBHOOK_SECRET,
        n8n_webhook_url=COVERCUT_N8N_WEBHOOK_URL,
        n8n_webhook_header=N8N_WEBHOOK_HEADER,
        n8n_webhook_secret=N8N_WEBHOOK_SECRET,
        media_max_bytes=COVERCUT_MEDIA_MAX_BYTES,
        business_integration_repo=BusinessIntegrationRepository(),
        contact_service=get_contact_service(db),
        ownership_service=ConversationOwnershipService(),
        bot_agent_name=WHATSAPP_BOT_AGENT_NAME,
    )
