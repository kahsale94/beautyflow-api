"""add business admin fields

Revision ID: f6b7c8d9e0a1
Revises: e7a1c2d3f4b5
Create Date: 2026-05-26 00:00:01.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "f6b7c8d9e0a1"
down_revision: Union[str, Sequence[str], None] = "e7a1c2d3f4b5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("businesses", sa.Column("slug", sa.String(length=80), nullable=True))
    op.add_column("businesses", sa.Column("phone", sa.String(length=20), nullable=True))
    op.add_column("businesses", sa.Column("email", sa.String(length=255), nullable=True))
    op.add_column("businesses", sa.Column("address", sa.String(length=255), nullable=True))
    op.add_column("businesses", sa.Column("city", sa.String(length=100), nullable=True))
    op.add_column("businesses", sa.Column("state", sa.String(length=50), nullable=True))
    op.add_column("businesses", sa.Column("description", sa.Text(), nullable=True))

    op.add_column("businesses", sa.Column("booking_enabled", sa.Boolean(), server_default="true", nullable=False))
    op.add_column("businesses", sa.Column("slot_interval_minutes", sa.Integer(), server_default="15", nullable=False))
    op.add_column("businesses", sa.Column("minimum_notice_minutes", sa.Integer(), server_default="0", nullable=False))
    op.add_column("businesses", sa.Column("maximum_schedule_days", sa.Integer(), server_default="30", nullable=False))
    op.add_column("businesses", sa.Column("allow_client_cancel", sa.Boolean(), server_default="true", nullable=False))
    op.add_column("businesses", sa.Column("cancel_limit_hours", sa.Integer(), server_default="24", nullable=False))
    op.add_column("businesses", sa.Column("appointment_confirmation_required", sa.Boolean(), server_default="false", nullable=False))

    op.create_index("ix_businesses_slug", "businesses", ["slug"], unique=True)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_businesses_slug", table_name="businesses")

    op.drop_column("businesses", "appointment_confirmation_required")
    op.drop_column("businesses", "cancel_limit_hours")
    op.drop_column("businesses", "allow_client_cancel")
    op.drop_column("businesses", "maximum_schedule_days")
    op.drop_column("businesses", "minimum_notice_minutes")
    op.drop_column("businesses", "slot_interval_minutes")
    op.drop_column("businesses", "booking_enabled")

    op.drop_column("businesses", "description")
    op.drop_column("businesses", "state")
    op.drop_column("businesses", "city")
    op.drop_column("businesses", "address")
    op.drop_column("businesses", "email")
    op.drop_column("businesses", "phone")
    op.drop_column("businesses", "slug")