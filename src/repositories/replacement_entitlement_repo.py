from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from src.models import ReplacementEntitlement
from src.models.replacement_entitlement_model import ReplacementEntitlementStatus


class ReplacementEntitlementRepository:
    def add(self, db: Session, entitlement: ReplacementEntitlement) -> None:
        db.add(entitlement)

    def get_by_id(
        self,
        db: Session,
        business_id: int,
        entitlement_id: int,
        *,
        for_update: bool = False,
    ) -> ReplacementEntitlement | None:
        stmt = select(ReplacementEntitlement).where(
            ReplacementEntitlement.business_id == business_id,
            ReplacementEntitlement.id == entitlement_id,
        )
        if for_update:
            stmt = stmt.with_for_update()
        return db.scalars(stmt).one_or_none()

    def get_by_source(
        self,
        db: Session,
        business_id: int,
        source_appointment_id: int,
        *,
        for_update: bool = False,
    ) -> ReplacementEntitlement | None:
        stmt = select(ReplacementEntitlement).where(
            ReplacementEntitlement.business_id == business_id,
            ReplacementEntitlement.source_appointment_id == source_appointment_id,
        )
        if for_update:
            stmt = stmt.with_for_update()
        return db.scalars(stmt).one_or_none()

    def get_by_business(
        self,
        db: Session,
        business_id: int,
        *,
        client_id: int | None = None,
        status: ReplacementEntitlementStatus | None = None,
    ) -> list[ReplacementEntitlement]:
        stmt = select(ReplacementEntitlement).where(
            ReplacementEntitlement.business_id == business_id
        )
        if client_id is not None:
            stmt = stmt.where(ReplacementEntitlement.client_id == client_id)
        if status is not None:
            stmt = stmt.where(ReplacementEntitlement.status == status)
        stmt = stmt.order_by(ReplacementEntitlement.expires_at, ReplacementEntitlement.id)
        return list(db.scalars(stmt).all())

    def get_expired_available(
        self,
        db: Session,
        business_id: int,
        now: datetime,
    ) -> list[ReplacementEntitlement]:
        stmt = (
            select(ReplacementEntitlement)
            .where(
                ReplacementEntitlement.business_id == business_id,
                ReplacementEntitlement.status == ReplacementEntitlementStatus.available,
                ReplacementEntitlement.expires_at <= now,
            )
            .order_by(ReplacementEntitlement.id)
            .with_for_update()
        )
        return list(db.scalars(stmt).all())
