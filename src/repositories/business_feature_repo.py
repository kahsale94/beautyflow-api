from sqlalchemy import select
from sqlalchemy.orm import Session

from src.models import BusinessFeature
from src.models.business_feature_model import BusinessFeatureKey


class BusinessFeatureRepository:
    def add(self, db: Session, feature: BusinessFeature) -> None:
        db.add(feature)

    def get_by_key(
        self,
        db: Session,
        business_id: int,
        feature_key: BusinessFeatureKey,
        *,
        for_update: bool = False,
    ) -> BusinessFeature | None:
        stmt = select(BusinessFeature).where(
            BusinessFeature.business_id == business_id,
            BusinessFeature.feature_key == feature_key,
        )
        if for_update:
            stmt = stmt.with_for_update()
        return db.scalars(stmt).one_or_none()

    def get_by_business(self, db: Session, business_id: int) -> list[BusinessFeature]:
        stmt = (
            select(BusinessFeature)
            .where(BusinessFeature.business_id == business_id)
            .order_by(BusinessFeature.feature_key)
        )
        return list(db.scalars(stmt).all())
