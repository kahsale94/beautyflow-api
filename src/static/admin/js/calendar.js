document.addEventListener('DOMContentLoaded', function () {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl || !window.FullCalendar) return;

    const eventsUrl = calendarEl.dataset.eventsUrl || '/admin/appointments/events';
    const professionalFilter = document.getElementById('calendar-professional-filter');

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'timeGridWeek',
        locale: 'pt-br',
        height: 'auto',
        nowIndicator: true,
        selectable: false,
        navLinks: true,
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
        },
        buttonText: {
            today: 'Hoje',
            month: 'Mês',
            week: 'Semana',
            day: 'Dia',
            list: 'Lista'
        },
        events: function (info, successCallback, failureCallback) {
            const params = new URLSearchParams({
                start: info.startStr,
                end: info.endStr
            });
            if (professionalFilter && professionalFilter.value) {
                params.set('professional_id', professionalFilter.value);
            }
            fetch(`${eventsUrl}?${params.toString()}`, { credentials: 'same-origin' })
                .then(response => {
                    if (!response.ok) throw new Error('Erro ao carregar eventos');
                    return response.json();
                })
                .then(successCallback)
                .catch(failureCallback);
        },
        eventClick: function (info) {
            info.jsEvent.preventDefault();
            fetch(`/admin/appointments/${info.event.id}/details`, { credentials: 'same-origin' })
                .then(response => response.text())
                .then(html => window.openAdminModal(html));
        }
    });

    calendar.render();

    if (professionalFilter) {
        professionalFilter.addEventListener('change', function () {
            calendar.refetchEvents();
        });
    }
});
