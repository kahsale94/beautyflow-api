import asyncio
import json

import httpx
import pytest

from src.clients import (
    CovercutAPIError,
    CovercutAmbiguousSendError,
    CovercutClient,
    CovercutConfigurationError,
    CovercutMediaError,
    CovercutRateLimitError,
)


def run(coroutine):
    return asyncio.run(coroutine)


def test_covercut_client_sends_text_with_server_credentials_and_explicit_from():
    captured = {}

    async def handler(request: httpx.Request):
        captured["headers"] = dict(request.headers)
        captured["payload"] = json.loads(request.content)
        return httpx.Response(200, json={"success": True, "message_id": "wamid.1"})

    client = CovercutClient(
        "https://api.covercut.example/api/v1",
        "api-key",
        "api-secret",
        transport=httpx.MockTransport(handler),
    )
    payload = run(
        client.send_text(
            phone_number_id="phone-number-id",
            to="5511999999999",
            text="Olá",
        )
    )

    assert payload["message_id"] == "wamid.1"
    assert captured["headers"]["x-api-key"] == "api-key"
    assert captured["headers"]["x-api-secret"] == "api-secret"
    assert captured["payload"] == {
        "from": "phone-number-id",
        "to": "5511999999999",
        "type": "text",
        "text": {"body": "Olá"},
        "agent_name": "Beautyflow",
    }


def test_covercut_client_sends_template_with_ordered_parameters():
    captured = {}

    async def handler(request: httpx.Request):
        captured["path"] = request.url.path
        captured["payload"] = json.loads(request.content)
        return httpx.Response(200, json={"success": True, "message_id": "wamid.tpl"})

    client = CovercutClient("https://api.example/v1", "key", "secret", transport=httpx.MockTransport(handler))
    run(
        client.send_template(
            phone_number_id="pnid",
            to="5511999999999",
            name="appointment_reminder",
            language="pt_BR",
            body_parameters=["Ana", "Beautyflow"],
        )
    )

    assert captured["path"] == "/v1/messages/template"
    assert captured["payload"]["from"] == "pnid"
    assert captured["payload"]["template"]["components"][0]["parameters"] == [
        {"type": "text", "text": "Ana"},
        {"type": "text", "text": "Beautyflow"},
    ]


@pytest.mark.parametrize("status", [400, 401, 500])
def test_covercut_client_classifies_http_errors_without_secret_leak(status):
    async def handler(request: httpx.Request):
        return httpx.Response(
            status,
            json={"success": False, "error": "invalid api-secret", "code": "BAD_REQUEST"},
        )

    client = CovercutClient("https://api.example/v1", "key", "api-secret", transport=httpx.MockTransport(handler))
    with pytest.raises(CovercutAPIError) as caught:
        run(client.send_text(phone_number_id="pnid", to="5511999999999", text="Oi"))

    assert caught.value.status_code == status
    assert "api-secret" not in str(caught.value)


def test_covercut_client_exposes_multiple_numbers_code_but_not_available_numbers():
    async def handler(request: httpx.Request):
        return httpx.Response(
            400,
            json={
                "success": False,
                "error": "from obrigatório",
                "code": "MULTIPLE_NUMBERS",
                "numbers": [{"phone_number_id": "other-tenant-number"}],
            },
        )

    client = CovercutClient("https://api.example/v1", "key", "secret", transport=httpx.MockTransport(handler))
    with pytest.raises(CovercutAPIError) as caught:
        run(client.send_text(phone_number_id="pnid", to="5511999999999", text="Oi"))

    assert caught.value.code == "MULTIPLE_NUMBERS"
    assert "other-tenant-number" not in str(caught.value)


def test_covercut_client_retries_rate_limit_only_for_safe_read():
    calls = 0

    async def handler(request: httpx.Request):
        nonlocal calls
        calls += 1
        if calls < 3:
            return httpx.Response(429, json={"error": "rate limited"})
        return httpx.Response(200, json={"success": True, "data": {"status": "CONNECTED"}})

    client = CovercutClient("https://api.example/v1", "key", "secret", transport=httpx.MockTransport(handler))
    payload = run(client.get_number_status(phone_number_id="pnid"))

    assert calls == 3
    assert payload["data"]["status"] == "CONNECTED"


def test_covercut_client_does_not_retry_message_send_on_ambiguous_timeout():
    calls = 0

    async def handler(request: httpx.Request):
        nonlocal calls
        calls += 1
        raise httpx.ReadTimeout("timed out", request=request)

    client = CovercutClient("https://api.example/v1", "key", "secret", transport=httpx.MockTransport(handler))
    with pytest.raises(CovercutAmbiguousSendError):
        run(client.send_text(phone_number_id="pnid", to="5511999999999", text="Oi"))
    assert calls == 1


def test_covercut_client_rejects_invalid_json_and_unconfigured_client():
    async def handler(request: httpx.Request):
        return httpx.Response(200, content=b"not-json")

    client = CovercutClient("https://api.example/v1", "key", "secret", transport=httpx.MockTransport(handler))
    with pytest.raises(CovercutAPIError) as caught:
        run(client.get_number_status(phone_number_id="pnid"))
    assert caught.value.status_code == 502

    with pytest.raises(CovercutConfigurationError):
        run(CovercutClient(None, None, None).get_number_status(phone_number_id="pnid"))


def test_covercut_client_rate_limit_remains_typed_after_bounded_retries():
    async def handler(request: httpx.Request):
        return httpx.Response(429, json={"error": "rate limited"})

    client = CovercutClient("https://api.example/v1", "key", "secret", transport=httpx.MockTransport(handler))
    with pytest.raises(CovercutRateLimitError):
        run(client.get_number_status(phone_number_id="pnid"))


def test_covercut_media_is_scoped_and_bounded():
    captured = {}

    async def handler(request: httpx.Request):
        captured["params"] = dict(request.url.params)
        return httpx.Response(200, content=b"audio", headers={"content-type": "audio/ogg"})

    client = CovercutClient("https://api.example/v1", "key", "secret", transport=httpx.MockTransport(handler))
    content, mime_type = run(
        client.get_media(phone_number_id="pnid", media_id="media-1", max_bytes=10)
    )
    assert content == b"audio"
    assert mime_type == "audio/ogg"
    assert captured["params"] == {"id": "media-1", "from": "pnid", "mode": "stream"}

    with pytest.raises(CovercutMediaError):
        run(client.get_media(phone_number_id="pnid", media_id="media-1", max_bytes=3))
