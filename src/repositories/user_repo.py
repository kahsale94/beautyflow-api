from sqlalchemy import select
from sqlalchemy.orm import Session

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
        stmt = select(User).where(
            User.is_active == True,
            User.business_id == business_id,
            User.email == user_email,
        )
        return db.scalars(stmt).one_or_none()

    def get_by_business(self, db: Session, business_id: int):
        stmt = select(User).where(
            User.is_active == True,
            User.business_id == business_id,
        )
        return db.scalars(stmt).all()