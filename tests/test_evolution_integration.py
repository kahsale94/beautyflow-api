import asyncio
import json
from pathlib import Path
from types import SimpleNamespace

import httpx

from src.clients import EvolutionAPIError, EvolutionClient
from src.services.evolution_instance_service import EvolutionInstanceService


ROOT = Path(__file__).resolve().parents[1]


def test_evolution_client_configures_authenticated_message_webhook():
    captured = {"requests": []}

    async def handler(request: httpx.Request):
        captured["requests"].append(
            {
                "method": request.method,
                "path": request.url.path,
                "apikey": request.headers.get("apikey"),
                "payload": json.loads(request.content) if request.content else None,
            }
        )
        if request.url.path == "/":
            return httpx.Response(200, json={"version": "2.3.7"})
        return httpx.Response(200, json={"success": True})

    client = EvolutionClient(
        "https://evolution.example.com",
        "secret-key",
        transport=httpx.MockTransport(handler),
    )

    asyncio.run(
        client.set_webhook(
            "beautyflow-n8n-atendimento-teste-7",
            "https://n8n.example.com/webhook/beauty-api",
            "X-Beautyflow-Webhook-Secret",
            "webhook-secret",
        )
    )

    assert captured["requests"][0]["path"] == "/"
    webhook_request = captured["requests"][1]
    assert webhook_request["method"] == "POST"
    assert webhook_request["path"] == "/webhook/set/beautyflow-n8n-atendimento-teste-7"
    assert webhook_request["apikey"] == "secret-key"
    assert webhook_request["payload"] == {
        "webhook": {
            "enabled": True,
            "url": "https://n8n.example.com/webhook/beauty-api",
            "events": ["MESSAGES_UPSERT"],
            "headers": {"X-Beautyflow-Webhook-Secret": "webhook-secret"},
            "base64": True,
            "webhookByEvents": False,
        }
    }

def test_evolution_client_uses_flat_webhook_contract_for_v3():
    captured = {}

    async def handler(request: httpx.Request):
        if request.url.path == "/":
            return httpx.Response(200, json={"version": "3.0.0"})
        captured["payload"] = json.loads(request.content)
        return httpx.Response(200, json={"success": True})

    client = EvolutionClient(
        "https://evolution.example.com",
        "secret-key",
        transport=httpx.MockTransport(handler),
    )

    asyncio.run(
        client.set_webhook(
            "beautyflow-n8n-atendimento-teste-7",
            "https://n8n.example.com/webhook/beauty-api",
            "X-Beautyflow-Webhook-Secret",
            "webhook-secret",
        )
    )

    assert captured["payload"] == {
        "enabled": True,
        "url": "https://n8n.example.com/webhook/beauty-api",
        "events": ["MESSAGES_UPSERT"],
        "headers": {"X-Beautyflow-Webhook-Secret": "webhook-secret"},
        "base64": True,
    }

def test_evolution_client_fetches_instance_details_by_name():
    captured = {}

    async def handler(request: httpx.Request):
        captured["path"] = request.url.path
        captured["params"] = dict(request.url.params)
        return httpx.Response(
            200,
            json=[
                {
                    "name": "beautyflow-n8n-atendimento-teste-7",
                    "connectionStatus": "open",
                    "ownerJid": "5511999999999@s.whatsapp.net",
                }
            ],
        )

    client = EvolutionClient(
        "https://evolution.example.com",
        "secret-key",
        transport=httpx.MockTransport(handler),
    )

    payload = asyncio.run(
        client.fetch_instances(instance_name="beautyflow-n8n-atendimento-teste-7")
    )

    assert captured["path"] == "/instance/fetchInstances"
    assert captured["params"] == {"instanceName": "beautyflow-n8n-atendimento-teste-7"}
    assert payload[0]["ownerJid"] == "5511999999999@s.whatsapp.net"

def test_production_requires_evolution_configuration():
    config_source = (ROOT / "src/core/config.py").read_text(encoding="utf-8")

    assert '"EVOLUTION_API_URL": EVOLUTION_API_URL' in config_source
    assert '"EVOLUTION_API_KEY": EVOLUTION_API_KEY' in config_source
    assert '"EVOLUTION_WEBHOOK_URL": EVOLUTION_WEBHOOK_URL' in config_source
    assert "Evolution API obrigatória em produção" in config_source

def test_evolution_client_raises_typed_error_without_exposing_key():
    async def handler(request: httpx.Request):
        return httpx.Response(401, json={"message": "invalid api key"})

    client = EvolutionClient(
        "https://evolution.example.com",
        "secret-key",
        transport=httpx.MockTransport(handler),
    )

    try:
        asyncio.run(client.connection_state("beautyflow-n8n-atendimento-teste-7"))
    except EvolutionAPIError as exc:
        assert exc.status_code == 401
        assert "secret-key" not in str(exc)
    else:
        raise AssertionError("EvolutionAPIError was not raised")

