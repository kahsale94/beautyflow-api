from sqlalchemy import select
from sqlalchemy.orm import Session

from src.models import Business


class BusinessRepository:

    def add(self, db: Session, business: Business):
        db.add(business)

    def delete(self, db: Session, business: Business):
        db.delete(business)

    def get_by_id(self, db: Session, business_id: int):
        stmt = select(Business).where(
            Business.is_active == True,
            Business.id == business_id,
        )
        return db.scalars(stmt).one_or_none()

    def get_by_name(self, db: Session, name: str):
        stmt = select(Business).where(
            Business.is_active == True,
            Business.name == name,
        )
        return db.scalars(stmt).one_or_none()

    def get_all(self, db: Session):
        stmt = select(Business).where(
            Business.is_active == True,
        )
        return db.scalars(stmt).all()