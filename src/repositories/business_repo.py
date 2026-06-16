from sqlalchemy.orm import Session
from sqlalchemy import select, func

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

    def get_by_slug(self, db: Session, business_slug: str):
        similarity_score = func.similarity(Business.slug, business_slug)

        stmt = (select(Business).where(
            Business.is_active == True,
            (
                Business.slug.ilike(f"%{business_slug}%")
                | (similarity_score > 0.4)
            ),
        )
        .order_by(similarity_score.desc())
        .limit(20)
        )

        return db.scalars(stmt).all()

    def get_by_exact_slug(self, db: Session, business_slug: str):
        stmt = select(Business).where(Business.slug == business_slug)
        return db.scalars(stmt).one_or_none()
    
    def get_by_phone(self, db: Session, phone: str):
        stmt = select(Business).where(
            Business.is_active == True,
            Business.phone == phone,
        )
        return db.scalars(stmt).one_or_none()

    def get_all(self, db: Session):
        stmt = select(Business).where(
            Business.is_active == True,
        )
        return db.scalars(stmt).all()
