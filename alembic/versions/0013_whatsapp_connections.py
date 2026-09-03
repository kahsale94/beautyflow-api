"""add provider-agnostic whatsapp connections

Revision ID: 0013_whatsapp_connections
Revises: 0012_add_business_cep
Create Date: 2026-09-02 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0013_whatsapp_connections"
down_revision: Union[str, None] = "0012_add_business_cep"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "whatsapp_connections",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("business_id", sa.Integer(), nullable=False),
        sa.Column("integration_id", sa.Integer(), nullable=False),
        sa.Column("provider", sa.String(length=32), nullable=False),
        sa.Column("provider_connection_id", sa.String(length=191), nullable=False),
        sa.Column("provider_account_id", sa.String(length=100), nullable=True),
        sa.Column("external_reference", sa.String(length=191), nullable=True),
        sa.Column("business_account_id", sa.String(length=100), nullable=True),
        sa.Column("phone", sa.String(length=32), nullable=True),
        sa.Column("status", sa.String(length=32), server_default="connecting", nullable=False),
        sa.Column("provider_status", sa.String(length=64), nullable=True),
        sa.Column(
            "metadata",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
        sa.Column("connected_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("disconnected_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint(
            "provider IN ('evolution', 'covercut')",
            name="ck_whatsapp_connections_provider",
        ),
        sa.CheckConstraint(
            "status IN ('not_configured', 'connecting', 'connected', 'disconnected', 'error')",
            name="ck_whatsapp_connections_status",
        ),
        sa.ForeignKeyConstraint(["business_id"], ["businesses.id"], ondelete="cascade"),
        sa.ForeignKeyConstraint(["integration_id"], ["integrations.id"], ondelete="cascade"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("business_id", name="uq_whatsapp_connection_business"),
        sa.UniqueConstraint(
            "provider",
            "provider_connection_id",
            name="uq_whatsapp_connection_provider_identifier",
        ),
        sa.UniqueConstraint(
            "provider",
            "external_reference",
            name="uq_whatsapp_connection_provider_reference",
        ),
    )
    op.create_index(
        op.f("ix_whatsapp_connections_business_id"),
        "whatsapp_connections",
        ["business_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_whatsapp_connections_integration_id"),
        "whatsapp_connections",
        ["integration_id"],
        unique=False,
    )
    op.execute(
        sa.text(
            """
            INSERT INTO whatsapp_connections (
                business_id,
                integration_id,
                provider,
                provider_connection_id,
                provider_account_id,
                phone,
                status,
                provider_status,
                metadata,
                connected_at,
                created_at,
                updated_at
            )
            SELECT
                business_id,
                integration_id,
                'evolution',
                instance_name,
                instance_id,
                phone,
                CASE
                    WHEN lower(state) IN ('open', 'connected') THEN 'connected'
                    WHEN lower(state) IN ('new', 'creating', 'connecting') THEN 'connecting'
                    WHEN lower(state) IN ('close', 'closed', 'disconnected', 'missing') THEN 'disconnected'
                    ELSE 'error'
                END,
                state,
                '{"migrated_from":"evolution_instances"}'::jsonb,
                connected_at,
                created_at,
                updated_at
            FROM evolution_instances
            """
        )
    )

    op.create_table(
        "whatsapp_webhook_events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("connection_id", sa.Integer(), nullable=True),
        sa.Column("business_id", sa.Integer(), nullable=True),
        sa.Column("provider", sa.String(length=32), nullable=False),
        sa.Column("event_type", sa.String(length=64), nullable=False),
        sa.Column("external_event_id", sa.String(length=255), nullable=False),
        sa.Column("deduplication_key", sa.String(length=64), nullable=False),
        sa.Column("payload_sha256", sa.String(length=64), nullable=False),
        sa.Column("status", sa.String(length=32), server_default="processing", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint(
            "status IN ('processing', 'processed', 'ignored', 'failed', 'indeterminate')",
            name="ck_whatsapp_webhook_events_status",
        ),
        sa.ForeignKeyConstraint(["business_id"], ["businesses.id"], ondelete="cascade"),
        sa.ForeignKeyConstraint(["connection_id"], ["whatsapp_connections.id"], ondelete="cascade"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("deduplication_key", name="uq_whatsapp_webhook_event_deduplication"),
    )
    op.create_index(
        op.f("ix_whatsapp_webhook_events_business_id"),
        "whatsapp_webhook_events",
        ["business_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_whatsapp_webhook_events_connection_id"),
        "whatsapp_webhook_events",
        ["connection_id"],
        unique=False,
    )


def downgrade() -> None:
    op.execute(
        sa.text(
            """
            INSERT INTO evolution_instances (
                business_id,
                integration_id,
                instance_name,
                instance_id,
                phone,
                state,
                connected_at,
                created_at,
                updated_at
            )
            SELECT
                business_id,
                integration_id,
                provider_connection_id,
                provider_account_id,
                phone,
                COALESCE(provider_status, CASE WHEN status = 'connected' THEN 'open' ELSE status END),
                connected_at,
                created_at,
                updated_at
            FROM whatsapp_connections
            WHERE provider = 'evolution'
            ON CONFLICT (business_id) DO UPDATE SET
                integration_id = EXCLUDED.integration_id,
                instance_name = EXCLUDED.instance_name,
                instance_id = EXCLUDED.instance_id,
                phone = EXCLUDED.phone,
                state = EXCLUDED.state,
                connected_at = EXCLUDED.connected_at,
                updated_at = EXCLUDED.updated_at
            """
        )
    )

    op.drop_index(op.f("ix_whatsapp_webhook_events_connection_id"), table_name="whatsapp_webhook_events")
    op.drop_index(op.f("ix_whatsapp_webhook_events_business_id"), table_name="whatsapp_webhook_events")
    op.drop_table("whatsapp_webhook_events")
    op.drop_index(op.f("ix_whatsapp_connections_integration_id"), table_name="whatsapp_connections")
    op.drop_index(op.f("ix_whatsapp_connections_business_id"), table_name="whatsapp_connections")
    op.drop_table("whatsapp_connections")
