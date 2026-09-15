(function () {
    'use strict';

    const storageKey = 'beautyflow.admin.theme.v1';
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
    const root = document.documentElement;

    function readPreference() {
        try {
            const stored = window.localStorage.getItem(storageKey);
            return stored === 'light' || stored === 'dark' ? stored : null;
        } catch (_error) {
            return null;
        }
    }

    function preferredTheme() {
        return readPreference() || (systemTheme.matches ? 'dark' : 'light');
    }

    function syncControls(theme) {
        const isDark = theme === 'dark';
        const actionLabel = isDark ? 'Ativar tema claro' : 'Ativar tema escuro';

        document.querySelectorAll('[data-theme-toggle]').forEach(function (control) {
            control.setAttribute('aria-pressed', String(isDark));
            control.setAttribute('aria-label', actionLabel);
            control.setAttribute('title', actionLabel);
        });

        document.querySelectorAll('[data-theme-toggle-label]').forEach(function (label) {
            label.textContent = isDark ? 'Tema claro' : 'Tema escuro';
        });
    }

    function applyTheme(theme) {
        root.dataset.theme = theme;
        root.style.colorScheme = theme;
        const themeColor = document.querySelector('[data-theme-color]');
        if (themeColor instanceof HTMLMetaElement) {
            themeColor.content = theme === 'dark' ? '#0d1018' : '#f7f6fb';
        }
        syncControls(theme);
    }

    applyTheme(preferredTheme());

    document.addEventListener('DOMContentLoaded', function () {
        syncControls(root.dataset.theme || preferredTheme());
        document.querySelectorAll('[data-theme-toggle]').forEach(function (control) {
            control.addEventListener('click', function () {
                const theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
                try {
                    window.localStorage.setItem(storageKey, theme);
                } catch (_error) {
                    // The selected theme still applies for the current page.
                }
                applyTheme(theme);
                document.dispatchEvent(new CustomEvent('beautyflow:themechange', { detail: { theme: theme } }));
            });
        });
    });

    systemTheme.addEventListener('change', function () {
        if (!readPreference()) applyTheme(systemTheme.matches ? 'dark' : 'light');
    });
})();
