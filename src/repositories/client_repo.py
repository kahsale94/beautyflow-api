from sqlalchemy import select
from sqlalchemy.orm import Session

from src.models import Client

class ClientRepository:

    def add(self, db: Session, client: Client):
        db.add(client)

    def delete(self, db: Session, client: Client):
        db.delete(client)

    def get_by_id(self, db: Session, client_id: int):
        return db.get(Client, client_id)

    def get_by_phone(self, db: Session, phone: str):
        stmt = select(Client).where(Client.phone == phone)
        return db.scalars(stmt).first()

    def get_by_business(self, db: Session, business_id: int):
        stmt = select(Client).where(Client.business_id == business_id)
        return db.scalars(stmt).all()