/* theme-toggle.js — Light/Dark mode + scroll progress bar */

(function () {
    const STORAGE_KEY = 'omegatek-theme';
    const root = document.documentElement;

    function applyTheme(theme) {
        if (theme === 'dark') {
            root.setAttribute('data-theme', 'dark');
        } else {
            root.removeAttribute('data-theme');
        }
    }

    function getPreferred() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return stored;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function toggle() {
        const current = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        localStorage.setItem(STORAGE_KEY, next);
    }

    /* Apply saved theme immediately to avoid flash */
    applyTheme(getPreferred());

    document.addEventListener('DOMContentLoaded', function () {
        const btn = document.getElementById('theme-toggle');
        if (btn) {
            btn.addEventListener('click', toggle);
        }

        /* Listen for OS-level preference changes */
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
            if (!localStorage.getItem(STORAGE_KEY)) {
                applyTheme(e.matches ? 'dark' : 'light');
            }
        });

        /* Scroll progress bar */
        const bar = document.getElementById('scrollProgressBar');
        if (bar) {
            let ticking = false;
            window.addEventListener('scroll', function () {
                if (ticking) return;
                ticking = true;
                requestAnimationFrame(function () {
                    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
                    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
                    const pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
                    bar.style.width = pct + '%';
                    ticking = false;
                });
            }, { passive: true });
        }
    });
})();
