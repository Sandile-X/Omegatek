/**
 * transitions.js — Premium page transitions for Omegatek Solutions
 *
 * Features:
 *  • Thin loading progress bar (like YouTube / NProgress)
 *  • Smooth fade + slight-upward entry animation on every page load
 *  • Hover-prefetch for instant navigation
 *  • View Transitions API used where supported (Chrome 111+)
 *  • Graceful fallback for all other browsers
 */

(() => {
    'use strict';

    // ─────────────────────────────────────────────────────────────────────────
    // 1.  PROGRESS BAR
    // ─────────────────────────────────────────────────────────────────────────
    const bar = (() => {
        const el     = document.createElement('div');
        el.id        = 'omg-progress-bar';
        el.style.cssText = [
            'position:fixed', 'top:0', 'left:0', 'z-index:99999',
            'height:3px', 'width:0', 'border-radius:0 2px 2px 0',
            'background:linear-gradient(90deg,#b30ce6,#7c3aed,#b30ce6)',
            'background-size:200% 100%',
            'animation:omgShimmer 1.2s linear infinite',
            'transition:width 0.25s ease, opacity 0.3s ease',
            'opacity:0', 'pointer-events:none',
        ].join(';');
        document.head.insertAdjacentHTML('beforeend',
            '<style>' +
            '@keyframes omgShimmer{0%{background-position:200% 0}to{background-position:-200% 0}}' +
            '</style>'
        );
        document.body?.appendChild(el) || document.addEventListener('DOMContentLoaded', () => document.body.appendChild(el));
        return {
            start() {
                el.style.opacity = '1';
                el.style.width   = '0';
                requestAnimationFrame(() => { el.style.width = '40%'; });
                setTimeout(() => { el.style.width = '70%'; }, 400);
                setTimeout(() => { el.style.width = '85%'; }, 1200);
            },
            finish() {
                el.style.width   = '100%';
                setTimeout(() => { el.style.opacity = '0'; el.style.width = '0'; }, 350);
            },
            fail() {
                el.style.background = '#ef4444';
                el.style.width      = '100%';
                setTimeout(() => { el.style.opacity = '0'; el.style.width = '0'; el.style.background = ''; }, 500);
            }
        };
    })();

    // ─────────────────────────────────────────────────────────────────────────
    // 2.  CSS FOR PAGE ENTER / EXIT (injected once)
    // ─────────────────────────────────────────────────────────────────────────
    document.head.insertAdjacentHTML('beforeend', `<style>
/* Page enter animation — applied on first load */
@keyframes omgPageEnter {
    from { opacity: 0; }
    to   { opacity: 1; }
}
/* Page exit animation — applied before navigation */
@keyframes omgPageExit {
    from { opacity: 1; }
    to   { opacity: 0; }
}

html.omg-entering body,
html.omg-entering main,
html.omg-entering .page-content {
    animation: omgPageEnter 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
}
html.omg-exiting body,
html.omg-exiting main,
html.omg-exiting .page-content {
    animation: omgPageExit 0.2s ease forwards;
}

/* View Transitions API styles */
@keyframes vtFadeIn  { from { opacity:0; } to { opacity:1; } }
@keyframes vtFadeOut { from { opacity:1; } to { opacity:0; } }

::view-transition-old(root) {
    animation: 180ms ease both vtFadeOut;
}
::view-transition-new(root) {
    animation: 300ms ease both vtFadeIn;
}

/* Hover-prefetch visual hint */
a[data-prefetching]::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, #b30ce6, #7c3aed);
    border-radius: 1px;
    animation: omgShimmer 1s linear infinite;
}
</style>`);

    // ─────────────────────────────────────────────────────────────────────────
    // 3.  HELPERS
    // ─────────────────────────────────────────────────────────────────────────
    const isSameOrigin = (href) => {
        if (!href) return false;
        try { return new URL(href, location.href).origin === location.origin; }
        catch { return false; }
    };

    const isNavigable = (a) => {
        if (!a || a.tagName !== 'A') return false;
        const href = a.getAttribute('href') || '';
        if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return false;
        if (a.hasAttribute('download') || a.target === '_blank') return false;
        if (!isSameOrigin(href)) return false;
        // Skip admin pages from soft transitions (they handle their own auth)
        if (href.includes('admin/') || href.includes('admin-')) return false;
        return true;
    };

    // ─────────────────────────────────────────────────────────────────────────
    // 4.  PREFETCH ON HOVER
    // ─────────────────────────────────────────────────────────────────────────
    const prefetched = new Set();

    function prefetch(href) {
        if (prefetched.has(href)) return;
        prefetched.add(href);
        const link  = document.createElement('link');
        link.rel    = 'prefetch';
        link.href   = href;
        link.as     = 'document';
        document.head.appendChild(link);
    }

    document.addEventListener('mouseover', (e) => {
        const a = e.target.closest('a');
        if (!isNavigable(a)) return;
        const href = a.href;
        // Small delay: only prefetch if user hovers for 100ms (intent detection)
        a._prefetchTimer = setTimeout(() => prefetch(href), 100);
    }, { passive: true });

    document.addEventListener('mouseout', (e) => {
        const a = e.target.closest('a');
        if (a?._prefetchTimer) {
            clearTimeout(a._prefetchTimer);
            a._prefetchTimer = null;
        }
    }, { passive: true });

    // ─────────────────────────────────────────────────────────────────────────
    // 5.  PAGE ENTRY ANIMATION
    // ─────────────────────────────────────────────────────────────────────────
    function animateEntry() {
        // Remove the FOUC guard so the page becomes visible; the entry animation
        // takes over immediately (starts from opacity:0 via @keyframes omgPageEnter).
        const guard = document.getElementById('fouc-guard');
        if (guard) guard.parentNode.removeChild(guard);

        document.documentElement.classList.add('omg-entering');
        setTimeout(() => document.documentElement.classList.remove('omg-entering'), 500);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 6.  NAVIGATION WITH TRANSITION
    // ─────────────────────────────────────────────────────────────────────────
    function navigateTo(href) {
        bar.start();

        // Use View Transitions API if available
        if (document.startViewTransition) {
            document.startViewTransition(() => {
                window.location.href = href;
            });
            return;
        }

        // Fallback: CSS exit animation then navigate
        document.documentElement.classList.add('omg-exiting');
        setTimeout(() => {
            window.location.href = href;
        }, 200);
    }

    document.addEventListener('click', (e) => {
        const a = e.target.closest('a');
        if (!isNavigable(a) || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

        // Allow default for fragment-only links
        const href = a.href;
        if (href === location.href || href === location.href + '#') return;

        e.preventDefault();
        navigateTo(href);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 7.  ON LOAD — entry animation + finish progress bar
    //
    //  This script is defer'd, so it runs when readyState is 'interactive'
    //  (HTML parsed, before DOMContentLoaded fires). Tailwind CDN processes
    //  its classes inside its own DOMContentLoaded listener, which was
    //  registered earlier (in <head>). We must therefore wait for
    //  DOMContentLoaded so Tailwind fires first, then use one rAF to ensure
    //  the repaint from Tailwind's class injection has settled before we
    //  reveal the page. Skipping this causes a double-flash: body fades in
    //  unstyled, then Tailwind repaints.
    // ─────────────────────────────────────────────────────────────────────────
    if (document.readyState === 'complete') {
        // Page was already fully loaded (e.g. script injected dynamically)
        bar.finish();
        animateEntry();
    } else {
        bar.start();
        document.addEventListener('DOMContentLoaded', () => {
            // One rAF lets the browser commit Tailwind's injected <style> before
            // we remove the FOUC guard and start the entry animation.
            requestAnimationFrame(() => {
                bar.finish();
                animateEntry();
            });
        });
    }

    // Handle back/forward navigation
    window.addEventListener('pageshow', (e) => {
        if (e.persisted) {
            document.documentElement.classList.remove('omg-exiting');
            animateEntry();
        }
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 8.  BUTTON LOADING STATES — auto-apply to any form submit button
    // ─────────────────────────────────────────────────────────────────────────
    document.addEventListener('submit', (e) => {
        const form = e.target;
        const btn  = form.querySelector('button[type="submit"], input[type="submit"]');
        if (!btn || btn.dataset.noLoader) return;

        const original = btn.textContent || btn.value;
        btn.disabled   = true;
        if (btn.tagName === 'BUTTON') {
            btn.dataset.originalText = original;
            btn.innerHTML = '<span style="display:inline-block;width:14px;height:14px;border:2px solid currentColor;border-top-color:transparent;border-radius:50%;animation:omgShimmer 0.7s linear infinite;vertical-align:middle;margin-right:6px"></span>' + original;
        }
    }, { passive: true });

    // Expose bar for external use (e.g. AJAX calls)
    window.OmgProgress = bar;
})();
