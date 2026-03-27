from sqlalchemy import select
from sqlalchemy.orm import Session

from src.models import BusinessIntegration


class BusinessIntegrationRepository:

    def add(self, db: Session, business_integration: BusinessIntegration):
        db.add(business_integration)

    def delete(self, db: Session, business_integration: BusinessIntegration):
        db.delete(business_integration)

    def get_by_ids(self, db: Session, business_id: int, integration_id: int):
        stmt = select(BusinessIntegration).where(
            BusinessIntegration.is_active == True,
            BusinessIntegration.business_id == business_id,
            BusinessIntegration.integration_id == integration_id,
        )
        return db.scalars(stmt).one_or_none()

    def get_by_business(self, db: Session, business_id: int):
        stmt = select(BusinessIntegration).where(
            BusinessIntegration.is_active == True,
            BusinessIntegration.business_id == business_id,
        )
        return db.scalars(stmt).all()