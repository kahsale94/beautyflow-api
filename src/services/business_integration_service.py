from sqlalchemy.orm import Session

from src.core import DataBaseDep
from src.security import ActorSecurity
from src.models import BusinessIntegration
from src.repositories import BusinessIntegrationRepository

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

    def create_business_integration(self, business_id: int, integration_id: int):
        existing = self.business_integration_repo.get_by_ids(self.db, business_id, integration_id)
        if existing:
            raise BusinessIntegrationAlreadyExistsError()

        record = BusinessIntegration(
            business_id=business_id,
            integration_id=integration_id,
            is_active=True
        )

        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)

        token = ActorSecurity.create_integration_token(self.db, business_id, integration_id)

        return {
            "token": token
        }
    
    def get_business_integration(self, business_id: int, integration_id: int | None = None):
        if integration_id is None:
            result = self.business_integration_repo.get_by_business(self.db, business_id)
        else:
            result = self.business_integration_repo.get_by_ids(self.db, business_id, integration_id)

        if not result:
            raise BusinessIntegrationNotFoundError()
        
        return result
    
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

        new_token = ActorSecurity.create_integration_token(self.db, business_id, integration_id)
        
        return new_token

def get_business_integration_service(db: DataBaseDep):
    return BusinessIntegrationService(
        db,
        BusinessIntegrationRepository(),
    )