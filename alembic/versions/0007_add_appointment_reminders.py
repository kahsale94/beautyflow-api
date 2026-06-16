"""add appointment reminders

Revision ID: 0007_add_appointment_reminders
Revises: 0006_backfill_business_slugs
Create Date: 2026-06-16 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0007_add_appointment_reminders"
down_revision: Union[str, None] = "0006_backfill_business_slugs"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


appointmentreminderstatus = postgresql.ENUM(
    "pending",
    "processing",
    "sent",
    "failed",
    "skipped",
    name="appointmentreminderstatus",
    create_type=False,
)


def upgrade() -> None:
    bind = op.get_bind()
    appointmentreminderstatus.create(bind, checkfirst=True)

    op.create_table(
        "appointment_reminders",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("appointment_id", sa.Integer(), nullable=False),
        sa.Column("business_id", sa.Integer(), nullable=False),
        sa.Column("reminder_type", sa.String(length=40), server_default="appointment_upcoming", nullable=False),
        sa.Column("appointment_start_datetime", sa.DateTime(timezone=True), nullable=False),
        sa.Column("scheduled_for", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", appointmentreminderstatus, server_default="pending", nullable=False),
        sa.Column("attempts", sa.Integer(), server_default="0", nullable=False),
        sa.Column("locked_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("failed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column("external_message_id", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("attempts >= 0", name="ck_appointment_reminders_attempts_non_negative"),
        sa.ForeignKeyConstraint(["appointment_id"], ["appointments.id"], ondelete="cascade"),
        sa.ForeignKeyConstraint(["business_id"], ["businesses.id"], ondelete="cascade"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ux_appointment_reminders_upcoming_snapshot",
        "appointment_reminders",
        ["appointment_id", "reminder_type", "appointment_start_datetime"],
        unique=True,
        postgresql_where=sa.text("reminder_type = 'appointment_upcoming'"),
    )
    op.create_index(
        "ux_appointment_reminders_active_manual_snapshot",
        "appointment_reminders",
        ["appointment_id", "reminder_type", "appointment_start_datetime"],
        unique=True,
        postgresql_where=sa.text("reminder_type = 'appointment_manual' AND status IN ('pending', 'processing')"),
    )
    op.create_index(
        "ix_appointment_reminders_claim",
        "appointment_reminders",
        ["status", "scheduled_for", "locked_until"],
        unique=False,
    )
    op.create_index(
        op.f("ix_appointment_reminders_appointment_id"),
        "appointment_reminders",
        ["appointment_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_appointment_reminders_business_id"),
        "appointment_reminders",
        ["business_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_appointment_reminders_scheduled_for"),
        "appointment_reminders",
        ["scheduled_for"],
        unique=False,
    )
    op.create_index(
        op.f("ix_appointment_reminders_status"),
        "appointment_reminders",
        ["status"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_appointment_reminders_status"), table_name="appointment_reminders")
    op.drop_index(op.f("ix_appointment_reminders_scheduled_for"), table_name="appointment_reminders")
    op.drop_index(op.f("ix_appointment_reminders_business_id"), table_name="appointment_reminders")
    op.drop_index(op.f("ix_appointment_reminders_appointment_id"), table_name="appointment_reminders")
    op.drop_index("ix_appointment_reminders_claim", table_name="appointment_reminders")
    op.drop_index("ux_appointment_reminders_active_manual_snapshot", table_name="appointment_reminders")
    op.drop_index("ux_appointment_reminders_upcoming_snapshot", table_name="appointment_reminders")
    op.drop_table("appointment_reminders")

    bind = op.get_bind()
    appointmentreminderstatus.drop(bind, checkfirst=True)
