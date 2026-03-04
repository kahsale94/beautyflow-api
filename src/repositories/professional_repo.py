from sqlalchemy import select
from sqlalchemy.orm import Session

from src.models import Professional

class ProfessionalRepository:

    def add(self, db: Session, professional: Professional):
        db.add(professional)

    def delete(self, db: Session, professional: Professional):
        db.delete(professional)

    def get_by_id(self, db: Session, professional_id: int):
        return db.get(Professional, professional_id)

    def get_by_business(self, db: Session, business_id: int):
        stmt = select(Professional).where(
            Professional.business_id == business_id,
            Professional.is_active == True
        )
        return db.scalars(stmt).all()