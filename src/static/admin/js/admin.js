document.addEventListener('submit', function (event) {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;

    const message = form.dataset.confirm;
    if (message && !window.confirm(message)) {
        event.preventDefault();
        return;
    }

    if (form.id) {
        const selector = `[form="${window.CSS && CSS.escape ? CSS.escape(form.id) : form.id}"][data-editable][disabled]`;
        document.querySelectorAll(selector).forEach(function (field) {
            field.removeAttribute('disabled');
        });
    }

    form.querySelectorAll('[data-editable][disabled]').forEach(function (field) {
        field.removeAttribute('disabled');
    });
});

function storeEditableState(field) {
    if (!(field instanceof HTMLElement)) return;

    if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement) {
        field.dataset.originalValue = field.value;
    }

    if (field instanceof HTMLInputElement && (field.type === 'checkbox' || field.type === 'radio')) {
        field.dataset.originalChecked = field.checked ? 'true' : 'false';
    }

    field.dataset.originalHidden = field.hidden ? 'true' : 'false';
}

function restoreEditableState(field) {
    if (!(field instanceof HTMLElement)) return;

    if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement) {
        if (Object.prototype.hasOwnProperty.call(field.dataset, 'originalValue')) {
            field.value = field.dataset.originalValue || '';
        }
    }

    if (field instanceof HTMLInputElement && (field.type === 'checkbox' || field.type === 'radio')) {
        if (Object.prototype.hasOwnProperty.call(field.dataset, 'originalChecked')) {
            field.checked = field.dataset.originalChecked === 'true';
        }
    }

    if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
        field.setAttribute('readonly', 'readonly');
    }

    if (field instanceof HTMLSelectElement) {
        field.setAttribute('disabled', 'disabled');
    }

    if (field.classList.contains('edit-only') || field.dataset.originalHidden === 'true') {
        field.hidden = true;
    }
}

function finishRowEditing(row, rowSelector) {
    row.classList.remove('is-editing');

    row.querySelectorAll('[data-save-row], [data-cancel-row]').forEach(function (element) {
        if (element instanceof HTMLElement) element.hidden = true;
    });

    row.querySelectorAll('[data-edit-row]').forEach(function (element) {
        if (element instanceof HTMLElement) element.hidden = false;
    });

    row.querySelectorAll('.edit-only').forEach(function (element) {
        if (element instanceof HTMLElement) element.hidden = true;
    });

    if (rowSelector) {
        document.querySelectorAll(`[data-edit-row="${rowSelector}"]`).forEach(function (element) {
            if (element instanceof HTMLElement) element.hidden = false;
        });
    }
}

document.addEventListener('click', function (event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const editButton = target.closest('[data-edit-row]');
    if (editButton instanceof HTMLElement) {
        const rowSelector = editButton.dataset.editRow;
        const row = rowSelector ? document.querySelector(rowSelector) : null;
        if (!row) return;

        row.classList.add('is-editing');

        row.querySelectorAll('.edit-only[hidden]').forEach(function (element) {
            if (element instanceof HTMLElement) element.hidden = false;
        });

        const editableFields = Array.from(row.querySelectorAll('[data-editable]'));
        editableFields.forEach(function (field) {
            storeEditableState(field);

            if (field instanceof HTMLElement && field.hasAttribute('hidden')) {
                field.hidden = false;
            }
            if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
                field.removeAttribute('readonly');
            }
            if (field instanceof HTMLSelectElement) {
                field.removeAttribute('disabled');
            }
        });

        row.querySelectorAll('[data-save-row], [data-cancel-row]').forEach(function (element) {
            if (element instanceof HTMLElement) element.hidden = false;
        });

        editButton.hidden = true;

        const firstEditable = editableFields.find(function (field) {
            return field instanceof HTMLElement && !field.hidden && !field.hasAttribute('disabled');
        });
        if (firstEditable instanceof HTMLElement) {
            firstEditable.focus();
        }
        return;
    }

    const cancelButton = target.closest('[data-cancel-row]');
    if (cancelButton instanceof HTMLElement) {
        const rowSelector = cancelButton.dataset.cancelRow;
        const row = rowSelector ? document.querySelector(rowSelector) : null;
        if (!row) return;

        row.querySelectorAll('[data-editable]').forEach(function (field) {
            restoreEditableState(field);
        });

        finishRowEditing(row, rowSelector);
        return;
    }

    if (target.matches('[data-close-modal]')) {
        const modal = document.getElementById('modal');
        if (modal) modal.hidden = true;
    }
});


