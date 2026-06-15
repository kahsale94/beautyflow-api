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

function initializeScheduleBlockForms(root = document) {
    root.querySelectorAll('.schedule-block-form').forEach(function (form) {
        const allDayToggle = form.querySelector('[data-schedule-block-all-day]');
        const durationInput = form.querySelector('[data-schedule-block-duration]');
        const durationField = form.querySelector('[data-schedule-block-duration-field]');

        if (!(allDayToggle instanceof HTMLInputElement) || !(durationInput instanceof HTMLInputElement)) return;
        if (form.dataset.scheduleBlockInitialized === 'true') return;

        const defaultDuration = durationInput.value || '1';
        form.dataset.scheduleBlockInitialized = 'true';

        function syncAllDayState() {
            if (allDayToggle.checked) {
                durationInput.dataset.previousValue = durationInput.value || durationInput.dataset.previousValue || defaultDuration;
                durationInput.value = '';
                durationInput.disabled = true;
                durationInput.required = false;
                if (durationField instanceof HTMLElement) durationField.classList.add('is-disabled');
                return;
            }

            durationInput.disabled = false;
            durationInput.required = true;
            if (!durationInput.value) {
                durationInput.value = durationInput.dataset.previousValue || defaultDuration;
            }
            if (durationField instanceof HTMLElement) durationField.classList.remove('is-disabled');
        }

        allDayToggle.addEventListener('change', syncAllDayState);
        syncAllDayState();
    });
}

window.initializeScheduleBlockForms = initializeScheduleBlockForms;

function initializeAppointmentServiceFilters(root = document) {
    root.querySelectorAll('[data-appointment-service-filter]').forEach(function (form) {
        if (!(form instanceof HTMLFormElement) || form.dataset.appointmentServiceFilterInitialized === 'true') return;

        const professionalSelect = form.querySelector('[data-appointment-professional]');
        const serviceSelect = form.querySelector('[data-appointment-service]');
        if (!(professionalSelect instanceof HTMLSelectElement) || !(serviceSelect instanceof HTMLSelectElement)) return;

        const serviceOptions = Array.from(serviceSelect.options).map(function (option) {
            return option.cloneNode(true);
        });
        const submitButton = form.querySelector('[data-appointment-submit]')
            || (form.id ? root.querySelector(`[data-appointment-submit][form="${form.id}"]`) : null);

        form.dataset.appointmentServiceFilterInitialized = 'true';

        function syncServices() {
            const professionalId = professionalSelect.value;
            const currentServiceId = serviceSelect.value;
            const availableOptions = serviceOptions.filter(function (option) {
                const professionalIds = String(option.dataset.professionalIds || '')
                    .split(',')
                    .filter(Boolean);
                return professionalIds.includes(professionalId);
            });

            serviceSelect.replaceChildren();

            if (!availableOptions.length) {
                const emptyOption = document.createElement('option');
                emptyOption.value = '';
                emptyOption.textContent = 'Nenhum serviço disponível';
                serviceSelect.appendChild(emptyOption);
                serviceSelect.disabled = true;
                serviceSelect.required = false;
                if (submitButton instanceof HTMLButtonElement) submitButton.disabled = true;
                return;
            }

            availableOptions.forEach(function (option) {
                serviceSelect.appendChild(option.cloneNode(true));
            });

            serviceSelect.disabled = false;
            serviceSelect.required = true;
            if (availableOptions.some(function (option) { return option.value === currentServiceId; })) {
                serviceSelect.value = currentServiceId;
            } else {
                serviceSelect.selectedIndex = 0;
            }
            if (submitButton instanceof HTMLButtonElement) submitButton.disabled = false;
        }

        professionalSelect.addEventListener('change', syncServices);
        syncServices();
    });
}

window.initializeAppointmentServiceFilters = initializeAppointmentServiceFilters;

