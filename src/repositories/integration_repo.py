from sqlalchemy.orm import Session
from sqlalchemy import select, func

from src.models import Integration

class IntegrationRepository:
        
    def add(self, db: Session, integration: Integration):
        db.add(integration)

    def delete(self, db: Session, integration: Integration):
        db.delete(integration)

    def get_by_id(self, db: Session, integration_id: int):
        stmt = select(Integration).where(
            Integration.is_active == True,
            Integration.id == integration_id,
        )
        return db.scalars(stmt).one_or_none()
    
    def get_by_name(self, db: Session, integration_name: str):
        similarity_score = func.similarity(Integration.name, integration_name)

        stmt = (select(Integration).where(
            Integration.is_active == True,
            (
                Integration.name.ilike(f"%{integration_name}%")
                | (similarity_score > 0.4)
            ),
        )
        .order_by(similarity_score.desc())
        .limit(20)
        )

        return db.scalars(stmt).all()
    
    def get_all(self, db: Session):
        stmt = select(Integration).where(
            Integration.is_active == True,
        )
        return db.scalars(stmt).all()