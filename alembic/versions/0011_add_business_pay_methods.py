"""add business payment methods

Revision ID: 0011_add_business_pay_methods
Revises: 0010_add_business_attendance
Create Date: 2026-07-02 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import context, op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0011_add_business_pay_methods"
down_revision: Union[str, None] = "0010_add_business_attendance"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


businesspaymentmethod = postgresql.ENUM(
    "money",
    "pix",
    "credit_card",
    "debit_card",
    name="businesspaymentmethod",
    create_type=False,
)
payment_methods_type = postgresql.ARRAY(businesspaymentmethod)
empty_payment_methods = sa.text("ARRAY[]::businesspaymentmethod[]")


def _has_column(table_name: str, column_name: str) -> bool:
    if context.is_offline_mode():
        return False

    inspector = sa.inspect(op.get_bind())
    return any(column["name"] == column_name for column in inspector.get_columns(table_name))


def upgrade() -> None:
    bind = op.get_bind()
    businesspaymentmethod.create(bind, checkfirst=True)

    if not _has_column("businesses", "payment_methods"):
        op.add_column(
            "businesses",
            sa.Column(
                "payment_methods",
                payment_methods_type,
                server_default=empty_payment_methods,
                nullable=True,
            ),
        )
        op.execute(
            "UPDATE businesses "
            "SET payment_methods = ARRAY[]::businesspaymentmethod[] "
            "WHERE payment_methods IS NULL"
        )
        op.alter_column(
            "businesses",
            "payment_methods",
            existing_type=payment_methods_type,
            existing_server_default=empty_payment_methods,
            server_default=None,
            nullable=False,
        )


def downgrade() -> None:
    bind = op.get_bind()

    if _has_column("businesses", "payment_methods"):
        op.drop_column("businesses", "payment_methods")

    businesspaymentmethod.drop(bind, checkfirst=True)
