"""initial_clean_schema

Revision ID: 0001_initial_clean_schema
Revises: 
Create Date: 2026-06-02 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0001_initial_clean_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


businesstype = postgresql.ENUM("barbershop", "salon", "clinic", name="businesstype", create_type=False)
integrationtype = postgresql.ENUM("automation", name="integrationtype", create_type=False)
appointmentstatus = postgresql.ENUM("scheduled", "canceled", "completed", name="appointmentstatus", create_type=False)
userrole = postgresql.ENUM("super_admin", "admin", "user", name="userrole", create_type=False)


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS btree_gist")
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
    op.execute("CREATE EXTENSION IF NOT EXISTS unaccent")

    bind = op.get_bind()
    businesstype.create(bind, checkfirst=True)
    integrationtype.create(bind, checkfirst=True)
    appointmentstatus.create(bind, checkfirst=True)
    userrole.create(bind, checkfirst=True)

    op.create_table(
        "businesses",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.Column("slug", sa.String(length=80), nullable=True),
        sa.Column("type", businesstype, nullable=False),
        sa.Column("timezone", sa.String(), nullable=False),
        sa.Column("phone", sa.String(length=13), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("address", sa.String(length=255), nullable=True),
        sa.Column("city", sa.String(length=100), nullable=True),
        sa.Column("state", sa.String(length=50), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("booking_enabled", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("slot_interval_minutes", sa.Integer(), server_default="15", nullable=False),
        sa.Column("minimum_notice_minutes", sa.Integer(), server_default="0", nullable=False),
        sa.Column("maximum_schedule_days", sa.Integer(), server_default="30", nullable=False),
        sa.Column("allow_client_cancel", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("cancel_limit_hours", sa.Integer(), server_default="24", nullable=False),
        sa.Column("appointment_confirmation_required", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name", name="uq_business_name"),
        sa.UniqueConstraint("slug", name="uq_business_slug"),
    )
    op.create_index(op.f("ix_businesses_slug"), "businesses", ["slug"], unique=False)

    op.create_table(
        "integrations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.Column("type", integrationtype, nullable=False),
        sa.Column("api_token_hash", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )

    op.create_table(
        "clients",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=50), nullable=True),
        sa.Column("phone", sa.String(length=13), nullable=False),
        sa.Column("business_id", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.ForeignKeyConstraint(["business_id"], ["businesses.id"], ondelete="cascade"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("business_id", "phone", name="uq_client_business_phone"),
    )
    op.create_index(op.f("ix_clients_business_id"), "clients", ["business_id"], unique=False)

    op.create_table(
        "professionals",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("business_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.Column("normalized_name", sa.String(length=50), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("phone", sa.String(length=13), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.ForeignKeyConstraint(["business_id"], ["businesses.id"], ondelete="cascade"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("business_id", "name", name="uq_professional_business_name"),
    )
    op.create_index(op.f("ix_professionals_business_id"), "professionals", ["business_id"], unique=False)
    op.create_index("idx_professionals_normalized_name_trgm", "professionals", ["normalized_name"], unique=False, postgresql_using="gin", postgresql_ops={"normalized_name": "gin_trgm_ops"})

    op.create_table(
        "services",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("business_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.Column("normalized_name", sa.String(length=50), nullable=False),
        sa.Column("duration_minutes", sa.Integer(), nullable=False),
        sa.Column("price", sa.Numeric(10, 2), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.ForeignKeyConstraint(["business_id"], ["businesses.id"], ondelete="cascade"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("business_id", "name", name="uq_service_business_name"),
    )
    op.create_index(op.f("ix_services_business_id"), "services", ["business_id"], unique=False)
    op.create_index("idx_services_normalized_name_trgm", "services", ["normalized_name"], unique=False, postgresql_using="gin", postgresql_ops={"normalized_name": "gin_trgm_ops"})

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("business_id", sa.Integer(), nullable=True),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("password_hash", sa.String(), nullable=False),
        sa.Column("role", userrole, nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.ForeignKeyConstraint(["business_id"], ["businesses.id"], ondelete="cascade"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email", name="uq_user_email"),
    )
    op.create_index(op.f("ix_users_business_id"), "users", ["business_id"], unique=False)

    op.create_table(
        "availabilities",
        sa.Column("professional_id", sa.Integer(), nullable=False),
        sa.Column("weekday", sa.Integer(), nullable=False),
        sa.Column("start_time", sa.Time(), nullable=False),
        sa.Column("end_time", sa.Time(), nullable=False),
        sa.CheckConstraint("weekday >= 0 AND weekday <= 6", name="valid_weekday"),
        sa.CheckConstraint("start_time < end_time", name="valid_time_range"),
        sa.ForeignKeyConstraint(["professional_id"], ["professionals.id"], ondelete="cascade"),
        sa.PrimaryKeyConstraint("professional_id", "weekday"),
        sa.UniqueConstraint("professional_id", "weekday", name="uq_professional_weekday"),
    )
    op.create_index(op.f("ix_availabilities_professional_id"), "availabilities", ["professional_id"], unique=False)

    op.create_table(
        "professional_services",
        sa.Column("professional_id", sa.Integer(), nullable=False),
        sa.Column("service_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["professional_id"], ["professionals.id"], ondelete="cascade"),
        sa.ForeignKeyConstraint(["service_id"], ["services.id"], ondelete="cascade"),
        sa.PrimaryKeyConstraint("professional_id", "service_id", name="pk_professional_services"),
    )
    op.create_index(op.f("ix_professional_services_professional_id"), "professional_services", ["professional_id"], unique=False)
    op.create_index(op.f("ix_professional_services_service_id"), "professional_services", ["service_id"], unique=False)

    op.create_table(
        "appointments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("client_id", sa.Integer(), nullable=False),
        sa.Column("professional_id", sa.Integer(), nullable=False),
        sa.Column("service_id", sa.Integer(), nullable=False),
        sa.Column("business_id", sa.Integer(), nullable=False),
        sa.Column("start_datetime", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_datetime", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("status", appointmentstatus, server_default="scheduled", nullable=False),
        sa.CheckConstraint("start_datetime < end_datetime", name="ck_appointments_valid_datetime_range"),
        sa.ForeignKeyConstraint(["business_id"], ["businesses.id"], ondelete="cascade"),
        sa.ForeignKeyConstraint(["client_id"], ["clients.id"], ondelete="cascade"),
        sa.ForeignKeyConstraint(["professional_id"], ["professionals.id"], ondelete="cascade"),
        sa.ForeignKeyConstraint(["service_id"], ["services.id"], ondelete="cascade"),
        sa.PrimaryKeyConstraint("id"),
        postgresql.ExcludeConstraint(
            ("business_id", "="),
            ("professional_id", "="),
            (sa.text("tstzrange(start_datetime, end_datetime, '[)')"), "&&"),
            where=sa.text("status = 'scheduled'"),
            using="gist",
            name="ex_appointments_business_professional_time_conflict",
        ),
    )
    op.create_index(op.f("ix_appointments_business_id"), "appointments", ["business_id"], unique=False)
    op.create_index(op.f("ix_appointments_client_id"), "appointments", ["client_id"], unique=False)
    op.create_index(op.f("ix_appointments_professional_id"), "appointments", ["professional_id"], unique=False)
    op.create_index(op.f("ix_appointments_service_id"), "appointments", ["service_id"], unique=False)

    op.create_table(
        "business_integrations",
        sa.Column("business_id", sa.Integer(), nullable=False),
        sa.Column("integration_id", sa.Integer(), nullable=False),
        sa.Column("config", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.ForeignKeyConstraint(["business_id"], ["businesses.id"], ondelete="cascade"),
        sa.ForeignKeyConstraint(["integration_id"], ["integrations.id"], ondelete="cascade"),
        sa.PrimaryKeyConstraint("business_id", "integration_id"),
    )
    op.create_index(op.f("ix_business_integrations_business_id"), "business_integrations", ["business_id"], unique=False)
    op.create_index(op.f("ix_business_integrations_integration_id"), "business_integrations", ["integration_id"], unique=False)

    op.create_table(
        "user_refresh_tokens",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("jti_hash", sa.String(length=64), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("replaced_by_jti_hash", sa.String(length=64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="cascade"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("jti_hash", name="uq_user_refresh_tokens_jti_hash"),
    )
    op.create_index(op.f("ix_user_refresh_tokens_user_id"), "user_refresh_tokens", ["user_id"], unique=False)
    op.create_index(op.f("ix_user_refresh_tokens_jti_hash"), "user_refresh_tokens", ["jti_hash"], unique=False)
    op.create_index(op.f("ix_user_refresh_tokens_expires_at"), "user_refresh_tokens", ["expires_at"], unique=False)
    op.create_index(op.f("ix_user_refresh_tokens_revoked_at"), "user_refresh_tokens", ["revoked_at"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_user_refresh_tokens_revoked_at"), table_name="user_refresh_tokens")
    op.drop_index(op.f("ix_user_refresh_tokens_expires_at"), table_name="user_refresh_tokens")
    op.drop_index(op.f("ix_user_refresh_tokens_jti_hash"), table_name="user_refresh_tokens")
    op.drop_index(op.f("ix_user_refresh_tokens_user_id"), table_name="user_refresh_tokens")
    op.drop_table("user_refresh_tokens")
    op.drop_index(op.f("ix_business_integrations_integration_id"), table_name="business_integrations")
    op.drop_index(op.f("ix_business_integrations_business_id"), table_name="business_integrations")
    op.drop_table("business_integrations")
    op.drop_index(op.f("ix_appointments_service_id"), table_name="appointments")
    op.drop_index(op.f("ix_appointments_professional_id"), table_name="appointments")
    op.drop_index(op.f("ix_appointments_client_id"), table_name="appointments")
    op.drop_index(op.f("ix_appointments_business_id"), table_name="appointments")
    op.drop_table("appointments")
    op.drop_index(op.f("ix_professional_services_service_id"), table_name="professional_services")
    op.drop_index(op.f("ix_professional_services_professional_id"), table_name="professional_services")
    op.drop_table("professional_services")
    op.drop_index(op.f("ix_availabilities_professional_id"), table_name="availabilities")
    op.drop_table("availabilities")
    op.drop_index(op.f("ix_users_business_id"), table_name="users")
    op.drop_table("users")
    op.drop_index("idx_services_normalized_name_trgm", table_name="services")
    op.drop_index(op.f("ix_services_business_id"), table_name="services")
    op.drop_table("services")
    op.drop_index("idx_professionals_normalized_name_trgm", table_name="professionals")
    op.drop_index(op.f("ix_professionals_business_id"), table_name="professionals")
    op.drop_table("professionals")
    op.drop_index(op.f("ix_clients_business_id"), table_name="clients")
    op.drop_table("clients")
    op.drop_table("integrations")
    op.drop_index(op.f("ix_businesses_slug"), table_name="businesses")
    op.drop_table("businesses")

    bind = op.get_bind()
    userrole.drop(bind, checkfirst=True)
    appointmentstatus.drop(bind, checkfirst=True)
    integrationtype.drop(bind, checkfirst=True)
    businesstype.drop(bind, checkfirst=True)
