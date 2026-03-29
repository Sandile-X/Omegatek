/**
 * Omegatek Auth - Supabase-powered authentication
 * Handles login, registration, session management and UI injection
 */

// =============================
// SUPABASE CONFIG
// =============================
// Supabase project credentials
// "Publishable key" in the dashboard = the anon/public key — they are the same thing
const SUPABASE_URL = 'https://pefjkiijqratjixskmdx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_qLhnUJT68w0LB35jfAStDA_Hz4_MWmU';

// =============================
// SUPABASE CLIENT
// =============================
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =============================
// STATE
// =============================
let currentUser = null;
let authCallback = null; // called after successful login (used by checkout)

// =============================
// INIT - runs on every page load
// =============================
document.addEventListener('DOMContentLoaded', async () => {
    injectAuthModal();
    injectNavUserIcon();
    injectPortalPanel();

    // Check for existing session
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
        currentUser = session.user;
        updateNavIcon(true, session.user);
    }

    // Listen for auth state changes
    supabase.auth.onAuthStateChange((_event, session) => {
        currentUser = session?.user || null;
        updateNavIcon(!!currentUser, currentUser);
        if (currentUser && typeof authCallback === 'function') {
            authCallback(currentUser);
            authCallback = null;
        }
    });
});

// =============================
// INJECT: Auth Modal into DOM
// =============================
function injectAuthModal() {
    const modal = document.createElement('div');
    modal.id = 'auth-modal';
    modal.innerHTML = `
        <div class="auth-backdrop" onclick="closeAuthModal()"></div>
        <div class="auth-box">
            <button class="auth-close" onclick="closeAuthModal()"><i class="fas fa-times"></i></button>
            
            <!-- Tabs -->
            <div class="auth-tabs">
                <button class="auth-tab active" id="tab-login" onclick="switchAuthTab('login')">Login</button>
                <button class="auth-tab" id="tab-register" onclick="switchAuthTab('register')">Create Account</button>
            </div>

            <!-- Login Form -->
            <div id="auth-form-login">
                <h2 class="auth-title">Welcome back</h2>
                <p class="auth-sub">Sign in to track orders & repairs</p>
                <div class="auth-error" id="auth-error-login" style="display:none;"></div>
                <form onsubmit="handleLogin(event)">
                    <div class="auth-field">
                        <label>Email</label>
                        <input type="email" id="login-email" placeholder="you@example.com" required>
                    </div>
                    <div class="auth-field">
                        <label>Password</label>
                        <input type="password" id="login-password" placeholder="••••••••" required>
                    </div>
                    <button type="submit" class="auth-btn" id="login-submit-btn">
                        Sign In
                    </button>
                </form>
                <p class="auth-switch">No account? <a href="#" onclick="switchAuthTab('register')">Register here</a></p>
                <p class="auth-switch"><a href="#" onclick="handleForgotPassword()">Forgot password?</a></p>
            </div>

            <!-- Register Form -->
            <div id="auth-form-register" style="display:none;">
                <h2 class="auth-title">Create account</h2>
                <p class="auth-sub">Save your details for faster checkout</p>
                <div class="auth-error" id="auth-error-register" style="display:none;"></div>
                <form onsubmit="handleRegister(event)">
                    <div class="auth-field-row">
                        <div class="auth-field">
                            <label>First Name</label>
                            <input type="text" id="reg-first" placeholder="John" required>
                        </div>
                        <div class="auth-field">
                            <label>Last Name</label>
                            <input type="text" id="reg-last" placeholder="Doe">
                        </div>
                    </div>
                    <div class="auth-field">
                        <label>Email</label>
                        <input type="email" id="reg-email" placeholder="you@example.com" required>
                    </div>
                    <div class="auth-field">
                        <label>Phone</label>
                        <input type="tel" id="reg-phone" placeholder="073 653 8207">
                    </div>
                    <div class="auth-field">
                        <label>Password</label>
                        <input type="password" id="reg-password" placeholder="Min. 6 characters" required>
                    </div>
                    <button type="submit" class="auth-btn" id="register-submit-btn">
                        Create Account
                    </button>
                </form>
                <p class="auth-switch">Already registered? <a href="#" onclick="switchAuthTab('login')">Sign in</a></p>
            </div>

            <!-- Guest option (only shown when triggered by checkout) -->
            <div id="auth-guest-option" style="display:none;">
                <div class="auth-divider"><span>or</span></div>
                <button class="auth-guest-btn" onclick="continueAsGuest()">Continue as guest</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// =============================
// INJECT: User icon into navbar
// =============================
function injectNavUserIcon() {
    const navbar = document.querySelector('nav.navbar');
    if (!navbar) return;

    // Wrap existing menu-btn in a right-side container
    const menuBtn = navbar.querySelector('#menu-btn');

    const userSection = document.createElement('div');
    userSection.className = 'nav-user-section';
    userSection.innerHTML = `
        <div class="nav-user-icon" id="nav-user-icon" onclick="toggleUserDropdown()">
            <i class="fas fa-user-circle" id="nav-user-icon-img"></i>
            <span class="nav-user-name" id="nav-user-name" style="display:none;"></span>
        </div>
        <div class="nav-user-dropdown" id="nav-user-dropdown">
            <!-- Shown when logged OUT -->
            <div id="dropdown-logged-out">
                <button onclick="openAuthModal(); closeDropdown()">
                    <i class="fas fa-sign-in-alt"></i> Login / Register
                </button>
                <button onclick="location.href='order-tracking.html'; closeDropdown()">
                    <i class="fas fa-search"></i> Track My Order
                </button>
            </div>
            <!-- Shown when logged IN -->
            <div id="dropdown-logged-in" style="display:none;">
                <div class="dropdown-user-info">
                    <span id="dropdown-greeting">Hi there!</span>
                </div>
                <button onclick="openPortalPanel('orders'); closeDropdown()">
                    <i class="fas fa-box"></i> My Orders
                </button>
                <button onclick="openPortalPanel('repairs'); closeDropdown()">
                    <i class="fas fa-tools"></i> Repair Status
                </button>
                <button onclick="openPortalPanel('profile'); closeDropdown()">
                    <i class="fas fa-user"></i> My Profile
                </button>
                <button onclick="handleLogout()" class="dropdown-logout">
                    <i class="fas fa-sign-out-alt"></i> Logout
                </button>
            </div>
        </div>
    `;

    // Insert after menu-btn so it appears on the right next to the hamburger
    if (menuBtn) {
        navbar.insertBefore(userSection, menuBtn.nextSibling);
    } else {
        navbar.appendChild(userSection);
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const icon = document.getElementById('nav-user-icon');
        const dropdown = document.getElementById('nav-user-dropdown');
        if (dropdown && icon && !icon.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove('open');
        }
    });
}

// =============================
// INJECT: Customer Portal Panel
// =============================
function injectPortalPanel() {
    const panel = document.createElement('div');
    panel.id = 'customer-portal';
    panel.innerHTML = `
        <div class="portal-backdrop" onclick="closePortalPanel()"></div>
        <div class="portal-panel">
            <div class="portal-header">
                <div class="portal-tabs">
                    <button class="portal-tab active" onclick="switchPortalTab('orders')">
                        <i class="fas fa-box"></i> Orders
                    </button>
                    <button class="portal-tab" onclick="switchPortalTab('repairs')">
                        <i class="fas fa-tools"></i> Repairs
                    </button>
                    <button class="portal-tab" onclick="switchPortalTab('profile')">
                        <i class="fas fa-user"></i> Profile
                    </button>
                </div>
                <button class="portal-close" onclick="closePortalPanel()">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div class="portal-body">
                <!-- Orders -->
                <div id="portal-orders" class="portal-section">
                    <h3>My Orders</h3>
                    <div id="portal-orders-list">
                        <div class="portal-loading"><i class="fas fa-spinner fa-spin"></i> Loading orders...</div>
                    </div>
                </div>

                <!-- Repairs -->
                <div id="portal-repairs" class="portal-section" style="display:none;">
                    <h3>Repair Tickets</h3>
                    <div id="portal-repairs-list">
                        <div class="portal-loading"><i class="fas fa-spinner fa-spin"></i> Loading tickets...</div>
                    </div>
                </div>

                <!-- Profile -->
                <div id="portal-profile" class="portal-section" style="display:none;">
                    <h3>My Profile</h3>
                    <div id="portal-profile-content">
                        <div class="portal-loading"><i class="fas fa-spinner fa-spin"></i> Loading profile...</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(panel);
}

