"""add provider-neutral contacts and ownership policy

Revision ID: 0014_contacts_ownership
Revises: 0013_whatsapp_connections
Create Date: 2026-09-07 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0014_contacts_ownership"
down_revision: Union[str, None] = "0013_whatsapp_connections"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_unique_constraint("uq_clients_id_business", "clients", ["id", "business_id"])
    op.create_table(
        "contacts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("business_id", sa.Integer(), nullable=False),
        sa.Column("client_id", sa.Integer(), nullable=True),
        sa.Column("whatsapp_connection_id", sa.Integer(), nullable=True),
        sa.Column("provider", sa.String(32), nullable=True),
        sa.Column("provider_user_id", sa.String(191), nullable=True),
        sa.Column("parent_provider_user_id", sa.String(191), nullable=True),
        sa.Column("wa_id", sa.String(32), nullable=True),
        sa.Column("phone", sa.String(32), nullable=True),
        sa.Column("username", sa.String(191), nullable=True),
        sa.Column("name", sa.String(255), nullable=True),
        sa.Column("source", sa.String(32), server_default="inbound", nullable=False),
        sa.Column("is_saved", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("bot_policy", sa.String(16), server_default="AUTO", nullable=False),
        sa.Column("policy_manually_overridden", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("synced_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("provider IS NULL OR provider IN ('evolution', 'covercut')", name="ck_contacts_provider"),
        sa.CheckConstraint("bot_policy IN ('BOT', 'HUMAN', 'AUTO')", name="ck_contacts_bot_policy"),
        sa.CheckConstraint("source IN ('client_backfill', 'client', 'covercut_sync', 'inbound')", name="ck_contacts_source"),
        sa.CheckConstraint("provider_user_id IS NOT NULL OR wa_id IS NOT NULL OR phone IS NOT NULL OR username IS NOT NULL", name="ck_contacts_has_identity"),
        sa.ForeignKeyConstraint(["business_id"], ["businesses.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["client_id", "business_id"], ["clients.id", "clients.business_id"], name="fk_contacts_client_business", ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["whatsapp_connection_id"], ["whatsapp_connections.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("client_id", name="uq_contacts_client"),
    )
    op.create_index(op.f("ix_contacts_business_id"), "contacts", ["business_id"], unique=False)
    op.create_index(op.f("ix_contacts_client_id"), "contacts", ["client_id"], unique=False)
    op.create_index(op.f("ix_contacts_whatsapp_connection_id"), "contacts", ["whatsapp_connection_id"], unique=False)
    op.create_index("uq_contacts_business_phone", "contacts", ["business_id", "phone"], unique=True, postgresql_where=sa.text("phone IS NOT NULL"))
    op.create_index("uq_contacts_business_provider_user", "contacts", ["business_id", "provider", "provider_user_id"], unique=True, postgresql_where=sa.text("provider IS NOT NULL AND provider_user_id IS NOT NULL"))
    op.create_index("uq_contacts_business_provider_wa", "contacts", ["business_id", "provider", "wa_id"], unique=True, postgresql_where=sa.text("provider IS NOT NULL AND wa_id IS NOT NULL"))
    op.create_index("uq_contacts_business_provider_username", "contacts", ["business_id", "provider", "username"], unique=True, postgresql_where=sa.text("provider IS NOT NULL AND username IS NOT NULL"))
    op.execute(sa.text("""
        INSERT INTO contacts (
            business_id, client_id, whatsapp_connection_id, provider, wa_id, phone, name,
            source, is_saved, bot_policy, policy_manually_overridden, created_at, updated_at
        )
        SELECT c.business_id, c.id, wc.id, wc.provider, c.phone, c.phone, c.name,
               'client_backfill', false, 'BOT', false, now(), now()
        FROM clients c
        LEFT JOIN whatsapp_connections wc ON wc.business_id = c.business_id
        ON CONFLICT DO NOTHING
    """))


def downgrade() -> None:
    op.drop_index("uq_contacts_business_provider_username", table_name="contacts")
    op.drop_index("uq_contacts_business_provider_wa", table_name="contacts")
    op.drop_index("uq_contacts_business_provider_user", table_name="contacts")
    op.drop_index("uq_contacts_business_phone", table_name="contacts")
    op.drop_index(op.f("ix_contacts_whatsapp_connection_id"), table_name="contacts")
    op.drop_index(op.f("ix_contacts_client_id"), table_name="contacts")
    op.drop_index(op.f("ix_contacts_business_id"), table_name="contacts")
    op.drop_table("contacts")
    op.drop_constraint("uq_clients_id_business", "clients", type_="unique")
