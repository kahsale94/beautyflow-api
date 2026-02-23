from sqlalchemy.orm import Session
from src.models.user_model import User
from src.schemas.user_schema import UserCreate
from src.repositories.user_repo import UserRepository
from src.security.security import Security

class UserAlreadyExistsError(Exception):
    pass

class UserNotFoundError(Exception):
    pass

class UserService:

    def __init__(self):
        self.user_repo = UserRepository()

    def create_user(self, db: Session, data: UserCreate):

        existing = self.user_repo.get_by_email(db, data.email)

        if existing:
            raise UserAlreadyExistsError()

        password_hash = Security.password_hash(data.senha)

        user = User(
            email=data.email,
            password_hash=password_hash,
            role=data.role
        )

        self.user_repo.add(db, user)

        db.commit()
        db.refresh(user)

        return user

    def get_user(self, db: Session, user_id: int | None = None, user_email: str | None = None):
        
        if user_id is None:
            if user_email is None:
                return self.user_repo.get_all(db)
            result = self.user_repo.get_by_email(db, user_email)
        else:
            result = self.user_repo.get_by_id(db, user_id)
       
        user = result

        if not user:
            return UserNotFoundError()
        
        return user