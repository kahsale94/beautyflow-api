import logging
from fnmatch import fnmatchcase

from src.services.redis_cache_invalidator import RedisCacheInvalidator


class FakeRedis:
    def __init__(self, keys=(), *, close_error: Exception | None = None):
        self.keys = dict.fromkeys(keys, "cached")
        self.deleted = []
        self.scanned = []
        self.closed = False
        self.close_error = close_error

    def scan_iter(self, match, count):
        self.scanned.append((match, count))
        yield from [key for key in self.keys if fnmatchcase(key, match)]

    def delete(self, *keys):
        deleted = 0
        for key in keys:
            if key in self.keys:
                del self.keys[key]
                self.deleted.append(key)
                deleted += 1
        return deleted

    def close(self):
        self.closed = True
        if self.close_error:
            raise self.close_error


class FailingRedis:
    def __init__(self):
        self.closed = False

    def scan_iter(self, match, count):
        raise ConnectionError("redis unavailable")

    def close(self):
        self.closed = True


def invalidator_for(fake_redis, **kwargs):
    return RedisCacheInvalidator(
        redis_url="redis://redis:6379/0",
        client_factory=lambda *args, **factory_kwargs: fake_redis,
        retry_delay_seconds=0,
        **kwargs,
    )


def test_redis_cache_invalidator_deletes_matching_context_keys():
    fake_redis = FakeRedis(
        [
            "beautyflow_bot.sale_instance.1.corte.service_context",
            "beautyflow_bot.sale_instance.2.barba.service_context",
            "beautyflow_bot.11922220001.business_context",
            "beautyflow_bot.sale_instance.7.maria.professional_context",
        ]
    )

    deleted = invalidator_for(fake_redis).invalidate_patterns(
        [
            RedisCacheInvalidator.SERVICE_CONTEXT_PATTERN,
            "beautyflow_bot.11922220001.business_context",
        ]
    )

    assert deleted == 3
    assert fake_redis.deleted == [
        "beautyflow_bot.sale_instance.1.corte.service_context",
        "beautyflow_bot.sale_instance.2.barba.service_context",
        "beautyflow_bot.11922220001.business_context",
    ]
    assert "beautyflow_bot.sale_instance.7.maria.professional_context" in fake_redis.keys
    assert fake_redis.closed is True


def test_specific_context_invalidation_matches_instance_scoped_and_legacy_keys():
    fake_redis = FakeRedis(
        [
            "beautyflow_bot.sale_instance.11922220001.business_context",
            "beautyflow_bot.11922220001.business_context",
        ]
    )

    invalidator_for(fake_redis).invalidate_business_context("11922220001")

    assert fake_redis.closed is True
    assert fake_redis.deleted == [
        "beautyflow_bot.sale_instance.11922220001.business_context",
        "beautyflow_bot.11922220001.business_context",
    ]


def test_professional_invalidation_is_targeted_and_covers_current_and_legacy_keys():
    target_keys = {
        "beautyflow_bot.instance_a.7.maria.professional_context",
        "beautyflow_bot.instance_b.7.maria.professional_context",
        "beautyflow_bot.7.maria.professional_context",
    }
    neighbor_keys = {
        "beautyflow_bot.instance_a.8.joana.professional_context",
        "beautyflow_bot.8.joana.professional_context",
        "beautyflow_bot.instance_a.7.maria.service_context",
    }
    fake_redis = FakeRedis(target_keys | neighbor_keys)

    deleted = invalidator_for(fake_redis).invalidate_professional_context(7)

    assert deleted == len(target_keys)
    assert set(fake_redis.deleted) == target_keys
    assert set(fake_redis.keys) == neighbor_keys
    assert fake_redis.scanned == [
        ("beautyflow_bot.*.7.*.professional_context", 500),
        ("beautyflow_bot.7.*.professional_context", 500),
    ]


def test_redis_failure_is_retried_logged_and_does_not_propagate(caplog):
    clients = []

    def factory(*args, **kwargs):
        client = FailingRedis()
        clients.append(client)
        return client

    invalidator = RedisCacheInvalidator(
        redis_url="redis://redis:6379/0",
        client_factory=factory,
        max_attempts=3,
        retry_delay_seconds=0,
    )

    with caplog.at_level(logging.WARNING, logger="src.services.redis_cache_invalidator"):
        deleted = invalidator.invalidate_professional_context(7)

    assert deleted == 0
    assert len(clients) == 3
    assert all(client.closed for client in clients)
    assert "Redis n8n cache invalidation failed after retries" in caplog.text


def test_redis_close_failure_is_logged_and_does_not_override_success(caplog):
    fake_redis = FakeRedis(close_error=ConnectionError("close failed"))

    with caplog.at_level(logging.WARNING, logger="src.services.redis_cache_invalidator"):
        deleted = invalidator_for(fake_redis).invalidate_professional_context(7)

    assert deleted == 0
    assert fake_redis.closed is True
    assert "Failed to close Redis cache invalidation client" in caplog.text


def test_missing_redis_configuration_is_logged_without_raising(caplog):
    invalidator = RedisCacheInvalidator(redis_url=None, max_attempts=1)

    with caplog.at_level(logging.ERROR, logger="src.services.redis_cache_invalidator"):
        deleted = invalidator.invalidate_professional_context(7)

    assert deleted == 0
    assert "Redis n8n cache invalidation is unavailable" in caplog.text
