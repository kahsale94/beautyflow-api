"""add replacement entitlements

Revision ID: 0019_replacement_entitlements
Revises: 0018_recurring_schedules
Create Date: 2026-09-08 01:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0019_replacement_entitlements"
down_revision: Union[str, None] = "0018_recurring_schedules"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


replacementstatus = postgresql.ENUM(
    "available", "used", "expired", "forfeited",
    name="replacemententitlementstatus",
    create_type=False,
)
replacementreason = postgresql.ENUM(
    "client_cancellation", "professional_unavailable", "business_unavailable", "manual",
    name="replacemententitlementreason",
    create_type=False,
)


def upgrade() -> None:
    bind = op.get_bind()
    replacementstatus.create(bind, checkfirst=True)
    replacementreason.create(bind, checkfirst=True)
    op.create_table(
        "replacement_entitlements",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("business_id", sa.Integer(), nullable=False),
        sa.Column("client_id", sa.Integer(), nullable=False),
        sa.Column("source_appointment_id", sa.Integer(), nullable=False),
        sa.Column("status", replacementstatus, server_default="available", nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("reason", replacementreason, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["business_id"], ["businesses.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["client_id"], ["clients.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["source_appointment_id"], ["appointments.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("source_appointment_id", name="uq_replacement_entitlements_source_appointment"),
    )
    op.create_index(op.f("ix_replacement_entitlements_business_id"), "replacement_entitlements", ["business_id"])
    op.create_index(op.f("ix_replacement_entitlements_client_id"), "replacement_entitlements", ["client_id"])
    op.create_index(op.f("ix_replacement_entitlements_source_appointment_id"), "replacement_entitlements", ["source_appointment_id"])
    op.create_index(op.f("ix_replacement_entitlements_status"), "replacement_entitlements", ["status"])
    op.create_index(op.f("ix_replacement_entitlements_expires_at"), "replacement_entitlements", ["expires_at"])

    op.add_column("appointments", sa.Column("replacement_entitlement_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_appointments_replacement_entitlement_id",
        "appointments",
        "replacement_entitlements",
        ["replacement_entitlement_id"],
        ["id"],
        ondelete="RESTRICT",
    )
    op.create_index(
        "uq_appointments_replacement_entitlement_id",
        "appointments",
        ["replacement_entitlement_id"],
        unique=True,
        postgresql_where=sa.text("replacement_entitlement_id IS NOT NULL"),
    )


def downgrade() -> None:
    op.drop_index("uq_appointments_replacement_entitlement_id", table_name="appointments")
    op.drop_constraint("fk_appointments_replacement_entitlement_id", "appointments", type_="foreignkey")
    op.drop_column("appointments", "replacement_entitlement_id")
    op.drop_index(op.f("ix_replacement_entitlements_expires_at"), table_name="replacement_entitlements")
    op.drop_index(op.f("ix_replacement_entitlements_status"), table_name="replacement_entitlements")
    op.drop_index(op.f("ix_replacement_entitlements_source_appointment_id"), table_name="replacement_entitlements")
    op.drop_index(op.f("ix_replacement_entitlements_client_id"), table_name="replacement_entitlements")
    op.drop_index(op.f("ix_replacement_entitlements_business_id"), table_name="replacement_entitlements")
    op.drop_table("replacement_entitlements")
    bind = op.get_bind()
    replacementreason.drop(bind, checkfirst=True)
    replacementstatus.drop(bind, checkfirst=True)
