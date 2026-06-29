from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from src.models import Service
from src.core import DataBaseDep
from src.utils import normalize_text
from src.repositories import ServiceRepository
from src.schemas import ServiceCreate, ServiceUpdate
from src.services.redis_cache_invalidator import RedisCacheInvalidator

class ServiceNotFoundError(Exception):
    pass

class ServiceAlreadyExistsError(Exception):
    pass

class ServiceService:

    def __init__(
        self,
        db: Session,
        service_repo: ServiceRepository,
        cache_invalidator: RedisCacheInvalidator | None = None,
    ):
        self.db = db
        self.service_repo = service_repo
        self.cache_invalidator = cache_invalidator or RedisCacheInvalidator()

    def _get_valid(self, business_id: int, service_id: int) -> Service:
        service = self.service_repo.get_by_id(self.db, business_id, service_id)
        if (
            not service
            or not service.is_active
            or service.business_id != business_id
        ):
            raise ServiceNotFoundError()

        return service

    def get_by_id(self, business_id: int, service_id: int):
        return self._get_valid(business_id, service_id)
    
    def get_all(self, business_id: int):
        result = self.service_repo.get_by_business(self.db, business_id)

        return result
    
    def get_by_name(self, business_id: int, service_name: str):
        normalized_name = normalize_text(service_name)

        result = self.service_repo.get_by_name(self.db, business_id, normalized_name)

        return result

    def create(self, business_id: int, data: ServiceCreate):
        name = normalize_text(data.name)

        service = Service(
            business_id = business_id,
            name = data.name,
            normalized_name = name,
            duration_minutes = data.duration_minutes,
            price = data.price,
        )

        self.service_repo.add(self.db, service)

        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise ServiceAlreadyExistsError()

        self.db.refresh(service)
        self.cache_invalidator.invalidate_service_context()

        return service

    def update(self, business_id: int, service_id: int, data: ServiceUpdate):
        service = self._get_valid(business_id, service_id)

        update_data = data.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(service, field, value)

        if "name" in update_data:
            service.normalized_name = normalize_text(update_data["name"])

        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise ServiceAlreadyExistsError()
        
        self.db.refresh(service)
        self.cache_invalidator.invalidate_service_context()

        return service
    
    def deactivate(self, business_id: int, service_id: int):
        service = self._get_valid(business_id, service_id)

        service.is_active = False

        self.db.commit()
        self.cache_invalidator.invalidate_service_context()

        return

    def delete(self, business_id: int, service_id: int):
        return self.deactivate(business_id, service_id)

def get_service_service(db: DataBaseDep):
    return ServiceService(
        db,
        ServiceRepository(),
        RedisCacheInvalidator(),
    )
