from datetime import datetime, time, timezone
from pathlib import Path
from types import SimpleNamespace

from src.admin.routes.appointments import _calendar_display_config
from src.admin.templating import templates


ROOT = Path(__file__).resolve().parents[1]


def read_source(relative_path: str) -> str:
    return (ROOT / relative_path).read_text(encoding="utf-8")


def test_calendar_display_uses_saved_business_opening_hours():
    opening_hours = [
        SimpleNamespace(weekday=0, start_time=time(8), end_time=time(18)),
        SimpleNamespace(weekday=2, start_time=time(10), end_time=time(20)),
        SimpleNamespace(weekday=6, start_time=time(9), end_time=time(13)),
    ]

    result = _calendar_display_config(opening_hours)

    assert result == {
        "business_hours": [
            {"daysOfWeek": [1], "startTime": "08:00:00", "endTime": "18:00:00"},
            {"daysOfWeek": [3], "startTime": "10:00:00", "endTime": "20:00:00"},
            {"daysOfWeek": [0], "startTime": "09:00:00", "endTime": "13:00:00"},
        ],
        "slot_min_time": "08:00:00",
        "slot_max_time": "20:00:00",
        "scroll_time": "08:00:00",
    }


def test_calendar_display_keeps_fullcalendar_fallback_without_saved_hours():
    assert _calendar_display_config([]) == {
        "business_hours": [],
        "slot_min_time": "",
        "slot_max_time": "",
        "scroll_time": "",
    }


def test_admin_control_panels_are_shared_and_collapsed_by_default():
    component = read_source("src/templates/admin/_components.html")
    assert '<details class="card admin-control-panel' in component
    assert "{% if initially_open %} open{% endif %}" in component
    assert "admin-control-panel-summary" in component

    pages_with_creation = (
        "src/templates/admin/appointments/calendar.html",
        "src/templates/admin/clients/index.html",
        "src/templates/admin/services/index.html",
        "src/templates/admin/professionals/index.html",
        "src/templates/admin/users/index.html",
    )
    pages_with_filters = pages_with_creation + (
        "src/templates/admin/contacts/index.html",
    )

    for path in pages_with_creation:
        assert 'control_panel("Ações"' in read_source(path)

    for path in pages_with_filters:
        assert 'control_panel("Pesquisa e filtros"' in read_source(path)

    calendar = read_source("src/templates/admin/appointments/calendar.html")
    assert calendar.index('class="admin-page-controls"') < calendar.index('class="card calendar-card"')


def test_agenda_uses_dynamic_hours_and_keeps_all_views():
    base = read_source("src/templates/admin/base.html")
    dashboard = read_source("src/templates/admin/dashboard.html")
    calendar = read_source("src/templates/admin/appointments/calendar.html")
    script = read_source("src/static/admin/js/calendar.js")

    assert ">Agenda</a>" in base
    assert "Calendário" not in base
    assert "Abrir agenda" in dashboard
    assert "{% block title %}Agenda - Beautyflow{% endblock %}" in calendar
    assert 'data-business-hours=' in calendar
    assert 'data-slot-min-time=' in calendar
    assert "businessHours: businessHours" in script
    assert "initialView: mobileCalendarQuery.matches ? 'timeGridDay' : 'timeGridWeek'" in script
    assert "dayGridMonth,timeGridWeek,timeGridDay,listWeek" in script
    assert script.count("eventMinHeight: 52") == 2
    assert "bf-calendar-event--detailed" in script
    assert "bf-calendar-event-details" in script
    assert "bf-calendar-event-service" in script
    assert "bf-calendar-event-professional" in script
    assert "slotMinTime: '07:00:00'" not in script
    assert "slotMaxTime: '20:00:00'" not in script


def test_contacts_page_has_spaced_bulk_actions_and_responsive_rows():
    template = read_source("src/templates/admin/contacts/index.html")
    stylesheet = read_source("src/static/admin/css/admin.css")

    assert "contacts-list-card" in template
    assert "contacts-list-header" in template
    assert "contacts-bulk-actions" in template
    assert "contacts-table-shell" in template
    assert "contact-row-actions" in template
    assert "contacts-pagination" in template
    assert 'data-label="Contato"' in template
    assert 'data-label="Identidade"' in template
    assert 'data-label="Origem"' in template
    assert ".contacts-table" in stylesheet
    assert ".contacts-bulk-actions" in stylesheet
    assert ".contact-row-actions" in stylesheet
    assert ".contacts-pagination" in stylesheet


