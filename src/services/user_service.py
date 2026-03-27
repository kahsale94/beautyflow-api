from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

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

    def _get_valid(self, business_id: int, user_id: int):
        user = self.user_repo.get_by_id(self.db, business_id, user_id)
        if (
            not user
            or not user.is_active
            or user.business_id != business_id
        ):
            raise UserNotFoundError()

        return user

    def get_all(self, business_id: int):
        result = self.user_repo.get_by_business(self.db, business_id)
        if (
            not result
            or not all(item.is_active for item in result)
            or not all(item.business_id != business_id for item in result)
        ):
            raise UserNotFoundError()

        return result

    def get_by_id(self, business_id: int, user_id: int):
        return self._get_valid(business_id, user_id)

    def get_by_email(self, business_id: int, user_email: str):
        user = self.user_repo.get_by_email(self.db, business_id, user_email)
        if (
            not user
            or not user.is_active
            or user.business_id != business_id
        ):
            raise UserNotFoundError()

        return user

    def create(self, business_id: int | None, data: UserCreate):
        user = User(
            email = data.email,
            password_hash = ActorSecurity.hash(data.password),
            role = data.role,
            business_id = business_id,
        )

        self.user_repo.add(self.db, user)

        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise UserAlreadyExistsError()

        self.db.refresh(user)

        return user

    def update(self, business_id: int, user_id: int, data: UserUpdate):
        user = self._get_valid(business_id, user_id)

        update_data = data.model_dump(exclude_unset=True)

        if "password" in update_data:
            user.password_hash = ActorSecurity.hash(update_data.pop("password"))

        for field, value in update_data.items():
            setattr(user, field, value)

        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise UserAlreadyExistsError()
        
        self.db.refresh(user)

        return user
    
    def deactivate(self, business_id: int, user_id: int):
        user = self._get_valid(business_id, user_id)

        user.is_active = False

        self.db.commit()

        return

    def delete(self, business_id: int, user_id: int):
        user = self._get_valid(business_id, user_id)

        self.user_repo.delete(self.db, user)
        self.db.commit()

        return
    
def get_user_service(db: DataBaseDep):
    return UserService(
        db,
        UserRepository(),
    )