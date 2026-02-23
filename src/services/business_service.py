from sqlalchemy.orm import Session
from src.models.business_model import Business
from src.schemas.business_schema import BusinessCreate, BusinessUpdate
from src.repositories.business_repo import BusinessRepository

class BusinessNotFoundError(Exception):
    pass

class BusinessAlreadyExistsError(Exception):
    pass

class BusinessService:

    def __init__(self):
        self.business_repo = BusinessRepository()

    def create_business(self, db: Session, data: BusinessCreate):

        existing = self.business_repo.get_by_name(db, data.name)
        if existing:
            raise BusinessAlreadyExistsError()

        business = Business(
            name=data.name,
            type=data.type,
            timezone=data.timezone,
            api_key=data.api_key
        )

        self.business_repo.add(db, business)

        db.commit()
        db.refresh(business)

        return business

    def get_business(self, db: Session, business_id: int | None = None):

        if business_id is None:
            return self.business_repo.get_all(db)

        business = self.business_repo.get_by_id(db, business_id)

        if not business:
            raise BusinessNotFoundError()

        return business

    def update_business(self, db: Session, business_id: int, data: BusinessUpdate):

        business = self.business_repo.get_by_id(db, business_id)

        if not business:
            raise BusinessNotFoundError()

        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(business, field, value)

        db.commit()
        db.refresh(business)

        return business

    def delete_business(self, db: Session, business_id: int):
        
        business = self.business_repo.get_by_id(db, business_id)

        if not business:
            raise BusinessNotFoundError()

        self.business_repo.delete(db, business)

        db.commit()