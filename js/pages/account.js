import { getPhpBase } from '../api.js';
import { onReady } from '../site-shell.js';

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

const API_BASE = `${getPhpBase()}/admin/`;
let currentUser = null;
let authToken = localStorage.getItem('authToken');

function showAccountDashboard() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('accountSection').style.display = 'block';
    document.getElementById('logoutBtn').style.display = 'inline-block';
    document.getElementById('userGreeting').textContent = currentUser.first_name || currentUser.email;
    loadProfile();
}

function switchToRegister() {
    document.getElementById('loginSection').style.display = 'grid';
    document.getElementById('loginCard').style.display = 'none';
    document.getElementById('registerCard').style.display = 'block';
    document.getElementById('regFirstName')?.focus();
}

function switchToLogin() {
    document.getElementById('loginSection').style.display = 'grid';
    document.getElementById('loginCard').style.display = 'block';
    document.getElementById('registerCard').style.display = 'none';
}

async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_BASE}auth-api.php?action=login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.message || 'Login failed.');
        }

        localStorage.setItem('authToken', data.token);
        authToken = data.token;
        currentUser = data.user;
        showAccountDashboard();
        await Promise.all([loadUserOrders(), loadRepairTickets()]);
    } catch (error) {
        window.alert(`Login failed: ${error.message}`);
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const payload = {
        first_name: document.getElementById('regFirstName').value,
        last_name: document.getElementById('regLastName').value,
        email: document.getElementById('regEmail').value,
        phone: document.getElementById('regPhone').value,
        password: document.getElementById('regPassword').value
    };

    try {
        const response = await fetch(`${API_BASE}auth-api.php?action=register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.message || 'Registration failed.');
        }

        localStorage.setItem('authToken', data.token);
        authToken = data.token;
        currentUser = data.user;
        showAccountDashboard();
    } catch (error) {
        window.alert(`Registration failed: ${error.message}`);
    }
}

async function verifyToken() {
    try {
        const response = await fetch(`${API_BASE}auth-api.php?action=verify_token`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        const data = await response.json();

        if (!data.success) {
            logout();
            return;
        }

        currentUser = data.user;
        showAccountDashboard();
        await Promise.all([loadUserOrders(), loadRepairTickets()]);
    } catch {
        logout();
    }
}

async function loadUserOrders() {
    try {
        const response = await fetch(`${API_BASE}orders-api.php?action=get_customer_orders`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        const data = await response.json();
        const ordersList = document.getElementById('ordersList');
        if (!ordersList) {
            return;
        }

        if (!data.success || !data.orders.length) {
            ordersList.innerHTML = '<p class="text-gray-600">No orders yet.</p>';
            return;
        }

        ordersList.innerHTML = data.orders.map((order) => `
            <div class="order-card">
                <div class="flex items-center justify-between mb-3">
                    <div>
                        <h3 class="font-bold text-gray-800">#${escapeHtml(order.order_number)}</h3>
                        <p class="text-sm text-gray-600">${new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <span class="badge badge-${escapeHtml(order.status)}">${escapeHtml(order.status)}</span>
                </div>
                <div class="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200">
                    <div>
                        <p class="text-xs text-gray-600">Total Amount</p>
                        <p class="font-bold text-gray-800">R${parseFloat(order.total_amount).toFixed(2)}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-600">Payment Status</p>
                        <p class="font-bold text-gray-800">${escapeHtml(order.payment_status)}</p>
                    </div>
                </div>
                <button class="mt-3 text-purple-600 text-sm font-medium hover:underline" type="button" data-account-action="view-order" data-order-id="${escapeHtml(order.id)}">
                    View Details
                </button>
            </div>
        `).join('');
    } catch {
        document.getElementById('ordersList').innerHTML = '<p class="text-red-600">Error loading orders.</p>';
    }
}

async function loadRepairTickets() {
    try {
        const response = await fetch(`${API_BASE}orders-api.php?action=get_customer_repairs`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        const data = await response.json();
        const repairsList = document.getElementById('repairsList');
        if (!repairsList) {
            return;
        }

        if (!data.success || !data.tickets.length) {
            repairsList.innerHTML = '<p class="text-gray-600">No repair tickets yet.</p>';
            return;
        }

        repairsList.innerHTML = data.tickets.map((ticket) => `
            <div class="order-card">
                <div class="flex items-center justify-between mb-3">
                    <div>
                        <h3 class="font-bold text-gray-800">#${escapeHtml(ticket.ticket_number)}</h3>
                        <p class="text-sm text-gray-600">${escapeHtml(ticket.device_type)}</p>
                    </div>
                    <span class="badge badge-${escapeHtml(ticket.status)}">${escapeHtml(ticket.status)}</span>
                </div>
                <p class="text-sm text-gray-600 mb-3">${escapeHtml(ticket.issue_description)}</p>
                <div class="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200">
                    <div>
                        <p class="text-xs text-gray-600">Priority</p>
                        <p class="font-bold text-gray-800 capitalize">${escapeHtml(ticket.priority)}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-600">Assigned To</p>
                        <p class="font-bold text-gray-800">${escapeHtml(ticket.assigned_technician || 'Pending')}</p>
                    </div>
                </div>
                <button class="mt-3 text-purple-600 text-sm font-medium hover:underline" type="button" data-account-action="view-ticket" data-ticket-id="${escapeHtml(ticket.id)}">
                    View Details
                </button>
            </div>
        `).join('');
    } catch {
        document.getElementById('repairsList').innerHTML = '<p class="text-red-600">Error loading repair tickets.</p>';
    }
}

function loadProfile() {
    if (!currentUser) {
        return;
    }

    document.getElementById('profileEmail').value = currentUser.email;
    document.getElementById('profileFirstName').value = currentUser.first_name || '';
    document.getElementById('profileLastName').value = currentUser.last_name || '';
    document.getElementById('profilePhone').value = currentUser.phone || '';
}

function updateProfile() {
    window.alert('Profile update functionality coming soon!');
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach((element) => {
        element.style.display = 'none';
    });

    document.querySelectorAll('.tab-btn').forEach((element) => {
        element.classList.remove('border-b-2', 'border-purple-600');
        element.classList.add('text-gray-700');
    });

    document.getElementById(`${tabName}-tab`).style.display = 'block';
    document.querySelector(`[data-tab-target="${tabName}"]`)?.classList.add('border-b-2', 'border-purple-600');
    document.querySelector(`[data-tab-target="${tabName}"]`)?.classList.remove('text-gray-700');
}

function logout() {
    localStorage.removeItem('authToken');
    authToken = null;
    currentUser = null;
    switchToLogin();
    document.getElementById('accountSection').style.display = 'none';
    document.getElementById('logoutBtn').style.display = 'none';
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
}

function bindAccountActions() {
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
    document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
    document.getElementById('registerForm')?.addEventListener('submit', handleRegister);
    document.getElementById('showRegisterLink')?.addEventListener('click', (event) => {
        event.preventDefault();
        switchToRegister();
    });
    document.getElementById('showLoginLink')?.addEventListener('click', (event) => {
        event.preventDefault();
        switchToLogin();
    });
    document.querySelectorAll('[data-tab-target]').forEach((button) => {
        button.addEventListener('click', () => switchTab(button.dataset.tabTarget));
    });
    document.getElementById('updateProfileButton')?.addEventListener('click', updateProfile);

    document.addEventListener('click', (event) => {
        const actionButton = event.target.closest('[data-account-action]');
        if (!actionButton) {
            return;
        }

        if (actionButton.dataset.accountAction === 'view-order') {
            window.alert(`Order details page coming soon! Order ID: ${actionButton.dataset.orderId}`);
            return;
        }

        if (actionButton.dataset.accountAction === 'view-ticket') {
            window.alert(`Ticket details page coming soon! Ticket ID: ${actionButton.dataset.ticketId}`);
        }
    });
}

function bootstrapAccountPage() {
    bindAccountActions();
    if (authToken) {
        void verifyToken();
    }
}

onReady(() => {
    bootstrapAccountPage();
});

export { bootstrapAccountPage };