import re
from sqlalchemy.orm import Session

from src.models import Client
from src.core import DataBaseDep
from src.repositories import ClientRepository

class ClientNotFoundError(Exception):
    pass

class ClientAlreadyExistsError(Exception):
    pass

class ClientService:

    def __init__(
        self,
        db: Session,
        client_repo: ClientRepository,
    ):
        self.db = db
        self.client_repo = client_repo

    def normalize_phone(phone: str) -> str:
        return re.sub(r"\D", "", phone)

    def create_client(self, business_id: int, data):

        phone = self.normalize_phone(data.phone)

        existing = self.client_repo.get_by_phone(self.db, data.phone)
        if existing and existing.business_id == business_id:
            raise ClientAlreadyExistsError()

        client = Client(
            business_id = business_id,
            phone = phone,
            name = data.name,
            name_wpp = data.name_wpp,
        )

        self.client_repo.add(self.db, client)
        self.db.commit()
        self.db.refresh(client)

        return client

    def get_client(self, business_id: int, client_id: int | None = None, client_phone: str | None = None):
        if client_id is None:
            if client_phone is None:
                return self.client_repo.get_by_business(self.db, business_id)
            client = self.client_repo.get_by_phone(self.db, client_phone)
        else:
            client = self.client_repo.get_by_id(self.db, client_id)

        if not client or client.business_id != business_id:
            raise ClientNotFoundError()

        return client

    def update_client(self, business_id: int, client_id: int, data):
        client = self.client_repo.get_by_id(self.db, client_id)
        if not client or client.business_id != business_id:
            raise ClientNotFoundError()

        update_data = data.model_dump(exclude_unset=True)

        if "phone" in update_data:
            existing = self.client_repo.get_by_phone(self.db, update_data["phone"])
            if existing and existing.business_id == business_id and existing.id != client.id:
                raise ClientAlreadyExistsError()

        for field, value in update_data.items():
            setattr(client, field, value)

        self.db.commit()
        self.db.refresh(client)

        return client

    def delete_client(self, business_id: int, client_id: int):
        client = self.client_repo.get_by_id(self.db, client_id)
        if not client or client.business_id != business_id:
            raise ClientNotFoundError()

        self.client_repo.delete(self.db, client)

        self.db.commit()

def get_client_service(db: DataBaseDep):
    return ClientService(
        db,
        ClientRepository(),
    )