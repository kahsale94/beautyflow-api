from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, ForeignKeyConstraint, Index, String, UniqueConstraint, func, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base_model import Base, business_fk, intpk

if TYPE_CHECKING:
    from .business_model import Business
    from .client_model import Client
    from .whatsapp_connection_model import WhatsAppConnection


class Contact(Base):
    __tablename__ = "contacts"
    __table_args__ = (
        ForeignKeyConstraint(
            ["client_id", "business_id"],
            ["clients.id", "clients.business_id"],
            name="fk_contacts_client_business",
            ondelete="RESTRICT",
        ),
        UniqueConstraint("client_id", name="uq_contacts_client"),
        CheckConstraint(
            "provider IS NULL OR provider IN ('evolution', 'covercut')",
            name="ck_contacts_provider",
        ),
        CheckConstraint("bot_policy IN ('BOT', 'HUMAN', 'AUTO')", name="ck_contacts_bot_policy"),
        CheckConstraint(
            "source IN ('client_backfill', 'client', 'covercut_sync', 'inbound')",
            name="ck_contacts_source",
        ),
        CheckConstraint(
            "provider_user_id IS NOT NULL OR wa_id IS NOT NULL OR phone IS NOT NULL OR username IS NOT NULL",
            name="ck_contacts_has_identity",
        ),
        Index("uq_contacts_business_phone", "business_id", "phone", unique=True, postgresql_where=text("phone IS NOT NULL")),
        Index("uq_contacts_business_provider_user", "business_id", "provider", "provider_user_id", unique=True, postgresql_where=text("provider IS NOT NULL AND provider_user_id IS NOT NULL")),
        Index("uq_contacts_business_provider_wa", "business_id", "provider", "wa_id", unique=True, postgresql_where=text("provider IS NOT NULL AND wa_id IS NOT NULL")),
        Index("uq_contacts_business_provider_username", "business_id", "provider", "username", unique=True, postgresql_where=text("provider IS NOT NULL AND username IS NOT NULL")),
    )

    id: Mapped[intpk]
    business_id: Mapped[business_fk]
    client_id: Mapped[Optional[int]] = mapped_column(nullable=True, index=True)
    whatsapp_connection_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("whatsapp_connections.id", ondelete="SET NULL"), nullable=True, index=True
    )
    provider: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    provider_user_id: Mapped[Optional[str]] = mapped_column(String(191), nullable=True)
    parent_provider_user_id: Mapped[Optional[str]] = mapped_column(String(191), nullable=True)
    wa_id: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    username: Mapped[Optional[str]] = mapped_column(String(191), nullable=True)
    name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    source: Mapped[str] = mapped_column(String(32), nullable=False, server_default="inbound")
    is_saved: Mapped[bool] = mapped_column(nullable=False, default=False, server_default="false")
    bot_policy: Mapped[str] = mapped_column(String(16), nullable=False, server_default="AUTO")
    policy_manually_overridden: Mapped[bool] = mapped_column(nullable=False, default=False, server_default="false")
    last_seen_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    synced_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    business: Mapped["Business"] = relationship(back_populates="contacts", overlaps="client,contact")
    client: Mapped[Optional["Client"]] = relationship(back_populates="contact", overlaps="business,contacts")
    whatsapp_connection: Mapped[Optional["WhatsAppConnection"]] = relationship(back_populates="contacts")
