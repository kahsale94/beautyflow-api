from sqlalchemy import select
from sqlalchemy.orm import Session
from src.models.user_model import User

class UserRepository:

    def add(self, db: Session, user: User):
        db.add(user)

    def get_by_id(self, db: Session, user_id: int):
        return db.get(User, user_id)

    def get_by_email(self, db: Session, user_email: str):
        stmt = select(User).where(User.email == user_email)
        return db.scalars(stmt).first()

    def get_all(self, db: Session):
        stmt = select(User)
        return db.scalars(stmt).all()