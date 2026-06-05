from sqlalchemy.orm import Session
from sqlalchemy import select, func

from src.models import User

class UserRepository:
        
    def add(self, db: Session, user: User):
        db.add(user)

    def delete(self, db: Session, user: User):
        db.delete(user)

    def get_by_id(self, db: Session, business_id: int, user_id: int):
        stmt = select(User).where(
            User.is_active == True,
            User.business_id == business_id,
            User.id == user_id,
        )
        return db.scalars(stmt).one_or_none()

    def get_by_email(self, db: Session, business_id: int, user_email: str):
        similarity_score = func.similarity(User.email, user_email)

        stmt = (select(User).
            where(
                User.is_active == True,
                User.business_id == business_id,
                (
                    User.normalized_name.ilike(f"%{user_email}%") | (similarity_score > 0.4)
                ),
            )
            .order_by(similarity_score.desc())
            .limit(20)
        )

        return db.scalars(stmt).all()

    def get_by_business(self, db: Session, business_id: int):
        stmt = select(User).where(
            User.is_active == True,
            User.business_id == business_id,
        )
        return db.scalars(stmt).all()