"""add business cep

Revision ID: 0012_add_business_cep
Revises: 0011_add_business_pay_methods
Create Date: 2026-07-27 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import context, op
import sqlalchemy as sa


revision: str = "0012_add_business_cep"
down_revision: Union[str, None] = "0011_add_business_pay_methods"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _has_column(table_name: str, column_name: str) -> bool:
    if context.is_offline_mode():
        return False

    inspector = sa.inspect(op.get_bind())
    return any(column["name"] == column_name for column in inspector.get_columns(table_name))


def upgrade() -> None:
    if not _has_column("businesses", "cep"):
        op.add_column(
            "businesses",
            sa.Column("cep", sa.String(length=8), nullable=True),
        )


def downgrade() -> None:
    if _has_column("businesses", "cep"):
        op.drop_column("businesses", "cep")
