"""add appointment semantics and professional capacity fields

Revision ID: 0016_appointment_capacity
Revises: 0015_business_features
Create Date: 2026-09-08 00:10:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0016_appointment_capacity"
down_revision: Union[str, None] = "0015_business_features"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


appointmentkind = postgresql.ENUM("standard", "trial", name="appointmentkind", create_type=False)


def upgrade() -> None:
    op.execute("ALTER TYPE appointmentstatus ADD VALUE IF NOT EXISTS 'no_show'")
    bind = op.get_bind()
    appointmentkind.create(bind, checkfirst=True)

    op.add_column(
        "professionals",
        sa.Column("simultaneous_capacity", sa.Integer(), server_default="1", nullable=False),
    )
    op.create_check_constraint(
        "ck_professionals_simultaneous_capacity_positive",
        "professionals",
        "simultaneous_capacity >= 1",
    )
    op.add_column(
        "appointments",
        sa.Column("capacity_slot", sa.Integer(), server_default="1", nullable=False),
    )
    op.add_column(
        "appointments",
        sa.Column("kind", appointmentkind, server_default="standard", nullable=False),
    )
    op.create_check_constraint(
        "ck_appointments_capacity_slot_positive",
        "appointments",
        "capacity_slot >= 1",
    )


def downgrade() -> None:
    op.drop_constraint("ck_appointments_capacity_slot_positive", "appointments", type_="check")
    op.drop_column("appointments", "kind")
    op.drop_column("appointments", "capacity_slot")
    op.drop_constraint("ck_professionals_simultaneous_capacity_positive", "professionals", type_="check")
    op.drop_column("professionals", "simultaneous_capacity")

    bind = op.get_bind()
    appointmentkind.drop(bind, checkfirst=True)
    # no_show is an additive PostgreSQL enum value and is intentionally retained.
