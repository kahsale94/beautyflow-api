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

        stmt = (select(Service).
            where(
                Service.is_active == True,
                Service.business_id == business_id,
                (
                    Service.normalized_name.ilike(f"%{service_name}%") | (similarity_score > 0.4)
                ),
            )
            .order_by(similarity_score.desc())
            .limit(20)
        )

        return db.scalars(stmt).all()
    
    def get_by_business(self, db: Session, business_id: int, sort: str | None = None):
        stmt = select(Service).where(
            Service.is_active == True,
            Service.business_id == business_id,
        )
        name = func.lower(func.coalesce(Service.name, ""))
        ordering = {
            "name_asc": (name.asc(), Service.id.asc()),
            "name_desc": (name.desc(), Service.id.desc()),
            "price_asc": (Service.price.asc(), Service.id.asc()),
            "price_desc": (Service.price.desc(), Service.id.desc()),
            "duration_asc": (Service.duration_minutes.asc(), Service.id.asc()),
            "duration_desc": (Service.duration_minutes.desc(), Service.id.desc()),
            "oldest": (Service.id.asc(),),
            "newest": (Service.id.desc(),),
        }.get(sort)
        if ordering:
            stmt = stmt.order_by(*ordering)
        return db.scalars(stmt).all()