function initializeAdminSidebar() {
    const body = document.body;
    const sidebar = document.getElementById('admin-sidebar');
    const toggle = document.querySelector('[data-sidebar-toggle]');
    const backdrop = document.querySelector('[data-sidebar-close]');
    const mobileQuery = window.matchMedia('(max-width: 980px)');

    if (!sidebar || !(toggle instanceof HTMLElement) || !(backdrop instanceof HTMLElement)) return;

    function openSidebar() {
        body.classList.add('sidebar-open');
        toggle.setAttribute('aria-expanded', 'true');
        backdrop.hidden = false;
    }

    function closeSidebar() {
        body.classList.remove('sidebar-open');
        toggle.setAttribute('aria-expanded', 'false');
        backdrop.hidden = true;
    }

    function toggleSidebar() {
        if (body.classList.contains('sidebar-open')) {
            closeSidebar();
        } else {
            openSidebar();
        }
    }

    toggle.addEventListener('click', toggleSidebar);
    backdrop.addEventListener('click', closeSidebar);

    sidebar.addEventListener('click', function (event) {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        if (mobileQuery.matches && target.closest('.nav-link')) {
            closeSidebar();
        }
    });

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            closeSidebar();
        }
    });

    mobileQuery.addEventListener('change', function (event) {
        if (!event.matches) {
            closeSidebar();
        }
    });
}

function normalizeOptionText(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();
}

async function fetchOptionItems(url) {
    const response = await window.fetch(url, {
        headers: { 'Accept': 'application/json' },
        credentials: 'same-origin',
    });

    if (!response.ok) {
        throw new Error(`Não foi possível carregar as opções de ${url}`);
    }

    const payload = await response.json();
    return Array.isArray(payload.items) ? payload.items : [];
}

function replaceSelectOptions(select, items, options) {
    const currentValue = options.currentValue || '';
    const normalizedCurrentValue = normalizeOptionText(currentValue);
    const getValue = options.getValue;
    const getLabel = options.getLabel;
    let selectedValue = '';

    select.replaceChildren();

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = options.placeholder || 'Selecione';
    select.appendChild(placeholder);

    items.forEach(function (item) {
        const value = String(getValue(item) || '').trim();
        const label = String(getLabel(item) || value).trim();
        if (!value) return;

        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        select.appendChild(option);

        if (
            normalizedCurrentValue &&
            (normalizeOptionText(value) === normalizedCurrentValue || normalizeOptionText(label) === normalizedCurrentValue)
        ) {
            selectedValue = value;
        }
    });

    if (currentValue && !selectedValue) {
        const option = document.createElement('option');
        option.value = currentValue;
        option.textContent = currentValue;
        select.insertBefore(option, select.firstElementChild ? select.firstElementChild.nextSibling : null);
        selectedValue = currentValue;
    }

    select.value = selectedValue;
}

function keepCurrentSelectOption(select, placeholder) {
    const currentValue = select.dataset.currentValue || select.value || '';
    replaceSelectOptions(select, [], {
        currentValue: currentValue,
        placeholder: placeholder,
        getValue: function (item) { return item; },
        getLabel: function (item) { return item; },
    });
}

