from datetime import datetime
from enum import Enum as PyEnum
from typing import TYPE_CHECKING, Any, Optional

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String, UniqueConstraint, func, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.mutable import MutableDict
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base_model import Base, business_fk, integration_fk, intpk

if TYPE_CHECKING:
    from .business_model import Business
    from .integration_model import Integration


class WhatsAppProviderType(str, PyEnum):
    evolution = "evolution"
    covercut = "covercut"


class WhatsAppConnectionStatus(str, PyEnum):
    not_configured = "not_configured"
    connecting = "connecting"
    connected = "connected"
    disconnected = "disconnected"
    error = "error"


class WhatsAppConnection(Base):
    __tablename__ = "whatsapp_connections"
    __table_args__ = (
        UniqueConstraint("business_id", name="uq_whatsapp_connection_business"),
        UniqueConstraint(
            "provider",
            "provider_connection_id",
            name="uq_whatsapp_connection_provider_identifier",
        ),
        UniqueConstraint(
            "provider",
            "external_reference",
            name="uq_whatsapp_connection_provider_reference",
        ),
        CheckConstraint(
            "provider IN ('evolution', 'covercut')",
            name="ck_whatsapp_connections_provider",
        ),
        CheckConstraint(
            "status IN ('not_configured', 'connecting', 'connected', 'disconnected', 'error')",
            name="ck_whatsapp_connections_status",
        ),
    )

    id: Mapped[intpk]
    business_id: Mapped[business_fk]
    integration_id: Mapped[integration_fk]
    provider: Mapped[str] = mapped_column(String(32), nullable=False)
    provider_connection_id: Mapped[str] = mapped_column(String(191), nullable=False)
    provider_account_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    external_reference: Mapped[Optional[str]] = mapped_column(String(191), nullable=True)
    business_account_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default=WhatsAppConnectionStatus.connecting.value,
        server_default=WhatsAppConnectionStatus.connecting.value,
    )
    provider_status: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    provider_metadata: Mapped[dict[str, Any]] = mapped_column(
        "metadata",
        MutableDict.as_mutable(JSONB),
        nullable=False,
        default=dict,
        server_default=text("'{}'::jsonb"),
    )
    connected_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    disconnected_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    business: Mapped["Business"] = relationship(back_populates="whatsapp_connection")
    integration: Mapped["Integration"] = relationship(back_populates="whatsapp_connections")
    webhook_events: Mapped[list["WhatsAppWebhookEvent"]] = relationship(
        back_populates="connection",
        cascade="all, delete-orphan",
    )

    @property
    def connection_key(self) -> str:
        return f"{self.provider}:{self.provider_connection_id}"


class WhatsAppWebhookEvent(Base):
    __tablename__ = "whatsapp_webhook_events"
    __table_args__ = (
        UniqueConstraint("deduplication_key", name="uq_whatsapp_webhook_event_deduplication"),
        CheckConstraint(
            "status IN ('processing', 'processed', 'ignored', 'failed', 'indeterminate')",
            name="ck_whatsapp_webhook_events_status",
        ),
    )

    id: Mapped[intpk]
    connection_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("whatsapp_connections.id", ondelete="cascade"),
        nullable=True,
        index=True,
    )
    business_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("businesses.id", ondelete="cascade"),
        nullable=True,
        index=True,
    )
    provider: Mapped[str] = mapped_column(String(32), nullable=False)
    event_type: Mapped[str] = mapped_column(String(64), nullable=False)
    external_event_id: Mapped[str] = mapped_column(String(255), nullable=False)
    deduplication_key: Mapped[str] = mapped_column(String(64), nullable=False)
    payload_sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, server_default="processing")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    connection: Mapped[Optional["WhatsAppConnection"]] = relationship(back_populates="webhook_events")
