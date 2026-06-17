"""add business opening hours

Revision ID: 0008_add_business_opening_hours
Revises: 0007_add_appointment_reminders
Create Date: 2026-06-17 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0008_add_business_opening_hours"
down_revision: Union[str, None] = "0007_add_appointment_reminders"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "business_opening_hours",
        sa.Column("business_id", sa.Integer(), nullable=False),
        sa.Column("weekday", sa.Integer(), nullable=False),
        sa.Column("start_time", sa.Time(), nullable=False),
        sa.Column("end_time", sa.Time(), nullable=False),
        sa.CheckConstraint("weekday >= 0 AND weekday <= 6", name="valid_business_opening_weekday"),
        sa.CheckConstraint("start_time < end_time", name="valid_business_opening_time_range"),
        sa.ForeignKeyConstraint(["business_id"], ["businesses.id"], ondelete="cascade"),
        sa.PrimaryKeyConstraint("business_id", "weekday", name="pk_business_opening_hours"),
    )
    op.create_index(op.f("ix_business_opening_hours_business_id"), "business_opening_hours", ["business_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_business_opening_hours_business_id"), table_name="business_opening_hours")
    op.drop_table("business_opening_hours")