function initializeBusinessExternalOptions() {
    const timezoneSelect = document.querySelector('[data-business-timezone]');
    const stateSelect = document.querySelector('[data-business-state]');
    const citySelect = document.querySelector('[data-business-city]');

    async function loadTimezones() {
        if (!(timezoneSelect instanceof HTMLSelectElement)) return;

        const currentValue = timezoneSelect.dataset.currentValue || timezoneSelect.value || '';
        try {
            const items = await fetchOptionItems('/admin/business/options/timezones');
            replaceSelectOptions(timezoneSelect, items, {
                currentValue: currentValue,
                placeholder: 'Selecione o timezone',
                getValue: function (item) { return item; },
                getLabel: function (item) { return item; },
            });
        } catch (error) {
            console.warn(error);
            keepCurrentSelectOption(timezoneSelect, 'Selecione o timezone');
        }
    }

    async function loadCities() {
        if (!(stateSelect instanceof HTMLSelectElement)) return;
        if (!(citySelect instanceof HTMLSelectElement)) return;

        const selectedState = stateSelect.value;
        const currentValue = citySelect.dataset.currentValue || citySelect.value || '';

        if (!selectedState) {
            keepCurrentSelectOption(citySelect, 'Selecione a cidade');
            return;
        }

        try {
            const items = await fetchOptionItems(`/admin/business/options/cities?state=${encodeURIComponent(selectedState)}`);
            replaceSelectOptions(citySelect, items, {
                currentValue: currentValue,
                placeholder: 'Selecione a cidade',
                getValue: function (item) { return item.name; },
                getLabel: function (item) { return item.name; },
            });
        } catch (error) {
            console.warn(error);
            keepCurrentSelectOption(citySelect, 'Selecione a cidade');
        }
    }

    async function loadStates() {
        if (!(stateSelect instanceof HTMLSelectElement)) return;

        const currentValue = stateSelect.dataset.currentValue || stateSelect.value || '';
        try {
            const items = await fetchOptionItems('/admin/business/options/states');
            replaceSelectOptions(stateSelect, items, {
                currentValue: currentValue,
                placeholder: 'Selecione o estado',
                getValue: function (item) { return item.uf; },
                getLabel: function (item) { return `${item.uf} - ${item.name}`; },
            });
        } catch (error) {
            console.warn(error);
            keepCurrentSelectOption(stateSelect, 'Selecione o estado');
        }

        await loadCities();
    }

    if (stateSelect instanceof HTMLSelectElement && citySelect instanceof HTMLSelectElement) {
        stateSelect.addEventListener('change', function () {
            citySelect.dataset.currentValue = '';
            citySelect.value = '';
            loadCities();
        });

        document.addEventListener('business:cep-location', async function (event) {
            const detail = event instanceof CustomEvent ? event.detail || {} : {};
            const state = String(detail.state || '').trim().toUpperCase();
            const city = String(detail.city || '').trim();

            if (state) {
                if (!Array.from(stateSelect.options).some(function (option) { return option.value === state; })) {
                    const option = document.createElement('option');
                    option.value = state;
                    option.textContent = state;
                    stateSelect.appendChild(option);
                }
                stateSelect.value = state;
                stateSelect.dataset.currentValue = state;
            }

            if (city) {
                citySelect.dataset.currentValue = city;
            }

            await loadCities();

            if (city) {
                citySelect.value = city;
                citySelect.dataset.currentValue = city;
            }
        });
    }

    loadTimezones();
    loadStates();
}

