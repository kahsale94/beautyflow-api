import asyncio
from types import SimpleNamespace

import pytest

from src.clients import CovercutAmbiguousSendError
from src.providers import CovercutWhatsAppProvider, WhatsAppOperationContext, normalize_connection_status
from src.services.messaging_service import (
    MessagingService,
    WhatsAppMessagingTenantError,
    WhatsAppMessagingUnavailableError,
)
from src.services.whatsapp_connection_service import WhatsAppConnectionService


def run(coroutine):
    return asyncio.run(coroutine)


class FakeCovercutClient:
    configured = True

    def __init__(self):
        self.sent = None
        self.template_sent = None
        self.error = None

    async def create_saas_account(self, *, company_name, external_id):
        return {
            "success": True,
            "sub_customer_id": 118,
            "external_id": external_id,
            "direct_link": "https://api.covercut.example/conectar.php?token=opaque",
            "reused_existing": True,
        }

    async def send_text(self, *, phone_number_id, to, text):
        if self.error:
            raise self.error
        self.sent = (phone_number_id, to, text)
        return {"message_id": "wamid.1"}

    async def send_template(self, *, phone_number_id, to, name, language, body_parameters):
        self.template_sent = (phone_number_id, to, name, language, list(body_parameters))
        return {"data": {"message_id": "wamid.template"}}


class FakeConnectionRepository:
    def __init__(self, connection):
        self.connection = connection

    def get_by_business(self, db, business_id, integration_id):
        if (
            self.connection
            and self.connection.business_id == business_id
            and self.connection.integration_id == integration_id
        ):
            return self.connection
        return None


@pytest.mark.parametrize(
    ("raw", "normalized"),
    [
        ("open", "connected"),
        ("CONNECTED", "connected"),
        ("active", "connected"),
        ("creating", "connecting"),
        ("suspended", "disconnected"),
        ("unexpected", "error"),
    ],
)
def test_statuses_are_normalized_across_providers(raw, normalized):
    assert normalize_connection_status("covercut", raw) == normalized


def test_persisted_connection_provider_overrides_provisioning_default_and_config():
    service = WhatsAppConnectionService(
        None,
        SimpleNamespace(),
        SimpleNamespace(),
        {},
        {"evolution", "covercut"},
        "covercut",
        "beautyflow-staging",
    )
    link = SimpleNamespace(config={"whatsapp_provider": "covercut"})

    assert service._provider_name(link, None) == "covercut"
    assert service._provider_name(link, SimpleNamespace(provider="evolution")) == "evolution"


def test_covercut_provider_uses_idempotent_external_reference_for_onboarding():
    provider = CovercutWhatsAppProvider(FakeCovercutClient())
    result = run(
        provider.start_connection(
            WhatsAppOperationContext(
                business_id=7,
                integration_id=3,
                business_name="Salão da Ana",
                external_reference="beautyflow:business:7",
            )
        )
    )

    assert result.provider == "covercut"
    assert result.provider_connection_id == "pending:beautyflow:business:7"
    assert result.provider_account_id == "118"
    assert result.metadata == {"reused_existing": True}
    assert "opaque" in result.onboarding_url


def test_messaging_resolves_provider_connection_inside_business_scope():
    client = FakeCovercutClient()
    provider = CovercutWhatsAppProvider(client)
    item = SimpleNamespace(
        id=4,
        business_id=7,
        integration_id=3,
        provider="covercut",
        provider_connection_id="pnid-business-7",
        status="connected",
    )
    service = MessagingService(None, FakeConnectionRepository(item), {"covercut": provider})
    result = run(
        service.send_text(
            7,
            3,
            to="(11) 99999-9999",
            text="Olá",
        )
    )

    assert result.external_message_id == "wamid.1"
    assert client.sent == ("pnid-business-7", "5511999999999", "Olá")

    with pytest.raises(WhatsAppMessagingTenantError):
        run(service.send_text(9, 3, to="11999999999", text="Não enviar"))


def test_messaging_template_uses_scoped_source_and_captures_external_id():
    client = FakeCovercutClient()
    provider = CovercutWhatsAppProvider(client)
    item = SimpleNamespace(
        id=4,
        business_id=7,
        integration_id=3,
        provider="covercut",
        provider_connection_id="pnid-business-7",
        status="connected",
    )
    service = MessagingService(None, FakeConnectionRepository(item), {"covercut": provider})

    result = run(
        service.send_template(
            7,
            3,
            to="(11) 99999-9999",
            name="appointment_reminder",
            language="pt_BR",
            body_parameters=["Joana", "Salão"],
        )
    )

    assert result.external_message_id == "wamid.template"
    assert client.template_sent == (
        "pnid-business-7",
        "5511999999999",
        "appointment_reminder",
        "pt_BR",
        ["Joana", "Salão"],
    )


def test_messaging_rejects_disconnected_and_preserves_ambiguous_send():
    item = SimpleNamespace(
        id=4,
        business_id=7,
        integration_id=3,
        provider="covercut",
        provider_connection_id="pnid-business-7",
        status="disconnected",
    )
    client = FakeCovercutClient()
    provider = CovercutWhatsAppProvider(client)
    service = MessagingService(None, FakeConnectionRepository(item), {"covercut": provider})

    with pytest.raises(WhatsAppMessagingUnavailableError):
        run(service.send_text(7, 3, to="11999999999", text="Não enviar"))

    item.status = "connected"
    client.error = CovercutAmbiguousSendError(503, "indeterminate")
    with pytest.raises(CovercutAmbiguousSendError):
        run(service.send_text(7, 3, to="11999999999", text="Uma tentativa"))


def test_connection_model_enforces_one_business_and_provider_identity():
    from src.models import WhatsAppConnection

    constraint_names = {constraint.name for constraint in WhatsAppConnection.__table__.constraints}
    index_names = {index.name for index in WhatsAppConnection.__table__.indexes}

    assert "uq_whatsapp_connection_business" in constraint_names
    assert "uq_whatsapp_connection_provider_identifier" in constraint_names
    assert "uq_whatsapp_connection_provider_reference" in constraint_names
    assert "ix_whatsapp_connections_business_id" in index_names
