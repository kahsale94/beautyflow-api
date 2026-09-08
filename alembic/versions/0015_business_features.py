"""add business features and Pilates business type

Revision ID: 0015_business_features
Revises: 0014_contacts_ownership
Create Date: 2026-09-08 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0015_business_features"
down_revision: Union[str, None] = "0014_contacts_ownership"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


FEATURE_KEYS = (
    "capacity_based_booking",
    "recurring_schedules",
    "replacement_classes",
    "trial_appointments",
    "professional_schedule_notifications",
    "reminder_policy",
)


def upgrade() -> None:
    op.execute("ALTER TYPE businesstype ADD VALUE IF NOT EXISTS 'pilates_studio'")
    op.create_table(
        "business_features",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("business_id", sa.Integer(), nullable=False),
        sa.Column("feature_key", sa.String(length=64), nullable=False),
        sa.Column("enabled", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("config", postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'{}'::jsonb"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint(
            "feature_key IN (" + ", ".join(f"'{key}'" for key in FEATURE_KEYS) + ")",
            name="businessfeaturekey",
        ),
        sa.ForeignKeyConstraint(["business_id"], ["businesses.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("business_id", "feature_key", name="uq_business_features_business_key"),
    )
    op.create_index(op.f("ix_business_features_business_id"), "business_features", ["business_id"], unique=False)
    op.create_index(op.f("ix_business_features_feature_key"), "business_features", ["feature_key"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_business_features_feature_key"), table_name="business_features")
    op.drop_index(op.f("ix_business_features_business_id"), table_name="business_features")
    op.drop_table("business_features")
    # PostgreSQL cannot remove an enum value safely in-place. The additive
    # pilates_studio value is intentionally retained on downgrade.
