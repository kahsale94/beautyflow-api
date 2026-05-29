window.initializeAdminDateTimePickers = function (root = document) {
    if (!window.flatpickr) return;

    root.querySelectorAll('[data-datetime-picker]').forEach(function (input) {
        if (!(input instanceof HTMLInputElement) || input.dataset.flatpickrInitialized === 'true') return;

        const minuteIncrement = Number.parseInt(input.dataset.minuteIncrement || '15', 10) || 15;
        input.dataset.flatpickrInitialized = 'true';

        window.flatpickr(input, {
            enableTime: true,
            time_24hr: true,
            locale: window.flatpickr.l10ns && window.flatpickr.l10ns.pt ? window.flatpickr.l10ns.pt : undefined,
            dateFormat: 'Y-m-d\\TH:i',
            altInput: true,
            altFormat: 'd/m/Y H:i',
            minuteIncrement: minuteIncrement,
            minDate: input.getAttribute('min') || undefined,
            maxDate: input.getAttribute('max') || undefined,
            defaultDate: input.value || undefined
        });
    });
};

document.addEventListener('DOMContentLoaded', function () {
    window.initializeAdminDateTimePickers();

    const calendarEl = document.getElementById('calendar');
    if (!calendarEl || !window.FullCalendar) return;

    const eventsUrl = calendarEl.dataset.eventsUrl || '/admin/appointments/events';
    const professionalFilter = document.getElementById('calendar-professional-filter');

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'timeGridWeek',
        locale: 'pt-br',
        timeZone: calendarEl.dataset.timezone || 'America/Sao_Paulo',
        slotDuration: calendarEl.dataset.slotDuration || '00:15:00',
        height: 'auto',
        nowIndicator: true,
        selectable: false,
        navLinks: true,
        eventTimeFormat: {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        },
        slotLabelFormat: {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        },
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
                .then(html => {
                    window.openAdminModal(html);
                    const content = document.getElementById('modal-content');
                    if (content && typeof window.initializeAdminDateTimePickers === 'function') {
                        window.initializeAdminDateTimePickers(content);
                    }
                });
        }
    });

    calendar.render();

    if (professionalFilter) {
        professionalFilter.addEventListener('change', function () {
            calendar.refetchEvents();
        });
    }
});
