"""add recurring schedules and appointment occurrences

Revision ID: 0018_recurring_schedules
Revises: 0017_capacity_lane
Create Date: 2026-09-08 00:30:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0018_recurring_schedules"
down_revision: Union[str, None] = "0017_capacity_lane"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


recurringstatus = postgresql.ENUM(
    "active", "paused", "canceled", name="recurringschedulestatus", create_type=False
)


def upgrade() -> None:
    bind = op.get_bind()
    recurringstatus.create(bind, checkfirst=True)
    op.create_table(
        "recurring_schedules",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("business_id", sa.Integer(), nullable=False),
        sa.Column("client_id", sa.Integer(), nullable=False),
        sa.Column("service_id", sa.Integer(), nullable=False),
        sa.Column("weekday", sa.Integer(), nullable=False),
        sa.Column("start_time", sa.Time(), nullable=False),
        sa.Column("effective_from", sa.Date(), nullable=False),
        sa.Column("effective_until", sa.Date(), nullable=True),
        sa.Column("status", recurringstatus, server_default="active", nullable=False),
        sa.Column("last_materialized_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_materialization_error", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("weekday >= 0 AND weekday <= 6", name="ck_recurring_schedules_valid_weekday"),
        sa.CheckConstraint(
            "effective_until IS NULL OR effective_until >= effective_from",
            name="ck_recurring_schedules_valid_effective_range",
        ),
        sa.ForeignKeyConstraint(["business_id"], ["businesses.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["client_id"], ["clients.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["service_id"], ["services.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_recurring_schedules_business_id"), "recurring_schedules", ["business_id"])
    op.create_index(op.f("ix_recurring_schedules_client_id"), "recurring_schedules", ["client_id"])
    op.create_index(op.f("ix_recurring_schedules_service_id"), "recurring_schedules", ["service_id"])
    op.create_index(op.f("ix_recurring_schedules_status"), "recurring_schedules", ["status"])

    op.add_column("appointments", sa.Column("series_id", sa.Integer(), nullable=True))
    op.add_column("appointments", sa.Column("occurrence_start", sa.DateTime(timezone=True), nullable=True))
    op.create_foreign_key(
        "fk_appointments_series_id_recurring_schedules",
        "appointments",
        "recurring_schedules",
        ["series_id"],
        ["id"],
        ondelete="RESTRICT",
    )
    op.create_index(op.f("ix_appointments_series_id"), "appointments", ["series_id"])
    op.create_index(
        "uq_appointments_series_occurrence_start",
        "appointments",
        ["series_id", "occurrence_start"],
        unique=True,
        postgresql_where=sa.text("series_id IS NOT NULL"),
    )


def downgrade() -> None:
    op.drop_index("uq_appointments_series_occurrence_start", table_name="appointments")
    op.drop_index(op.f("ix_appointments_series_id"), table_name="appointments")
    op.drop_constraint("fk_appointments_series_id_recurring_schedules", "appointments", type_="foreignkey")
    op.drop_column("appointments", "occurrence_start")
    op.drop_column("appointments", "series_id")
    op.drop_index(op.f("ix_recurring_schedules_status"), table_name="recurring_schedules")
    op.drop_index(op.f("ix_recurring_schedules_service_id"), table_name="recurring_schedules")
    op.drop_index(op.f("ix_recurring_schedules_client_id"), table_name="recurring_schedules")
    op.drop_index(op.f("ix_recurring_schedules_business_id"), table_name="recurring_schedules")
    op.drop_table("recurring_schedules")
    bind = op.get_bind()
    recurringstatus.drop(bind, checkfirst=True)
