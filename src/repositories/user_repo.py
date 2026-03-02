from sqlalchemy import select
from sqlalchemy.orm import Session

from src.models import User

class UserRepository:

    def add(self, db: Session, user: User):
        db.add(user)

    def delete(self, db: Session, user: User):
        db.delete(user)

    def get_by_id(self, db: Session, user_id: int):
        return db.get(User, user_id)

    def get_by_email(self, db: Session, user_email: str):
        stmt = select(User).where(User.email == user_email)
        return db.scalars(stmt).first()

    def get_by_business(self, db: Session, business_id: int):
        stmt = select(User).where(User.business_id == business_id)
        return db.scalars(stmt).all()