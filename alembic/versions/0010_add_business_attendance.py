"""add business attendance plan

Revision ID: 0010_add_business_attendance
Revises: 0009_structured_business_hours
Create Date: 2026-06-23 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0010_add_business_attendance"
down_revision: Union[str, None] = "0009_structured_business_hours"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


businessattendanceplan = postgresql.ENUM(
    "business_hours",
    "after_hours",
    "always",
    name="businessattendanceplan",
    create_type=False,
)


def _has_column(table_name: str, column_name: str) -> bool:
    inspector = sa.inspect(op.get_bind())
    return any(column["name"] == column_name for column in inspector.get_columns(table_name))


def upgrade() -> None:
    bind = op.get_bind()
    businessattendanceplan.create(bind, checkfirst=True)

    if not _has_column("businesses", "attendance_plan"):
        op.add_column(
            "businesses",
            sa.Column(
                "attendance_plan",
                businessattendanceplan,
                server_default="business_hours",
                nullable=False,
            ),
        )


def downgrade() -> None:
    bind = op.get_bind()

    if _has_column("businesses", "attendance_plan"):
        op.drop_column("businesses", "attendance_plan")

    businessattendanceplan.drop(bind, checkfirst=True)
