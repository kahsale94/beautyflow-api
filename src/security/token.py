from jose import jwt, JWTError
from fastapi import HTTPException

from src.core import SECRET_KEY, ALGORITHM

class TokenManager:

    @staticmethod
    def encode(payload: dict) -> str:
        return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    @staticmethod
    def decode(token: str) -> dict:
        try:
            return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        except JWTError:
            raise HTTPException(status_code=401, detail="Token inválido ou expirado!")