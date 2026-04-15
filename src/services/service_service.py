from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from src.models import Service
from src.core import DataBaseDep
from src.repositories import ServiceRepository
from src.schemas import ServiceCreate, ServiceUpdate

class ServiceNotFoundError(Exception):
    pass

class ServiceAlreadyExistsError(Exception):
    pass

class ServiceService:

    def __init__(
        self,
        db: Session,
        service_repo: ServiceRepository,
    ):
        self.db = db
        self.service_repo = service_repo

    def _get_valid(self, business_id: int, service_id: int):
        service = self.service_repo.get_by_id(self.db, business_id, service_id)
        if (
            not service
            or not service.is_active
            or service.business_id != business_id
        ):
            raise ServiceNotFoundError()

        return service

    def get_all(self, business_id: int):
        result = self.service_repo.get_by_business(self.db, business_id)
        if (
            not result
            or not all(item.is_active for item in result)
            or not all(item.business_id == business_id for item in result)
        ):
            raise ServiceNotFoundError()

        return result

    def get_by_id(self, business_id: int, service_id: int):
        return self._get_valid(business_id, service_id)
    
    def get_by_name(self, business_id: int, service_name: str):
        result = self.service_repo.get_by_name(self.db, business_id, service_name)
        if (
            not result
            or not result.is_active
            or result.business_id != business_id
        ):
            raise ServiceNotFoundError()

        return [result]

    def create(self, business_id: int, data: ServiceCreate):
        service = Service(
            business_id = business_id,
            name = data.name,
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

        return service

    def update(self, business_id: int, service_id: int, data: ServiceUpdate):
        service = self._get_valid(business_id, service_id)

        update_data = data.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(service, field, value)

        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise ServiceAlreadyExistsError()
        
        self.db.refresh(service)

        return service
    
    def deactivate(self, business_id: int, service_id: int):
        service = self._get_valid(business_id, service_id)

        service.is_active = False

        self.db.commit()

        return

    def delete(self, business_id: int, service_id: int):
        service = self._get_valid(business_id, service_id)

        self.service_repo.delete(self.db, service)
        self.db.commit()

        return

def get_service_service(db: DataBaseDep):
    return ServiceService(
        db,
        ServiceRepository(),
    )