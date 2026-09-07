from datetime import datetime, timezone

from sqlalchemy.exc import IntegrityError

from src.core import DataBaseDep
from src.models import Contact
from src.repositories import ClientRepository, ContactRepository, WhatsAppConnectionRepository
from src.services.conversation_ownership_service import ConversationOwnershipService
from src.utils import normalize_phone


class ContactNotFoundError(Exception):
    pass


class ContactIdentityConflictError(Exception):
    pass


class ContactConnectionError(Exception):
    pass


class ContactService:
    POLICIES = {"BOT", "HUMAN", "AUTO"}

    def __init__(self, db, contact_repo, client_repo, connection_repo, ownership):
        self.db = db
        self.contact_repo = contact_repo
        self.client_repo = client_repo
        self.connection_repo = connection_repo
        self.ownership = ownership

    @staticmethod
    def _clean(value, limit: int = 191) -> str | None:
        result = str(value or "").strip()
        return result[:limit] or None

    @staticmethod
    def _phone(value) -> str | None:
        raw = str(value or "").strip()
        if not raw:
            return None
        try:
            return normalize_phone(raw)
        except ValueError:
            return None

    def require_connection(self, business_id: int, connection_key: str):
        connection = self.connection_repo.get_by_connection_key(self.db, connection_key)
        if not connection or connection.business_id != business_id:
            raise ContactConnectionError()
        return connection

    def resolve(
        self, *, business_id: int, connection, provider_user_id=None,
        parent_provider_user_id=None, wa_id=None, phone=None, username=None,
        name=None, saved: bool = False, source: str = "inbound", commit: bool = True,
    ) -> Contact:
        provider = self._clean(connection.provider, 32)
        provider_user_id = self._clean(provider_user_id)
        parent_provider_user_id = self._clean(parent_provider_user_id)
        wa_id = self._phone(wa_id)
        phone = self._phone(phone) or wa_id
        username = self._clean(username)
        name = self._clean(name, 255)
        if not any((provider_user_id, wa_id, phone, username)):
            raise ValueError("Contato sem identidade utilizável.")

        matches = self.contact_repo.find_by_identities(
            self.db, business_id, provider,
            provider_user_id=provider_user_id, wa_id=wa_id, phone=phone,
            username=username, for_update=True,
        )
        unique_matches = {item.id: item for item in matches}
        if len(unique_matches) > 1:
            raise ContactIdentityConflictError()
        contact = next(iter(unique_matches.values()), None)
        clients = self.client_repo.get_by_phone(self.db, business_id, phone) if phone else []
        client = clients[0] if clients else None
        now = datetime.now(timezone.utc)

        if contact is None:
            contact = Contact(
                business_id=business_id,
                client_id=getattr(client, "id", None),
                whatsapp_connection_id=connection.id,
                provider=provider,
                provider_user_id=provider_user_id,
                parent_provider_user_id=parent_provider_user_id,
                wa_id=wa_id,
                phone=phone,
                username=username,
                name=name or getattr(client, "name", None),
                source="client" if client else source,
                is_saved=saved,
                bot_policy="BOT" if client else ("HUMAN" if saved else "AUTO"),
                policy_manually_overridden=False,
                last_seen_at=now if source == "inbound" else None,
                synced_at=now if saved else None,
            )
            self.contact_repo.add(self.db, contact)
        else:
            contact.whatsapp_connection_id = connection.id
            contact.provider = provider
            contact.provider_user_id = provider_user_id or contact.provider_user_id
            contact.parent_provider_user_id = parent_provider_user_id or contact.parent_provider_user_id
            contact.wa_id = wa_id or contact.wa_id
            contact.phone = phone or contact.phone
            contact.username = username or contact.username
            contact.name = name or contact.name or getattr(client, "name", None)
            contact.is_saved = contact.is_saved or saved
            contact.last_seen_at = now if source == "inbound" else contact.last_seen_at
            contact.synced_at = now if saved else contact.synced_at
            if client and contact.client_id not in {None, client.id}:
                raise ContactIdentityConflictError()
            if client:
                contact.client_id = client.id
                if not contact.policy_manually_overridden:
                    contact.bot_policy = "BOT"
                    contact.source = "client"
            elif saved and not contact.policy_manually_overridden:
                contact.bot_policy = "HUMAN"
                contact.source = "covercut_sync"

        if commit:
            try:
                self.db.commit()
                self.db.refresh(contact)
            except IntegrityError as exc:
                self.db.rollback()
                raise ContactIdentityConflictError() from exc
        return contact

    def sync_contacts(self, business_id: int, connection, records: list[dict], batch_size: int = 200) -> int:
        count = 0
        for index, record in enumerate(records, start=1):
            self.resolve(
                business_id=business_id, connection=connection,
                provider_user_id=record.get("user_id"),
                parent_provider_user_id=record.get("parent_user_id"),
                wa_id=record.get("wa_id") or record.get("phone_number"),
                phone=record.get("phone_number"), username=record.get("username"),
                name=record.get("full_name") or record.get("name") or record.get("first_name"),
                saved=True, source="covercut_sync", commit=index % batch_size == 0,
            )
            count += 1
        if records and len(records) % batch_size:
            try:
                self.db.commit()
            except IntegrityError as exc:
                self.db.rollback()
                raise ContactIdentityConflictError() from exc
        return count

    def update_provider_user_id(
        self, business_id: int, connection, previous: str, current: str, wa_id=None,
        *, previous_parent=None, current_parent=None,
    ) -> Contact:
        previous_matches = self.contact_repo.find_by_identities(
            self.db, business_id, connection.provider,
            provider_user_id=self._clean(previous), wa_id=self._phone(wa_id), for_update=True,
        )
        current_matches = self.contact_repo.find_by_identities(
            self.db, business_id, connection.provider,
            provider_user_id=self._clean(current), for_update=True,
        )
        unique_matches = {
            item.id: item for item in [*previous_matches, *current_matches]
        }
        if len(unique_matches) != 1:
            raise ContactIdentityConflictError()
        contact = next(iter(unique_matches.values()))
        contact.provider_user_id = self._clean(current)
        normalized_previous_parent = self._clean(previous_parent)
        if normalized_previous_parent and contact.parent_provider_user_id not in {None, normalized_previous_parent}:
            raise ContactIdentityConflictError()
        contact.parent_provider_user_id = self._clean(current_parent) or contact.parent_provider_user_id
        try:
            self.db.commit()
            self.db.refresh(contact)
        except IntegrityError as exc:
            self.db.rollback()
            raise ContactIdentityConflictError() from exc
        return contact

    def get(self, business_id: int, contact_id: int) -> Contact:
        contact = self.contact_repo.get_by_id(self.db, business_id, contact_id)
        if not contact:
            raise ContactNotFoundError()
        return contact

    def set_policy(self, business_id: int, contact_id: int, policy: str) -> Contact:
        normalized = policy.upper()
        if normalized not in self.POLICIES:
            raise ValueError("Política inválida.")
        contact = self.get(business_id, contact_id)
        contact.bot_policy = normalized
        contact.policy_manually_overridden = True
        self.db.commit()
        self.db.refresh(contact)
        return contact

    def set_policy_bulk(self, business_id: int, contact_ids: list[int], policy: str) -> int:
        normalized = policy.upper()
        if normalized not in self.POLICIES:
            raise ValueError("Política inválida.")
        contacts = self.contact_repo.list_by_ids(self.db, business_id, contact_ids)
        if len(contacts) != len(set(contact_ids)):
            raise ContactNotFoundError()
        for contact in contacts:
            contact.bot_policy = normalized
            contact.policy_manually_overridden = True
        self.db.commit()
        return len(contacts)

    def ownership_result(self, contact: Contact, connection) -> dict:
        takeover = self.ownership.is_active(contact.business_id, connection.id, contact.id)
        return {"contact": contact, "human_takeover": takeover, "should_respond": not takeover and contact.bot_policy != "HUMAN"}


def get_contact_service(db: DataBaseDep):
    return ContactService(db, ContactRepository(), ClientRepository(), WhatsAppConnectionRepository(), ConversationOwnershipService())
