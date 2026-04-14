from jose import jwt, JWTError
from fastapi import HTTPException
from src.core import ALGORITHM, USER_SECRET_KEY, INTEGRATION_SECRET_KEY, BUSINESS_INTEGRATION_SECRET_KEY

class TokenManager:

    SECRET_MAP = {
        "user": USER_SECRET_KEY,
        "integration": INTEGRATION_SECRET_KEY,
        "business_integration": BUSINESS_INTEGRATION_SECRET_KEY,
    }

    @staticmethod
    def encode(payload: dict, secret_key: str) -> str:
        return jwt.encode(payload, secret_key, algorithm=ALGORITHM)

    @staticmethod
    def decode(token: str) -> dict:
        try:
            unverified_payload = jwt.get_unverified_claims(token)

            token_type = unverified_payload.get("type")
            if not token_type:
                raise HTTPException(status_code=401, detail="Token inválido")

            secret_key = TokenManager.SECRET_MAP.get(token_type)
            if not secret_key:
                raise HTTPException(status_code=401, detail="Tipo de token inválido")

            return jwt.decode(token, secret_key, algorithms=[ALGORITHM])

        except JWTError:
            raise HTTPException(status_code=401, detail="Token inválido ou expirado!")