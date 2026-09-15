
from typing import Sequence

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from src.models import Client

class ClientRepository:

    def add(self, db: Session, client: Client):
        db.add(client)

    def delete(self, db: Session, client: Client):
        db.delete(client)

    def get_by_id(self, db: Session, business_id: int, client_id: int) -> Client:
        stmt = select(Client).where(
            Client.is_active == True,
            Client.business_id == business_id,
            Client.id == client_id,
        )
        return db.scalars(stmt).one_or_none()

    def get_by_phone(self, db: Session, business_id: int, phone: str) -> Sequence[Client]:
        stmt = select(Client).where(
            Client.is_active == True,
            Client.business_id == business_id,
            Client.phone == phone,
        )
        return db.scalars(stmt).all()

    def get_by_business(self, db: Session, business_id: int, sort: str | None = None) -> Sequence[Client]:
        stmt = select(Client).where(
            Client.is_active == True,
            Client.business_id == business_id,
        )
        name = func.lower(func.coalesce(Client.name, ""))
        ordering = {
            "name_asc": (name.asc(), Client.id.asc()),
            "name_desc": (name.desc(), Client.id.desc()),
            "oldest": (Client.id.asc(),),
            "newest": (Client.id.desc(),),
        }.get(sort)
        if ordering:
            stmt = stmt.order_by(*ordering)
        return db.scalars(stmt).all()
