from jose import JWTError, jwt
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from ..security import Security
from ..core import db_dependecy, SECRET_KEY, ALGORITHM
from ..services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/login")
def login(db: db_dependecy, form_data: OAuth2PasswordRequestForm = Depends()):
    try:
        access_token, refresh_token = AuthService.login(
            db=db,
            email=form_data.username,
            password=form_data.password,
        )

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
        }

    except ValueError:
        raise HTTPException(status_code=401, detail="Email ou senha inválidos!")
    
@router.post("/refresh")
def refresh_token(refresh_token: str):
    try:
        payload = jwt.decode(
            refresh_token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Token inválido!")

        user_id = payload.get("sub")

        if not user_id:
            raise HTTPException(status_code=401, detail="Token inválido!")

    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado!")

    new_access_token = Security.criar_access_token(int(user_id))

    return {
        "access_token": new_access_token,
        "token_type": "bearer",
    }