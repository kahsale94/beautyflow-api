
import re
from typing import Sequence

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from src.models import Client
from src.core import DataBaseDep
from src.utils import normalize_phone
from src.repositories import ClientRepository
from src.schemas import ClientCreate, ClientUpdate
from src.services.redis_cache_invalidator import RedisCacheInvalidator

class ClientNotFoundError(Exception):
    pass

class ClientAlreadyExistsError(Exception):
    pass

class ClientService:

    def __init__(
        self,
        db: Session,
        client_repo: ClientRepository,
        cache_invalidator: RedisCacheInvalidator | None = None,
    ):
        self.db = db
        self.client_repo = client_repo
        self.cache_invalidator = cache_invalidator or RedisCacheInvalidator()

    def _get_valid(self, business_id: int, client_id: int):
        client = self.client_repo.get_by_id(self.db, business_id, client_id)
        if (
            not client
            or not client.is_active
            or client.business_id != business_id
        ):
            raise ClientNotFoundError()

        return client

    def get_all(self, business_id: int):
        result = self.client_repo.get_by_business(self.db, business_id)
        if not all(item.business_id == business_id and item.is_active for item in result):
            raise ClientNotFoundError()

        return result

    def get_by_id(self, business_id: int, client_id: int):
        return self._get_valid(business_id, client_id)

    def get_by_phone(self, business_id: int, client_phone: str):
        normalized_phone = normalize_phone(client_phone)

        result = self.client_repo.get_by_phone(self.db, business_id, normalized_phone)

        return result

    def create(self, business_id: int, data: ClientCreate):
        phone = normalize_phone(data.phone)

        client = Client(
            business_id = business_id,
            name = data.name,
            phone = phone,
        )

        self.client_repo.add(self.db, client)

        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise ClientAlreadyExistsError()

        self.db.refresh(client)
        self.cache_invalidator.invalidate_client_context(client.phone)

        return client

    def new_name(self, business_id: int, client_id: int, name: str):
        client = self._get_valid(business_id, client_id)

        if name is None or not re.search(r"[A-Za-zÀ-ÿ]", name):
            raise ValueError("Nome inválido")

        client.name = name
        self.db.commit()
        self.db.refresh(client)
        self.cache_invalidator.invalidate_client_context(client.phone)

        return client

    def update(self, business_id: int, client_id: int, data: ClientUpdate):
        client = self._get_valid(business_id, client_id)
        previous_phone = client.phone

        update_data = data.model_dump(exclude_unset=True)

        if "phone" in update_data and update_data["phone"] is not None:
            update_data["phone"] = normalize_phone(update_data["phone"])

        for field, value in update_data.items():
            setattr(client, field, value)

        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise ClientAlreadyExistsError()
        
        self.db.refresh(client)
        self.cache_invalidator.invalidate_client_context(previous_phone)
        if client.phone != previous_phone:
            self.cache_invalidator.invalidate_client_context(client.phone)

        return client

    def deactivate(self, business_id: int, client_id: int):
        client = self._get_valid(business_id, client_id)
        previous_phone = client.phone
        client.is_active = False
        self.db.commit()
        self.cache_invalidator.invalidate_client_context(previous_phone)
        return

    def delete(self, business_id: int, client_id: int):
        return self.deactivate(business_id, client_id)

def get_client_service(db: DataBaseDep):
    return ClientService(
        db,
        ClientRepository(),
        RedisCacheInvalidator(),
    )
