import asyncio
import hashlib
import hmac
import json
from types import SimpleNamespace

import httpx
import pytest

from src.services.covercut_webhook_service import (
    CovercutWebhookAuthenticationError,
    CovercutWebhookConflictError,
    CovercutWebhookPayloadError,
    CovercutWebhookService,
)


class FakeDatabase:
    def commit(self):
        return None

    def rollback(self):
        return None

    def refresh(self, value):
        return None


class FakeConnectionRepository:
    def __init__(self, connections):
        self.connections = connections

    def get_by_provider_connection_id(self, db, provider, provider_connection_id, integration_id=None):
        for connection in self.connections:
            if (
                connection.provider == provider
                and connection.provider_connection_id == provider_connection_id
                and (integration_id is None or connection.integration_id == integration_id)
            ):
                return connection
        return None

    def get_by_external_reference(self, db, provider, external_reference, for_update=False):
        for connection in self.connections:
            if connection.provider == provider and connection.external_reference == external_reference:
                return connection
        return None


class FakeEventRepository:
    def __init__(self):
        self.events = {}

    def add(self, db, event):
        event.id = len(self.events) + 1
        self.events[event.deduplication_key] = event

    def get_by_deduplication_key(self, db, deduplication_key, for_update=False):
        return self.events.get(deduplication_key)


class FakeBusinessRepository:
    def __init__(self, business_ids=(7,)):
        self.business_ids = business_ids

    def get_by_id(self, db, business_id):
        return SimpleNamespace(id=business_id, is_active=True) if business_id in self.business_ids else None


class FakeBusinessIntegrationRepository:
    def __init__(self, links=((7, 3),)):
        self.links = set(links)

    def get_by_ids(self, db, business_id, integration_id):
        if (business_id, integration_id) in self.links:
            return SimpleNamespace(business_id=business_id, integration_id=integration_id, is_active=True)
        return None


class FakeCovercutClient:
    async def get_media(self, *, phone_number_id, media_id, max_bytes):
        assert phone_number_id == "pnid-7"
        assert media_id == "media-1"
        assert max_bytes == 1024
        return b"voice", "audio/ogg"


def connection(**overrides):
    values = {
        "id": 2,
        "business_id": 7,
        "integration_id": 3,
        "provider": "covercut",
        "provider_connection_id": "pnid-7",
        "provider_account_id": "118",
        "external_reference": "beautyflow:business:7",
        "business_account_id": None,
        "phone": None,
        "status": "connecting",
        "provider_status": "pending",
        "provider_metadata": {},
        "connected_at": None,
        "disconnected_at": None,
    }
    values.update(overrides)
    result = SimpleNamespace(**values)
    result.connection_key = f"{result.provider}:{result.provider_connection_id}"
    return result


def signed(raw_body, secret="message-secret"):
    return hmac.new(secret.encode(), raw_body, hashlib.sha256).hexdigest()


def build_service(
    *,
    connections=None,
    transport=None,
    event_repo=None,
    businesses=(7,),
    links=((7, 3),),
    covercut_client=None,
):
    return CovercutWebhookService(
        FakeDatabase(),
        FakeConnectionRepository(connections or []),
        event_repo or FakeEventRepository(),
        FakeBusinessRepository(businesses),
        covercut_client or FakeCovercutClient(),
        message_secret="message-secret",
        saas_secret="saas-secret",
        n8n_webhook_url="https://n8n.example/webhook/beautyflow-staging",
        n8n_webhook_header="X-Beautyflow-Webhook-Secret",
        n8n_webhook_secret="n8n-secret",
        media_max_bytes=1024,
        transport=transport,
        business_integration_repo=FakeBusinessIntegrationRepository(links),
    )


def run(coroutine):
    return asyncio.run(coroutine)


def test_message_webhook_verifies_hmac_normalizes_and_deduplicates_text():
    forwarded = []

    async def handler(request: httpx.Request):
        forwarded.append({"headers": dict(request.headers), "payload": json.loads(request.content)})
        return httpx.Response(200, json={"ok": True})

    raw = json.dumps(
        {
            "event": "message",
            "direction": "inbound",
            "from_number_id": "pnid-7",
            "contact": {"wa_id": "5511999999999", "name": "Ana", "user_id": "BR.1"},
            "message": {"id": "wamid.1", "type": "text", "text": "Oi"},
        },
        separators=(",", ":"),
    ).encode()
    service = build_service(
        connections=[connection(status="connected")],
        transport=httpx.MockTransport(handler),
    )

    first = run(service.handle_message(raw, signature=signed(raw), timestamp="1778884885"))
    second = run(service.handle_message(raw, signature=signed(raw), timestamp="1778884885"))

    assert first == {"accepted": True, "forwarded": True}
    assert second == {"accepted": True, "duplicate": True}
    assert len(forwarded) == 1
    assert forwarded[0]["headers"]["x-beautyflow-webhook-secret"] == "n8n-secret"
    assert forwarded[0]["payload"]["connection_key"] == "covercut:pnid-7"
    assert forwarded[0]["payload"]["business_id"] == 7
    assert forwarded[0]["payload"]["message"] == {
        "id": "wamid.1",
        "type": "text",
        "text": "Oi",
    }


