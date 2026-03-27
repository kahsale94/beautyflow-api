from sqlalchemy import select
from sqlalchemy.orm import Session

from src.models import Client

class ClientRepository:

    def add(self, db: Session, client: Client):
        db.add(client)

    def delete(self, db: Session, client: Client):
        db.delete(client)

    def get_by_id(self, db: Session, business_id: int, client_id: int):
        stmt = select(Client).where(
            Client.business_id == business_id,
            Client.id == client_id,
        )
        return db.scalars(stmt).one_or_none()

    def get_by_phone(self, db: Session, business_id: int, phone: str):
        stmt = select(Client).where(
            Client.business_id == business_id,
            Client.phone == phone,
        )
        return db.scalars(stmt).one_or_none()

    def get_by_business(self, db: Session, business_id: int):
        stmt = select(Client).where(
            Client.business_id == business_id,
        )
        return db.scalars(stmt).all()