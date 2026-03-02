from sqlalchemy.orm import Session

from src.models import Service
from src.core import DataBaseDep
from src.schemas import ServiceCreate, ServiceUpdate
from src.repositories import ServiceRepository, BusinessRepository

class ServiceNotFoundError(Exception):
    pass

class ServiceService:

    def __init__(
        self,
        db: Session,
        service_repo: ServiceRepository,
        business_repo: BusinessRepository,
    ):
        self.db = db
        self.service_repo = service_repo
        self.business_repo = business_repo

    def create_service(self, business_id: int, data: ServiceCreate):      
        if data.duration_minutes <= 0:
            raise ValueError()

        if data.price < 0:
            raise ValueError()

        service = Service(
            business_id=business_id,
            name=data.name,
            duration_minutes=data.duration_minutes,
            price=data.price,
        )

        self.service_repo.add(self.db, service)

        self.db.commit()
        self.db.refresh(service)

        return service

    def get_service(self, business_id: int, service_id: int | None = None):
        if service_id is None:
            return self.service_repo.get_by_business(self.db, business_id)

        service = self.service_repo.get_by_id(self.db, service_id)
        if not service or service.business_id != business_id:
            raise ServiceNotFoundError()

        return service

    def update_service(self, business_id: int, service_id: int, data: ServiceUpdate):        
        service = self.service_repo.get_by_id(self.db, service_id)
        if not service or service.business_id != business_id:
            raise ServiceNotFoundError()

        update_data = data.model_dump(exclude_unset=True)

        if "duration_minutes" in update_data:
            if update_data.duration_minutes <= 0:
                raise ValueError()

        if "price" in update_data:
            if update_data.price < 0:
                raise ValueError()

        for field, value in update_data.items():
            setattr(service, field, value)

        self.db.commit()
        self.db.refresh(service)

        return service

    def delete_service(self, business_id: int, service_id: int):
        service = self.service_repo.get_by_id(self.db, service_id)
        if not service or service.business_id != business_id:
            raise ServiceNotFoundError()

        self.service_repo.delete(self.db, service)

        self.db.commit()

def get_service_service(db: DataBaseDep):
    return ServiceService(
        db,
        ServiceRepository(),
        BusinessRepository(),    
    )