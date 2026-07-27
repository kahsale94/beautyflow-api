import json
import os
import uuid
from fnmatch import fnmatchcase
from pathlib import Path
from types import SimpleNamespace

import pytest
from sqlalchemy.exc import IntegrityError

from src.schemas import ProfessionalCreate, ProfessionalUpdate
from src.services.professional_service import (
    ProfessionalAlreadyExistsError,
    ProfessionalService,
)
from src.services.redis_cache_invalidator import RedisCacheInvalidator

ROOT = Path(__file__).resolve().parents[1]

def read_source(relative_path: str) -> str:
    return (ROOT / relative_path).read_text(encoding="utf-8")

def test_professional_create_persists_email():
    source = read_source("src/services/professional_service.py")

    assert "email" in source
    assert "str(data.email)" in source

def test_professional_lists_can_return_empty_list():
    source = read_source("src/services/professional_service.py")

    assert "def get_all" in source
    assert "not result" not in source[source.index("def get_all"):source.index("def get_by_id")]

def test_professional_email_uses_emailstr_schema():
    source = read_source("src/schemas/professional_schema.py")

    assert "EmailStr" in source
    assert "email: EmailStr" in source


class RecordingSession:
    def __init__(self, events, *, commit_error=None):
        self.events = events
        self.commit_error = commit_error

    def commit(self):
        self.events.append("commit")
        if self.commit_error:
            raise self.commit_error

    def rollback(self):
        self.events.append("rollback")

    def refresh(self, value):
        self.events.append("refresh")


class ProfessionalRepositoryStub:
    def __init__(self, professional, events):
        self.professional = professional
        self.events = events

    def add(self, db, professional):
        self.events.append("add")
        professional.id = 41
        self.professional = professional

    def get_by_id(self, db, business_id, professional_id):
        self.events.append("get")
        return self.professional


class RecordingInvalidator:
    def __init__(self, events):
        self.events = events

    def invalidate_professional_context(self, professional_id):
        self.events.append(f"invalidate:{professional_id}")
        return 0


class RecordingRedis:
    def __init__(self, values, events):
        self.values = dict(values)
        self.events = events

    def scan_iter(self, match, count):
        self.events.append(f"scan:{match}")
        yield from [key for key in self.values if fnmatchcase(key, match)]

    def delete(self, *keys):
        self.events.append("delete")
        deleted = 0
        for key in keys:
            if key in self.values:
                del self.values[key]
                deleted += 1
        return deleted

    def close(self):
        self.events.append("redis-close")


def professional_fixture():
    return SimpleNamespace(
        id=7,
        business_id=3,
        name="Maria",
        normalized_name="maria",
        email="old@example.com",
        phone="5511999999999",
        is_active=True,
    )


def test_professional_create_invalidates_target_after_commit_before_refresh():
    events = []
    repository = ProfessionalRepositoryStub(None, events)
    service = ProfessionalService(
        RecordingSession(events),
        repository,
        RecordingInvalidator(events),
    )

    result = service.create(
        3,
        ProfessionalCreate(
            name="Maria",
            email="maria@example.com",
            phone="11999999999",
        ),
    )

    assert result.id == 41
    assert events == ["add", "commit", "invalidate:41", "refresh"]


def test_professional_email_update_removes_old_cache_after_commit_and_preserves_neighbor():
    events = []
    target_key = "beautyflow_bot.instance_a.7.maria.professional_context"
    neighbor_key = "beautyflow_bot.instance_a.8.joana.professional_context"
    redis_client = RecordingRedis(
        {
            target_key: '{"id":7,"email":"old@example.com"}',
            neighbor_key: '{"id":8,"email":"neighbor@example.com"}',
        },
        events,
    )
    invalidator = RedisCacheInvalidator(
        redis_url="redis://redis:6379/0",
        client_factory=lambda *args, **kwargs: redis_client,
        max_attempts=1,
        retry_delay_seconds=0,
    )
    professional = professional_fixture()
    service = ProfessionalService(
        RecordingSession(events),
        ProfessionalRepositoryStub(professional, events),
        invalidator,
    )

    result = service.update(3, 7, ProfessionalUpdate(email="new@example.com"))

    assert result.email == "new@example.com"
    assert target_key not in redis_client.values
    assert neighbor_key in redis_client.values
    assert events.index("commit") < events.index("scan:beautyflow_bot.*.7.*.professional_context")
    assert events.index("redis-close") < events.index("refresh")


