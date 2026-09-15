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
    BUFFER_TTL_SECONDS = 120
    HISTORY_TTL_SECONDS = 86400
    BUFFER_MAX_MESSAGES = 100
    HISTORY_MAX_MESSAGES = 100

    def __init__(self, redis_url: str | None = REDIS_URL, ttl_seconds: int = WHATSAPP_HUMAN_TAKEOVER_TTL_SECONDS, client_factory: Callable[..., Any] | None = None):
        self.redis_url = redis_url
        self.ttl_seconds = max(60, int(ttl_seconds))
        self.client_factory = client_factory

    @staticmethod
    def key(business_id: int, connection_id: int, contact_id: int) -> str:
        return f"beautyflow_bot.v2.{business_id}.{connection_id}.{contact_id}.human_takeover"

    @staticmethod
    def conversation_prefix(connection_key: str, conversation_key: str) -> str:
        if not connection_key or not conversation_key or any(char in conversation_key for char in "*?[]"):
            raise ValueError("Chave de conversa inválida.")
        return f"beautyflow_bot.{connection_key}.{conversation_key}"

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
        except Exception as exc:
            logger.exception("Failed to strictly read WhatsApp human takeover")
            raise RuntimeError("Redis indisponível para validar atendimento humano.") from exc
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
            if connection_key and conversation_key:
                prefix = self.conversation_prefix(connection_key, conversation_key)
                pipeline = client.pipeline(transaction=True)
                pipeline.setex(
                    self.key(business_id, connection_id, contact_id),
                    self.ttl_seconds,
                    source[:64],
                )
                pipeline.delete(
                    f"{prefix}.state",
                    f"{prefix}.chat_buffer",
                    f"{prefix}.outside_hours_context",
                    f"{prefix}.conversation_meta",
                )
                pipeline.execute()
            else:
                client.setex(self.key(business_id, connection_id, contact_id), self.ttl_seconds, source[:64])
        except Exception as exc:
            logger.exception("Failed to activate WhatsApp human takeover")
            raise RuntimeError("Redis indisponível para ativar atendimento humano.") from exc
        finally:
            self._close(client)

    def clear(
        self, business_id: int, connection_id: int, contact_id: int,
        *, connection_key: str | None = None, conversation_key: str | None = None,
    ) -> None:
        client = self._client()
        if client is None:
            raise RuntimeError("Redis indisponível para retomar o bot.")
        try:
            keys = [self.key(business_id, connection_id, contact_id)]
            if connection_key and conversation_key:
                prefix = self.conversation_prefix(connection_key, conversation_key)
                keys.extend((
                    f"{prefix}.state",
                    f"{prefix}.chat_buffer",
                    f"{prefix}.outside_hours_context",
                    f"{prefix}.conversation_meta",
                ))
            pipeline = client.pipeline(transaction=True)
            pipeline.delete(*keys)
            pipeline.execute()
        except Exception as exc:
            logger.exception("Failed to clear WhatsApp human takeover")
            raise RuntimeError("Redis indisponível para retomar o bot.") from exc
        finally:
            self._close(client)

    def append_buffer(
        self, connection_key: str, conversation_key: str, message: str,
        *, ttl_seconds: int | None = None,
    ) -> None:
        self._append_list(
            connection_key,
            conversation_key,
            "chat_buffer",
            message,
            ttl_seconds=max(30, int(ttl_seconds or self.BUFFER_TTL_SECONDS)),
            max_messages=self.BUFFER_MAX_MESSAGES,
            error_message="Redis indisponível para armazenar mensagem.",
            log_message="Failed to append WhatsApp conversation buffer",
        )

    def append_history(
        self, connection_key: str, conversation_key: str, message: str,
        *, ttl_seconds: int | None = None,
    ) -> None:
        self._append_list(
            connection_key,
            conversation_key,
            "chat_memory",
            message,
            ttl_seconds=max(300, int(ttl_seconds or self.HISTORY_TTL_SECONDS)),
            max_messages=self.HISTORY_MAX_MESSAGES,
            error_message="Redis indisponível para armazenar histórico.",
            log_message="Failed to append WhatsApp conversation history",
        )

    def maintain_history(
        self, connection_key: str, conversation_key: str,
        *, ttl_seconds: int | None = None,
    ) -> None:
        client = self._client()
        if client is None:
            raise RuntimeError("Redis indisponível para manter histórico.")
        key = f"{self.conversation_prefix(connection_key, conversation_key)}.chat_memory"
        ttl = max(300, int(ttl_seconds or self.HISTORY_TTL_SECONDS))
        try:
            pipeline = client.pipeline(transaction=True)
            pipeline.ltrim(key, -self.HISTORY_MAX_MESSAGES, -1)
            pipeline.expire(key, ttl)
            pipeline.execute()
        except Exception as exc:
            logger.exception("Failed to maintain WhatsApp conversation history")
            raise RuntimeError("Redis indisponível para manter histórico.") from exc
        finally:
            self._close(client)

    def _append_list(
        self,
        connection_key: str,
        conversation_key: str,
        suffix: str,
        message: str,
        *,
        ttl_seconds: int,
        max_messages: int,
        error_message: str,
        log_message: str,
    ) -> None:
        client = self._client()
        if client is None:
            raise RuntimeError(error_message)
        prefix = self.conversation_prefix(connection_key, conversation_key)
        key = f"{prefix}.{suffix}"
        try:
            pipeline = client.pipeline(transaction=True)
            pipeline.rpush(key, message)
            pipeline.ltrim(key, -max_messages, -1)
            pipeline.expire(key, ttl_seconds)
            pipeline.execute()
        except Exception as exc:
            logger.exception(log_message)
            raise RuntimeError(error_message) from exc
        finally:
            self._close(client)
