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
    assert "slotMinTime: '07:00:00'" not in script
    assert "slotMaxTime: '20:00:00'" not in script


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
