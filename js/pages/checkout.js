import { placeOrder, syncOrderToSupabase } from '../api.js';
import { onReady } from '../site-shell.js';

function formatCurrency(amount) {
    return `R${Number(amount).toFixed(2)}`;
}

function getImageFallbackDataUri() {
    return 'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27200%27 height=%27200%27 viewBox=%270 0 200 200%27%3E%3Crect width=%27200%27 height=%27200%27 fill=%27%23f3f4f6%27/%3E%3Cpath d=%27M65 70h70a10 10 0 0110 10v60a10 10 0 01-10 10H65a10 10 0 01-10-10V80a10 10 0 0110-10z%27 fill=%27none%27 stroke=%27%23d1d5db%27 stroke-width=%273%27/%3E%3Ccircle cx=%27100%27 cy=%27105%27 r=%2718%27 fill=%27none%27 stroke=%27%23d1d5db%27 stroke-width=%273%27/%3E%3C/svg%3E';
}

function calculateDeliveryFee(province, subtotal) {
    if (subtotal >= 500) {
        return 0;
    }

    const deliveryFees = {
        Gauteng: 50,
        'Western Cape': 100,
        'KwaZulu-Natal': 100,
        'Eastern Cape': 120,
        'Free State': 100,
        Limpopo: 120,
        Mpumalanga: 100,
        'North West': 100,
        'Northern Cape': 150
    };

    return deliveryFees[province] || 100;
}

function getCart() {
    const parsedCart = JSON.parse(localStorage.getItem('omegatek_cart') || '[]');
    return parsedCart.map((item) => ({
        ...item,
        quantity: item.quantity ?? item.qty ?? 1
    }));
}

function renderCheckoutCart(cart) {
    const container = document.getElementById('checkoutCartItems');
    const subtotalAmount = document.getElementById('subtotalAmount');
    if (!container || !subtotalAmount) {
        return;
    }

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    container.innerHTML = cart.map((item) => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}" data-fallback-image="true">
            <div class="flex-1">
                <h3 class="font-semibold text-gray-800 mb-1">${item.name}</h3>
                <p class="text-gray-600">Qty: ${item.quantity}</p>
                <p class="text-primary font-bold mt-1">${formatCurrency(item.price * item.quantity)}</p>
            </div>
        </div>
    `).join('');

    container.querySelectorAll('[data-fallback-image="true"]').forEach((image) => {
        image.addEventListener('error', () => {
            image.src = getImageFallbackDataUri();
        }, { once: true });
    });

    subtotalAmount.textContent = formatCurrency(subtotal);
}

function updateTotal(cart) {
    const province = document.querySelector('select[name="province"]')?.value || '';
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = province ? calculateDeliveryFee(province, subtotal) : 0;
    const total = subtotal + deliveryFee;
    document.getElementById('deliveryFee').textContent = deliveryFee === 0 ? 'FREE' : formatCurrency(deliveryFee);
    document.getElementById('totalAmount').textContent = formatCurrency(total);
}

function prefillCheckoutUser() {
    const checkoutUser = JSON.parse(sessionStorage.getItem('checkoutUser') || 'null');
    if (!checkoutUser) {
        return;
    }

    const form = document.getElementById('checkoutForm');
    if (!(form instanceof HTMLFormElement)) {
        return;
    }

    form.elements.fullName.value = checkoutUser.name || '';
    form.elements.email.value = checkoutUser.email || '';
    form.elements.phone.value = checkoutUser.phone || '';
}

function bindPaymentOptions() {
    document.querySelectorAll('.payment-method').forEach((method) => {
        method.addEventListener('click', () => {
            document.querySelectorAll('.payment-method').forEach((entry) => entry.classList.remove('selected'));
            method.classList.add('selected');
            method.querySelector('input[type="radio"]')?.setAttribute('checked', 'checked');
            const radio = method.querySelector('input[type="radio"]');
            if (radio) {
                radio.checked = true;
            }
        });
    });
}

function buildOrderPayload(cart, formElement) {
    const formData = new FormData(formElement);
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = calculateDeliveryFee(formData.get('province'), subtotal);

    return {
        customer: {
            fullName: formData.get('fullName'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            altPhone: formData.get('altPhone')
        },
        address: {
            street: formData.get('address'),
            suburb: formData.get('suburb'),
            city: formData.get('city'),
            province: formData.get('province'),
            postalCode: formData.get('postalCode')
        },
        paymentMethod: formData.get('paymentMethod'),
        notes: formData.get('notes'),
        items: cart,
        subtotal,
        deliveryFee,
        total: subtotal + deliveryFee
    };
}

async function bootstrapCheckoutPage() {
    const cart = getCart();
    if (!cart.length) {
        window.location.href = 'products.html';
        return;
    }

    renderCheckoutCart(cart);
    updateTotal(cart);
    prefillCheckoutUser();
    bindPaymentOptions();

    document.querySelector('select[name="province"]')?.addEventListener('change', () => updateTotal(cart));

    document.getElementById('checkoutForm')?.addEventListener('submit', async (event) => {
        event.preventDefault();

        const button = document.getElementById('placeOrderBtn');
        const form = event.currentTarget;
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Processing...';

        const orderData = buildOrderPayload(cart, form);

        try {
            const response = await placeOrder(orderData);
            if (!response.success) {
                throw new Error(response.message || 'Error placing order.');
            }

            await syncOrderToSupabase(orderData, response.orderId);
            localStorage.removeItem('omegatek_cart');
            sessionStorage.removeItem('pendingCart');

            if (response.payfast) {
                window.location.href = response.redirectUrl;
                return;
            }

            window.location.href = `order-confirmation.html?order=${encodeURIComponent(response.orderId)}`;
        } catch (error) {
            window.alert(error.message || 'Server error. Please try again or contact support.');
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-lock mr-2"></i> Place Order Securely';
        }
    });
}

onReady(() => {
    bootstrapCheckoutPage();
});

export { bootstrapCheckoutPage };