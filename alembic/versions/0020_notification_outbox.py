"""add generic notification outbox

Revision ID: 0020_notification_outbox
Revises: 0019_replacement_entitlements
Create Date: 2026-09-08 01:30:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0020_notification_outbox"
down_revision: Union[str, None] = "0019_replacement_entitlements"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


notificationstatus = postgresql.ENUM(
    "pending", "processing", "sent", "failed", name="notificationjobstatus", create_type=False
)


def upgrade() -> None:
    bind = op.get_bind()
    notificationstatus.create(bind, checkfirst=True)
    op.create_table(
        "notification_jobs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("business_id", sa.Integer(), nullable=False),
        sa.Column("appointment_id", sa.Integer(), nullable=True),
        sa.Column("professional_id", sa.Integer(), nullable=True),
        sa.Column("notification_type", sa.String(length=80), nullable=False),
        sa.Column("dedup_key", sa.String(length=255), nullable=False),
        sa.Column("recipient_phone", sa.String(length=32), nullable=True),
        sa.Column("recipient_email", sa.String(length=255), nullable=True),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("payload", postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'{}'::jsonb"), nullable=False),
        sa.Column("scheduled_for", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", notificationstatus, server_default="pending", nullable=False),
        sa.Column("attempts", sa.Integer(), server_default="0", nullable=False),
        sa.Column("locked_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("failed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column("external_message_id", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("attempts >= 0", name="ck_notification_jobs_attempts_non_negative"),
        sa.ForeignKeyConstraint(["appointment_id"], ["appointments.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["business_id"], ["businesses.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["professional_id"], ["professionals.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("business_id", "dedup_key", name="uq_notification_jobs_business_dedup"),
    )
    for column in ("business_id", "appointment_id", "professional_id", "notification_type", "scheduled_for", "status"):
        op.create_index(op.f(f"ix_notification_jobs_{column}"), "notification_jobs", [column])
    op.create_index(
        "ix_notification_jobs_claim",
        "notification_jobs",
        ["status", "scheduled_for", "locked_until"],
    )


def downgrade() -> None:
    op.drop_index("ix_notification_jobs_claim", table_name="notification_jobs")
    for column in reversed(("business_id", "appointment_id", "professional_id", "notification_type", "scheduled_for", "status")):
        op.drop_index(op.f(f"ix_notification_jobs_{column}"), table_name="notification_jobs")
    op.drop_table("notification_jobs")
    bind = op.get_bind()
    notificationstatus.drop(bind, checkfirst=True)
