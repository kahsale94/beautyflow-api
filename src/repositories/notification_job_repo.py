from datetime import datetime

from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session

from src.models import BusinessIntegration, NotificationJob
from src.models.notification_job_model import NotificationJobStatus


class NotificationJobRepository:
    def add(self, db: Session, job: NotificationJob) -> None:
        db.add(job)

    def get_by_dedup_key(
        self, db: Session, business_id: int, dedup_key: str
    ) -> NotificationJob | None:
        stmt = select(NotificationJob).where(
            NotificationJob.business_id == business_id,
            NotificationJob.dedup_key == dedup_key,
        )
        return db.scalars(stmt).one_or_none()

    def get_by_id_for_integration(
        self,
        db: Session,
        job_id: int,
        integration_id: int,
        *,
        for_update: bool = False,
    ) -> NotificationJob | None:
        stmt = (
            select(NotificationJob)
            .join(
                BusinessIntegration,
                and_(
                    BusinessIntegration.business_id == NotificationJob.business_id,
                    BusinessIntegration.integration_id == integration_id,
                    BusinessIntegration.is_active == True,
                ),
            )
            .where(NotificationJob.id == job_id)
        )
        if for_update:
            stmt = stmt.with_for_update(of=NotificationJob)
        return db.scalars(stmt).one_or_none()

    def claim_due(
        self,
        db: Session,
        integration_id: int,
        now: datetime,
        limit: int,
        max_attempts: int,
    ) -> list[NotificationJob]:
        claimable = or_(
            NotificationJob.status == NotificationJobStatus.pending,
            and_(
                NotificationJob.status == NotificationJobStatus.processing,
                or_(
                    NotificationJob.locked_until == None,
                    NotificationJob.locked_until <= now,
                ),
            ),
        )
        stmt = (
            select(NotificationJob)
            .join(
                BusinessIntegration,
                and_(
                    BusinessIntegration.business_id == NotificationJob.business_id,
                    BusinessIntegration.integration_id == integration_id,
                    BusinessIntegration.is_active == True,
                ),
            )
            .where(
                claimable,
                NotificationJob.scheduled_for <= now,
                NotificationJob.attempts < max_attempts,
            )
            .order_by(NotificationJob.scheduled_for, NotificationJob.id)
            .limit(limit)
            .with_for_update(skip_locked=True, of=NotificationJob)
        )
        return list(db.scalars(stmt).all())
