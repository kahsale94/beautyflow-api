from types import SimpleNamespace

import pytest

from src.services.contact_service import (
    ContactIdentityConflictError,
    ContactNotFoundError,
    ContactService,
)
from src.services.conversation_ownership_service import ConversationOwnershipService


class FakeDatabase:
    def flush(self):
        return None

    def commit(self):
        return None

    def rollback(self):
        return None

    def refresh(self, value):
        return None


class FakeContactRepository:
    def __init__(self):
        self.items = []

    def add(self, db, contact):
        contact.id = len(self.items) + 1
        self.items.append(contact)

    def find_by_identities(self, db, business_id, provider, **identity):
        result = []
        for contact in self.items:
            if contact.business_id != business_id:
                continue
            matches = [
                identity.get("provider_user_id") and contact.provider == provider and contact.provider_user_id == identity["provider_user_id"],
                identity.get("wa_id") and contact.provider == provider and contact.wa_id == identity["wa_id"],
                identity.get("phone") and contact.phone == identity["phone"],
                identity.get("username") and contact.provider == provider and contact.username == identity["username"],
            ]
            if any(matches):
                result.append(contact)
        return result

    def get_by_id(self, db, business_id, contact_id):
        return next((item for item in self.items if item.business_id == business_id and item.id == contact_id), None)

    def list_by_ids(self, db, business_id, contact_ids):
        return [item for item in self.items if item.business_id == business_id and item.id in contact_ids]


class FakeClientRepository:
    def __init__(self, clients=()):
        self.clients = list(clients)

    def get_by_phone(self, db, business_id, phone):
        return [item for item in self.clients if item.business_id == business_id and item.phone == phone]


class FakeConnectionRepository:
    def get_by_connection_key(self, db, key):
        return None


class FakeOwnership:
    def is_active(self, business_id, connection_id, contact_id):
        return False


def build_service(clients=()):
    repo = FakeContactRepository()
    return ContactService(
        FakeDatabase(), repo, FakeClientRepository(clients), FakeConnectionRepository(), FakeOwnership()
    ), repo


def connection(provider="covercut", connection_id=8):
    return SimpleNamespace(id=connection_id, provider=provider)


def test_bsuid_only_spontaneous_contact_is_auto_without_fake_phone():
    service, repo = build_service()
    contact = service.resolve(
        business_id=7,
        connection=connection(),
        provider_user_id="BR-stable-user-1",
    )

    assert len(repo.items) == 1
    assert contact.phone is None
    assert contact.wa_id is None
    assert contact.provider_user_id == "BR-stable-user-1"
    assert contact.bot_policy == "AUTO"


def test_synced_saved_contact_defaults_human_and_manual_override_survives_resync():
    service, _ = build_service()
    contact = service.resolve(
        business_id=7,
        connection=connection(),
        provider_user_id="BR-saved",
        username="ana",
        saved=True,
        source="covercut_sync",
    )
    assert contact.bot_policy == "HUMAN"

    service.set_policy(7, contact.id, "BOT")
    same = service.resolve(
        business_id=7,
        connection=connection(),
        provider_user_id="BR-saved",
        username="ana.updated",
        saved=True,
        source="covercut_sync",
    )
    assert same.id == contact.id
    assert same.bot_policy == "BOT"
    assert same.policy_manually_overridden is True


def test_matching_client_links_same_contact_and_defaults_bot():
    client = SimpleNamespace(id=41, business_id=7, phone="5511999999999", name="Ana")
    service, repo = build_service([client])
    contact = service.resolve(
        business_id=7,
        connection=connection(),
        provider_user_id="BR-client",
        phone="(11) 99999-9999",
        saved=True,
        source="covercut_sync",
    )
    assert len(repo.items) == 1
    assert contact.client_id == 41
    assert contact.phone == "5511999999999"
    assert contact.bot_policy == "BOT"


