from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from src.models import Contact


class ContactRepository:
    def add(self, db: Session, contact: Contact) -> None:
        db.add(contact)

    def get_by_id(self, db: Session, business_id: int, contact_id: int) -> Contact | None:
        return db.scalars(select(Contact).where(Contact.business_id == business_id, Contact.id == contact_id)).one_or_none()

    def get_by_client(self, db: Session, business_id: int, client_id: int) -> Contact | None:
        return db.scalars(select(Contact).where(Contact.business_id == business_id, Contact.client_id == client_id)).one_or_none()

    def find_by_identities(
        self, db: Session, business_id: int, provider: str | None, *,
        provider_user_id: str | None = None, wa_id: str | None = None,
        phone: str | None = None, username: str | None = None, for_update: bool = False,
    ) -> list[Contact]:
        conditions = []
        if provider and provider_user_id:
            conditions.append((Contact.provider == provider) & (Contact.provider_user_id == provider_user_id))
        if provider and wa_id:
            conditions.append((Contact.provider == provider) & (Contact.wa_id == wa_id))
        if phone:
            conditions.append(Contact.phone == phone)
        if provider and username:
            conditions.append((Contact.provider == provider) & (Contact.username == username))
        if not conditions:
            return []
        stmt = select(Contact).where(Contact.business_id == business_id, or_(*conditions))
        if for_update:
            stmt = stmt.with_for_update()
        return list(db.scalars(stmt).unique().all())

    def list_page(
        self, db: Session, business_id: int, *, page: int, page_size: int,
        query: str | None = None, policy: str | None = None,
        provider: str | None = None, saved: bool | None = None,
    ) -> tuple[list[Contact], int]:
        filters = [Contact.business_id == business_id]
        if query:
            pattern = f"%{query.strip()}%"
            filters.append(or_(Contact.name.ilike(pattern), Contact.phone.ilike(pattern), Contact.wa_id.ilike(pattern), Contact.username.ilike(pattern), Contact.provider_user_id.ilike(pattern)))
        if policy:
            filters.append(Contact.bot_policy == policy)
        if provider:
            filters.append(Contact.provider == provider)
        if saved is not None:
            filters.append(Contact.is_saved == saved)
        total = int(db.scalar(select(func.count()).select_from(Contact).where(*filters)) or 0)
        items = list(db.scalars(select(Contact).where(*filters).order_by(Contact.updated_at.desc(), Contact.id.desc()).offset((page - 1) * page_size).limit(page_size)).all())
        return items, total

    def list_by_ids(self, db: Session, business_id: int, contact_ids: list[int]) -> list[Contact]:
        if not contact_ids:
            return []
        return list(db.scalars(select(Contact).where(Contact.business_id == business_id, Contact.id.in_(contact_ids))).all())
