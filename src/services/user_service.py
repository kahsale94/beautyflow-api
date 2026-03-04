from sqlalchemy.orm import Session

from src.models import User
from src.core import DataBaseDep
from src.security import ActorSecurity
from src.repositories import UserRepository
from src.schemas import UserCreate, UserUpdate

class UserAlreadyExistsError(Exception):
    pass

class UserNotFoundError(Exception):
    pass

class UserService:

    def __init__(
        self,
        db: Session,
        user_repo: UserRepository,
    ):
        self.db = db
        self.user_repo = user_repo

    def create_user(self, data: UserCreate, business_id: int | None = None):        
        existing = self.user_repo.get_by_email(self.db, data.email)
        if existing and existing.business_id == business_id:
            raise UserAlreadyExistsError()

        password_hash = ActorSecurity.password_hash(data.password)

        user = User(
            email = data.email,
            password_hash = password_hash,
            role = data.role,
            business_id = business_id,
        )

        self.user_repo.add(self.db, user)

        self.db.commit()
        self.db.refresh(user)

        return user

    def get_user(self, business_id: int, user_id: int | None = None, user_email: str | None = None):
        if user_id is None:
            if user_email is None:
                return self.user_repo.get_by_business(self.db, business_id)
            user = self.user_repo.get_by_email(self.db, user_email)
        else:
            user = self.user_repo.get_by_id(self.db, user_id)

        if not user or user.business_id != business_id:
            raise UserNotFoundError()
        
        return user
    
    def update_user(self, business_id: int, user_id: int, data: UserUpdate):        
        user = self.user_repo.get_by_id(self.db, user_id)
        if not user or user.business_id != business_id:
            raise UserNotFoundError()
        
        update_data = data.model_dump(exclude_unset=True)

        if "email" in update_data:
            email = update_data.get("email", user.email)
            
            existing = self.user_repo.get_by_email(self.db, email)
            if existing and existing.business_id == business_id and existing.id != user.id:
                raise UserAlreadyExistsError()

        for field, value in update_data.items():
            setattr(user, field, value)

        self.db.commit()
        self.db.refresh(user)

        return user

    def delete_user(self, business_id: int, user_id: int):
        user = self.user_repo.get_by_id(self.db, user_id)
        if not user or user.business_id != business_id:
            raise UserNotFoundError()

        self.user_repo.delete(self.db, user)

        self.db.commit()
    
def get_user_service(db: DataBaseDep):
    return UserService(
        db,
        UserRepository(),
    )