// =============================
// AUTH: Login
// =============================
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const btn = document.getElementById('login-submit-btn');

    setAuthLoading(btn, true);
    hideAuthError('login');

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        showAuthError('login', error.message);
        setAuthLoading(btn, false);
        return;
    }

    currentUser = data.user;
    closeAuthModal();
    showAuthToast(`Welcome back, ${getUserFirstName(data.user)}!`);
}

// =============================
// AUTH: Register
// =============================
async function handleRegister(e) {
    e.preventDefault();
    const first = document.getElementById('reg-first').value.trim();
    const last = document.getElementById('reg-last').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const password = document.getElementById('reg-password').value;
    const btn = document.getElementById('register-submit-btn');

    if (password.length < 6) {
        showAuthError('register', 'Password must be at least 6 characters');
        return;
    }

    setAuthLoading(btn, true);
    hideAuthError('register');

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                first_name: first,
                last_name: last,
                phone: phone,
                full_name: `${first} ${last}`.trim()
            }
        }
    });

    if (error) {
        showAuthError('register', error.message);
        setAuthLoading(btn, false);
        return;
    }

    // Only upsert profile when we have a live session (no email confirmation needed).
    // When email confirmation IS required, the profile is created by the DB trigger
    // on the auth.users table once the user clicks the confirmation link.
    if (data.session && data.user) {
        await supabase.from('profiles').upsert({
            id: data.user.id,
            email,
            first_name: first,
            last_name: last,
            phone
        });
    }

    if (data.session) {
        closeAuthModal();
        showAuthToast(`Welcome to Omegatek, ${first}! 🎉`);
    } else {
        closeAuthModal();
        showAuthToast(`Check your email to confirm your account, ${first}!`);
    }
}

