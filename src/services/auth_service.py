from sqlalchemy import select
from sqlalchemy.orm import Session
from src.models.user_model import User
from src.security.security import Security

class AuthService:

    @staticmethod
    def login(db: Session, email: str, password: str):

        stmt = select(User).where(User.email == email)
        user = db.scalars(stmt).first()

        if not user:
            raise ValueError("Credenciais inválidas")

        if not Security.verify_password(password, user.password_hash):
            raise ValueError("Credenciais inválidas")

        access_token = Security.create_access_token(user.id)
        refresh_token = Security.create_refresh_token(user.id)

        return access_token, refresh_token