def test_professional_email_update_invalidates_real_redis_and_repopulates_new_email():
    redis_url = os.getenv("TEST_REDIS_URL")
    if not redis_url:
        pytest.skip("TEST_REDIS_URL is required for the real Redis integration test")

    import redis

    namespace = f"codex_{uuid.uuid4().hex}"
    professional_id = 1_500_000_000 + (uuid.uuid4().int % 100_000_000)
    target_key = (
        f"beautyflow_bot.{namespace}.{professional_id}.maria.professional_context"
    )
    neighbor_key = (
        f"beautyflow_bot.{namespace}.{professional_id + 1}.joana.professional_context"
    )
    client = redis.from_url(redis_url, decode_responses=True)

    try:
        client.setex(
            target_key,
            86400,
            json.dumps({"id": professional_id, "email": "old@example.com"}),
        )
        client.setex(
            neighbor_key,
            86400,
            json.dumps({"id": professional_id + 1, "email": "neighbor@example.com"}),
        )

        events = []
        professional = professional_fixture()
        professional.id = professional_id
        service = ProfessionalService(
            RecordingSession(events),
            ProfessionalRepositoryStub(professional, events),
            RedisCacheInvalidator(
                redis_url=redis_url,
                max_attempts=1,
                retry_delay_seconds=0,
            ),
        )

        updated = service.update(
            3,
            professional_id,
            ProfessionalUpdate(email="new@example.com"),
        )

        assert client.get(target_key) is None
        assert json.loads(client.get(neighbor_key))["email"] == "neighbor@example.com"

        # Mirrors the n8n fresh API response being written back to the same cache key.
        client.setex(
            target_key,
            86400,
            json.dumps({"id": professional_id, "email": updated.email}),
        )
        cached_context = json.loads(client.get(target_key))
        next_notification_recipient = cached_context["email"]

        assert cached_context["email"] == "new@example.com"
        assert next_notification_recipient == "new@example.com"
        assert next_notification_recipient != "old@example.com"
        assert 0 < client.ttl(target_key) <= 86400
    finally:
        client.delete(target_key, neighbor_key)
        client.close()


def test_professional_non_email_update_invalidates_cached_context():
    events = []
    target_key = "beautyflow_bot.instance_a.7.maria.professional_context"
    redis_client = RecordingRedis(
        {target_key: '{"id":7,"name":"Maria","email":"old@example.com"}'},
        events,
    )
    professional = professional_fixture()
    service = ProfessionalService(
        RecordingSession(events),
        ProfessionalRepositoryStub(professional, events),
        RedisCacheInvalidator(
            redis_url="redis://redis:6379/0",
            client_factory=lambda *args, **kwargs: redis_client,
            max_attempts=1,
            retry_delay_seconds=0,
        ),
    )

    updated = service.update(3, 7, ProfessionalUpdate(name="Maria Silva"))

    assert updated.name == "Maria Silva"
    assert target_key not in redis_client.values
    assert events.index("commit") < events.index(
        "scan:beautyflow_bot.*.7.*.professional_context"
    )


def test_professional_update_rollback_keeps_valid_cache_and_skips_invalidation():
    events = []
    target_key = "beautyflow_bot.instance_a.7.maria.professional_context"
    redis_client = RecordingRedis(
        {target_key: '{"id":7,"email":"old@example.com"}'},
        events,
    )
    factory_calls = []

    def factory(*args, **kwargs):
        factory_calls.append(True)
        return redis_client

    invalidator = RedisCacheInvalidator(
        redis_url="redis://redis:6379/0",
        client_factory=factory,
        max_attempts=1,
        retry_delay_seconds=0,
    )
    service = ProfessionalService(
        RecordingSession(
            events,
            commit_error=IntegrityError("update professionals", {}, Exception("constraint")),
        ),
        ProfessionalRepositoryStub(professional_fixture(), events),
        invalidator,
    )

    with pytest.raises(ProfessionalAlreadyExistsError):
        service.update(3, 7, ProfessionalUpdate(email="new@example.com"))

    assert events == ["get", "commit", "rollback"]
    assert factory_calls == []
    assert target_key in redis_client.values


def test_professional_update_remains_committed_when_redis_connection_fails():
    events = []

    def failing_factory(*args, **kwargs):
        events.append("redis-connect")
        raise ConnectionError("redis unavailable")

    invalidator = RedisCacheInvalidator(
        redis_url="redis://redis:6379/0",
        client_factory=failing_factory,
        max_attempts=2,
        retry_delay_seconds=0,
    )
    professional = professional_fixture()
    service = ProfessionalService(
        RecordingSession(events),
        ProfessionalRepositoryStub(professional, events),
        invalidator,
    )

    result = service.update(3, 7, ProfessionalUpdate(email="new@example.com"))

    assert result.email == "new@example.com"
    assert events == ["get", "commit", "redis-connect", "redis-connect", "refresh"]


def test_professional_deactivation_invalidates_only_after_commit():
    events = []
    professional = professional_fixture()
    service = ProfessionalService(
        RecordingSession(events),
        ProfessionalRepositoryStub(professional, events),
        RecordingInvalidator(events),
    )

    service.deactivate(3, 7)

    assert professional.is_active is False
    assert events == ["get", "commit", "invalidate:7"]
