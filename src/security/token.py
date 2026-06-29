from jose import jwt, JWTError
from fastapi import HTTPException

from src.core import ALGORITHM
from .key_rotation import get_jwt_key_set


class TokenManager:

    @staticmethod
    def encode(payload: dict, secret_key: str | None = None) -> str:
        if secret_key is not None:
            return jwt.encode(payload, secret_key, algorithm=ALGORITHM)

        token_type = payload.get("type")
        if not token_type:
            raise HTTPException(status_code=401, detail="Token inválido")

        key_set = get_jwt_key_set(str(token_type))
        if not key_set:
            raise HTTPException(status_code=401, detail="Tipo de token inválido")

        return jwt.encode(
            payload,
            key_set.current.secret,
            algorithm=ALGORITHM,
            headers={"kid": key_set.current.kid},
        )

    @staticmethod
    def decode(token: str) -> dict:
        try:
            unverified_payload = jwt.get_unverified_claims(token)
            unverified_header = jwt.get_unverified_header(token)

            token_type = unverified_payload.get("type")
            if not token_type:
                raise HTTPException(status_code=401, detail="Token inválido")

            key_set = get_jwt_key_set(str(token_type))
            if not key_set:
                raise HTTPException(status_code=401, detail="Tipo de token inválido")

            kid = unverified_header.get("kid")
            for key in key_set.validation_keys(str(kid) if kid else None):
                try:
                    return jwt.decode(token, key.secret, algorithms=[ALGORITHM])
                except JWTError:
                    continue

            raise HTTPException(status_code=401, detail="Token inválido ou expirado!")

        except JWTError:
            raise HTTPException(status_code=401, detail="Token inválido ou expirado!")