// =============================
// AUTH: Logout
// =============================
async function handleLogout() {
    await supabase.auth.signOut();
    currentUser = null;
    updateNavIcon(false, null);
    closePortalPanel();
    showAuthToast('Logged out successfully');
}

// =============================
// AUTH: Forgot Password
// =============================
async function handleForgotPassword() {
    const email = document.getElementById('login-email').value;
    if (!email) {
        showAuthError('login', 'Enter your email above first');
        return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/account-reset.html`
    });
    if (error) {
        showAuthError('login', error.message);
    } else {
        showAuthToast('Password reset email sent!');
    }
}

// =============================
// NAV: Update user icon
// =============================
function updateNavIcon(loggedIn, user) {
    const loggedOut = document.getElementById('dropdown-logged-out');
    const loggedIn_ = document.getElementById('dropdown-logged-in');
    const name = document.getElementById('nav-user-name');
    const greeting = document.getElementById('dropdown-greeting');
    const icon = document.getElementById('nav-user-icon-img');

    if (!loggedOut || !loggedIn_) return;

    if (loggedIn && user) {
        const firstName = getUserFirstName(user);
        loggedOut.style.display = 'none';
        loggedIn_.style.display = 'block';
        if (name) { name.textContent = firstName; name.style.display = 'inline'; }
        if (greeting) greeting.textContent = `Hi, ${firstName}!`;
        if (icon) icon.className = 'fas fa-user-circle nav-icon-active';
    } else {
        loggedOut.style.display = 'block';
        loggedIn_.style.display = 'none';
        if (name) name.style.display = 'none';
        if (icon) icon.className = 'fas fa-user-circle';
    }
}

// =============================
// UI: Modal Controls
// =============================
function openAuthModal(tab = 'login', withGuestOption = false, onSuccess = null) {
    if (onSuccess) authCallback = onSuccess;
    const modal = document.getElementById('auth-modal');
    if (!modal) return;
    modal.classList.add('open');
    switchAuthTab(tab);

    const guestOption = document.getElementById('auth-guest-option');
    if (guestOption) guestOption.style.display = withGuestOption ? 'block' : 'none';
}

function closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.remove('open');
}

function switchAuthTab(tab) {
    document.getElementById('auth-form-login').style.display = tab === 'login' ? 'block' : 'none';
    document.getElementById('auth-form-register').style.display = tab === 'register' ? 'block' : 'none';
    document.getElementById('tab-login').classList.toggle('active', tab === 'login');
    document.getElementById('tab-register').classList.toggle('active', tab === 'register');
}

function continueAsGuest() {
    closeAuthModal();
    if (typeof authCallback === 'function') {
        authCallback(null); // null = guest
        authCallback = null;
    }
}

// =============================
// UI: Dropdown Controls
// =============================
function toggleUserDropdown() {
    const dropdown = document.getElementById('nav-user-dropdown');
    const icon = document.getElementById('nav-user-icon');
    if (!dropdown || !icon) return;

    if (dropdown.classList.contains('open')) {
        dropdown.classList.remove('open');
        return;
    }

    // Mobile: centered positioning
    if (window.innerWidth <= 768) {
        dropdown.style.left = '50%';
        dropdown.style.top = '80px';
        dropdown.style.right = 'auto';
        dropdown.classList.add('open');
        return;
    }

    // Desktop: Position dropdown anchored to the bottom-right of the icon,
    // clamped so it never overflows the right or bottom edge of the viewport
    const rect = icon.getBoundingClientRect();
    const dropW = dropdown.offsetWidth || 220;
    const gap = 8;

    let top = rect.bottom + gap;
    let right = window.innerWidth - rect.right;

    // If it would overflow the bottom, flip above
    if (top + 300 > window.innerHeight) {
        top = rect.top - gap - 300;
    }
    // Never let the left edge go off-screen
    const leftEdge = window.innerWidth - right - dropW;
    if (leftEdge < 8) right = window.innerWidth - dropW - 8;

    dropdown.style.top   = top   + 'px';
    dropdown.style.right = right + 'px';
    dropdown.style.left = 'auto';
    dropdown.classList.add('open');
}

function closeDropdown() {
    const dropdown = document.getElementById('nav-user-dropdown');
    if (dropdown) dropdown.classList.remove('open');
}

// =============================
// UI: Portal Panel
// =============================
function openPortalPanel(tab = 'orders') {
    if (!currentUser) {
        openAuthModal('login');
        return;
    }
    const panel = document.getElementById('customer-portal');
    if (!panel) return;
    panel.classList.add('open');
    switchPortalTab(tab);
    loadPortalData(tab);
}

function closePortalPanel() {
    const panel = document.getElementById('customer-portal');
    if (panel) panel.classList.remove('open');
}

function switchPortalTab(tab) {
    const sections = ['orders', 'repairs', 'profile'];
    sections.forEach(s => {
        const el = document.getElementById(`portal-${s}`);
        if (el) el.style.display = s === tab ? 'block' : 'none';
    });
    document.querySelectorAll('.portal-tab').forEach((btn, i) => {
        btn.classList.toggle('active', sections[i] === tab);
    });
    loadPortalData(tab);
}

// =============================
// PORTAL: Load Data from Supabase
// =============================
async function loadPortalData(tab) {
    if (!currentUser) return;

    if (tab === 'orders') {
        const container = document.getElementById('portal-orders-list');
        container.innerHTML = '<div class="portal-loading"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';

        const { data: orders, error } = await supabase
            .from('orders')
            .select('*, order_items(*)')
            .eq('customer_email', currentUser.email)
            .order('created_at', { ascending: false });

        if (error || !orders?.length) {
            container.innerHTML = `<div class="portal-empty"><i class="fas fa-box-open"></i><p>No orders yet</p></div>`;
            return;
        }

        container.innerHTML = orders.map(order => `
            <div class="portal-card">
                <div class="portal-card-head">
                    <strong>#${order.order_number}</strong>
                    <span class="portal-badge portal-badge-${order.status}">${order.status}</span>
                </div>
                <div class="portal-card-meta">
                    <span>${new Date(order.created_at).toLocaleDateString('en-ZA')}</span>
                    <span>R${parseFloat(order.total_amount || 0).toFixed(2)}</span>
                </div>
                ${order.order_items?.length ? `
                <div class="portal-items">
                    ${order.order_items.map(i => `<span class="portal-item-chip">${i.product_name} ×${i.quantity}</span>`).join('')}
                </div>` : ''}
                <div class="portal-card-foot">
                    <span class="portal-payment-${order.payment_status}">
                        <i class="fas fa-circle"></i> Payment: ${order.payment_status}
                    </span>
                </div>
            </div>
        `).join('');
    }

    if (tab === 'repairs') {
        const container = document.getElementById('portal-repairs-list');
        container.innerHTML = '<div class="portal-loading"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';

        const { data: tickets, error } = await supabase
            .from('repair_tickets')
            .select('*')
            .eq('customer_email', currentUser.email)
            .order('created_at', { ascending: false });

        if (error || !tickets?.length) {
            container.innerHTML = `<div class="portal-empty"><i class="fas fa-tools"></i><p>No repair tickets yet</p></div>`;
            return;
        }

        container.innerHTML = tickets.map(t => `
            <div class="portal-card">
                <div class="portal-card-head">
                    <strong>#${t.ticket_number}</strong>
                    <span class="portal-badge portal-badge-${t.status}">${t.status.replace(/_/g, ' ')}</span>
                </div>
                <div class="portal-card-meta">
                    <span>${t.device_type}</span>
                    <span class="portal-priority-${t.priority}">${t.priority} priority</span>
                </div>
                <p class="portal-issue">${t.issue_description}</p>
                ${t.assigned_technician ? `<p class="portal-tech"><i class="fas fa-user-cog"></i> ${t.assigned_technician}</p>` : ''}
                ${t.estimated_cost ? `<p class="portal-cost">Estimated: R${parseFloat(t.estimated_cost).toFixed(2)}</p>` : ''}
            </div>
        `).join('');
    }

    if (tab === 'profile') {
        const container = document.getElementById('portal-profile-content');
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();

        const p = profile || {};
        container.innerHTML = `
            <form onsubmit="saveProfile(event)" class="portal-profile-form">
                <div class="portal-field-row">
                    <div class="portal-field">
                        <label>First Name</label>
                        <input type="text" id="pf-first" value="${p.first_name || ''}" placeholder="First name">
                    </div>
                    <div class="portal-field">
                        <label>Last Name</label>
                        <input type="text" id="pf-last" value="${p.last_name || ''}" placeholder="Last name">
                    </div>
                </div>
                <div class="portal-field">
                    <label>Email</label>
                    <input type="email" value="${currentUser.email}" readonly style="opacity:0.7;">
                </div>
                <div class="portal-field">
                    <label>Phone</label>
                    <input type="tel" id="pf-phone" value="${p.phone || ''}" placeholder="Phone number">
                </div>
                <button type="submit" class="auth-btn">Save Changes</button>
            </form>

            <div class="portal-divider"></div>

            <!-- Change Password -->
            <div class="portal-sub-section">
                <h4 class="portal-sub-title"><i class="fas fa-lock"></i> Change Password</h4>
                <form onsubmit="handleChangePassword(event)" class="portal-profile-form">
                    <div class="portal-field">
                        <label>New Password</label>
                        <input type="password" id="pf-new-password" placeholder="Min. 6 characters" required>
                    </div>
                    <div class="portal-field">
                        <label>Confirm Password</label>
                        <input type="password" id="pf-confirm-password" placeholder="Repeat new password" required>
                    </div>
                    <div class="auth-error" id="pw-change-error" style="display:none;"></div>
                    <button type="submit" class="auth-btn auth-btn-outline">Update Password</button>
                </form>
            </div>

            <div class="portal-divider"></div>

            <!-- Danger Zone -->
            <div class="portal-sub-section portal-danger-zone">
                <h4 class="portal-sub-title portal-sub-title-danger"><i class="fas fa-exclamation-triangle"></i> Danger Zone</h4>
                <p class="portal-danger-msg">Deleting your account is permanent and cannot be undone.</p>
                <button onclick="handleDeleteAccount()" class="auth-btn auth-btn-danger">Delete My Account</button>
            </div>
        `;
    }
}

// =============================
// PORTAL: Save Profile
// =============================
async function saveProfile(e) {
    e.preventDefault();
    if (!currentUser) return;

    const { error } = await supabase.from('profiles').upsert({
        id: currentUser.id,
        email: currentUser.email,
        first_name: document.getElementById('pf-first').value,
        last_name: document.getElementById('pf-last').value,
        phone: document.getElementById('pf-phone').value
    });

    if (error) {
        showAuthToast('Error saving profile', true);
    } else {
        showAuthToast('Profile saved!');
    }
}

// =============================
// PORTAL: Change Password
// =============================
async function handleChangePassword(e) {
    e.preventDefault();
    const newPw  = document.getElementById('pf-new-password').value;
    const confPw = document.getElementById('pf-confirm-password').value;
    const errEl  = document.getElementById('pw-change-error');

    if (newPw.length < 6) {
        errEl.textContent = 'Password must be at least 6 characters.';
        errEl.style.display = 'block'; return;
    }
    if (newPw !== confPw) {
        errEl.textContent = 'Passwords do not match.';
        errEl.style.display = 'block'; return;
    }
    errEl.style.display = 'none';

    const btn = e.target.querySelector('button[type="submit"]');
    const orig = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';

    const { error } = await supabase.auth.updateUser({ password: newPw });

    btn.disabled = false;
    btn.innerHTML = orig;

    if (error) {
        errEl.textContent = error.message;
        errEl.style.display = 'block';
    } else {
        document.getElementById('pf-new-password').value = '';
        document.getElementById('pf-confirm-password').value = '';
        showAuthToast('Password updated successfully!');
    }
}

// =============================
// PORTAL: Delete Account
// =============================
async function handleDeleteAccount() {
    const confirmed = window.confirm(
        'Are you sure you want to permanently delete your account?\n\nThis cannot be undone.'
    );
    if (!confirmed) return;

    // Delete their profile row first (auth user deleted by DB cascade via RPC)
    await supabase.from('profiles').delete().eq('id', currentUser.id);

    // Call the delete_user RPC (add this function to Supabase SQL — see supabase-schema.sql)
    const { error } = await supabase.rpc('delete_user');

    if (error) {
        showAuthToast('Could not delete account: ' + error.message, true);
        return;
    }

    await supabase.auth.signOut();
    currentUser = null;
    updateNavIcon(false, null);
    closePortalPanel();
    showAuthToast('Your account has been deleted.');
}

// =============================
// CHECKOUT GUARD
// Require login before proceeding to checkout
// =============================
window.requireAuthForCheckout = function(onProceed) {
    if (currentUser) {
        onProceed(currentUser);
        return;
    }
    openAuthModal('login', true, onProceed);
};

// =============================
// HELPERS
// =============================
function getUserFirstName(user) {
    return user?.user_metadata?.first_name
        || user?.user_metadata?.full_name?.split(' ')[0]
        || user?.email?.split('@')[0]
        || 'there';
}

function showAuthError(form, msg) {
    const el = document.getElementById(`auth-error-${form}`);
    if (el) { el.textContent = msg; el.style.display = 'block'; }
}

function hideAuthError(form) {
    const el = document.getElementById(`auth-error-${form}`);
    if (el) el.style.display = 'none';
}

function setAuthLoading(btn, loading) {
    if (!btn) return;
    btn.disabled = loading;
    btn.innerHTML = loading
        ? '<i class="fas fa-spinner fa-spin"></i> Please wait...'
        : btn.id === 'login-submit-btn' ? 'Sign In' : 'Create Account';
}

function showAuthToast(msg, isError = false) {
    const existing = document.getElementById('auth-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.id = 'auth-toast';
    toast.className = `auth-toast${isError ? ' auth-toast-error' : ''}`;
    toast.innerHTML = `<i class="fas fa-${isError ? 'exclamation-circle' : 'check-circle'}"></i> ${msg}`;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
}

// Export for use by other scripts
window.supabase = supabase;
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.switchAuthTab = switchAuthTab;
window.continueAsGuest = continueAsGuest;
window.toggleUserDropdown = toggleUserDropdown;
window.closeDropdown = closeDropdown;
window.openPortalPanel = openPortalPanel;
window.closePortalPanel = closePortalPanel;
window.switchPortalTab = switchPortalTab;
window.handleLogout = handleLogout;
window.handleForgotPassword = handleForgotPassword;
window.saveProfile = saveProfile;
window.handleChangePassword = handleChangePassword;
window.handleDeleteAccount = handleDeleteAccount;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.currentUser = () => currentUser;
