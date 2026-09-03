import asyncio
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from src.admin.routes import integrations as routes
from src.services.whatsapp_connection_service import (
    WhatsAppConnectionNotFoundError,
    WhatsAppProviderUnavailableError,
)


class FakeResult:
    def as_dict(self):
        return {
            "provider": "covercut",
            "connection_key": "covercut:pnid-7",
            "status": "connected",
        }


class FakeWhatsAppService:
    def __init__(self, error=None):
        self.error = error
        self.calls = []

    async def provision(self, business_id, integration_id):
        self.calls.append(("connect", business_id, integration_id))
        if self.error:
            raise self.error
        return FakeResult()

    async def refresh_status(self, business_id, integration_id):
        self.calls.append(("status", business_id, integration_id))
        if self.error:
            raise self.error
        return FakeResult()

    async def disconnect(self, business_id, integration_id):
        self.calls.append(("disconnect", business_id, integration_id))
        if self.error:
            raise self.error
        return FakeResult()

    async def remove(self, business_id, integration_id):
        self.calls.append(("remove", business_id, integration_id))
        if self.error:
            raise self.error


def run(coroutine):
    return asyncio.run(coroutine)


def test_admin_connect_uses_session_tenant_and_validates_csrf(monkeypatch):
    csrf_requests = []

    async def fake_validate_csrf(request):
        csrf_requests.append(request)

    monkeypatch.setattr(routes, "validate_csrf", fake_validate_csrf)
    service = FakeWhatsAppService()
    request = object()

    result = run(
        routes.connect_whatsapp_action(
            3,
            request,
            service,
            SimpleNamespace(business_id=7),
        )
    )

    assert result["connection_key"] == "covercut:pnid-7"
    assert service.calls == [("connect", 7, 3)]
    assert csrf_requests == [request]


def test_admin_status_and_disconnect_remain_scoped_to_session(monkeypatch):
    async def fake_validate_csrf(request):
        return None

    monkeypatch.setattr(routes, "validate_csrf", fake_validate_csrf)
    service = FakeWhatsAppService()
    session = SimpleNamespace(business_id=7)

    run(routes.whatsapp_status_action(3, service, session))
    run(routes.logout_whatsapp_action(3, object(), service, session))

    assert service.calls == [("status", 7, 3), ("disconnect", 7, 3)]


@pytest.mark.parametrize(
    ("error", "status_code"),
    [
        (WhatsAppProviderUnavailableError("covercut"), 503),
        (WhatsAppConnectionNotFoundError(), 404),
    ],
)
def test_admin_maps_provider_configuration_and_tenant_errors(monkeypatch, error, status_code):
    async def fake_validate_csrf(request):
        return None

    monkeypatch.setattr(routes, "validate_csrf", fake_validate_csrf)
    service = FakeWhatsAppService(error=error)

    with pytest.raises(HTTPException) as exc:
        run(
            routes.connect_whatsapp_action(
                3,
                object(),
                service,
                SimpleNamespace(business_id=7),
            )
        )

    assert exc.value.status_code == status_code


def test_admin_remove_requires_csrf_and_never_accepts_a_frontend_business_id(monkeypatch):
    csrf_calls = 0

    async def fake_validate_csrf(request):
        nonlocal csrf_calls
        csrf_calls += 1

    monkeypatch.setattr(routes, "validate_csrf", fake_validate_csrf)
    service = FakeWhatsAppService()

    result = run(
        routes.remove_whatsapp_action(
            3,
            object(),
            service,
            SimpleNamespace(business_id=7),
        )
    )

    assert result == {"removed": True}
    assert service.calls == [("remove", 7, 3)]
    assert csrf_calls == 1
