import asyncio
from types import SimpleNamespace

from src.admin.routes import contacts as routes


def run(coroutine):
    return asyncio.run(coroutine)


class FakeForm(dict):
    def getlist(self, key):
        value = self.get(key, [])
        return value if isinstance(value, list) else [value]


class FakeRequest:
    def __init__(self, form=None):
        self._form = FakeForm(form or {})

    async def form(self):
        return self._form


class FakeContactRepository:
    def __init__(self, contacts):
        self.contacts = contacts
        self.calls = []

    def list_page(self, db, business_id, **filters):
        self.calls.append((business_id, filters))
        return self.contacts, len(self.contacts)


class FakeOwnership:
    def __init__(self):
        self.map_calls = []
        self.clear_calls = []

    def active_map(self, business_id, identities):
        self.map_calls.append((business_id, identities))
        return {contact_id: False for _, contact_id in identities}

    def clear(self, business_id, connection_id, contact_id):
        self.clear_calls.append((business_id, connection_id, contact_id))


class FakeContactService:
    POLICIES = {"BOT", "HUMAN", "AUTO"}

    def __init__(self, contacts=None):
        self.contact_repo = FakeContactRepository(contacts or [])
        self.ownership = FakeOwnership()
        self.db = object()
        self.policy_calls = []
        self.bulk_calls = []
        self.contact = SimpleNamespace(id=31, whatsapp_connection_id=4)

    def set_policy(self, business_id, contact_id, policy):
        self.policy_calls.append((business_id, contact_id, policy))

    def set_policy_bulk(self, business_id, contact_ids, policy):
        self.bulk_calls.append((business_id, contact_ids, policy))
        return len(contact_ids)

    def get(self, business_id, contact_id):
        assert business_id == 7
        assert contact_id == 31
        return self.contact


def _stub_mutation_helpers(monkeypatch):
    csrf_requests = []

    async def fake_validate_csrf(request):
        csrf_requests.append(request)

    monkeypatch.setattr(routes, "validate_csrf", fake_validate_csrf)
    monkeypatch.setattr(
        routes,
        "redirect_with_flash",
        lambda url, message, *args, **kwargs: {"url": url, "message": message},
    )
    return csrf_requests


def test_contacts_page_is_sql_paginated_tenant_scoped_and_batches_takeover(monkeypatch):
    contacts = [
        SimpleNamespace(id=31, whatsapp_connection_id=4),
        SimpleNamespace(id=32, whatsapp_connection_id=None),
    ]
    service = FakeContactService(contacts)
    captured = {}
    monkeypatch.setattr(routes, "render", lambda request, template, context, **kwargs: captured.update(context) or context)

    routes.contacts_page(
        object(), service, SimpleNamespace(business_id=7),
        q="ana", policy="HUMAN", provider="covercut", saved="yes", page=2,
    )

    assert service.contact_repo.calls == [(7, {
        "page": 2, "page_size": 50, "query": "ana", "policy": "HUMAN",
        "provider": "covercut", "saved": True,
    })]
    assert service.ownership.map_calls == [(7, [(4, 31)])]
    assert captured["contacts"] == contacts


def test_contact_admin_policy_bulk_and_resume_use_session_tenant_and_csrf(monkeypatch):
    csrf_requests = _stub_mutation_helpers(monkeypatch)
    service = FakeContactService()
    session = SimpleNamespace(business_id=7)
    policy_request = FakeRequest({"policy": "HUMAN"})
    bulk_request = FakeRequest({"policy": "BOT", "contact_ids": ["31", "32"]})
    resume_request = FakeRequest()

    run(routes.update_policy(31, policy_request, service, session))
    run(routes.bulk_policy(bulk_request, service, session))
    run(routes.resume_bot(31, resume_request, service, session))

    assert csrf_requests == [policy_request, bulk_request, resume_request]
    assert service.policy_calls == [(7, 31, "HUMAN")]
    assert service.bulk_calls == [(7, [31, 32], "BOT")]
    assert service.ownership.clear_calls == [(7, 4, 31)]


def test_contact_sync_uses_session_tenant_and_csrf(monkeypatch):
    csrf_requests = _stub_mutation_helpers(monkeypatch)

    class FakeConnectionService:
        def __init__(self):
            self.calls = []

        async def request_contact_sync(self, business_id):
            self.calls.append(business_id)

    service = FakeConnectionService()
    request = FakeRequest()
    run(routes.sync_contacts(request, service, SimpleNamespace(business_id=7)))

    assert csrf_requests == [request]
    assert service.calls == [7]
