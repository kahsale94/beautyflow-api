"""add client phone index

Revision ID: 0004_add_client_phone_index
Revises: 0003_production_hardening
Create Date: 2026-06-08 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op


revision: str = "0004_add_client_phone_index"
down_revision: Union[str, None] = "0003_production_hardening"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(op.f("ix_clients_phone"), "clients", ["phone"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_clients_phone"), table_name="clients")
