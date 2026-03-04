from sqlalchemy import select
from sqlalchemy.orm import Session

from src.models import BusinessIntegration

class BusinessIntegrationRepository:

    def add(self, db: Session, business_integration: BusinessIntegration):
        db.add(business_integration)

    def get_by_ids(self, db: Session, business_id, integration_id):
        stmt = select(BusinessIntegration).where(
            BusinessIntegration.integration_id == integration_id,
            BusinessIntegration.business_id == business_id,
        )
        return db.scalar(stmt)
    
    def get_by_business(self, db: Session, business_id):
        stmt = select(BusinessIntegration).where(
            BusinessIntegration.business_id == business_id,
        )
        return db.scalar(stmt)

    def delete(self, db: Session, business_integration: BusinessIntegration):
        db.delete(business_integration)