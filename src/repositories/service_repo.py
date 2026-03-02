from sqlalchemy import select
from sqlalchemy.orm import Session

from src.models import Service

class ServiceRepository:

    def add(self, db: Session, service: Service):
        db.add(service)

    def delete(self, db: Session, service: Service):
        db.delete(service)

    def get_by_id(self, db: Session, service_id: int):
        return db.get(Service, service_id)

    def get_by_business(self, db: Session, business_id: int):
        stmt = select(Service).where(Service.business_id == business_id)
        return db.scalars(stmt).all()