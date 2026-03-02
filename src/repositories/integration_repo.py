from sqlalchemy.orm import Session

from src.models import Integration

class IntegrationRepository:
        
    def add(self, db: Session, integration: Integration):
        db.add(integration)

    def delete(self, db: Session, integration: Integration):
        db.delete(integration)

    def get_by_id(self, db: Session, integration_id: int):
        return db.get(Integration, integration_id)