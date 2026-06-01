document.addEventListener('submit', function (event) {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;

    const message = form.dataset.confirm;
    if (message && !window.confirm(message)) {
        event.preventDefault();
        return;
    }

    if (form.id) {
        const selector = `[form="${window.CSS && CSS.escape ? CSS.escape(form.id) : form.id}"][disabled]`;
        document.querySelectorAll(selector).forEach(function (field) {
            field.removeAttribute('disabled');
        });
    }

    form.querySelectorAll('[disabled]').forEach(function (field) {
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

document.addEventListener('DOMContentLoaded', function () {
    initializeAdminSidebar();
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
};