function initializeBusinessCepLookup() {
    const form = document.querySelector('[data-business-settings-form]');
    const cepInput = document.querySelector('[data-business-cep]');
    const streetInput = document.querySelector('[data-business-address-street]');
    const messageElement = document.querySelector('[data-business-cep-message]');

    if (!(form instanceof HTMLFormElement)) return;
    if (!(cepInput instanceof HTMLInputElement)) return;

    let lookupController = null;

    function cepDigits(value) {
        return String(value || '').replace(/\D/g, '').slice(0, 8);
    }

    function formatCep(value) {
        const digits = cepDigits(value);
        if (digits.length <= 5) return digits;
        return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    }

    function setCepStatus(status, message) {
        cepInput.dataset.cepStatus = status;
        if (messageElement instanceof HTMLElement) {
            messageElement.textContent = message || '';
            messageElement.classList.toggle('error', status === 'error');
            messageElement.classList.toggle('success', status === 'success');
        }
    }

    async function lookupCep(digits) {
        if (lookupController) lookupController.abort();

        lookupController = new AbortController();
        setCepStatus('loading', 'Consultando CEP...');

        try {
            const response = await window.fetch(`/admin/business/cep/${encodeURIComponent(digits)}`, {
                headers: { 'Accept': 'application/json' },
                credentials: 'same-origin',
                signal: lookupController.signal,
            });

            let payload = {};
            try {
                payload = await response.json();
            } catch (error) {
                payload = {};
            }

            if (!response.ok) {
                throw new Error(payload.detail || 'Não foi possível consultar o CEP.');
            }

            cepInput.dataset.validCep = digits;
            cepInput.value = payload.cep || formatCep(digits);

            if (payload.street && streetInput instanceof HTMLInputElement) {
                streetInput.value = payload.street;
            }

            document.dispatchEvent(new CustomEvent('business:cep-location', {
                detail: {
                    city: payload.city || '',
                    state: payload.state || '',
                },
            }));

            setCepStatus('success', 'CEP válido. Preencha o número do estabelecimento.');
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') return;
            delete cepInput.dataset.validCep;
            setCepStatus('error', error instanceof Error ? error.message : 'Não foi possível consultar o CEP.');
        }
    }

    cepInput.addEventListener('input', function () {
        const digits = cepDigits(cepInput.value);
        cepInput.value = formatCep(digits);
        delete cepInput.dataset.validCep;

        if (!digits) {
            setCepStatus('', '');
            return;
        }

        if (digits.length < 8) {
            setCepStatus('error', 'Digite os 8 números do CEP.');
            return;
        }

        lookupCep(digits);
    });

    cepInput.addEventListener('blur', function () {
        cepInput.value = formatCep(cepInput.value);
    });

    form.addEventListener('submit', function (event) {
        const digits = cepDigits(cepInput.value);
        if (!digits) return;

        if (digits.length !== 8) {
            event.preventDefault();
            setCepStatus('error', 'Digite um CEP completo antes de salvar.');
            cepInput.focus();
            return;
        }

        if (cepInput.dataset.validCep !== digits) {
            event.preventDefault();
            setCepStatus('error', 'Valide o CEP antes de salvar.');
            lookupCep(digits);
            cepInput.focus();
        }
    });
}

