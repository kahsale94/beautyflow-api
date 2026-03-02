from typing import Annotated
from fastapi import Depends
from sqlalchemy.orm import Session
from sqlalchemy import create_engine

from .config import DATABASE_URL

engine = create_engine(DATABASE_URL, pool_pre_ping=True)

def get_db():
    with Session(engine, expire_on_commit=False) as session:
        yield session

DataBaseDep = Annotated[Session, Depends(get_db)]