import { fetchOrderById } from '../api.js';
import { onReady } from '../site-shell.js';
import { escapeHtml } from '../utils.js';

const statusIcons = {
    pending: 'fa-clock',
    confirmed: 'fa-check-circle',
    processing: 'fa-cog',
    dispatched: 'fa-shipping-fast',
    delivered: 'fa-box-open',
    cancelled: 'fa-times-circle'
};

const statusLabels = {
    pending: 'Order Placed',
    confirmed: 'Order Confirmed',
    processing: 'Processing',
    dispatched: 'Dispatched',
    delivered: 'Delivered',
    cancelled: 'Cancelled'
};

const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    processing: 'bg-purple-100 text-purple-800',
    dispatched: 'bg-indigo-100 text-indigo-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
};

function getImageFallbackDataUri() {
    return 'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27200%27 height=%27200%27 viewBox=%270 0 200 200%27%3E%3Crect width=%27200%27 height=%27200%27 fill=%27%23f3f4f6%27/%3E%3Cpath d=%27M65 70h70a10 10 0 0110 10v60a10 10 0 01-10 10H65a10 10 0 01-10-10V80a10 10 0 0110-10z%27 fill=%27none%27 stroke=%27%23d1d5db%27 stroke-width=%273%27/%3E%3Ccircle cx=%27100%27 cy=%27105%27 r=%2718%27 fill=%27none%27 stroke=%27%23d1d5db%27 stroke-width=%273%27/%3E%3C/svg%3E';
}

function showNotFound() {
    document.getElementById('loadingState')?.classList.add('hidden');
    document.getElementById('notFoundState')?.classList.remove('hidden');
}

function renderStatusTimeline(order) {
    const allStatuses = ['pending', 'confirmed', 'processing', 'dispatched', 'delivered'];
    const currentStatusIndex = allStatuses.indexOf(order.status);
    const timelineHtml = allStatuses.map((status, index) => {
        const statusClass = index < currentStatusIndex ? 'completed' : (index === currentStatusIndex ? 'current' : 'pending');
        const historyItem = order.statusHistory.find((entry) => entry.status === status);
        const timestamp = historyItem ? new Date(historyItem.timestamp).toLocaleString('en-ZA') : '';
        const note = historyItem?.note || '';

        return `
            <div class="status-item">
                <div class="status-icon ${statusClass}">
                    <i class="fas ${statusIcons[status]}"></i>
                </div>
                <div>
                    <h3 class="text-xl font-semibold text-gray-800">${statusLabels[status]}</h3>
                    ${timestamp ? `<p class="text-gray-600 mt-1">${timestamp}</p>` : ''}
                    ${note ? `<p class="text-gray-500 mt-2 text-sm">${escapeHtml(note)}</p>` : ''}
                </div>
            </div>
        `;
    }).join('');

    document.getElementById('statusTimeline').innerHTML = timelineHtml;
}

function displayOrder(order) {
    document.getElementById('loadingState')?.classList.add('hidden');
    document.getElementById('orderContent')?.classList.remove('hidden');
    document.getElementById('displayOrderId').textContent = order.orderId;
    document.getElementById('orderDate').textContent = new Date(order.orderDate).toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    document.getElementById('orderStatus').innerHTML = `<span class="px-4 py-2 rounded-lg font-semibold ${statusColors[order.status]}">${statusLabels[order.status]}</span>`;
    document.getElementById('orderTotal').textContent = `R${order.total.toFixed(2)}`;
    document.getElementById('deliveryAddress').innerHTML = `
        <p class="font-semibold text-gray-800 mb-2">${escapeHtml(order.customer.fullName)}</p>
        <p class="text-gray-600">${escapeHtml(order.address.street)}</p>
        <p class="text-gray-600">${escapeHtml(order.address.suburb)}, ${escapeHtml(order.address.city)}</p>
        <p class="text-gray-600">${escapeHtml(order.address.province)}, ${escapeHtml(order.address.postalCode)}</p>
        <p class="text-gray-600 mt-4"><i class="fas fa-phone mr-2"></i>${escapeHtml(order.customer.phone)}</p>
    `;

    renderStatusTimeline(order);

    document.getElementById('orderItems').innerHTML = order.items.map((item) => `
        <div class="flex gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-primary transition-colors">
            <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" class="w-24 h-24 object-cover rounded-lg" data-order-item-image="true">
            <div class="flex-1">
                <h3 class="font-semibold text-gray-800 text-lg mb-1">${escapeHtml(item.name)}</h3>
                <p class="text-gray-600">Quantity: ${escapeHtml(item.quantity)}</p>
                <p class="text-gray-600">Unit Price: R${item.price.toFixed(2)}</p>
            </div>
            <div class="text-right">
                <p class="font-bold text-primary text-xl">R${(item.price * item.quantity).toFixed(2)}</p>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('[data-order-item-image="true"]').forEach((image) => {
        image.addEventListener('error', () => {
            image.src = getImageFallbackDataUri();
        }, { once: true });
    });

    document.getElementById('subtotalDisplay').textContent = `R${order.subtotal.toFixed(2)}`;
    document.getElementById('deliveryFeeDisplay').textContent = order.deliveryFee === 0 ? 'FREE' : `R${order.deliveryFee.toFixed(2)}`;
    document.getElementById('totalDisplay').textContent = `R${order.total.toFixed(2)}`;
}

async function loadOrder(orderId) {
    try {
        const response = await fetchOrderById(orderId);
        if (!response.success || !response.order) {
            showNotFound();
            return;
        }

        displayOrder(response.order);
    } catch {
        showNotFound();
    }
}

function bindSearchActions() {
    document.getElementById('searchOrderButton')?.addEventListener('click', () => {
        const orderId = document.getElementById('orderIdInput')?.value.trim();
        if (!orderId) {
            return;
        }

        window.location.href = `order-tracking.html?order=${encodeURIComponent(orderId)}`;
    });

    document.getElementById('tryAgainButton')?.addEventListener('click', () => {
        document.getElementById('searchForm')?.classList.remove('hidden');
        document.getElementById('notFoundState')?.classList.add('hidden');
    });
}

function bootstrapOrderTracking() {
    bindSearchActions();
    const orderId = new URLSearchParams(window.location.search).get('order');
    if (!orderId) {
        document.getElementById('loadingState')?.classList.add('hidden');
        document.getElementById('searchForm')?.classList.remove('hidden');
        return;
    }

    loadOrder(orderId);
}

onReady(() => {
    bootstrapOrderTracking();
});

export { bootstrapOrderTracking };