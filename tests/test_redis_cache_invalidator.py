from src.services.redis_cache_invalidator import RedisCacheInvalidator


class FakeRedis:
    def __init__(self):
        self.deleted = []
        self.closed = False

    def scan_iter(self, match, count):
        keys_by_pattern = {
            "beautyflow_bot.*.*.service_context": [
                "beautyflow_bot.1.Corte.service_context",
                "beautyflow_bot.2.Barba.service_context",
            ],
            "beautyflow_bot.11922220001.business_context": [
                "beautyflow_bot.11922220001.business_context",
            ],
        }
        yield from keys_by_pattern.get(match, [])

    def delete(self, *keys):
        self.deleted.extend(keys)
        return len(keys)

    def close(self):
        self.closed = True


def test_redis_cache_invalidator_deletes_matching_context_keys():
    fake_redis = FakeRedis()
    invalidator = RedisCacheInvalidator(
        redis_url="redis://redis:6379/0",
        client_factory=lambda *args, **kwargs: fake_redis,
    )

    deleted = invalidator.invalidate_patterns(
        [
            RedisCacheInvalidator.SERVICE_CONTEXT_PATTERN,
            "beautyflow_bot.11922220001.business_context",
        ]
    )

    assert deleted == 3
    assert fake_redis.deleted == [
        "beautyflow_bot.1.Corte.service_context",
        "beautyflow_bot.2.Barba.service_context",
        "beautyflow_bot.11922220001.business_context",
    ]
    assert fake_redis.closed is True