function initializeEvolutionIntegrations() {
    const cards = document.querySelectorAll('[data-evolution-card]');

    cards.forEach(function (card) {
        if (!(card instanceof HTMLElement)) return;

        const integrationId = card.dataset.integrationId;
        const csrfToken = card.dataset.csrfToken || '';
        const configured = card.dataset.evolutionConfigured === 'true';
        const statusElement = card.querySelector('[data-evolution-status]');
        const messageElement = card.querySelector('[data-evolution-message]');
        const detailsElement = card.querySelector('[data-evolution-details]');
        const instanceNameElement = card.querySelector('[data-evolution-instance-name]');
        const phoneElement = card.querySelector('[data-evolution-phone]');
        const qrContainer = card.querySelector('[data-evolution-qr]');
        const qrImage = card.querySelector('[data-evolution-qr-image]');
        const pairingCodeElement = card.querySelector('[data-evolution-pairing-code]');
        let pollTimer = null;
        let pollAttempts = 0;

        if (!integrationId || !configured) return;

        function statusLabel(state) {
            const labels = {
                open: 'conectado',
                connected: 'conectado',
                connecting: 'aguardando conexão',
                creating: 'criando instância',
                close: 'desconectado',
                disconnected: 'desconectado',
                missing: 'ausente',
                error: 'erro',
                not_configured: 'não configurado',
            };
            return labels[state] || 'desconhecido';
        }

        function setMessage(message, isError) {
            if (!(messageElement instanceof HTMLElement)) return;
            messageElement.textContent = message || '';
            messageElement.hidden = !message;
            messageElement.classList.toggle('error', Boolean(isError));
        }

        function updateButtons(hasInstance, state) {
            card.querySelectorAll('[data-evolution-action]').forEach(function (button) {
                if (!(button instanceof HTMLButtonElement)) return;
                const action = button.dataset.evolutionAction;
                if (action === 'connect') {
                    button.textContent = hasInstance ? 'Reconectar WhatsApp' : 'Conectar WhatsApp';
                    button.hidden = state === 'open';
                } else if (action === 'qrcode') {
                    button.hidden = !hasInstance || state === 'open';
                } else if (action === 'logout') {
                    button.hidden = !hasInstance || state !== 'open';
                } else {
                    button.hidden = !hasInstance;
                }
            });
        }

        function updateState(payload) {
            const state = payload.state || 'not_configured';
            const hasInstance = Boolean(payload.instance_name);
            card.dataset.instanceState = state;

            if (statusElement instanceof HTMLElement) {
                statusElement.textContent = statusLabel(state);
                statusElement.className = `badge evolution-status evolution-status-${state}`;
            }
            if (detailsElement instanceof HTMLElement) detailsElement.hidden = !hasInstance;
            if (instanceNameElement instanceof HTMLElement) {
                instanceNameElement.textContent = payload.instance_name || '';
            }
            if (phoneElement instanceof HTMLElement) {
                phoneElement.textContent = payload.phone || 'Será identificado após a conexão';
            }

            updateButtons(hasInstance, state);

            if (state === 'open') {
                hideQrCode();
                stopPolling();
                setMessage('WhatsApp conectado com sucesso.', false);
            }
        }

        function showQrCode(payload) {
            const qrCode = payload.qr_code;
            const pairingCode = payload.pairing_code;

            if (qrCode && qrImage instanceof HTMLImageElement && qrContainer instanceof HTMLElement) {
                qrImage.src = qrCode;
                qrContainer.hidden = false;
            }
            if (pairingCodeElement instanceof HTMLElement) {
                pairingCodeElement.hidden = !pairingCode;
                pairingCodeElement.textContent = pairingCode ? `Código de pareamento: ${pairingCode}` : '';
            }
        }

        function hideQrCode() {
            if (qrContainer instanceof HTMLElement) qrContainer.hidden = true;
            if (qrImage instanceof HTMLImageElement) qrImage.removeAttribute('src');
            if (pairingCodeElement instanceof HTMLElement) pairingCodeElement.hidden = true;
        }

        function setBusy(busy) {
            card.querySelectorAll('[data-evolution-action]').forEach(function (button) {
                if (button instanceof HTMLButtonElement) button.disabled = busy;
            });
            card.classList.toggle('is-loading', busy);
        }

        async function parseResponse(response) {
            let payload = {};
            try {
                payload = await response.json();
            } catch (error) {
                payload = {};
            }
            if (!response.ok) {
                throw new Error(payload.detail || 'Não foi possível concluir a operação.');
            }
            return payload;
        }

        async function postAction(action) {
            const formData = new FormData();
            formData.set('_csrf_token', csrfToken);
            const response = await window.fetch(
                `/admin/integrations/${encodeURIComponent(integrationId)}/whatsapp/${action}`,
                {
                    method: 'POST',
                    body: formData,
                    credentials: 'same-origin',
                    headers: { 'Accept': 'application/json' },
                }
            );
            return parseResponse(response);
        }

        async function refreshStatus() {
            const response = await window.fetch(
                `/admin/integrations/${encodeURIComponent(integrationId)}/whatsapp/status`,
                {
                    credentials: 'same-origin',
                    headers: { 'Accept': 'application/json' },
                }
            );
            const payload = await parseResponse(response);
            updateState(payload);
            return payload;
        }

        function stopPolling() {
            if (pollTimer !== null) {
                window.clearInterval(pollTimer);
                pollTimer = null;
            }
        }

        function startPolling() {
            stopPolling();
            pollAttempts = 0;
            pollTimer = window.setInterval(async function () {
                pollAttempts += 1;
                if (pollAttempts > 40) {
                    stopPolling();
                    setMessage('O QR expirou. Gere um novo código para continuar.', true);
                    return;
                }
                try {
                    await refreshStatus();
                } catch (error) {
                    stopPolling();
                    setMessage(error instanceof Error ? error.message : 'Falha ao consultar a conexão.', true);
                }
            }, 3000);
        }

        card.addEventListener('click', async function (event) {
            const target = event.target;
            if (!(target instanceof HTMLElement)) return;
            const button = target.closest('[data-evolution-action]');
            if (!(button instanceof HTMLButtonElement)) return;

            const action = button.dataset.evolutionAction;
            if (!action) return;
            if (action === 'remove' && !window.confirm('Remover definitivamente esta instância da Evolution API?')) {
                return;
            }
            if (action === 'logout' && !window.confirm('Desconectar o WhatsApp desta instância?')) {
                return;
            }

            setBusy(true);
            setMessage('', false);
            try {
                const payload = await postAction(action);
                if (action === 'remove') {
                    stopPolling();
                    hideQrCode();
                    updateState({ state: 'not_configured', instance_name: null, phone: null });
                    setMessage('Instância removida.', false);
                    return;
                }

                updateState(payload);
                showQrCode(payload);
                if (action === 'connect' || action === 'qrcode') {
                    if (payload.state !== 'open') {
                        setMessage('Escaneie o código QR para concluir a conexão.', false);
                        startPolling();
                    }
                } else if (action === 'logout') {
                    hideQrCode();
                    setMessage('WhatsApp desconectado.', false);
                }
            } catch (error) {
                setMessage(error instanceof Error ? error.message : 'Não foi possível concluir a operação.', true);
            } finally {
                setBusy(false);
            }
        });

        updateButtons(
            Boolean(instanceNameElement instanceof HTMLElement && instanceNameElement.textContent.trim()),
            card.dataset.instanceState || 'not_configured'
        );

        if (['connecting', 'creating'].includes(card.dataset.instanceState || '')) {
            startPolling();
        }
    });
}

