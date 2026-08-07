import {
    getSession,
    onSupabaseAuthChange,
    signInWithEmail,
    signUpWithEmail,
    signOutUser,
    fetchOrdersByEmail,
    fetchRepairTicketsByEmail,
    fetchProfileRow,
    upsertProfileRow
} from '../api.js';
import { onReady } from '../site-shell.js';
import { escapeHtml } from '../utils.js';

let currentUser = null;
let currentProfile = null;

function showAccountDashboard() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('accountSection').style.display = 'block';
    document.getElementById('logoutBtn').style.display = 'inline-block';
    document.getElementById('userGreeting').textContent = currentProfile?.first_name || currentUser.email;
    loadProfile();
    void Promise.all([loadUserOrders(), loadRepairTickets()]);
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
        await signInWithEmail({ email, password });
    } catch (error) {
        window.alert(`Login failed: ${error.message}`);
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const firstName = document.getElementById('regFirstName').value;
    const lastName = document.getElementById('regLastName').value;
    const email = document.getElementById('regEmail').value;
    const phone = document.getElementById('regPhone').value;
    const password = document.getElementById('regPassword').value;

    try {
        const data = await signUpWithEmail({ firstName, lastName, email, phone, password });
        if (!data.session) {
            window.alert('Check your email to confirm your account before logging in.');
            switchToLogin();
        }
    } catch (error) {
        window.alert(`Registration failed: ${error.message}`);
    }
}

async function loadUserOrders() {
    const ordersList = document.getElementById('ordersList');
    if (!ordersList || !currentUser) {
        return;
    }

    try {
        const orders = await fetchOrdersByEmail(currentUser.email);

        if (!orders.length) {
            ordersList.innerHTML = '<p class="text-gray-600">No orders yet.</p>';
            return;
        }

        ordersList.innerHTML = orders.map((order) => `
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
                <a class="mt-3 inline-block text-purple-600 text-sm font-medium hover:underline" href="../order-tracking.html?order=${encodeURIComponent(order.order_number)}">
                    Track Order
                </a>
            </div>
        `).join('');
    } catch {
        ordersList.innerHTML = '<p class="text-red-600">Error loading orders.</p>';
    }
}

async function loadRepairTickets() {
    const repairsList = document.getElementById('repairsList');
    if (!repairsList || !currentUser) {
        return;
    }

    try {
        const tickets = await fetchRepairTicketsByEmail(currentUser.email);

        if (!tickets.length) {
            repairsList.innerHTML = '<p class="text-gray-600">No repair tickets yet.</p>';
            return;
        }

        repairsList.innerHTML = tickets.map((ticket) => `
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
            </div>
        `).join('');
    } catch {
        repairsList.innerHTML = '<p class="text-red-600">Error loading repair tickets.</p>';
    }
}

async function loadProfile() {
    if (!currentUser) {
        return;
    }

    currentProfile = await fetchProfileRow(currentUser.id);

    document.getElementById('profileEmail').value = currentUser.email;
    document.getElementById('profileFirstName').value = currentProfile?.first_name || '';
    document.getElementById('profileLastName').value = currentProfile?.last_name || '';
    document.getElementById('profilePhone').value = currentProfile?.phone || '';
}

async function updateProfile() {
    if (!currentUser) {
        return;
    }

    try {
        await upsertProfileRow({
            id: currentUser.id,
            email: currentUser.email,
            first_name: document.getElementById('profileFirstName').value,
            last_name: document.getElementById('profileLastName').value,
            phone: document.getElementById('profilePhone').value
        });
        window.alert('Profile updated.');
    } catch (error) {
        window.alert(`Could not update profile: ${error.message}`);
    }
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

async function logout() {
    await signOutUser();
}

function showLoggedOutState() {
    currentUser = null;
    currentProfile = null;
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
}

async function bootstrapAccountPage() {
    bindAccountActions();

    onSupabaseAuthChange(({ session }) => {
        if (session?.user) {
            currentUser = session.user;
            showAccountDashboard();
        } else {
            showLoggedOutState();
        }
    });

    const session = await getSession();
    if (session?.user) {
        currentUser = session.user;
        showAccountDashboard();
    }
}

onReady(() => {
    void bootstrapAccountPage();
});

export { bootstrapAccountPage };
