import logging
from collections.abc import Callable, Iterable
from typing import Any

from src.core import REDIS_URL

try:
    import redis
except ImportError:  # pragma: no cover - dependency is declared, this is defensive.
    redis = None


logger = logging.getLogger(__name__)


RedisClientFactory = Callable[..., Any]


class RedisCacheInvalidator:
    SERVICE_CONTEXT_PATTERN = "beautyflow_bot.*.*.service_context"
    PROFESSIONAL_CONTEXT_PATTERN = "beautyflow_bot.*.*.professional_context"
    CLIENT_CONTEXT_PATTERN = "beautyflow_bot.*.client_context"
    BUSINESS_CONTEXT_PATTERN = "beautyflow_bot.*.business_context"

    def __init__(
        self,
        redis_url: str | None = REDIS_URL,
        client_factory: RedisClientFactory | None = None,
    ):
        self.redis_url = redis_url
        self.client_factory = client_factory

    def _client(self):
        if not self.redis_url or redis is None:
            return None

        factory = self.client_factory or redis.from_url
        return factory(
            self.redis_url,
            decode_responses=True,
            socket_connect_timeout=2,
            socket_timeout=5,
        )

    def invalidate_patterns(self, patterns: Iterable[str]) -> int:
        unique_patterns = [pattern for pattern in dict.fromkeys(patterns) if pattern]
        if not unique_patterns:
            return 0

        client = self._client()
        if client is None:
            return 0

        deleted = 0

        try:
            for pattern in unique_patterns:
                keys = list(client.scan_iter(match=pattern, count=500))
                if not keys:
                    continue

                for index in range(0, len(keys), 500):
                    chunk = keys[index : index + 500]
                    deleted += int(client.delete(*chunk) or 0)

            if deleted:
                logger.info("Invalidated Redis n8n cache keys", extra={"deleted": deleted})

            return deleted
        except Exception:
            logger.exception(
                "Redis n8n cache invalidation failed",
                extra={"patterns": unique_patterns},
            )
            return 0
        finally:
            close = getattr(client, "close", None)
            if close:
                close()

    def invalidate_business_context(self, phone: str | None = None) -> int:
        pattern = f"beautyflow_bot.{phone}.business_context" if phone else self.BUSINESS_CONTEXT_PATTERN
        return self.invalidate_patterns([pattern])

    def invalidate_client_context(self, phone: str | None = None) -> int:
        pattern = f"beautyflow_bot.{phone}.client_context" if phone else self.CLIENT_CONTEXT_PATTERN
        return self.invalidate_patterns([pattern])

    def invalidate_service_context(self) -> int:
        return self.invalidate_patterns([self.SERVICE_CONTEXT_PATTERN])

    def invalidate_professional_context(self) -> int:
        return self.invalidate_patterns([self.PROFESSIONAL_CONTEXT_PATTERN])
