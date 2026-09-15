from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from src.api.v1.contact_routes import append_conversation_buffer, append_conversation_memory, clear_takeover, maintain_conversation_memory, resolve_contact
from src.schemas import ContactBufferAppendRequest, ContactIdentityRequest, ContactMemoryAppendRequest


class FakeConnectionRepository:
    def __init__(self, connection):
        self.connection = connection

    def get_by_business(self, db, business_id, integration_id):
        if (
            self.connection.business_id == business_id
            and self.connection.integration_id == integration_id
        ):
            return self.connection
        return None


class FakeOwnership:
    def __init__(self):
        self.cleared = []

    def clear(self, business_id, connection_id, contact_id, **kwargs):
        self.cleared.append((business_id, connection_id, contact_id, kwargs))

    def append_buffer(self, connection_key, conversation_key, message):
        self.appended = (connection_key, conversation_key, message)

    def append_history(self, connection_key, conversation_key, message):
        self.history_appended = (connection_key, conversation_key, message)

    def maintain_history(self, connection_key, conversation_key):
        self.history_maintained = (connection_key, conversation_key)


class FakeService:
    def __init__(self, connection):
        self.db = object()
        self.connection_repo = FakeConnectionRepository(connection)
        self.ownership = FakeOwnership()
        self.connection = connection
        self.contact = SimpleNamespace(
            id=31,
            business_id=7,
            whatsapp_connection_id=connection.id,
        )

    def require_connection(self, business_id, connection_key):
        assert business_id == 7
        return self.connection

    def get(self, business_id, contact_id):
        assert business_id == 7
        assert contact_id == 31
        return self.contact


def test_n8n_contact_resolution_rejects_another_integration_connection():
    connection = SimpleNamespace(
        id=4,
        business_id=7,
        integration_id=99,
        provider="covercut",
    )
    service = FakeService(connection)

    with pytest.raises(HTTPException) as exc:
        resolve_contact(
            ContactIdentityRequest(
                connection_key="covercut:pnid-7",
                provider_user_id="BR.31",
            ),
            SimpleNamespace(business_id=7, integration_id=3),
            service,
        )

    assert exc.value.status_code == 404


def test_n8n_clear_takeover_rechecks_integration_scope():
    connection = SimpleNamespace(
        id=4,
        business_id=7,
        integration_id=99,
        provider="covercut",
    )
    service = FakeService(connection)

    with pytest.raises(HTTPException) as exc:
        clear_takeover(
            31,
            SimpleNamespace(business_id=7, integration_id=3),
            service,
        )

    assert exc.value.status_code == 409
    assert service.ownership.cleared == []


def test_resolve_fails_closed_when_ownership_store_is_unavailable():
    connection = SimpleNamespace(
        id=4,
        business_id=7,
        integration_id=3,
        provider="covercut",
    )
    service = FakeService(connection)
    service.resolve = lambda **kwargs: service.contact
    service.ownership_result = lambda contact, scoped_connection: (_ for _ in ()).throw(
        RuntimeError("redis unavailable")
    )

    with pytest.raises(HTTPException) as exc:
        resolve_contact(
            ContactIdentityRequest(connection_key="covercut:pnid-7", provider_user_id="BR.31"),
            SimpleNamespace(business_id=7, integration_id=3),
            service,
        )

    assert exc.value.status_code == 503


def test_conversation_buffer_append_is_contact_and_connection_scoped():
    connection = SimpleNamespace(
        id=4,
        business_id=7,
        integration_id=3,
        provider="covercut",
        connection_key="covercut:pnid-7",
    )
    service = FakeService(connection)

    response = append_conversation_buffer(
        31,
        ContactBufferAppendRequest(message="Olá"),
        SimpleNamespace(business_id=7, integration_id=3),
        service,
    )

    assert response.status_code == 204
    assert service.ownership.appended == ("covercut:pnid-7", "contact:31", "Olá")


def test_conversation_memory_append_is_contact_scoped():
    connection = SimpleNamespace(
        id=4,
        business_id=7,
        integration_id=3,
        provider="covercut",
        connection_key="covercut:pnid-7",
    )
    service = FakeService(connection)

    response = append_conversation_memory(
        31,
        ContactMemoryAppendRequest(message='{"type":"human"}'),
        SimpleNamespace(business_id=7, integration_id=3),
        service,
    )

    assert response.status_code == 204
    assert service.ownership.history_appended == (
        "covercut:pnid-7",
        "contact:31",
        '{"type":"human"}',
    )


def test_conversation_memory_maintenance_is_contact_scoped():
    connection = SimpleNamespace(
        id=4,
        business_id=7,
        integration_id=3,
        provider="covercut",
        connection_key="covercut:pnid-7",
    )
    service = FakeService(connection)

    response = maintain_conversation_memory(
        31,
        SimpleNamespace(business_id=7, integration_id=3),
        service,
    )

    assert response.status_code == 204
    assert service.ownership.history_maintained == ("covercut:pnid-7", "contact:31")