class FakeDatabase:

    def add(self, value):
        return None

    def delete(self, value):
        return None

    def commit(self):
        return None

    def rollback(self):
        return None

    def refresh(self, value):
        return None

class FakeBusinessIntegrationRepository:

    def get_by_ids(self, db, business_id, integration_id):
        if business_id == 7 and integration_id == 3:
            return SimpleNamespace(business=SimpleNamespace(slug="n8n-atendimento-teste"))
        return None

class FakeEvolutionInstanceRepository:

    def __init__(self):
        self.instance = None

    def add(self, db, instance):
        self.instance = instance

    def delete(self, db, instance):
        self.instance = None

    def get_by_business(self, db, business_id):
        if self.instance and self.instance.business_id == business_id:
            return self.instance
        return None

class FakeEvolutionClient:

    configured = True

    def __init__(self):
        self.webhook = None

    async def connection_state(self, instance_name):
        raise EvolutionAPIError(404, "not found")

    async def create_instance(self, instance_name):
        return {
            "instance": {
                "instanceName": instance_name,
                "instanceId": "remote-id",
                "status": "connecting",
            },
            "qrcode": {
                "base64": "data:image/png;base64,abc",
                "pairingCode": None,
            },
        }

    async def set_webhook(self, instance_name, webhook_url, webhook_header, webhook_secret):
        self.webhook = (instance_name, webhook_url, webhook_header, webhook_secret)
        return {"success": True}

    async def connect_instance(self, instance_name):
        raise AssertionError("create response already contains a QR code")

class FakeOpenEvolutionClient:

    configured = True

    def __init__(self):
        self.fetched_instance_name = None

    async def connection_state(self, instance_name):
        return {
            "instance": {
                "instanceName": instance_name,
                "state": "open",
            }
        }

    async def fetch_instances(self, instance_name=None, instance_id=None, number=None):
        self.fetched_instance_name = instance_name
        return [
            {
                "name": instance_name,
                "connectionStatus": "open",
                "ownerJid": "5511999999999@s.whatsapp.net",
                "number": None,
            }
        ]

def test_evolution_provisioning_is_deterministic_and_persists_remote_state():
    repository = FakeEvolutionInstanceRepository()
    client = FakeEvolutionClient()
    service = EvolutionInstanceService(
        FakeDatabase(),
        FakeBusinessIntegrationRepository(),
        repository,
        client,
        "Beauty Flow Production",
        "https://n8n.example.com/webhook/beauty-api",
        "X-Beautyflow-Webhook-Secret",
        "webhook-secret",
    )

    result = asyncio.run(service.provision(7, 3))

    assert result.instance_name == "beauty-flow-production-n8n-atendimento-teste-7"
    assert result.state == "connecting"
    assert result.qr_code == "data:image/png;base64,abc"
    assert repository.instance.instance_id == "remote-id"
    assert repository.instance.state == "connecting"
    assert client.webhook == (
        "beauty-flow-production-n8n-atendimento-teste-7",
        "https://n8n.example.com/webhook/beauty-api",
        "X-Beautyflow-Webhook-Secret",
        "webhook-secret",
    )

def test_evolution_refresh_status_persists_connected_phone_from_instance_details():
    repository = FakeEvolutionInstanceRepository()
    repository.instance = SimpleNamespace(
        business_id=7,
        integration_id=3,
        instance_name="beautyflow-n8n-atendimento-teste-7",
        phone=None,
        state="connecting",
        connected_at=None,
    )
    client = FakeOpenEvolutionClient()
    service = EvolutionInstanceService(
        FakeDatabase(),
        FakeBusinessIntegrationRepository(),
        repository,
        client,
        "beautyflow",
        "https://n8n.example.com/webhook/beauty-api",
        "X-Beautyflow-Webhook-Secret",
        "webhook-secret",
    )

    result = asyncio.run(service.refresh_status(7, 3))

    assert result.state == "open"
    assert result.phone == "5511999999999"
    assert repository.instance.phone == "5511999999999"
    assert client.fetched_instance_name == "beautyflow-n8n-atendimento-teste-7"

def test_admin_and_workflow_use_instance_based_onboarding_contract():
    admin_template = open(
        "src/templates/admin/integrations/index.html",
        encoding="utf-8",
    ).read()
    workflow = open(
        "workflows/main agent_HH6KPg5o.workflow.ts",
        encoding="utf-8",
    ).read()

    assert 'data-evolution-action="connect"' in admin_template
    assert "data-evolution-qr-image" in admin_template
    assert "X-Evolution-Instance" in workflow
    assert "data handler').item.json.evo.instance" in workflow
