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
    const monthStrip = document.getElementById('calendar-month-strip');
    const mobileCalendarQuery = window.matchMedia('(max-width: 760px)');

    const desktopToolbar = {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
    };

    const mobileToolbar = {
        left: 'prev,next',
        center: 'title',
        right: 'today dayGridMonth,timeGridWeek,timeGridDay,listWeek'
    };

    const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'short' });
    const monthTitleFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });
    const dayHeaderFormatter = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' });

    function normalizeShortMonth(value) {
        return value.replace('.', '').replace(/^./, char => char.toUpperCase());
    }

    function createDayHeaderNode(args) {
        const wrapper = document.createElement('span');
        wrapper.className = 'bf-calendar-day-header';
        if (args.isToday) wrapper.classList.add('is-today');

        const label = document.createElement('span');
        label.className = 'bf-calendar-day-header-label';
        label.textContent = dayHeaderFormatter.format(args.date).replace('.', '');
        wrapper.appendChild(label);

        if (args.view.type !== 'dayGridMonth') {
            const number = document.createElement('span');
            number.className = 'bf-calendar-day-header-number';
            number.textContent = String(args.date.getDate());
            wrapper.appendChild(number);
        }

        return wrapper;
    }

    function buildDayHeaderContent(args) {
        return { domNodes: [createDayHeaderNode(args)] };
    }

    function mountDayHeaderContent(args) {
        const target = args.el.querySelector('.fc-col-header-cell-cushion') || args.el;
        if (!target || target.querySelector('.bf-calendar-day-header')) return;
        target.replaceChildren(createDayHeaderNode(args));
    }

    function normalizedStatus(status) {
        const rawStatus = String(status || 'scheduled').trim().toLowerCase();
        const compactStatus = rawStatus.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        if (compactStatus.includes('cancel')) return 'canceled';
        if (compactStatus.includes('complete') || compactStatus.includes('conclu')) return 'completed';
        return 'scheduled';
    }

    function statusClassName(status) {
        return normalizedStatus(status).replace(/[^a-z0-9_-]/g, '-');
    }

    function appointmentColor(status) {
        switch (normalizedStatus(status)) {
            case 'completed':
                return '#86efac';
            case 'canceled':
                return '#fca5a5';
            default:
                return '#2dd4bf';
        }
    }

    function eventStatus(infoOrEvent) {
        const event = infoOrEvent && infoOrEvent.event ? infoOrEvent.event : infoOrEvent;
        const props = event && event.extendedProps ? event.extendedProps : {};
        return normalizedStatus(props.status || (event && event.status));
    }

    function applyAppointmentColorToElement(element, status) {
        if (!element) return;
        const normalized = normalizedStatus(status);
        const eventColor = appointmentColor(normalized);

        element.style.setProperty('--bf-calendar-event-bg', eventColor);
        element.style.backgroundColor = eventColor;
        element.style.borderColor = eventColor;
        element.style.color = '#0f172a';
        element.classList.remove('appointment-status-scheduled', 'appointment-status-completed', 'appointment-status-canceled');
        element.classList.add(`appointment-status-${normalized}`);
    }

    function applyAppointmentStatusToEvent(event, status) {
        if (!event || typeof event.setExtendedProp !== 'function') return;
        const normalized = normalizedStatus(status);
        const eventColor = appointmentColor(normalized);

        event.setExtendedProp('status', normalized);
        if (typeof event.setProp === 'function') {
            event.setProp('backgroundColor', eventColor);
            event.setProp('borderColor', eventColor);
            event.setProp('textColor', '#0f172a');
            event.setProp('classNames', [
                'bf-calendar-event-shell',
                `appointment-status-${normalized}`
            ]);
        }
    }

    function extractStatusFromDetailsHtml(html) {
        const holder = document.createElement('div');
        holder.innerHTML = html;
        const badge = holder.querySelector('.details-list .badge, .badge.scheduled, .badge.completed, .badge.canceled');
        if (!badge) return '';

        return [badge.textContent || '', Array.from(badge.classList).join(' ')].join(' ');
    }

    function renderMonthStrip(calendarInstance) {
        if (!monthStrip || !calendarInstance) return;

        const activeDate = calendarInstance.getDate();
        const activeMonth = activeDate.getMonth();
        const activeYear = activeDate.getFullYear();

        monthStrip.innerHTML = '';
        monthStrip.setAttribute('aria-label', monthTitleFormatter.format(activeDate));

        for (let month = 0; month < 12; month += 1) {
            const button = document.createElement('button');
            const buttonDate = new Date(activeYear, month, 1);
            const isActive = month === activeMonth;

            button.type = 'button';
            button.className = 'calendar-month-button';
            button.textContent = normalizeShortMonth(monthFormatter.format(buttonDate));
            button.setAttribute('aria-label', monthTitleFormatter.format(buttonDate));
            if (isActive) button.setAttribute('aria-current', 'date');

            button.addEventListener('click', function () {
                calendarInstance.gotoDate(buttonDate);
            });

            monthStrip.appendChild(button);
        }

        const activeButton = monthStrip.querySelector('[aria-current="date"]');
        if (activeButton) {
            window.requestAnimationFrame(function () {
                activeButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            });
        }
    }

    let calendar;
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'pt-br',
        timeZone: calendarEl.dataset.timezone || 'America/Sao_Paulo',
        slotDuration: calendarEl.dataset.slotDuration || '00:15:00',
        height: 'auto',
        expandRows: true,
        nowIndicator: true,
        selectable: false,
        navLinks: true,
        dayMaxEventRows: 3,
        eventDisplay: 'block',
        displayEventEnd: false,
        dayHeaderFormat: { weekday: 'short', day: 'numeric' },
        views: {
            dayGridMonth: {
                dayHeaderFormat: { weekday: 'short' }
            },
            timeGridWeek: {
                dayHeaderFormat: { weekday: 'short', day: 'numeric' }
            },
            timeGridDay: {
                dayHeaderFormat: { weekday: 'long', day: 'numeric' }
            }
        },
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
        headerToolbar: mobileCalendarQuery.matches ? mobileToolbar : desktopToolbar,
        buttonText: {
            today: 'Hoje',
            month: 'Mês',
            week: 'Semana',
            day: 'Dia',
            list: 'Lista'
        },
        dayHeaderContent: buildDayHeaderContent,
        dayHeaderDidMount: mountDayHeaderContent,
        datesSet: function () {
            renderMonthStrip(calendar);
        },
        eventDataTransform: function (eventData) {
            const props = eventData.extendedProps || {};
            const normalized = normalizedStatus(props.status || eventData.status);
            const eventColor = appointmentColor(normalized);
            const incomingClasses = Array.isArray(eventData.classNames) ? eventData.classNames : [];

            return {
                ...eventData,
                backgroundColor: eventColor,
                borderColor: eventColor,
                textColor: '#0f172a',
                classNames: [
                    ...incomingClasses.filter(className => !String(className).startsWith('appointment-status-')),
                    'bf-calendar-event-shell',
                    `appointment-status-${normalized}`
                ],
                extendedProps: {
                    ...props,
                    status: normalized
                }
            };
        },
        eventContent: function (info) {
            const props = info.event.extendedProps || {};
            const startTime = info.event.start
                ? info.event.start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                : '';
            const client = props.client || info.event.title || 'Cliente';
            const service = props.service || 'Serviço';
            const professional = props.professional || '';
            const isMonth = info.view.type === 'dayGridMonth';
            const wrapper = document.createElement('div');
            wrapper.className = isMonth ? 'bf-calendar-event bf-calendar-event--month' : 'bf-calendar-event bf-calendar-event--time';

            function appendText(className, text) {
                if (!text) return;
                const item = document.createElement('span');
                item.className = className;
                item.textContent = text;
                wrapper.appendChild(item);
            }

            appendText('bf-calendar-event-time', startTime);
            appendText('bf-calendar-event-title', client);
            if (!isMonth) {
                appendText('bf-calendar-event-subtitle', `${service}${professional ? ` • ${professional}` : ''}`);
            }

            return { domNodes: [wrapper] };
        },
        eventDidMount: function (info) {
            const props = info.event.extendedProps || {};
            const startTime = info.event.start
                ? info.event.start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                : '';
            applyAppointmentColorToElement(info.el, eventStatus(info));
            info.el.title = [startTime, props.client, props.service, props.professional]
                .filter(Boolean)
                .join(' • ');
        },
        eventClassNames: function (info) {
            return [
                'bf-calendar-event-shell',
                `appointment-status-${statusClassName(eventStatus(info))}`
            ];
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
                    const freshStatus = extractStatusFromDetailsHtml(html);
                    if (freshStatus) {
                        applyAppointmentStatusToEvent(info.event, freshStatus);
                    }

                    window.openAdminModal(html);
                    const content = document.getElementById('modal-content');
                    if (content && typeof window.initializeAdminDateTimePickers === 'function') {
                        window.initializeAdminDateTimePickers(content);
                    }
                });
        }
    });

    calendar.render();
    renderMonthStrip(calendar);

    function syncCalendarResponsiveness() {
        const isMobile = mobileCalendarQuery.matches;
        calendar.setOption('headerToolbar', isMobile ? mobileToolbar : desktopToolbar);

        calendar.updateSize();
        renderMonthStrip(calendar);
    }

    mobileCalendarQuery.addEventListener('change', syncCalendarResponsiveness);
    window.addEventListener('resize', function () {
        window.requestAnimationFrame(function () {
            calendar.updateSize();
        });
    });

    if (professionalFilter) {
        professionalFilter.addEventListener('change', function () {
            calendar.refetchEvents();
        });
    }
});
