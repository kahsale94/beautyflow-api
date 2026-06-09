"""add_schedule_blocks

Revision ID: 0002_add_schedule_blocks
Revises: 0001_initial_clean_schema
Create Date: 2026-06-08 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0002_add_schedule_blocks"
down_revision: Union[str, None] = "0001_initial_clean_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


scheduleblockreason = postgresql.ENUM("lunch", "day_off", "vacation", "sick", name="scheduleblockreason", create_type=False)
scheduleblockstatus = postgresql.ENUM("active", "canceled", name="scheduleblockstatus", create_type=False)


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS btree_gist")

    bind = op.get_bind()
    scheduleblockreason.create(bind, checkfirst=True)
    scheduleblockstatus.create(bind, checkfirst=True)

    op.create_table(
        "schedule_blocks",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("business_id", sa.Integer(), nullable=False),
        sa.Column("professional_id", sa.Integer(), nullable=False),
        sa.Column("start_datetime", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_datetime", sa.DateTime(timezone=True), nullable=False),
        sa.Column("all_day", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("reason", scheduleblockreason, nullable=False),
        sa.Column("status", scheduleblockstatus, server_default="active", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("start_datetime < end_datetime", name="ck_schedule_blocks_valid_datetime_range"),
        sa.ForeignKeyConstraint(["business_id"], ["businesses.id"], ondelete="cascade"),
        sa.ForeignKeyConstraint(["professional_id"], ["professionals.id"], ondelete="cascade"),
        sa.PrimaryKeyConstraint("id"),
        postgresql.ExcludeConstraint(
            ("business_id", "="),
            ("professional_id", "="),
            (sa.text("tstzrange(start_datetime, end_datetime, '[)')"), "&&"),
            where=sa.text("status = 'active'"),
            using="gist",
            name="ex_schedule_blocks_business_professional_time_conflict",
        ),
    )
    op.create_index(op.f("ix_schedule_blocks_business_id"), "schedule_blocks", ["business_id"], unique=False)
    op.create_index(op.f("ix_schedule_blocks_professional_id"), "schedule_blocks", ["professional_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_schedule_blocks_professional_id"), table_name="schedule_blocks")
    op.drop_index(op.f("ix_schedule_blocks_business_id"), table_name="schedule_blocks")
    op.drop_table("schedule_blocks")

    bind = op.get_bind()
    scheduleblockstatus.drop(bind, checkfirst=True)
    scheduleblockreason.drop(bind, checkfirst=True)
