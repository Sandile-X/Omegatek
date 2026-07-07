/* ═══════════════════════════════════════════════════════════
   app.js — Navigation, auth, security timers & init
   ═══════════════════════════════════════════════════════════ */

// ── Tab Navigation (with persistence) ─────────────────────
const VALID_TABS = ['dashboard','orders','products','jobs','blog','newsletter','gallery','gemini-ai'];

function switchTab(tabName) {
    if (!VALID_TABS.includes(tabName)) tabName = 'dashboard';

    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));

    document.getElementById(tabName)?.classList.add('active');

    // Highlight the correct sidebar item
    document.querySelectorAll('.nav-item').forEach(item => {
        if (item.getAttribute('onclick')?.includes("'" + tabName + "'")) {
            item.classList.add('active');
        }
    });

    // Close mobile sidebar on navigation
    document.querySelector('.sidebar')?.classList.remove('open');

    // Persist active tab in URL hash + sessionStorage
    history.replaceState(null, '', '#' + tabName);
    sessionStorage.setItem('adm_active_tab', tabName);

    if (tabName === 'orders') loadOrders();
    if (tabName === 'products') loadProducts();
    if (tabName === 'blog') loadBlogPosts();
    if (tabName === 'newsletter') loadNewsletterSection();
    if (tabName === 'jobs') loadJobs();
    if (tabName === 'gallery') loadGallery();
    if (tabName === 'gemini-ai') initAI();
}

function getPersistedTab() {
    const hash = location.hash.replace('#', '');
    if (VALID_TABS.includes(hash)) return hash;
    const stored = sessionStorage.getItem('adm_active_tab');
    if (VALID_TABS.includes(stored)) return stored;
    return 'dashboard';
}

// ── Logout ────────────────────────────────────────────────
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        _sb.auth.signOut().then(() => {
            sessionStorage.clear();
            window.location.href = 'admin-login.html';
        });
    }
}

// ── SECURITY — Auto-logout on inactivity & session age cap ──
const ADMIN_EMAIL         = '';
const INACTIVITY_LIMIT_MS = 2 * 60 * 60 * 1000;
const SESSION_MAX_AGE_MS  = 8 * 60 * 60 * 1000;
const WARN_BEFORE_MS      = 60 * 1000;
const HIDDEN_LIMIT_MS     = 30 * 60 * 1000;

let inactivityTimer, warnTimer, hiddenSince;

function forceLogout(reason) {
    clearTimeout(inactivityTimer);
    clearTimeout(warnTimer);
    _sb.auth.signOut().then(() => {
        sessionStorage.clear();
        window.location.href = 'admin-login.html?reason=' + encodeURIComponent(reason);
    });
}

function showAutoLogoutWarning(secsLeft) {
    let banner = document.getElementById('_autoLogoutBanner');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = '_autoLogoutBanner';
        banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:#c0392b;color:#fff;text-align:center;padding:14px 20px;font-weight:bold;font-size:15px;display:flex;align-items:center;justify-content:center;gap:14px;';
        banner.innerHTML = `<span id="_autoLogoutMsg"></span>
            <button onclick="resetInactivityTimer();document.getElementById('_autoLogoutBanner').remove()"
                style="background:rgba(255,255,255,0.25);border:none;color:#fff;padding:5px 14px;border-radius:6px;cursor:pointer;font-weight:bold;">Stay logged in</button>`;
        document.body.prepend(banner);
    }
    document.getElementById('_autoLogoutMsg').textContent = `\u26a0\ufe0f You will be automatically logged out in ${secsLeft} second${secsLeft !== 1 ? 's' : ''} due to inactivity.`;
}

function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    clearTimeout(warnTimer);
    const banner = document.getElementById('_autoLogoutBanner');
    if (banner) banner.remove();

    warnTimer = setTimeout(() => {
        let countdown = Math.round(WARN_BEFORE_MS / 1000);
        showAutoLogoutWarning(countdown);
        const tick = setInterval(() => {
            countdown--;
            const msg = document.getElementById('_autoLogoutMsg');
            if (msg) msg.textContent = `\u26a0\ufe0f You will be automatically logged out in ${countdown} second${countdown !== 1 ? 's' : ''} due to inactivity.`;
            if (countdown <= 0) clearInterval(tick);
        }, 1000);
    }, INACTIVITY_LIMIT_MS - WARN_BEFORE_MS);

    inactivityTimer = setTimeout(() => {
        forceLogout('inactivity');
    }, INACTIVITY_LIMIT_MS);
}

['mousemove','mousedown','keydown','touchstart','scroll','click'].forEach(ev => {
    document.addEventListener(ev, resetInactivityTimer, { passive: true });
});

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        hiddenSince = Date.now();
    } else {
        if (hiddenSince && (Date.now() - hiddenSince) > HIDDEN_LIMIT_MS) {
            forceLogout('backgrounded');
        }
        hiddenSince = null;
    }
});

// ── Initialize dashboard ──────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
    _sb.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT' || (!session && event !== 'INITIAL_SESSION')) {
            sessionStorage.clear();
            window.location.replace('admin-login.html');
        }
    });

    document.getElementById('blogCoverImage')?.addEventListener('input', (e) => {
        setCoverPreview(e.target.value.trim());
    });

    const aiInput = document.getElementById('aiManualCommand');
    if (aiInput) aiInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); sendManualAICommand(); }
    });

    let { data: { session } } = await _sb.auth.getSession();
    if (!session) {
        const { data: refreshed } = await _sb.auth.refreshSession();
        session = refreshed?.session || null;
    }
    if (!session) {
        window.location.replace('admin-login.html');
        return;
    }

    if (session.user.email !== ADMIN_EMAIL) {
        await _sb.auth.signOut();
        window.location.replace('admin-login.html?reason=unauthorized');
        return;
    }

    const loginAt = parseInt(sessionStorage.getItem('adm_login_at') || '0');
    if (loginAt > 0 && (Date.now() - loginAt) > SESSION_MAX_AGE_MS) {
        forceLogout('session_expired');
        return;
    }
    if (!loginAt) sessionStorage.setItem('adm_login_at', Date.now().toString());

    resetInactivityTimer();

    loadOrders();
    loadProducts();
    loadBlogPosts();
    loadNewsletterData();
    loadRepairs();
    if (typeof loadGallery === 'function') loadGallery();
    document.getElementById('lastUpdate').textContent = new Date().toLocaleString('en-ZA');

    // Restore persisted tab on refresh
    const restoredTab = getPersistedTab();
    if (restoredTab !== 'dashboard') switchTab(restoredTab);
});

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});
