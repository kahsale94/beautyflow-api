from sqlalchemy.orm import Session
from src.models.service_model import Service
from src.schemas.service_schema import ServiceCreate, ServiceUpdate
from src.repositories.service_repo import ServiceRepository
from src.repositories.business_repo import BusinessRepository

class ServiceNotFoundError(Exception):
    pass

class BusinessNotFoundError(Exception):
    pass

class ServiceService:

    def __init__(self):
        self.service_repo = ServiceRepository()
        self.business_repo = BusinessRepository()

    def create_service(self, db: Session, data: ServiceCreate):

        business = self.business_repo.get_by_id(db, data.business_id)
        if not business or not business.is_active:
            raise BusinessNotFoundError()

        service = Service(
            business_id=data.business_id,
            name=data.name,
            duration_minutes=data.duration_minutes,
            price=data.price,
        )

        self.service_repo.add(db, service)

        db.commit()
        db.refresh(service)

        return service

    def get_service(self, db: Session, service_id: int | None = None):

        if service_id is None:
            return self.service_repo.get_all(db)

        service = self.service_repo.get_by_id(db, service_id)

        if not service:
            raise ServiceNotFoundError()

        return service

    def update_service(self, db: Session, service_id: int, data: ServiceUpdate):

        service = self.service_repo.get_by_id(db, service_id)

        if not service:
            raise ServiceNotFoundError()

        if data.business_id is not None:
            business = self.business_repo.get_by_id(db, data.business_id)
            if not business or not business.is_active:
                raise BusinessNotFoundError()

        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(service, field, value)

        db.commit()
        db.refresh(service)

        return service

    def delete_service(self, db: Session, service_id: int):

        service = self.service_repo.get_by_id(db, service_id)

        if not service:
            raise ServiceNotFoundError()

        self.service_repo.delete(db, service)

        db.commit()