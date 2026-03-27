from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from src.core import DataBaseDep
from src.models import Integration
from src.security import ActorSecurity
from src.repositories import IntegrationRepository
from src.schemas import IntegrationCreate, IntegrationUpdate, IntegrationCreateResponse

class IntegrationNotFoundError(Exception):
    pass

class IntegrationAlreadyExistsError(Exception):
    pass

class IntegrationService:

    def __init__(
        self,
        db: Session,
        integration_repo: IntegrationRepository,
    ):
        self.db = db
        self.integration_repo = integration_repo

    def _get_valid(self, integration_id):
        integration = self.integration_repo.get_by_id(self.db, integration_id)
        if (
            not integration
            or not integration.is_active
        ):
            raise IntegrationNotFoundError()

        return integration

    def get_all(self):
        result = self.integration_repo.get_all(self.db)
        if (
            not result
            or not all(item.is_active for item in result)
        ):
            raise IntegrationNotFoundError()

        return result
    
    def get_by_id(self, integration_id: int):
        return self._get_valid(integration_id)
    
    def get_by_name(self, integration_name: str):
        result = self.integration_repo.get_by_name(self.db, integration_name)
        if (
            not result
            or not result.is_active
        ):
            raise IntegrationNotFoundError()

        return result

    def create(self, data: IntegrationCreate):
        integration = Integration(
            name = data.name,
            type = data.type,
        )

        self.integration_repo.add(self.db, integration)
        self.db.flush()

        api_token = ActorSecurity.create_integration_token(integration.id)
        integration.api_token_hash = ActorSecurity.hash(api_token)

        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise IntegrationAlreadyExistsError()

        self.db.refresh(integration)

        return IntegrationCreateResponse(
            id = integration.id,
            name = integration.name,
            type = integration.type,
            api_token = api_token,
            created_at = integration.created_at,
            is_active = integration.is_active,
        )

    def update(self, integration_id: int, data: IntegrationUpdate):
        integration = self._get_valid(integration_id)

        update_data = data.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(integration, field, value)

        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise IntegrationAlreadyExistsError()
        
        self.db.refresh(integration)

        return integration
    
    def deactivate(self, integration_id: int):
        integration = self._get_valid(integration_id)

        integration.is_active = False

        self.db.commit()

        return

    def delete(self, integration_id: int):
        integration = self._get_valid(integration_id)

        self.integration_repo.delete(self.db, integration)
        self.db.commit()

        return

def get_integration_service(db: DataBaseDep):
    return IntegrationService(
        db,
        IntegrationRepository(),
    )