from sqlalchemy import select, func
from sqlalchemy.orm import Session

from src.models import Professional

class ProfessionalRepository:

    def add(self, db: Session, professional: Professional):
        db.add(professional)

    def delete(self, db: Session, professional: Professional):
        db.delete(professional)

    def get_by_id(self, db: Session, business_id: int, professional_id: int):
        stmt = select(Professional).where(
            Professional.is_active == True,
            Professional.business_id == business_id,
            Professional.id == professional_id,
        )
        return db.scalars(stmt).one_or_none()

    def get_by_name(self, db: Session, business_id: int, professional_name: str):
        similarity_score = func.similarity(Professional.normalized_name, professional_name)

        stmt = (select(Professional).where(
            Professional.is_active == True,
            Professional.business_id == business_id,
            (
                Professional.normalized_name.ilike(f"%{professional_name}%")
                | (similarity_score > 0.4)
            ),
        )
        .order_by(similarity_score.desc())
        .limit(20)
        )

        return db.scalars(stmt).all()

    def get_by_business(self, db: Session, business_id: int):
        stmt = select(Professional).where(
            Professional.is_active == True,
            Professional.business_id == business_id,
        )
        return db.scalars(stmt).all()
