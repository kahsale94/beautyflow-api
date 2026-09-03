from sqlalchemy import select
from sqlalchemy.orm import Session

from src.models import WhatsAppConnection, WhatsAppWebhookEvent


class WhatsAppConnectionRepository:
    def add(self, db: Session, connection: WhatsAppConnection) -> None:
        db.add(connection)

    def delete(self, db: Session, connection: WhatsAppConnection) -> None:
        db.delete(connection)

    def get_by_business(
        self,
        db: Session,
        business_id: int,
        integration_id: int | None = None,
        *,
        for_update: bool = False,
    ) -> WhatsAppConnection | None:
        stmt = select(WhatsAppConnection).where(WhatsAppConnection.business_id == business_id)
        if integration_id is not None:
            stmt = stmt.where(WhatsAppConnection.integration_id == integration_id)
        if for_update:
            stmt = stmt.with_for_update()
        return db.scalars(stmt).one_or_none()

    def get_by_provider_connection_id(
        self,
        db: Session,
        provider: str,
        provider_connection_id: str,
        integration_id: int | None = None,
    ) -> WhatsAppConnection | None:
        stmt = select(WhatsAppConnection).where(
            WhatsAppConnection.provider == provider,
            WhatsAppConnection.provider_connection_id == provider_connection_id,
        )
        if integration_id is not None:
            stmt = stmt.where(WhatsAppConnection.integration_id == integration_id)
        return db.scalars(stmt).one_or_none()

    def get_by_connection_key(
        self,
        db: Session,
        connection_key: str,
        integration_id: int | None = None,
    ) -> WhatsAppConnection | None:
        provider, separator, provider_connection_id = connection_key.strip().partition(":")
        if not separator or not provider or not provider_connection_id:
            return None
        return self.get_by_provider_connection_id(
            db,
            provider.lower(),
            provider_connection_id,
            integration_id,
        )

    def get_by_external_reference(
        self,
        db: Session,
        provider: str,
        external_reference: str,
        *,
        for_update: bool = False,
    ) -> WhatsAppConnection | None:
        stmt = select(WhatsAppConnection).where(
            WhatsAppConnection.provider == provider,
            WhatsAppConnection.external_reference == external_reference,
        )
        if for_update:
            stmt = stmt.with_for_update()
        return db.scalars(stmt).one_or_none()


class WhatsAppWebhookEventRepository:
    def add(self, db: Session, event: WhatsAppWebhookEvent) -> None:
        db.add(event)

    def get_by_deduplication_key(
        self,
        db: Session,
        deduplication_key: str,
        *,
        for_update: bool = False,
    ) -> WhatsAppWebhookEvent | None:
        stmt = select(WhatsAppWebhookEvent).where(
            WhatsAppWebhookEvent.deduplication_key == deduplication_key
        )
        if for_update:
            stmt = stmt.with_for_update()
        return db.scalars(stmt).one_or_none()