def test_message_webhook_rejects_bad_signature_changed_body_and_timestamp():
    raw = b'{"event":"message"}'
    service = build_service()
    with pytest.raises(CovercutWebhookAuthenticationError):
        run(service.handle_message(raw, signature="0" * 64, timestamp="1778884885"))
    with pytest.raises(CovercutWebhookAuthenticationError):
        run(service.handle_message(raw + b" ", signature=signed(raw), timestamp="1778884885"))
    with pytest.raises(CovercutWebhookAuthenticationError):
        run(service.handle_message(raw, signature=signed(raw), timestamp="not-a-timestamp"))


@pytest.mark.parametrize(
    ("event", "direction", "message_type"),
    [
        ("history", "inbound", "text"),
        ("smb_app_state_sync", "inbound", "text"),
        ("echo", "outbound", "text"),
        ("status", "outbound", "text"),
        ("message", "inbound", "unsupported"),
    ],
)
def test_non_live_and_unsupported_events_never_enter_bot(event, direction, message_type):
    async def handler(request: httpx.Request):
        raise AssertionError("n8n must not receive this event")

    raw = json.dumps(
        {
            "event": event,
            "direction": direction,
            "from_number_id": "pnid-7",
            "message": {"id": f"event-{event}-{message_type}", "type": message_type, "text": "old"},
        }
    ).encode()
    result = run(
        build_service(
            connections=[connection()],
            transport=httpx.MockTransport(handler),
        ).handle_message(raw, signature=signed(raw), timestamp="1778884885")
    )
    assert result["ignored"] == "non_live_or_unsupported"


def test_unknown_number_is_accepted_without_tenant_fallback():
    raw = json.dumps(
        {
            "event": "message",
            "direction": "inbound",
            "from_number_id": "other-tenant",
            "contact": {"wa_id": "5511999999999"},
            "message": {"id": "wamid.unknown", "type": "text", "text": "Oi"},
        }
    ).encode()
    result = run(build_service().handle_message(raw, signature=signed(raw), timestamp="1778884885"))
    assert result == {"accepted": True, "ignored": "unknown_number"}


def test_message_webhook_does_not_forward_for_inactive_business_link():
    async def handler(request: httpx.Request):
        raise AssertionError("inactive tenant must not reach n8n")

    raw = json.dumps(
        {
            "event": "message",
            "direction": "inbound",
            "from_number_id": "pnid-7",
            "contact": {"wa_id": "5511999999999"},
            "message": {"id": "wamid.inactive", "type": "text", "text": "Oi"},
        }
    ).encode()
    result = run(
        build_service(
            connections=[connection(status="connected")],
            links=(),
            transport=httpx.MockTransport(handler),
        ).handle_message(raw, signature=signed(raw), timestamp="1778884885")
    )
    assert result == {"accepted": True, "ignored": "inactive_tenant"}


def test_audio_is_downloaded_server_side_and_forwarded_as_bounded_base64():
    forwarded = {}

    async def handler(request: httpx.Request):
        forwarded.update(json.loads(request.content))
        return httpx.Response(200, json={"ok": True})

    raw = json.dumps(
        {
            "event": "message",
            "direction": "inbound",
            "from_number_id": "pnid-7",
            "contact": {"wa_id": "5511999999999"},
            "message": {"id": "wamid.audio", "type": "audio", "audio": {"id": "media-1"}},
        }
    ).encode()
    run(
        build_service(
            connections=[connection(status="connected")],
            transport=httpx.MockTransport(handler),
        ).handle_message(raw, signature=signed(raw), timestamp="1778884885")
    )
    assert forwarded["message"]["audio"]["base64"] == "dm9pY2U="
    assert forwarded["message"]["audio"]["mime_type"] == "audio/ogg"


def test_media_failure_is_retryable_before_n8n_forwarding():
    class FailOnceMediaClient(FakeCovercutClient):
        def __init__(self):
            self.calls = 0

        async def get_media(self, **kwargs):
            self.calls += 1
            if self.calls == 1:
                raise RuntimeError("temporary media failure")
            return b"voice", "audio/ogg"

    forwarded = []

    async def handler(request: httpx.Request):
        forwarded.append(json.loads(request.content))
        return httpx.Response(200, json={"ok": True})

    raw = json.dumps(
        {
            "event": "message",
            "direction": "inbound",
            "from_number_id": "pnid-7",
            "contact": {"wa_id": "5511999999999"},
            "message": {"id": "wamid.retry-audio", "type": "audio", "audio": {"id": "media-1"}},
        }
    ).encode()
    service = build_service(
        connections=[connection(status="connected")],
        covercut_client=FailOnceMediaClient(),
        transport=httpx.MockTransport(handler),
    )

    with pytest.raises(RuntimeError):
        run(service.handle_message(raw, signature=signed(raw), timestamp="1778884885"))
    result = run(service.handle_message(raw, signature=signed(raw), timestamp="1778884885"))

    assert result == {"accepted": True, "forwarded": True}
    assert len(forwarded) == 1


