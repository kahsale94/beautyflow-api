from sqlalchemy.orm import Session

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

    def create_business_integration(self, business_id: int, integration: BusinessIntegrationCreate):
        existing = self.business_integration_repo.get_by_ids(self.db, business_id, integration.integration_id)
        if existing:
            raise BusinessIntegrationAlreadyExistsError()

        config = integration.config or {}

        record = BusinessIntegration(
            business_id = business_id,
            integration_id = integration.integration_id,
            config = config,
        )

        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)
        
        return record
    
    def get_business_integration(self, business_id: int, integration_id: int | None = None):
        if integration_id is None:
            result = self.business_integration_repo.get_by_business(self.db, business_id)
        else:
            result = self.business_integration_repo.get_by_ids(self.db, business_id, integration_id)

        if not result:
            raise BusinessIntegrationNotFoundError()
        
        return result
    
    def update_config(self, business_id: int, integration_id: int, data: BusinessIntegrationUpdate):
        record = self.business_integration_repo.get_by_ids(self.db, business_id, integration_id)
        if not record:
            raise BusinessIntegrationNotFoundError()

        config = record.config or {}

        for key, value in data.config.items():
            config[key] = value

        record.config = config

        self.db.commit()
        self.db.refresh(record)

        return record
    
    def deactive_business_integration(self, business_id: int, integration_id: int):
        result = self.business_integration_repo.get_by_ids(self.db, business_id, integration_id)
        if not result:
            raise BusinessIntegrationNotFoundError()
        
        result.is_active = False

        self.db.commit()
        self.db.refresh(result)
        
        return
    
    def update_key(self, business_id: int, integration_id: int):
        result = self.business_integration_repo.get_by_ids(self.db, business_id, integration_id)
        if not result:
            raise BusinessIntegrationNotFoundError()

        new_token = ActorSecurity.create_business_integration_token(self.db, business_id, integration_id)
        
        return new_token

def get_business_integration_service(db: DataBaseDep):
    return BusinessIntegrationService(
        db,
        BusinessIntegrationRepository(),
    )