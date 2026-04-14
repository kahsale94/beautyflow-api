import re
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from src.models import Client
from src.core import DataBaseDep
from src.repositories import ClientRepository
from src.schemas import ClientCreate, ClientUpdate

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

    def _normalize_phone(self, phone: str):
        phone = re.sub(r"\D", "", phone)

        if phone.startswith("55") and len(phone) == 13:
            return phone

        if len(phone) == 11:
            return "55" + phone

        if len(phone) == 10:
            return "55" + phone[:2] + "9" + phone[2:]

        return phone

    def _get_valid(self, business_id: int, client_id: int):
        client = self.client_repo.get_by_id(self.db, business_id, client_id)
        if (
            not client
            or client.business_id != business_id
        ):
            raise ClientNotFoundError()

        return client

    def get_all(self, business_id: int):
        result = self.client_repo.get_by_business(self.db, business_id)
        if (
            not result
            or not all(item.business_id == business_id for item in result)
        ):
            raise ClientNotFoundError()

        return result

    def get_by_id(self, business_id: int, client_id: int):
        return self._get_valid(business_id, client_id)

    def get_by_phone(self, business_id: int, phone: str):
        phone = self._normalize_phone(phone)

        result = self.client_repo.get_by_phone(self.db, business_id, phone)
        if (
            not result 
            or result.business_id != business_id
        ):
            raise ClientNotFoundError()

        return result

    def create(self, business_id: int, data: ClientCreate):
        phone = self._normalize_phone(data.phone)

        client = Client(
            business_id = business_id,
            phone = phone,
            name = data.name,
            name_wpp = data.name_wpp,
        )

        self.client_repo.add(self.db, client)

        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise ClientAlreadyExistsError()

        self.db.refresh(client)

        return client

    def update(self, business_id: int, client_id: int, data: ClientUpdate):
        client = self._get_valid(business_id, client_id)

        update_data = data.model_dump(exclude_unset=True)

        if "phone" in update_data:
            update_data["phone"] = self._normalize_phone(update_data["phone"])

        for field, value in update_data.items():
            setattr(client, field, value)

        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise ClientAlreadyExistsError()

        self.db.refresh(client)

        return client

    def delete(self, business_id: int, client_id: int):
        client = self._get_valid(business_id, client_id)

        self.client_repo.delete(self.db, client)
        self.db.commit()

        return

def get_client_service(db: DataBaseDep):
    return ClientService(
        db,
        ClientRepository(),
    )