document.addEventListener('DOMContentLoaded', function () {
    window.initializeAdminDateTimePickers();
    window.initializeScheduleBlockForms();
    window.initializeAppointmentServiceFilters();

    const calendarEl = document.getElementById('calendar');
    if (!calendarEl || !window.FullCalendar) return;

    const eventsUrl = calendarEl.dataset.eventsUrl || '/admin/appointments/events';
    const professionalFilter = document.getElementById('calendar-professional-filter');
    const monthStrip = document.getElementById('calendar-month-strip');
    const mobileCalendarQuery = window.matchMedia('(max-width: 760px)');
    const scheduleBlockEventColor = '#cbd5e1';

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

    const monthFormatter = new Intl.DateTimeFormat('pt-BR', {month: 'short',timeZone: 'UTC'});
    const monthTitleFormatter = new Intl.DateTimeFormat('pt-BR', {month: 'long', year: 'numeric', timeZone: 'UTC'});
    const dayHeaderFormatter = new Intl.DateTimeFormat('pt-BR', {weekday: 'short', timeZone: 'UTC'});

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
            number.textContent = String(args.date.getUTCDate());
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

    function eventProps(infoOrEvent) {
        const event = infoOrEvent && infoOrEvent.event ? infoOrEvent.event : infoOrEvent;
        return event && event.extendedProps ? event.extendedProps : {};
    }

    function eventType(infoOrEvent) {
        const event = infoOrEvent && infoOrEvent.event ? infoOrEvent.event : infoOrEvent;
        const props = eventProps(infoOrEvent);
        return String(props.type || props.event_type || (event && event.type) || 'appointment');
    }

    function isScheduleBlockEvent(infoOrEvent) {
        return eventType(infoOrEvent) === 'schedule_block';
    }

    function scheduleBlockStatus(infoOrEvent) {
        const props = eventProps(infoOrEvent);
        return String(props.status || 'active').trim().toLowerCase();
    }

    function scheduleBlockId(infoOrEvent) {
        const event = infoOrEvent && infoOrEvent.event ? infoOrEvent.event : infoOrEvent;
        const props = eventProps(infoOrEvent);
        const explicitId = props.scheduleBlockId || props.schedule_block_id;
        if (explicitId) return explicitId;

        const rawId = event && event.id ? String(event.id) : '';
        return rawId.startsWith('schedule-block-') ? rawId.replace('schedule-block-', '') : rawId;
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

    function applyScheduleBlockColorToElement(element, status) {
        if (!element) return;
        const normalized = String(status || 'active').replace(/[^a-z0-9_-]/g, '-');

        element.style.setProperty('--bf-calendar-event-bg', scheduleBlockEventColor);
        element.style.backgroundColor = scheduleBlockEventColor;
        element.style.borderColor = scheduleBlockEventColor;
        element.style.color = '#0f172a';
        element.classList.remove('appointment-status-scheduled', 'appointment-status-completed', 'appointment-status-canceled');
        element.classList.add('schedule-block-event', `schedule-block-status-${normalized}`);
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
        const activeMonth = activeDate.getUTCMonth();
        const activeYear = activeDate.getUTCFullYear();

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
        displayEventEnd: true,
        dayHeaderFormat: { weekday: 'short', day: 'numeric' },
        views: {
            dayGridMonth: {
                dayHeaderFormat: { weekday: 'short' },
                displayEventEnd: false
            },
            timeGridWeek: {
                dayHeaderFormat: { weekday: 'short', day: 'numeric' },
                displayEventEnd: true
            },
            timeGridDay: {
                dayHeaderFormat: { weekday: 'long', day: 'numeric' },
                displayEventEnd: true
            },
            listWeek: {
                displayEventEnd: true
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
            const incomingClasses = Array.isArray(eventData.classNames) ? eventData.classNames : [];
            const rawType = props.type || props.event_type || eventData.type;

            if (rawType === 'schedule_block') {
                const blockStatus = String(props.status || eventData.status || 'active').replace(/[^a-z0-9_-]/g, '-');
                return {
                    ...eventData,
                    backgroundColor: scheduleBlockEventColor,
                    borderColor: scheduleBlockEventColor,
                    textColor: '#0f172a',
                    classNames: [
                        ...incomingClasses.filter(className => !String(className).startsWith('schedule-block-status-')),
                        'bf-calendar-event-shell',
                        'schedule-block-event',
                        `schedule-block-status-${blockStatus}`
                    ],
                    extendedProps: {
                        ...props,
                        type: 'schedule_block',
                        status: props.status || eventData.status || 'active',
                        scheduleBlockId: props.scheduleBlockId || props.schedule_block_id || eventData.scheduleBlockId || eventData.schedule_block_id,
                        schedule_block_id: props.schedule_block_id || props.scheduleBlockId || eventData.schedule_block_id || eventData.scheduleBlockId
                    }
                };
            }

            const normalized = normalizedStatus(props.status || eventData.status);
            const eventColor = appointmentColor(normalized);

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
            const props = eventProps(info);
            const startTime = info.timeText || '';
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

            if (isScheduleBlockEvent(info)) {
                const reasonLabel = props.reasonLabel || props.reason_label || 'Motivo';
                const professional = props.professional || '';
                const scheduleLabel = info.event.allDay ? 'Dia inteiro' : startTime;

                appendText('bf-calendar-event-time', scheduleLabel);
                appendText('bf-calendar-event-title', info.event.title || `Agenda fechada — ${reasonLabel}`);
                if (!isMonth) {
                    appendText('bf-calendar-event-subtitle', professional);
                }

                return { domNodes: [wrapper] };
            }

            const client = props.client || info.event.title || 'Cliente';
            const service = props.service || 'Serviço';
            const professional = props.professional || '';

            appendText('bf-calendar-event-time', startTime);
            appendText('bf-calendar-event-title', client);
            if (!isMonth) {
                appendText('bf-calendar-event-subtitle', `${service}${professional ? ` • ${professional}` : ''}`);
            }

            return { domNodes: [wrapper] };
        },
        eventDidMount: function (info) {
            const props = eventProps(info);
            const startTime = info.timeText || '';

            if (isScheduleBlockEvent(info)) {
                applyScheduleBlockColorToElement(info.el, scheduleBlockStatus(info));
                info.el.title = [info.event.allDay ? 'Dia inteiro' : startTime, 'Agenda fechada', props.reasonLabel || props.reason_label, props.professional]
                    .filter(Boolean)
                    .join(' • ');
                return;
            }

            applyAppointmentColorToElement(info.el, eventStatus(info));
            info.el.title = [startTime, props.client, props.service, props.professional]
                .filter(Boolean)
                .join(' • ');
        },
        eventClassNames: function (info) {
            if (isScheduleBlockEvent(info)) {
                const blockStatus = scheduleBlockStatus(info).replace(/[^a-z0-9_-]/g, '-');
                return [
                    'bf-calendar-event-shell',
                    'schedule-block-event',
                    `schedule-block-status-${blockStatus}`
                ];
            }

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
            fetch(`${eventsUrl}?${params.toString()}`, { credentials: 'same-origin', cache: 'no-store' })
                .then(response => {
                    if (!response.ok) throw new Error('Erro ao carregar eventos');
                    return response.json();
                })
                .then(successCallback)
                .catch(failureCallback);
        },
        eventClick: function (info) {
            info.jsEvent.preventDefault();

            const blockId = scheduleBlockId(info);
            const detailUrl = isScheduleBlockEvent(info)
                ? `/admin/appointments/blocks/${blockId}/details`
                : `/admin/appointments/${info.event.id}/details`;

            fetch(detailUrl, { credentials: 'same-origin' })
                .then(response => {
                    if (!response.ok) throw new Error('Erro ao carregar detalhes');
                    return response.text();
                })
                .then(html => {
                    if (!isScheduleBlockEvent(info)) {
                        const freshStatus = extractStatusFromDetailsHtml(html);
                        if (freshStatus) {
                            applyAppointmentStatusToEvent(info.event, freshStatus);
                        }
                    }

                    window.openAdminModal(html);
                    window.initializeAppointmentServiceFilters(document.getElementById('modal-content'));
                })
                .catch(error => {
                    console.warn(error);
                    window.openAdminModal('<p class="empty">Não foi possível carregar os detalhes.</p>');
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
