from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from src.core import DataBaseDep
from src.security import ActorSecurity
from src.models import BusinessIntegration
from src.repositories import BusinessIntegrationRepository
from src.schemas import BusinessIntegrationCreate, BusinessIntegrationUpdate

class BusinessIntegrationNotFoundError(Exception):
    pass

class BusinessIntegrationAlreadyExistsError(Exception):
    pass

class BusinessIntegrationService:

    def __init__(
        self,
        db: Session,
        business_integration_repo: BusinessIntegrationRepository,
    ):
        self.db = db
        self.business_integration_repo = business_integration_repo

    def _get_valid(self, business_id: int, integration_id: int):
        result = self.business_integration_repo.get_by_ids(self.db, business_id, integration_id)
        if (
            not result
            or not result.is_active
            or result.business_id != business_id
            or result.integration_id != integration_id
        ):
            raise BusinessIntegrationNotFoundError()

        return result

    def get_all(self, business_id: int):
        result = self.business_integration_repo.get_by_business(self.db, business_id)
        if (
            not result
            or not all(item.is_active for item in result)
            or not all(item.business_id == business_id for item in result)
        ):
            raise BusinessIntegrationNotFoundError()

        return result

    def get_by_ids(self, business_id: int, integration_id: int):
        return self._get_valid(business_id, integration_id)

    def create(self, business_id: int, data: BusinessIntegrationCreate):
        result = BusinessIntegration(
            business_id = business_id,
            integration_id = data.integration_id,
            config = data.config or {},
        )

        self.business_integration_repo.add(self.db, result)

        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise BusinessIntegrationAlreadyExistsError()
        
        self.db.refresh(result)

        return result

    def update_config(self, business_id: int, integration_id: int, data: BusinessIntegrationUpdate):
        result = self._get_valid(business_id, integration_id)

        update_data = data.model_dump(exclude_unset=True)

        if update_data.get("config"):
            result.config = result.config or {}

            for key, value in update_data["config"].items():
                result.config[key] = value

        self.db.commit()
        self.db.refresh(result)

        return result

    def update_key(self, business_id: int, integration_id: int):
        self._get_valid(business_id, integration_id)

        new_token = ActorSecurity.create_business_integration_token(
            business_id,
            integration_id
        )

        return new_token

    def deactivate(self, business_id: int, integration_id: int):
        result = self._get_valid(business_id, integration_id)

        result.is_active = False

        self.db.commit()

        return

    def delete(self, business_id: int, integration_id: int):
        result = self._get_valid(business_id, integration_id)

        self.business_integration_repo.delete(self.db, result)
        self.db.commit()

        return

def get_business_integration_service(db: DataBaseDep):
    return BusinessIntegrationService(
        db,
        BusinessIntegrationRepository(),
    )