def test_phone_shared_later_merges_by_bsuid_instead_of_creating_client_identity():
    service, repo = build_service()
    first = service.resolve(business_id=7, connection=connection(), provider_user_id="BR-later")
    second = service.resolve(
        business_id=7,
        connection=connection(),
        provider_user_id="BR-later",
        phone="5511988887777",
    )
    assert first.id == second.id
    assert len(repo.items) == 1
    assert second.phone == "5511988887777"


def test_conflicting_identifiers_never_merge_two_contacts():
    service, _ = build_service()
    service.resolve(business_id=7, connection=connection(), provider_user_id="BR-one")
    service.resolve(business_id=7, connection=connection(), provider_user_id="BR-two", phone="5511977776666")
    with pytest.raises(ContactIdentityConflictError):
        service.resolve(
            business_id=7,
            connection=connection(),
            provider_user_id="BR-one",
            phone="5511977776666",
        )


def test_same_identity_isolated_between_businesses():
    service, repo = build_service()
    first = service.resolve(business_id=7, connection=connection(connection_id=8), provider_user_id="BR-shared")
    second = service.resolve(business_id=9, connection=connection(connection_id=10), provider_user_id="BR-shared")
    assert first.id != second.id
    assert len(repo.items) == 2


def test_policy_update_cannot_cross_business_boundary():
    service, _ = build_service()
    contact = service.resolve(
        business_id=7,
        connection=connection(),
        provider_user_id="BR.tenant-seven",
    )

    with pytest.raises(ContactNotFoundError):
        service.set_policy(9, contact.id, "HUMAN")


def test_user_id_update_is_idempotent_and_preserves_contact_policy():
    service, repo = build_service()
    contact = service.resolve(
        business_id=7,
        connection=connection(),
        provider_user_id="BR.old",
        saved=True,
    )
    service.set_policy(7, contact.id, "BOT")

    updated = service.update_provider_user_id(
        7, connection(), "BR.old", "BR.new"
    )
    repeated = service.update_provider_user_id(
        7, connection(), "BR.old", "BR.new"
    )

    assert updated.id == repeated.id == contact.id
    assert len(repo.items) == 1
    assert repeated.provider_user_id == "BR.new"
    assert repeated.bot_policy == "BOT"
    assert repeated.policy_manually_overridden is True


class FakeRedis:
    def __init__(self):
        self.values = {}
        self.deleted = []
        self.set_args = None

    def setex(self, key, ttl, value):
        self.set_args = (key, ttl, value)
        self.values[key] = value

    def exists(self, key):
        return key in self.values

    def mget(self, keys):
        return [self.values.get(key) for key in keys]

    def delete(self, *keys):
        self.deleted.extend(keys)
        for key in keys:
            self.values.pop(key, None)

    def close(self):
        return None


def test_takeover_key_is_provider_neutral_ttl_bound_and_cleans_pending_state():
    client = FakeRedis()
    ownership = ConversationOwnershipService(
        "redis://test", ttl_seconds=86400, client_factory=lambda *args, **kwargs: client
    )
    ownership.activate(
        7, 8, 9, "phone", connection_key="covercut:pnid-7", conversation_key="contact:9"
    )

    assert client.set_args == ("beautyflow_bot.v2.7.8.9.human_takeover", 86400, "phone")
    assert "beautyflow_bot.covercut:pnid-7.contact:9.state" in client.deleted
    assert "beautyflow_bot.covercut:pnid-7.contact:9.chat_buffer" in client.deleted
    assert ownership.is_active_strict(7, 8, 9) is True


def test_takeover_batch_lookup_avoids_one_redis_call_per_contact():
    client = FakeRedis()
    client.values["beautyflow_bot.v2.7.8.1.human_takeover"] = "phone"
    ownership = ConversationOwnershipService("redis://test", client_factory=lambda *args, **kwargs: client)
    assert ownership.active_map(7, [(8, 1), (8, 2)]) == {1: True, 2: False}