function initializeWeeklySchedulePanels() {
    const panels = document.querySelectorAll('[data-weekly-schedule-panel]');

    function getRowParts(row) {
        return {
            enabled: row.querySelector('[data-schedule-enabled]'),
            follow: row.querySelector('[data-follow-business-hours]'),
            start: row.querySelector('[data-schedule-start]'),
            end: row.querySelector('[data-schedule-end]'),
        };
    }

    function syncRow(row) {
        const parts = getRowParts(row);
        if (!(parts.enabled instanceof HTMLInputElement)) return;
        if (!(parts.start instanceof HTMLInputElement) || !(parts.end instanceof HTMLInputElement)) return;

        const isEnabled = parts.enabled.checked;
        if (parts.follow instanceof HTMLInputElement && !isEnabled) {
            parts.follow.checked = false;
        }

        const followsBusiness = parts.follow instanceof HTMLInputElement && parts.follow.checked && isEnabled;
        const companyStart = row.dataset.companyStart || '';
        const companyEnd = row.dataset.companyEnd || '';

        if (followsBusiness && companyStart && companyEnd) {
            parts.start.value = companyStart;
            parts.end.value = companyEnd;
        }

        parts.start.disabled = !isEnabled;
        parts.end.disabled = !isEnabled;
        parts.start.readOnly = followsBusiness;
        parts.end.readOnly = followsBusiness;

        if (parts.follow instanceof HTMLInputElement) {
            parts.follow.disabled = !isEnabled;
        }

        row.classList.toggle('is-inactive', !isEnabled);
        row.classList.toggle('is-following-company', followsBusiness);
    }

    function selectedRows(panel) {
        return Array.from(panel.querySelectorAll('[data-schedule-row]')).filter(function (row) {
            if (!(row instanceof HTMLElement)) return false;
            const parts = getRowParts(row);
            return parts.enabled instanceof HTMLInputElement && parts.enabled.checked;
        });
    }

    panels.forEach(function (panel) {
        if (!(panel instanceof HTMLElement)) return;

        const rows = Array.from(panel.querySelectorAll('[data-schedule-row]')).filter(function (row) {
            return row instanceof HTMLElement;
        });

        rows.forEach(function (row) {
            const parts = getRowParts(row);

            if (parts.enabled instanceof HTMLInputElement) {
                parts.enabled.addEventListener('change', function () {
                    syncRow(row);
                });
            }

            if (parts.follow instanceof HTMLInputElement) {
                parts.follow.addEventListener('change', function () {
                    if (parts.follow.checked && parts.enabled instanceof HTMLInputElement) {
                        parts.enabled.checked = true;
                    }
                    if (parts.follow.checked && (!row.dataset.companyStart || !row.dataset.companyEnd)) {
                        window.alert('Horário de funcionamento da empresa não configurado para este dia.');
                        parts.follow.checked = false;
                    }
                    syncRow(row);
                });
            }

            syncRow(row);
        });

        const selectAllButton = panel.querySelector('[data-schedule-select-all]');
        if (selectAllButton instanceof HTMLButtonElement) {
            selectAllButton.addEventListener('click', function () {
                rows.forEach(function (row) {
                    const parts = getRowParts(row);
                    if (parts.enabled instanceof HTMLInputElement) {
                        parts.enabled.checked = true;
                    }
                    syncRow(row);
                });
            });
        }

        const copyFirstButton = panel.querySelector('[data-schedule-copy-first]');
        if (copyFirstButton instanceof HTMLButtonElement) {
            copyFirstButton.addEventListener('click', function () {
                const rowsToUpdate = selectedRows(panel);
                const source = rowsToUpdate.find(function (row) {
                    const parts = getRowParts(row);
                    return parts.start instanceof HTMLInputElement
                        && parts.end instanceof HTMLInputElement
                        && parts.start.value
                        && parts.end.value;
                });

                if (!(source instanceof HTMLElement)) {
                    window.alert('Marque ao menos um dia com horário configurado.');
                    return;
                }

                const sourceParts = getRowParts(source);
                if (!(sourceParts.start instanceof HTMLInputElement) || !(sourceParts.end instanceof HTMLInputElement)) return;

                let copied = 0;
                rowsToUpdate.forEach(function (row) {
                    const parts = getRowParts(row);
                    if (!(parts.start instanceof HTMLInputElement) || !(parts.end instanceof HTMLInputElement)) return;
                    if (parts.follow instanceof HTMLInputElement) {
                        parts.follow.checked = false;
                    }

                    parts.start.value = sourceParts.start.value;
                    parts.end.value = sourceParts.end.value;
                    copied += 1;
                    syncRow(row);
                });
            });
        }
    });
}

document.addEventListener('DOMContentLoaded', function () {
    initializeAdminSidebar();
    initializeBusinessExternalOptions();
    initializeBusinessCepLookup();
    initializeEvolutionIntegrations();
    initializeWeeklySchedulePanels();
    document.querySelectorAll('.flash').forEach(function (flash) {
        window.setTimeout(function () {
            if (flash instanceof HTMLElement) flash.remove();
        }, 5000);
    });
});

window.openAdminModal = function (html) {
    const modal = document.getElementById('modal');
    const content = document.getElementById('modal-content');
    if (!modal || !content) return;
    content.innerHTML = html;
    modal.hidden = false;

    if (typeof window.initializeAdminDateTimePickers === 'function') {
        window.initializeAdminDateTimePickers(content);
    }
    if (typeof window.initializeScheduleBlockForms === 'function') {
        window.initializeScheduleBlockForms(content);
    }
};
