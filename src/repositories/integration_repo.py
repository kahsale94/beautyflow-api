from sqlalchemy import select
from sqlalchemy.orm import Session

from src.models import Integration

class IntegrationRepository:
        
    def add(self, db: Session, integration: Integration):
        db.add(integration)

    def delete(self, db: Session, integration: Integration):
        db.delete(integration)

    def get_by_id(self, db: Session, integration_id: int):
        return db.get(Integration, integration_id)
    
    def get_by_name(self, db: Session, integration_name: str):
        stmt = select(Integration).where(Integration.name == integration_name)
        return db.scalars(stmt).first()
    
    def get_all(self, db: Session):
        stmt = select(Integration)
        return db.scalars(stmt).all()