def _render_appointment_details(status: str) -> str:
    appointment = SimpleNamespace(
        id=9,
        client_id=1,
        professional_id=7,
        service_id=3,
        status=SimpleNamespace(value=status),
        confirmation_pending=False,
        start_datetime=datetime(2026, 8, 20, 10, 0, tzinfo=timezone.utc),
        end_datetime=datetime(2026, 8, 20, 11, 0, tzinfo=timezone.utc),
    )
    client = SimpleNamespace(id=1, name="Carla", phone="5511999999999")
    professional = SimpleNamespace(id=7, name="Ana")
    service = SimpleNamespace(id=3, name="Corte")

    return templates.env.get_template("admin/appointments/_details.html").render(
        appointment=appointment,
        client=client,
        professional=professional,
        service=service,
        clients=[client],
        professionals=[professional],
        services=[service],
        automatic_reminder=None,
        latest_reminder=None,
        reminder_history=[],
        reminder_status_label=str,
        reminder_type_label=str,
        manual_reminder_disabled_reason=None,
        manual_reminder_button_label="Enviar lembrete agora",
        manual_reminder_confirm_message="Enviar lembrete agora?",
        service_professional_ids={3: [7]},
        business_timezone="UTC",
        slot_interval_minutes=15,
        csrf_token="test-token",
    )


def test_finished_appointment_modal_is_read_only():
    for status in ("canceled", "completed"):
        rendered = _render_appointment_details(status)

        assert "somente para consulta" in rendered
        assert "appointment-update-form" not in rendered
        assert "/cancel" not in rendered
        assert "/complete" not in rendered
        assert "/reminders/manual" not in rendered


def test_scheduled_appointment_modal_keeps_actions():
    rendered = _render_appointment_details("scheduled")

    assert "appointment-update-form" in rendered
    assert "/cancel" in rendered
    assert "/complete" in rendered
    assert "/reminders/manual" in rendered


def test_admin_exposes_feature_settings_capacity_and_domain_pages_with_csrf():
    business_route = read_source("src/admin/routes/business.py")
    business_template = read_source("src/templates/admin/business/settings.html")
    professional_route = read_source("src/admin/routes/professionals.py")
    professional_templates = (
        read_source("src/templates/admin/professionals/index.html")
        + read_source("src/templates/admin/professionals/detail.html")
    )
    recurring_route = read_source("src/admin/routes/recurring_schedules.py")
    recurring_template = read_source("src/templates/admin/recurring_schedules/index.html")
    replacement_route = read_source("src/admin/routes/replacement_entitlements.py")
    replacement_template = read_source("src/templates/admin/replacement_entitlements/index.html")
    base = read_source("src/templates/admin/base.html")

    assert 'action="/admin/business/features"' in business_template
    assert "feature_capacity_based_booking" in business_template
    assert "replacement_expiration_days" in business_template
    assert "reminder_policy" in business_template
    assert "validate_csrf(request)" in business_route
    assert "simultaneous_capacity" in professional_route
    assert "simultaneous_capacity" in professional_templates
    assert "ProfessionalCapacityConflictError" in professional_route
    assert "validate_csrf(request)" in recurring_route
    assert "validate_csrf(request)" in replacement_route
    assert "Não obrig" not in recurring_template
    assert "Profissional" not in recurring_template
    assert "source_appointment_id" in replacement_route
    assert "replacement_appointment_id" in replacement_template
    assert "/admin/recurring-schedules" in base
    assert "/admin/replacement-entitlements" in base


def test_agenda_has_semantic_origin_no_show_capacity_and_explicit_reallocation():
    route = read_source("src/admin/routes/appointments.py")
    details = read_source("src/templates/admin/appointments/_details.html")
    calendar = read_source("src/templates/admin/appointments/calendar.html")
    script = read_source("src/static/admin/js/calendar.js")

    assert '"appointmentKind"' in route
    assert '"seriesId"' in route
    assert '"isReplacement"' in route
    assert '"capacitySummary"' in route
    assert "create_with_reallocation" in route
    assert 'name="with_reallocation"' in calendar
    assert 'name="kind"' in calendar
    assert "atribuição automática" in calendar
    assert "/no-show" in details
    assert "Horário recorrente" in details
    assert "Reposição" in details
    assert "appointment-origin-recurring" in script
    assert "appointment-origin-replacement" in script
    assert "no_show" in script
