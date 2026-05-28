document.addEventListener('submit', function (event) {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    const message = form.dataset.confirm;
    if (message && !window.confirm(message)) {
        event.preventDefault();
    }
});

document.addEventListener('click', function (event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.matches('[data-close-modal]')) {
        const modal = document.getElementById('modal');
        if (modal) modal.hidden = true;
    }
});

window.openAdminModal = function (html) {
    const modal = document.getElementById('modal');
    const content = document.getElementById('modal-content');
    if (!modal || !content) return;
    content.innerHTML = html;
    modal.hidden = false;
};