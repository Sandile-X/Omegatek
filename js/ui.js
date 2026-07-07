import {
    initAuth,
    onCurrentUserChange,
    getCurrentUser,
    getUserFirstName,
    login,
    register,
    logout,
    forgotPassword,
    saveProfile,
    changePassword,
    deleteAccount,
    continueAsGuest
} from './auth.js';
import {
    fetchOrdersByEmail,
    fetchRepairTicketsByEmail,
    fetchProfileRow,
    subscribeNewsletter
} from './api.js';

let uiInitPromise = null;
let uiEventsBound = false;
let productsShellInitialized = false;
let activePortalTab = 'orders';

function onDomReady(callback) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback, { once: true });
        return;
    }

    callback();
}

function resolvePagePath(pageName) {
    const normalizedPath = window.location.pathname.replace(/\\/g, '/');

    if (normalizedPath.includes('/pages/')) {
        return `${pageName}.html`;
    }

    if (normalizedPath.includes('/blog/')) {
        return `../pages/${pageName}.html`;
    }

    return `pages/${pageName}.html`;
}

function ensureAuthModal() {
    if (document.getElementById('auth-modal')) {
        return;
    }

    const modal = document.createElement('div');
    modal.id = 'auth-modal';
    modal.innerHTML = `
        <div class="auth-backdrop" data-ui-action="close-auth-modal"></div>
        <div class="auth-box">
            <button class="auth-close" type="button" data-ui-action="close-auth-modal"><i class="fas fa-times"></i></button>

            <div class="auth-tabs">
                <button class="auth-tab active" id="tab-login" type="button" data-ui-action="switch-auth-tab" data-auth-tab="login">Login</button>
                <button class="auth-tab" id="tab-register" type="button" data-ui-action="switch-auth-tab" data-auth-tab="register">Create Account</button>
            </div>

            <div id="auth-form-login">
                <h2 class="auth-title">Welcome back</h2>
                <p class="auth-sub">Sign in to track orders and repairs</p>
                <div class="auth-error" id="auth-error-login" style="display:none;"></div>
                <form id="auth-login-form">
                    <div class="auth-field">
                        <label>Email</label>
                        <input type="email" id="login-email" placeholder="you@example.com" required>
                    </div>
                    <div class="auth-field">
                        <label>Password</label>
                        <input type="password" id="login-password" placeholder="********" required>
                    </div>
                    <button type="submit" class="auth-btn" id="login-submit-btn">Sign In</button>
                </form>
                <p class="auth-switch">No account? <a href="#" data-ui-action="switch-auth-tab" data-auth-tab="register">Register here</a></p>
                <p class="auth-switch"><a href="#" data-ui-action="forgot-password">Forgot password?</a></p>
            </div>

            <div id="auth-form-register" style="display:none;">
                <h2 class="auth-title">Create account</h2>
                <p class="auth-sub">Save your details for faster checkout</p>
                <div class="auth-error" id="auth-error-register" style="display:none;"></div>
                <form id="auth-register-form">
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
                        <input type="password" id="reg-password" placeholder="Min. 8 characters" required>
                    </div>
                    <button type="submit" class="auth-btn" id="register-submit-btn">Create Account</button>
                </form>
                <p class="auth-switch">Already registered? <a href="#" data-ui-action="switch-auth-tab" data-auth-tab="login">Sign in</a></p>
            </div>

            <div id="auth-guest-option" style="display:none;">
                <div class="auth-divider"><span>or</span></div>
                <button class="auth-guest-btn" type="button" data-ui-action="continue-as-guest">Continue as guest</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

function ensureNavUserSection() {
    const navbar = document.querySelector('nav.navbar');
    if (!navbar || document.getElementById('nav-user-icon')) {
        return;
    }

    const menuBtn = navbar.querySelector('#menu-btn');
    const userSection = document.createElement('div');
    userSection.className = 'nav-user-section';
    userSection.innerHTML = `
        <div class="nav-user-icon" id="nav-user-icon" data-ui-action="toggle-user-dropdown">
            <i class="fas fa-user-circle" id="nav-user-icon-img"></i>
            <span class="nav-user-name" id="nav-user-name" style="display:none;"></span>
        </div>
        <div class="nav-user-dropdown" id="nav-user-dropdown">
            <div id="dropdown-logged-out">
                <button type="button" data-ui-action="open-auth-modal">
                    <i class="fas fa-sign-in-alt"></i> Login / Register
                </button>
                <button type="button" data-ui-action="track-order">
                    <i class="fas fa-search"></i> Track My Order
                </button>
            </div>
            <div id="dropdown-logged-in" style="display:none;">
                <div class="dropdown-user-info">
                    <span id="dropdown-greeting">Hi there!</span>
                </div>
                <button type="button" data-ui-action="open-portal" data-portal-tab="orders">
                    <i class="fas fa-box"></i> My Orders
                </button>
                <button type="button" data-ui-action="open-portal" data-portal-tab="repairs">
                    <i class="fas fa-tools"></i> Repair Status
                </button>
                <button type="button" data-ui-action="open-portal" data-portal-tab="profile">
                    <i class="fas fa-user"></i> My Profile
                </button>
                <button type="button" class="dropdown-logout" data-ui-action="logout">
                    <i class="fas fa-sign-out-alt"></i> Logout
                </button>
            </div>
        </div>
    `;

    if (menuBtn) {
        navbar.insertBefore(userSection, menuBtn.nextSibling);
    } else {
        navbar.appendChild(userSection);
    }
}

function ensurePortalPanel() {
    if (document.getElementById('customer-portal')) {
        return;
    }

    const panel = document.createElement('div');
    panel.id = 'customer-portal';
    panel.innerHTML = `
        <div class="portal-backdrop" data-ui-action="close-portal"></div>
        <div class="portal-panel">
            <div class="portal-header">
                <div class="portal-tabs">
                    <button class="portal-tab active" type="button" data-ui-action="switch-portal-tab" data-portal-tab="orders">
                        <i class="fas fa-box"></i> Orders
                    </button>
                    <button class="portal-tab" type="button" data-ui-action="switch-portal-tab" data-portal-tab="repairs">
                        <i class="fas fa-tools"></i> Repairs
                    </button>
                    <button class="portal-tab" type="button" data-ui-action="switch-portal-tab" data-portal-tab="profile">
                        <i class="fas fa-user"></i> Profile
                    </button>
                </div>
                <button class="portal-close" type="button" data-ui-action="close-portal">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div class="portal-body">
                <div id="portal-orders" class="portal-section">
                    <h3>My Orders</h3>
                    <div id="portal-orders-list">
                        <div class="portal-loading"><i class="fas fa-spinner fa-spin"></i> Loading orders...</div>
                    </div>
                </div>

                <div id="portal-repairs" class="portal-section" style="display:none;">
                    <h3>Repair Tickets</h3>
                    <div id="portal-repairs-list">
                        <div class="portal-loading"><i class="fas fa-spinner fa-spin"></i> Loading tickets...</div>
                    </div>
                </div>

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

function showAuthError(form, message) {
    const errorElement = document.getElementById(`auth-error-${form}`);
    if (!errorElement) {
        return;
    }

    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

function hideAuthError(form) {
    const errorElement = document.getElementById(`auth-error-${form}`);
    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

function setButtonLoading(button, loading, idleText) {
    if (!button) {
        return;
    }

    button.disabled = loading;
    button.innerHTML = loading ? '<i class="fas fa-spinner fa-spin"></i> Please wait...' : idleText;
}

function updateNavIcon(loggedIn, user) {
    const loggedOut = document.getElementById('dropdown-logged-out');
    const loggedInSection = document.getElementById('dropdown-logged-in');
    const nameLabel = document.getElementById('nav-user-name');
    const greeting = document.getElementById('dropdown-greeting');
    const icon = document.getElementById('nav-user-icon-img');

    if (!loggedOut || !loggedInSection) {
        return;
    }

    if (loggedIn && user) {
        const firstName = getUserFirstName(user);
        loggedOut.style.display = 'none';
        loggedInSection.style.display = 'block';

        if (nameLabel) {
            nameLabel.textContent = firstName;
            nameLabel.style.display = 'inline';
        }

        if (greeting) {
            greeting.textContent = `Hi, ${firstName}!`;
        }

        if (icon) {
            icon.className = 'fas fa-user-circle nav-icon-active';
        }

        return;
    }

    loggedOut.style.display = 'block';
    loggedInSection.style.display = 'none';

    if (nameLabel) {
        nameLabel.style.display = 'none';
    }

    if (icon) {
        icon.className = 'fas fa-user-circle';
    }
}

export function showAuthToast(message, isError = false) {
    const existing = document.getElementById('auth-toast');
    if (existing) {
        existing.remove();
    }

    const toast = document.createElement('div');
    toast.id = 'auth-toast';
    toast.className = `auth-toast${isError ? ' auth-toast-error' : ''}`;
    toast.innerHTML = `<i class="fas fa-${isError ? 'exclamation-circle' : 'check-circle'}"></i> ${message}`;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

export function openAuthModal(tab = 'login', withGuestOption = false) {
    const modal = document.getElementById('auth-modal');
    if (!modal) {
        return;
    }

    modal.classList.add('open');
    switchAuthTab(tab);

    const guestOption = document.getElementById('auth-guest-option');
    if (guestOption) {
        guestOption.style.display = withGuestOption ? 'block' : 'none';
    }
}

export function closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.classList.remove('open');
    }
}

function switchAuthTab(tab) {
    const loginForm = document.getElementById('auth-form-login');
    const registerForm = document.getElementById('auth-form-register');
    const loginTab = document.getElementById('tab-login');
    const registerTab = document.getElementById('tab-register');

    if (loginForm) {
        loginForm.style.display = tab === 'login' ? 'block' : 'none';
    }

    if (registerForm) {
        registerForm.style.display = tab === 'register' ? 'block' : 'none';
    }

    loginTab?.classList.toggle('active', tab === 'login');
    registerTab?.classList.toggle('active', tab === 'register');
}

function toggleUserDropdown() {
    const dropdown = document.getElementById('nav-user-dropdown');
    const icon = document.getElementById('nav-user-icon');
    if (!dropdown || !icon) {
        return;
    }

    if (dropdown.classList.contains('open')) {
        dropdown.classList.remove('open');
        return;
    }

    if (window.innerWidth <= 768) {
        dropdown.style.left = '50%';
        dropdown.style.top = '80px';
        dropdown.style.right = 'auto';
        dropdown.classList.add('open');
        return;
    }

    const rect = icon.getBoundingClientRect();
    const dropdownWidth = dropdown.offsetWidth || 220;
    const gap = 8;

    let top = rect.bottom + gap;
    let right = window.innerWidth - rect.right;

    if (top + 300 > window.innerHeight) {
        top = rect.top - gap - 300;
    }

    const leftEdge = window.innerWidth - right - dropdownWidth;
    if (leftEdge < 8) {
        right = window.innerWidth - dropdownWidth - 8;
    }

    dropdown.style.top = `${top}px`;
    dropdown.style.right = `${right}px`;
    dropdown.style.left = 'auto';
    dropdown.classList.add('open');
}

export function closeDropdown() {
    const dropdown = document.getElementById('nav-user-dropdown');
    if (dropdown) {
        dropdown.classList.remove('open');
    }
}

export function openPortalPanel(tab = 'orders') {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        openAuthModal('login');
        return;
    }

    const panel = document.getElementById('customer-portal');
    if (!panel) {
        return;
    }

    panel.classList.add('open');
    switchPortalTab(tab);
}

export function closePortalPanel() {
    const panel = document.getElementById('customer-portal');
    if (panel) {
        panel.classList.remove('open');
    }
}

function renderPortalOrders(orders) {
    const container = document.getElementById('portal-orders-list');
    if (!container) {
        return;
    }

    if (!orders.length) {
        container.innerHTML = '<div class="portal-empty"><i class="fas fa-box-open"></i><p>No orders yet</p></div>';
        return;
    }

    container.innerHTML = orders.map((order) => `
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
                    ${order.order_items.map((item) => `<span class="portal-item-chip">${item.product_name} x${item.quantity}</span>`).join('')}
                </div>
            ` : ''}
            <div class="portal-card-foot">
                <span class="portal-payment-${order.payment_status}">
                    <i class="fas fa-circle"></i> Payment: ${order.payment_status}
                </span>
            </div>
        </div>
    `).join('');
}

function renderPortalRepairs(tickets) {
    const container = document.getElementById('portal-repairs-list');
    if (!container) {
        return;
    }

    if (!tickets.length) {
        container.innerHTML = '<div class="portal-empty"><i class="fas fa-tools"></i><p>No repair tickets yet</p></div>';
        return;
    }

    container.innerHTML = tickets.map((ticket) => `
        <div class="portal-card">
            <div class="portal-card-head">
                <strong>#${ticket.ticket_number}</strong>
                <span class="portal-badge portal-badge-${ticket.status}">${ticket.status.replace(/_/g, ' ')}</span>
            </div>
            <div class="portal-card-meta">
                <span>${ticket.device_type}</span>
                <span class="portal-priority-${ticket.priority}">${ticket.priority} priority</span>
            </div>
            <p class="portal-issue">${ticket.issue_description}</p>
            ${ticket.assigned_technician ? `<p class="portal-tech"><i class="fas fa-user-cog"></i> ${ticket.assigned_technician}</p>` : ''}
            ${ticket.estimated_cost ? `<p class="portal-cost">Estimated: R${parseFloat(ticket.estimated_cost).toFixed(2)}</p>` : ''}
        </div>
    `).join('');
}

function renderPortalProfile(profile) {
    const currentUser = getCurrentUser();
    const container = document.getElementById('portal-profile-content');
    if (!container || !currentUser) {
        return;
    }

    const safeProfile = profile || {};
    container.innerHTML = `
        <form id="portal-profile-form" class="portal-profile-form">
            <div class="portal-field-row">
                <div class="portal-field">
                    <label>First Name</label>
                    <input type="text" id="pf-first" value="${safeProfile.first_name || ''}" placeholder="First name">
                </div>
                <div class="portal-field">
                    <label>Last Name</label>
                    <input type="text" id="pf-last" value="${safeProfile.last_name || ''}" placeholder="Last name">
                </div>
            </div>
            <div class="portal-field">
                <label>Email</label>
                <input type="email" value="${currentUser.email}" readonly style="opacity:0.7;">
            </div>
            <div class="portal-field">
                <label>Phone</label>
                <input type="tel" id="pf-phone" value="${safeProfile.phone || ''}" placeholder="Phone number">
            </div>
            <button type="submit" class="auth-btn">Save Changes</button>
        </form>

        <div class="portal-divider"></div>

        <div class="portal-sub-section">
            <h4 class="portal-sub-title"><i class="fas fa-lock"></i> Change Password</h4>
            <form id="portal-password-form" class="portal-profile-form">
                <div class="portal-field">
                    <label>New Password</label>
                    <input type="password" id="pf-new-password" placeholder="Min. 8 characters" required>
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

        <div class="portal-sub-section portal-danger-zone">
            <h4 class="portal-sub-title portal-sub-title-danger"><i class="fas fa-exclamation-triangle"></i> Danger Zone</h4>
            <p class="portal-danger-msg">Deleting your account is permanent and cannot be undone.</p>
            <button type="button" class="auth-btn auth-btn-danger delete-account-btn" data-ui-action="delete-account">Delete My Account</button>
        </div>
    `;
}

async function loadPortalData(tab) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        return;
    }

    if (tab === 'orders') {
        const container = document.getElementById('portal-orders-list');
        if (container) {
            container.innerHTML = '<div class="portal-loading"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
        }

        try {
            const orders = await fetchOrdersByEmail(currentUser.email);
            renderPortalOrders(orders);
        } catch {
            renderPortalOrders([]);
        }
        return;
    }

    if (tab === 'repairs') {
        const container = document.getElementById('portal-repairs-list');
        if (container) {
            container.innerHTML = '<div class="portal-loading"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
        }

        try {
            const tickets = await fetchRepairTicketsByEmail(currentUser.email);
            renderPortalRepairs(tickets);
        } catch {
            renderPortalRepairs([]);
        }
        return;
    }

    const container = document.getElementById('portal-profile-content');
    if (container) {
        container.innerHTML = '<div class="portal-loading"><i class="fas fa-spinner fa-spin"></i> Loading profile...</div>';
    }

    const profile = await fetchProfileRow(currentUser.id);
    renderPortalProfile(profile);
}

function switchPortalTab(tab) {
    activePortalTab = tab;

    ['orders', 'repairs', 'profile'].forEach((sectionName) => {
        const section = document.getElementById(`portal-${sectionName}`);
        if (section) {
            section.style.display = sectionName === tab ? 'block' : 'none';
        }
    });

    document.querySelectorAll('[data-portal-tab]').forEach((button) => {
        button.classList.toggle('active', button.dataset.portalTab === tab);
    });

    loadPortalData(tab);
}

async function handleLoginSubmit(event) {
    event.preventDefault();

    const email = document.getElementById('login-email')?.value.trim();
    const password = document.getElementById('login-password')?.value || '';
    const button = document.getElementById('login-submit-btn');

    hideAuthError('login');
    setButtonLoading(button, true, 'Sign In');

    try {
        const user = await login({ email, password });
        closeAuthModal();
        showAuthToast(`Welcome back, ${getUserFirstName(user)}.`);
    } catch (error) {
        showAuthError('login', error.message || 'Could not sign you in.');
    } finally {
        setButtonLoading(button, false, 'Sign In');
    }
}

async function handleRegisterSubmit(event) {
    event.preventDefault();

    const firstName = document.getElementById('reg-first')?.value.trim() || '';
    const lastName = document.getElementById('reg-last')?.value.trim() || '';
    const email = document.getElementById('reg-email')?.value.trim() || '';
    const phone = document.getElementById('reg-phone')?.value.trim() || '';
    const password = document.getElementById('reg-password')?.value || '';
    const button = document.getElementById('register-submit-btn');

    hideAuthError('register');

    if (password.length < 8) {
        showAuthError('register', 'Password must be at least 8 characters.');
        return;
    }

    setButtonLoading(button, true, 'Create Account');

    try {
        const data = await register({ firstName, lastName, email, phone, password });
        closeAuthModal();

        if (data.session) {
            showAuthToast(`Welcome to Omegatek, ${firstName}.`);
        } else {
            showAuthToast(`Check your email to confirm your account, ${firstName}.`);
        }
    } catch (error) {
        showAuthError('register', error.message || 'Could not create your account.');
    } finally {
        setButtonLoading(button, false, 'Create Account');
    }
}

async function handleForgotPasswordClick() {
    const email = document.getElementById('login-email')?.value.trim();
    if (!email) {
        showAuthError('login', 'Enter your email above first.');
        return;
    }

    try {
        await forgotPassword(email);
        showAuthToast('Password reset email sent.');
    } catch (error) {
        showAuthError('login', error.message || 'Could not send a reset email.');
    }
}

async function handleProfileSaveSubmit(event) {
    event.preventDefault();

    try {
        await saveProfile({
            firstName: document.getElementById('pf-first')?.value.trim() || '',
            lastName: document.getElementById('pf-last')?.value.trim() || '',
            phone: document.getElementById('pf-phone')?.value.trim() || ''
        });
        showAuthToast('Profile saved.');
    } catch (error) {
        showAuthToast(error.message || 'Error saving profile.', true);
    }
}

async function handlePasswordChangeSubmit(event) {
    event.preventDefault();

    const newPassword = document.getElementById('pf-new-password')?.value || '';
    const confirmPassword = document.getElementById('pf-confirm-password')?.value || '';
    const errorElement = document.getElementById('pw-change-error');
    const button = event.target.querySelector('button[type="submit"]');

    if (newPassword.length < 8) {
        if (errorElement) {
            errorElement.textContent = 'Password must be at least 8 characters.';
            errorElement.style.display = 'block';
        }
        return;
    }

    if (newPassword !== confirmPassword) {
        if (errorElement) {
            errorElement.textContent = 'Passwords do not match.';
            errorElement.style.display = 'block';
        }
        return;
    }

    if (errorElement) {
        errorElement.style.display = 'none';
    }

    setButtonLoading(button, true, 'Update Password');

    try {
        await changePassword(newPassword);
        document.getElementById('pf-new-password').value = '';
        document.getElementById('pf-confirm-password').value = '';
        showAuthToast('Password updated successfully.');
    } catch (error) {
        if (errorElement) {
            errorElement.textContent = error.message || 'Could not update your password.';
            errorElement.style.display = 'block';
        }
    } finally {
        setButtonLoading(button, false, 'Update Password');
    }
}

async function handleDeleteAccountClick() {
    const password = window.prompt('To delete your account, enter your password to confirm:');
    if (!password) {
        return;
    }

    const confirmed = window.confirm('Are you absolutely sure? This cannot be undone.');
    if (!confirmed) {
        return;
    }

    const button = document.querySelector('.delete-account-btn');
    if (button) {
        button.disabled = true;
        button.textContent = 'Deleting...';
    }

    try {
        await deleteAccount(password);
        closePortalPanel();
        showAuthToast('Your account has been permanently deleted.');
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);
    } catch (error) {
        showAuthToast(error.message || 'Could not delete your account.', true);
        if (button) {
            button.disabled = false;
            button.textContent = 'Delete My Account';
        }
    }
}

function bindGlobalUiEvents() {
    if (uiEventsBound) {
        return;
    }

    uiEventsBound = true;

    document.addEventListener('click', (event) => {
        const actionButton = event.target.closest('[data-ui-action]');
        const toastCloseButton = event.target.closest('[data-close-toast]');
        const toast = event.target.closest('[data-toast-click-close="true"]');
        const cookieSettingsLink = event.target.closest('.js-cookie-settings');
        const navIcon = document.getElementById('nav-user-icon');
        const dropdown = document.getElementById('nav-user-dropdown');

        if (toastCloseButton) {
            event.stopPropagation();
            document.getElementById(toastCloseButton.dataset.closeToast)?.classList.remove('show');
            return;
        }

        if (toast && !toastCloseButton) {
            toast.classList.remove('show');
        }

        if (cookieSettingsLink) {
            event.preventDefault();
            window.OmegatekCookieConsent?.showSettings?.();
            return;
        }

        if (actionButton) {
            event.preventDefault();
            const action = actionButton.dataset.uiAction;

            switch (action) {
                case 'open-auth-modal':
                    openAuthModal(actionButton.dataset.authTab || 'login');
                    closeDropdown();
                    return;
                case 'close-auth-modal':
                    closeAuthModal();
                    return;
                case 'switch-auth-tab':
                    switchAuthTab(actionButton.dataset.authTab || 'login');
                    return;
                case 'continue-as-guest':
                    closeAuthModal();
                    continueAsGuest();
                    return;
                case 'forgot-password':
                    handleForgotPasswordClick();
                    return;
                case 'toggle-user-dropdown':
                    toggleUserDropdown();
                    return;
                case 'track-order':
                    closeDropdown();
                    window.location.href = resolvePagePath('order-tracking');
                    return;
                case 'open-portal':
                    closeDropdown();
                    openPortalPanel(actionButton.dataset.portalTab || 'orders');
                    return;
                case 'switch-portal-tab':
                    switchPortalTab(actionButton.dataset.portalTab || 'orders');
                    return;
                case 'close-portal':
                    closePortalPanel();
                    return;
                case 'logout':
                    logout().then(() => {
                        closePortalPanel();
                        showAuthToast('Logged out successfully.');
                    }).catch((error) => {
                        showAuthToast(error.message || 'Could not log you out.', true);
                    });
                    return;
                case 'delete-account':
                    handleDeleteAccountClick();
                    return;
                default:
                    break;
            }
        }

        if (dropdown && navIcon && !dropdown.contains(event.target) && !navIcon.contains(event.target)) {
            closeDropdown();
        }
    });

    document.addEventListener('submit', (event) => {
        if (event.target.id === 'auth-login-form') {
            handleLoginSubmit(event);
            return;
        }

        if (event.target.id === 'auth-register-form') {
            handleRegisterSubmit(event);
            return;
        }

        if (event.target.id === 'portal-profile-form') {
            handleProfileSaveSubmit(event);
            return;
        }

        if (event.target.id === 'portal-password-form') {
            handlePasswordChangeSubmit(event);
        }
    });
}

export function bindNewsletterForm(options = {}) {
    const {
        formSelector = '#newsletterForm',
        emailSelector = '#newsletterEmail',
        messageSelector = '#newsletterMessage',
        submitSelector = 'input[type="submit"], button[type="submit"]',
        loadingLabel = 'Subscribing...',
        idleLabel = null
    } = options;

    const newsletterForm = document.querySelector(formSelector);
    if (!newsletterForm || newsletterForm.dataset.bound === 'true') {
        return;
    }

    newsletterForm.dataset.bound = 'true';
    newsletterForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const emailInput = document.querySelector(emailSelector);
        const message = document.querySelector(messageSelector);
        const submitButton = newsletterForm.querySelector(submitSelector);

        if (!emailInput || !message || !submitButton) {
            return;
        }

        const defaultIdleLabel = idleLabel || (submitButton.tagName === 'BUTTON'
            ? submitButton.textContent.trim()
            : submitButton.value);

        submitButton.disabled = true;
        if (submitButton.tagName === 'BUTTON') {
            submitButton.textContent = loadingLabel;
        } else {
            submitButton.value = loadingLabel;
        }

        try {
            const result = await subscribeNewsletter({ email: emailInput.value, name: '' });
            message.style.display = 'block';

            if (result.success) {
                message.style.color = '#28a745';
                message.textContent = result.message;
                newsletterForm.reset();
            } else {
                message.style.color = '#dc3545';
                message.textContent = result.message;
            }
        } catch {
            message.style.display = 'block';
            message.style.color = '#dc3545';
            message.textContent = 'Server error. Please try again later.';
        } finally {
            submitButton.disabled = false;
            if (submitButton.tagName === 'BUTTON') {
                submitButton.textContent = defaultIdleLabel;
            } else {
                submitButton.value = defaultIdleLabel;
            }
            setTimeout(() => {
                message.style.display = 'none';
            }, 5000);
        }
    });
}

export function initProductsShellUi() {
    if (productsShellInitialized) {
        return;
    }

    productsShellInitialized = true;

    const menuButton = document.getElementById('menu-btn');
    const navbarLinks = document.querySelector('.header .navbar .links');
    const navbar = document.querySelector('.header .navbar');

    if (menuButton && navbarLinks) {
        const backdrop = document.createElement('div');
        backdrop.className = 'mobile-menu-backdrop';
        backdrop.style.cssText = [
            'position:fixed',
            'top:0',
            'left:0',
            'right:0',
            'bottom:0',
            'background:rgba(0, 0, 0, 0.4)',
            'backdrop-filter:blur(8px)',
            '-webkit-backdrop-filter:blur(8px)',
            'z-index:999',
            'opacity:0',
            'pointer-events:none',
            'transition:opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        ].join(';');
        document.body.appendChild(backdrop);

        const syncMenuState = () => {
            const isOpen = navbarLinks.classList.contains('active');
            backdrop.style.opacity = isOpen ? '1' : '0';
            backdrop.style.pointerEvents = isOpen ? 'auto' : 'none';
            document.body.style.overflow = isOpen ? 'hidden' : '';
        };

        menuButton.addEventListener('click', () => {
            menuButton.classList.toggle('fa-times');
            navbarLinks.classList.toggle('active');
            syncMenuState();
        });

        backdrop.addEventListener('click', () => {
            menuButton.classList.remove('fa-times');
            navbarLinks.classList.remove('active');
            syncMenuState();
        });

        navbarLinks.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => {
                menuButton.classList.remove('fa-times');
                navbarLinks.classList.remove('active');
                syncMenuState();
            });
        });
    }

    if (navbar) {
        const updateNavbarState = () => {
            const isScrolled = window.scrollY > 60;
            navbar.classList.toggle('active', isScrolled);
            navbar.classList.toggle('scrolled', window.scrollY > 100);
        };

        updateNavbarState();
        window.addEventListener('scroll', updateNavbarState, { passive: true });
    }

    const progressBar = document.createElement('div');
    progressBar.id = 'products-scroll-progress';
    progressBar.style.cssText = [
        'position:fixed',
        'top:0',
        'left:0',
        'width:0%',
        'height:4px',
        'background:linear-gradient(90deg, #b30ce6, #9333ea, #7c3aed)',
        'z-index:10000',
        'transition:width 0.1s ease',
        'box-shadow:0 2px 8px rgba(179, 12, 230, 0.4)'
    ].join(';');
    document.body.appendChild(progressBar);

    window.addEventListener('scroll', () => {
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const percent = scrollHeight > 0 ? (window.scrollY / scrollHeight) * 100 : 0;
        progressBar.style.width = `${percent}%`;
    }, { passive: true });
}

export function initUi() {
    if (uiInitPromise) {
        return uiInitPromise;
    }

    uiInitPromise = (async () => {
        ensureAuthModal();
        ensureNavUserSection();
        ensurePortalPanel();
        bindGlobalUiEvents();
        await initAuth();
        updateNavIcon(!!getCurrentUser(), getCurrentUser());
        onCurrentUserChange((user) => updateNavIcon(!!user, user));
        return true;
    })();

    return uiInitPromise;
}

onDomReady(() => {
    initUi();
});
