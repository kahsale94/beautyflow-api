from sqlalchemy.orm import Session

from src.core import DataBaseDep
from src.models import Integration
from src.security import ActorSecurity
from src.repositories import IntegrationRepository
from src.schemas import IntegrationCreate, IntegrationUpdate

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

    def create_integration(self, data: IntegrationCreate):
        existing = self.integration_repo.get_by_name(self.db, data.name)
        if existing:
            raise IntegrationAlreadyExistsError()

        integration = Integration(
            name = data.name,
            type = data.type,
        )

        self.integration_repo.add(self.db, integration)
        self.db.flush()

        api_token = ActorSecurity.create_integration_token(integration.id)
        integration.api_token_hash = ActorSecurity.hash(api_token)

        self.db.commit()
        self.db.refresh(integration)

        return {
            "id": integration.id,
            "name": integration.name,
            "type": integration.type,
            "api_token": api_token,
            "created_at": integration.created_at,
            "is_active": integration.is_active,
        }

    def get_integration(self, integration_id: int | None = None):
        if integration_id is None:
            return self.integration_repo.get_all(self.db)

        integration = self.integration_repo.get_by_id(self.db, integration_id)
        if not integration or not integration.is_active:
            raise IntegrationNotFoundError()

        return integration

    def update_integration(self, integration_id: int, data: IntegrationUpdate):
        integration = self.integration_repo.get_by_id(self.db, integration_id)
        if not integration or not integration.is_active:
            raise IntegrationNotFoundError()

        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(integration, field, value)

        self.db.commit()
        self.db.refresh(integration)

        return integration

    def delete_integration(self, integration_id: int):
        integration = self.integration_repo.get_by_id(self.db, integration_id)
        if not integration or not integration.is_active:
            raise IntegrationNotFoundError()

        self.integration_repo.delete(self.db, integration)

        self.db.commit()

def get_integration_service(db: DataBaseDep):
    return IntegrationService(
        db,
        IntegrationRepository(),
    )