def test_older_account_status_event_cannot_overwrite_newer_status():
    item = connection(
        status="connected",
        provider_status="ACCOUNT_RECONNECTED",
        provider_metadata={"status_event_at": "2026-09-02T12:00:00+00:00"},
    )
    raw = json.dumps(
        {
            "event": "account_update",
            "from_number_id": "pnid-7",
            "id": "account-update-old",
            "account_update": {"event": "ACCOUNT_OFFBOARDED"},
        }
    ).encode()

    result = run(
        build_service(connections=[item]).handle_message(
            raw,
            signature=signed(raw),
            timestamp="2026-09-02T11:00:00+00:00",
        )
    )

    assert result == {"accepted": True, "ignored": "stale_status"}
    assert item.status == "connected"


def test_saas_webhook_reconciles_only_matching_external_account():
    item = connection(provider_connection_id="pending:beautyflow:business:7")
    raw = json.dumps(
        {
            "event": "saas_customer_connected",
            "data": {
                "sub_customer_id": 118,
                "external_id": "beautyflow:business:7",
                "waba_id": "waba-7",
                "numbers": [
                    {
                        "phone_number_id": "pnid-7",
                        "display_phone_number": "+55 11 99999-9999",
                        "status": "active",
                    }
                ],
            },
        }
    ).encode()
    service = build_service(connections=[item])
    result = run(service.handle_saas(raw, signature=signed(raw, "saas-secret"), timestamp="1778884885"))

    assert result == {"accepted": True, "connected": True}
    assert item.provider_connection_id == "pnid-7"
    assert item.business_account_id == "waba-7"
    assert item.status == "connected"


def test_saas_webhook_rejects_event_header_mismatch():
    raw = json.dumps(
        {
            "event": "saas_customer_connected",
            "data": {"external_id": "beautyflow:business:7"},
        }
    ).encode()
    with pytest.raises(CovercutWebhookPayloadError):
        run(
            build_service().handle_saas(
                raw,
                signature=signed(raw, "saas-secret"),
                timestamp="1778884885",
                event_header="another_event",
            )
        )


def test_saas_webhook_rejects_account_or_number_owned_by_another_connection():
    pending = connection(provider_connection_id="pending:beautyflow:business:7")
    other = connection(
        id=9,
        business_id=9,
        provider_connection_id="pnid-9",
        provider_account_id="999",
        external_reference="beautyflow:business:9",
    )
    raw = json.dumps(
        {
            "event": "saas_customer_connected",
            "data": {
                "sub_customer_id": 999,
                "external_id": "beautyflow:business:7",
                "numbers": [{"phone_number_id": "pnid-9"}],
            },
        }
    ).encode()
    with pytest.raises(CovercutWebhookConflictError):
        run(
            build_service(connections=[pending, other]).handle_saas(
                raw,
                signature=signed(raw, "saas-secret"),
                timestamp="1778884885",
            )
        )


def test_saas_webhook_is_idempotent_and_unknown_external_id_does_not_claim_tenant():
    item = connection(provider_connection_id="pending:beautyflow:business:7")
    event_repo = FakeEventRepository()
    raw = json.dumps(
        {
            "event": "saas_customer_connected",
            "data": {
                "sub_customer_id": 118,
                "external_id": "beautyflow:business:7",
                "numbers": [{"phone_number_id": "pnid-7"}],
            },
        }
    ).encode()
    service = build_service(connections=[item], event_repo=event_repo)

    first = run(
        service.handle_saas(raw, signature=signed(raw, "saas-secret"), timestamp="1778884885")
    )
    second = run(
        service.handle_saas(raw, signature=signed(raw, "saas-secret"), timestamp="1778884885")
    )

    assert first == {"accepted": True, "connected": True}
    assert second == {"accepted": True, "duplicate": True}

    unknown = json.dumps(
        {
            "event": "saas_customer_connected",
            "data": {
                "sub_customer_id": 999,
                "external_id": "beautyflow:business:999",
                "numbers": [{"phone_number_id": "pnid-999"}],
            },
        }
    ).encode()
    result = run(
        service.handle_saas(
            unknown,
            signature=signed(unknown, "saas-secret"),
            timestamp="1778884885",
        )
    )
    assert result == {"accepted": True, "ignored": "unknown_or_invalid_saas_event"}
    assert item.business_id == 7


def test_saas_webhook_does_not_connect_an_inactive_business_link():
    item = connection(provider_connection_id="pending:beautyflow:business:7")
    raw = json.dumps(
        {
            "event": "saas_customer_connected",
            "data": {
                "sub_customer_id": 118,
                "external_id": "beautyflow:business:7",
                "numbers": [{"phone_number_id": "pnid-7"}],
            },
        }
    ).encode()

    result = run(
        build_service(connections=[item], links=()).handle_saas(
            raw,
            signature=signed(raw, "saas-secret"),
            timestamp="1778884885",
        )
    )

    assert result == {"accepted": True, "ignored": "inactive_tenant"}
    assert item.provider_connection_id.startswith("pending:")
