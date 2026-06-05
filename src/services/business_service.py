
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from src.models import Business
from src.core import DataBaseDep
from src.utils import normalize_phone
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
            not all(item.is_active for item in result)
        ):
            raise BusinessNotFoundError()

        return result

    def get_by_slug(self, business_name: str):
        result = self.business_repo.get_by_slug(self.db, business_name)

        return result
    
    def get_by_id(self, business_id: int):
        return self._get_valid(business_id)

    def create(self, data: BusinessCreate):
        phone = normalize_phone(data.phone)
        if not phone:
            raise ValueError("Telefone da empresa é obrigatório")

        business = Business(
            name = data.name,
            slug = data.slug,
            type = data.type,
            timezone = data.timezone,
            phone = phone,
            email = str(data.email) if data.email else None,
            address = data.address,
            city = data.city,
            state = data.state,
            description = data.description,
            booking_enabled = data.booking_enabled,
            slot_interval_minutes = data.slot_interval_minutes,
            minimum_notice_minutes = data.minimum_notice_minutes,
            maximum_schedule_days = data.maximum_schedule_days,
            allow_client_cancel = data.allow_client_cancel,
            cancel_limit_hours = data.cancel_limit_hours,
            appointment_confirmation_required = data.appointment_confirmation_required,
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

        if "email" in update_data and update_data["email"] is not None:
            update_data["email"] = str(update_data["email"])

        if "phone" in update_data and update_data["phone"] is not None:
            update_data["phone"] = normalize_phone(update_data["phone"])

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
        return self.deactivate(business_id)

def get_business_service(db: DataBaseDep):
    return BusinessService(
        db,
        BusinessRepository(),
    )
