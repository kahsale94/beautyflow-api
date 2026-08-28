from datetime import datetime, timezone
from pathlib import Path
from types import SimpleNamespace
from zoneinfo import ZoneInfo

from src.admin.routes import dashboard as dashboard_routes
from src.admin.routes.clients import _build_client_schedule_overview
from src.admin.templating import templates


ROOT = Path(__file__).resolve().parents[1]


def read_source(relative_path: str) -> str:
    return (ROOT / relative_path).read_text(encoding="utf-8")


def appointment(
    client_id: int,
    professional_id: int,
    start_datetime: datetime,
    status: str = "scheduled",
):
    return SimpleNamespace(
        client_id=client_id,
        professional_id=professional_id,
        start_datetime=start_datetime,
        status=status,
    )


def test_student_schedule_overview_derives_fixed_slots_and_isolated_replacements():
    now = datetime(2026, 8, 1, tzinfo=timezone.utc)
    appointments = [
        appointment(1, 7, datetime(2026, 8, 3, 13, 0, tzinfo=timezone.utc)),
        appointment(1, 7, datetime(2026, 8, 10, 13, 0, tzinfo=timezone.utc), "completed"),
        appointment(1, 7, datetime(2026, 8, 17, 13, 0, tzinfo=timezone.utc), "canceled"),
        appointment(1, 8, datetime(2026, 8, 6, 14, 30, tzinfo=timezone.utc)),
        appointment(2, 8, datetime(2026, 8, 5, 9, 0, tzinfo=timezone.utc), "canceled"),
        appointment(2, 8, datetime(2026, 8, 12, 9, 0, tzinfo=timezone.utc), "canceled"),
    ]
    professionals = {
        7: SimpleNamespace(name="Ana"),
        8: SimpleNamespace(name="Bruno"),
    }

    overview = _build_client_schedule_overview(
        appointments,
        professionals,
        now=now,
        business_timezone=ZoneInfo("America/Sao_Paulo"),
    )

    assert overview[1]["fixed_slots"] == [
        {
            "weekday": "Segunda",
            "time": "10:00",
            "professional": "Ana",
            "occurrences": 3,
        }
    ]
    assert overview[1]["isolated_appointments"] == [
        {
            "date": "06/08/2026",
            "weekday": "Quinta",
            "time": "11:30",
            "professional": "Bruno",
        }
    ]
    assert overview[2]["fixed_slots"] == []
    assert overview[2]["isolated_appointments"] == []


def test_dashboard_counts_today_appointments_by_status(monkeypatch):
    appointments = [
        SimpleNamespace(status=SimpleNamespace(value="scheduled")),
        SimpleNamespace(status=SimpleNamespace(value="canceled")),
        SimpleNamespace(status=SimpleNamespace(value="completed")),
    ]
    captured = {}

    def fake_render(request, template_name, context, **kwargs):
        captured.update(context)
        return captured

    monkeypatch.setattr(dashboard_routes, "render", fake_render)

    result = dashboard_routes.dashboard_page(
        request=SimpleNamespace(),
        appointment_service=SimpleNamespace(
            get_by_period=lambda business_id, start, end: appointments
        ),
        client_service=SimpleNamespace(get_all=lambda business_id: []),
        professional_service=SimpleNamespace(get_all=lambda business_id: []),
        business_service=SimpleNamespace(
            get_by_id=lambda business_id: SimpleNamespace(timezone="UTC")
        ),
        session=SimpleNamespace(business_id=42),
    )

    assert result is captured
    assert captured["today_scheduled_count"] == 1
    assert captured["today_canceled_count"] == 1
    assert "services_count" not in captured


def render_appointment_details(status: str) -> str:
    appointment_item = SimpleNamespace(
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
    service = SimpleNamespace(id=3, name="Pilates em grupo")

    return templates.env.get_template("admin/appointments/_details.html").render(
        appointment=appointment_item,
        client=client,
        professional=professional,
        service=service,
        clients=[client],
        professionals=[professional],
        services=[service],
        automatic_reminder=None,
        latest_reminder=None,
        reminder_history=[],
        reminder_status_label=lambda value: str(value),
        reminder_type_label=lambda value: str(value),
        manual_reminder_disabled_reason=None,
        manual_reminder_button_label="Enviar lembrete agora",
        manual_reminder_confirm_message="Enviar lembrete para este aluno agora?",
        service_professional_ids={3: [7]},
        business_timezone="UTC",
        slot_interval_minutes=15,
        csrf_token="test-token",
    )


def test_canceled_and_completed_appointment_modals_are_read_only():
    for status in ("canceled", "completed"):
        rendered = render_appointment_details(status)

        assert "somente para consulta" in rendered
        assert "appointment-update-form" not in rendered
        assert "/cancel" not in rendered
        assert "/complete" not in rendered
        assert "/reminders/manual" not in rendered


def test_scheduled_appointment_modal_keeps_domain_fields_and_actions():
    rendered = render_appointment_details("scheduled")

    assert 'name="service_id" value="3"' in rendered
    assert "/cancel" in rendered
    assert "/complete" in rendered
    assert "/reminders/manual" in rendered


def test_pilates_admin_calendar_and_navigation_contract():
    calendar_template = read_source("src/templates/admin/appointments/calendar.html")
    details_template = read_source("src/templates/admin/appointments/_details.html")
    base_template = read_source("src/templates/admin/base.html")
    dashboard_template = read_source("src/templates/admin/dashboard.html")
    calendar_script = read_source("src/static/admin/js/calendar.js")
    stylesheet = read_source("src/static/admin/css/admin.css")

    assert calendar_template.index('<section class="card calendar-card">') < calendar_template.index(
        '<details class="card calendar-admin-panel">'
    )
    assert 'id="calendar-refresh-button"' in calendar_template
    assert "initialView: 'timeGridWeek'" in calendar_script
    assert "firstDay: 1" in calendar_script
    assert "slotMinTime: '07:00:00'" in calendar_script
    assert "slotMaxTime: '20:00:00'" in calendar_script
    assert "scrollTime: '08:00:00'" in calendar_script
    assert "allDaySlot: true" in calendar_script
    assert "allDayText: 'Dia inteiro'" in calendar_script
    assert "slotEventOverlap: false" in calendar_script
    assert "contentHeight: 920" in calendar_script
    assert "height: 'auto'" not in calendar_script
    assert "calendar.refetchEvents()" in calendar_script
    assert "monthStrip.scrollTo" in calendar_script
    assert "scrollIntoView" not in calendar_script

    assert ">Alunos</a>" in base_template
    assert ">Professores</a>" in base_template
    assert 'href="/admin/services"' not in base_template
    assert "today_scheduled_count" in dashboard_template
    assert "today_canceled_count" in dashboard_template
    assert "appointment_is_editable" in details_template

    assert ".calendar-admin-panel" in stylesheet
    assert ".student-schedule-item" in stylesheet
    assert ".appointment-readonly-notice" in stylesheet
    assert "width: calc(100% - var(--sidebar-width));" in stylesheet
    assert "--bf-calendar-event-gap: var(--space-xs);" in stylesheet
    assert ".fc-timegrid-event-harness > .fc-timegrid-event" in stylesheet
