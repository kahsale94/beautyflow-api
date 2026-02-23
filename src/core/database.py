from typing import Annotated
from fastapi import Depends
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from src.core.config import DATABASE_URL

engine = create_engine(DATABASE_URL, pool_pre_ping=True)

def get_db():
    with Session(engine, expire_on_commit=False) as session:
        yield session

db_dependecy = Annotated[Session, Depends(get_db)]