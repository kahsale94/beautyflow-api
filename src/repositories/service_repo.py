from sqlalchemy import select, func
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
        similarity_score = func.similarity(Service.normalized_name, service_name)

        stmt = (select(Service).where(
            Service.is_active == True,
            Service.business_id == business_id,
            (
                Service.normalized_name.ilike(f"%{service_name}%")
                | (similarity_score > 0.4)
            ),
        )
        .order_by(similarity_score.desc())
        .limit(20)
        )

        return db.scalars(stmt).all()
    
    def get_by_business(self, db: Session, business_id: int):
        stmt = select(Service).where(
            Service.is_active == True,
            Service.business_id == business_id,
        )
        return db.scalars(stmt).all()