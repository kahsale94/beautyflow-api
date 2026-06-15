"""add evolution instances

Revision ID: 0005_add_evolution_instances
Revises: 0004_add_client_phone_index
Create Date: 2026-06-15 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0005_add_evolution_instances"
down_revision: Union[str, None] = "0004_add_client_phone_index"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "evolution_instances",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("business_id", sa.Integer(), nullable=False),
        sa.Column("integration_id", sa.Integer(), nullable=False),
        sa.Column("instance_name", sa.String(length=100), nullable=False),
        sa.Column("instance_id", sa.String(length=100), nullable=True),
        sa.Column("phone", sa.String(length=32), nullable=True),
        sa.Column("state", sa.String(length=32), server_default="new", nullable=False),
        sa.Column("connected_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["business_id"], ["businesses.id"], ondelete="cascade"),
        sa.ForeignKeyConstraint(["integration_id"], ["integrations.id"], ondelete="cascade"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("business_id", name="uq_evolution_instance_business"),
        sa.UniqueConstraint("instance_name", name="uq_evolution_instance_name"),
    )
    op.create_index(
        op.f("ix_evolution_instances_business_id"),
        "evolution_instances",
        ["business_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_evolution_instances_integration_id"),
        "evolution_instances",
        ["integration_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_evolution_instances_integration_id"), table_name="evolution_instances")
    op.drop_index(op.f("ix_evolution_instances_business_id"), table_name="evolution_instances")
    op.drop_table("evolution_instances")
