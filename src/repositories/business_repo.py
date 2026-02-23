from sqlalchemy import select
from sqlalchemy.orm import Session
from src.models.business_model import Business

class BusinessRepository:

    def add(self, db: Session, business: Business):
        db.add(business)

    def get_by_id(self, db: Session, business_id: int):
        return db.get(Business, business_id)

    def get_by_name(self, db: Session, name: str):
        stmt = select(Business).where(Business.name == name)
        return db.scalars(stmt).one_or_none()

    def get_all(self, db: Session):
        stmt = select(Business)
        return db.scalars(stmt).all()

    def delete(self, db: Session, business: Business):
        db.delete(business)