from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.orm import Session
from src.core.database import db_dependecy
from src.models.user_model import User
from src.core.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class Security:

    @staticmethod
    def password_hash(password: str) -> str:
        return pwd_context.hash(password)

    @staticmethod
    def verify_password(password: str, password_hash: str) -> bool:
        return pwd_context.verify(password, password_hash)

    @staticmethod
    def create_access_token(user_id: int) -> str:

        payload = {
            "sub": str(user_id),
            "type": "access",
            "exp": datetime.now(timezone.utc)
            + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        }
        return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    @staticmethod
    def create_refresh_token(user_id: int) -> str:

        payload = {
            "sub": str(user_id),
            "type": "refresh",
            "exp": datetime.now(timezone.utc)
            + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
        }
        return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    @staticmethod
    def get_current_user(db: db_dependecy, token: str = Depends(oauth2_scheme)) -> User:

        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

            user_id = payload.get("sub")
            token_type = payload.get("type")

            if token_type != "access" or user_id is None:
                raise HTTPException(status_code=401, detail="Token inválido!")

        except JWTError:
            raise HTTPException(status_code=401, detail="Token inválido ou expirado!")

        stmt = select(User).where(User.id == int(user_id))
        user = db.scalars(stmt).first()

        if not user:
            raise HTTPException(status_code=401, detail="Usuário não encontrado!")

        return user