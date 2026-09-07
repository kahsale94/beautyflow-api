from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from src.api.v1.contact_routes import clear_takeover, resolve_contact
from src.schemas import ContactIdentityRequest


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

    def clear(self, business_id, connection_id, contact_id):
        self.cleared.append((business_id, connection_id, contact_id))


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
