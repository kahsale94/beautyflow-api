from sqlalchemy.orm import Session

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

    def create_business(self, data: BusinessCreate):
        existing = self.business_repo.get_by_name(self.db, data.name)
        if existing:
            raise BusinessAlreadyExistsError()

        business = Business(
            name=data.name,
            type=data.type,
            timezone=data.timezone,
        )

        self.business_repo.add(self.db, business)

        self.db.commit()
        self.db.refresh(business)

        return business

    def get_business(self, business_id: int | None = None):
        if business_id is None:
            return self.business_repo.get_all(self.db)

        business = self.business_repo.get_by_id(self.db, business_id)
        if not business or not business.is_active:
            raise BusinessNotFoundError()

        return business

    def update_business(self, business_id: int, data: BusinessUpdate):
        business = self.business_repo.get_by_id(self.db, business_id)
        if not business or not business.is_active:
            raise BusinessNotFoundError()

        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(business, field, value)

        self.db.commit()
        self.db.refresh(business)

        return business

    def delete_business(self, business_id: int):
        business = self.business_repo.get_by_id(self.db, business_id)
        if not business or not business.is_active:
            raise BusinessNotFoundError()

        self.business_repo.delete(self.db, business)

        self.db.commit()

def get_business_service(db: DataBaseDep):
    return BusinessService(
        db,
        BusinessRepository(),
    )