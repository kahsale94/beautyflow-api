"""production hardening

Revision ID: 0003_production_hardening
Revises: 0002_add_schedule_blocks
Create Date: 2026-06-08 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0003_production_hardening"
down_revision: Union[str, None] = "0002_add_schedule_blocks"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_unique_constraint("uq_business_phone", "businesses", ["phone"])
    op.add_column(
        "appointments",
        sa.Column("confirmation_pending", sa.Boolean(), server_default="false", nullable=False),
    )


def downgrade() -> None:
    op.drop_column("appointments", "confirmation_pending")
    op.drop_constraint("uq_business_phone", "businesses", type_="unique")
