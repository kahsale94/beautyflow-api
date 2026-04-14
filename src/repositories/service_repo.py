from sqlalchemy import select
from sqlalchemy.orm import Session

from src.models import Service

class ServiceRepository:
        
    def add(self, db: Session, service: Service):
        db.add(service)

    def delete(self, db: Session, service: Service):
        db.delete(service)

    def get_by_id(self, db: Session, business_id: int, service_id: int):
        stmt = select(Service).where(
            Service.is_active == True,
            Service.business_id == business_id,
            Service.id == service_id,
        )
        return db.scalars(stmt).one_or_none()
    
    def get_by_name(self, db: Session, business_id: int, service_name: str):
        stmt = select(Service).where(
            Service.is_active == True,
            Service.business_id == business_id,
            Service.name == service_name,
        )
        return db.scalars(stmt).one_or_none()
    
    def get_by_business(self, db: Session, business_id: int):
        stmt = select(Service).where(
            Service.is_active == True,
            Service.business_id == business_id,
        )
        return db.scalars(stmt).all()