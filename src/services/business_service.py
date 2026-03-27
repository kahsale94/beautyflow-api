from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from src.models import Business
from src.core import DataBaseDep
from src.repositories import BusinessRepository
from src.schemas import BusinessCreate, BusinessUpdate

class BusinessNotFoundError(Exception):
    pass

class BusinessAlreadyExistsError(Exception):
    pass

class BusinessService:

    def __init__(
        self,
        db: Session,
        business_repo: BusinessRepository,
    ):
        self.db = db
        self.business_repo = business_repo

    def _get_valid(self, business_id: int):
        business = self.business_repo.get_by_id(self.db, business_id)
        if (
            not business 
            or not business.is_active
        ):
            raise BusinessNotFoundError()

        return business

    def get_all(self):
        result = self.business_repo.get_all(self.db)
        if (
            not result
            or not all(item.is_active for item in result)
        ):
            raise BusinessNotFoundError()

        return result

    def get_by_id(self, business_id: int):
        return self._get_valid(business_id)

    def get_by_name(self, business_name: str):
        result = self.business_repo.get_by_name(self.db, business_name)
        if (
            not result
            or not result.is_active
        ):
            raise BusinessNotFoundError()

        return result

    def create(self, data: BusinessCreate):
        business = Business(
            name = data.name,
            type = data.type,
            timezone = data.timezone,
        )

        self.business_repo.add(self.db, business)

        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise BusinessAlreadyExistsError()

        self.db.refresh(business)

        return business

    def update(self, business_id: int, data: BusinessUpdate):
        business = self._get_valid(business_id)

        update_data = data.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(business, field, value)

        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise BusinessAlreadyExistsError()
        
        self.db.refresh(business)

        return business

    def deactivate(self, business_id: int):
        business = self._get_valid(business_id)

        business.is_active = False

        self.db.commit()

        return

    def delete(self, business_id: int):
        business = self._get_valid(business_id)

        self.business_repo.delete(self.db, business)
        self.db.commit()

        return

def get_business_service(db: DataBaseDep):
    return BusinessService(
        db,
        BusinessRepository(),
    )