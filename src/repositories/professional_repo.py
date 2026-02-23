from sqlalchemy import select
from sqlalchemy.orm import Session
from src.models.professional_model import Professional

class ProfessionalRepository:

    def add(self, db: Session, professional: Professional):
        db.add(professional)

    def get_by_id(self, db: Session, professional_id: int):
        return db.get(Professional, professional_id)

    def get_all(self, db: Session):
        stmt = select(Professional)
        return db.scalars(stmt).all()

    def get_by_business(self, db: Session, business_id: int):
        stmt = select(Professional).where(
            Professional.business_id == business_id
        )
        return db.scalars(stmt).all()

    def delete(self, db: Session, professional: Professional):
        db.delete(professional)