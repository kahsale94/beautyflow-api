import logging
from collections.abc import Iterable
from typing import Any, Callable

from src.core import REDIS_URL, WHATSAPP_HUMAN_TAKEOVER_TTL_SECONDS

try:
    import redis
except ImportError:  # pragma: no cover
    redis = None


logger = logging.getLogger(__name__)


class ConversationOwnershipService:
    def __init__(self, redis_url: str | None = REDIS_URL, ttl_seconds: int = WHATSAPP_HUMAN_TAKEOVER_TTL_SECONDS, client_factory: Callable[..., Any] | None = None):
        self.redis_url = redis_url
        self.ttl_seconds = max(60, int(ttl_seconds))
        self.client_factory = client_factory

    @staticmethod
    def key(business_id: int, connection_id: int, contact_id: int) -> str:
        return f"beautyflow_bot.v2.{business_id}.{connection_id}.{contact_id}.human_takeover"

    def _client(self):
        if not self.redis_url or redis is None:
            return None
        factory = self.client_factory or redis.from_url
        return factory(self.redis_url, decode_responses=True, socket_connect_timeout=2, socket_timeout=5)

    @staticmethod
    def _close(client) -> None:
        close = getattr(client, "close", None)
        if close:
            close()

    def is_active(self, business_id: int, connection_id: int, contact_id: int) -> bool:
        client = self._client()
        if client is None:
            return False
        try:
            return bool(client.exists(self.key(business_id, connection_id, contact_id)))
        except Exception:
            logger.exception("Failed to read WhatsApp human takeover")
            return False
        finally:
            self._close(client)

    def is_active_strict(self, business_id: int, connection_id: int, contact_id: int) -> bool:
        client = self._client()
        if client is None:
            raise RuntimeError("Redis indisponível para validar atendimento humano.")
        try:
            return bool(client.exists(self.key(business_id, connection_id, contact_id)))
        finally:
            self._close(client)

    def active_map(self, business_id: int, pairs: Iterable[tuple[int, int]]) -> dict[int, bool]:
        normalized = list(dict.fromkeys((int(connection_id), int(contact_id)) for connection_id, contact_id in pairs))
        if not normalized:
            return {}
        client = self._client()
        if client is None:
            return {contact_id: False for _, contact_id in normalized}
        try:
            values = client.mget([self.key(business_id, connection_id, contact_id) for connection_id, contact_id in normalized])
            return {contact_id: bool(value) for (_, contact_id), value in zip(normalized, values)}
        except Exception:
            logger.exception("Failed to batch-read WhatsApp human takeover")
            return {contact_id: False for _, contact_id in normalized}
        finally:
            self._close(client)

    def activate(
        self, business_id: int, connection_id: int, contact_id: int, source: str,
        *, connection_key: str | None = None, conversation_key: str | None = None,
    ) -> None:
        client = self._client()
        if client is None:
            raise RuntimeError("Redis indisponível para ativar atendimento humano.")
        try:
            client.setex(self.key(business_id, connection_id, contact_id), self.ttl_seconds, source[:64])
            if connection_key and conversation_key and "*" not in conversation_key:
                prefix = f"beautyflow_bot.{connection_key}.{conversation_key}"
                client.delete(
                    f"{prefix}.state",
                    f"{prefix}.chat_buffer",
                    f"{prefix}.outside_hours_context",
                )
        finally:
            self._close(client)

    def clear(self, business_id: int, connection_id: int, contact_id: int) -> None:
        client = self._client()
        if client is None:
            raise RuntimeError("Redis indisponível para retomar o bot.")
        try:
            client.delete(self.key(business_id, connection_id, contact_id))
        finally:
            self._close(client)
