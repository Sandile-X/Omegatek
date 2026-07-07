/* ═══════════════════════════════════════════════════════════
   orders.js — Orders loading
   ═══════════════════════════════════════════════════════════ */

async function loadOrders() {
    try {
        const { data: orders, error } = await _sb
            .from('orders')
            .select('id, order_number, status, total_amount, created_at')
            .order('created_at', { ascending: false })
            .limit(50);

        if (!error && orders) {
            document.getElementById('totalOrders').textContent = orders.length;
            if (orders.length > 0) {
                document.getElementById('recentOrders').innerHTML = orders.slice(0, 3).map(o => `
                    <div class="p-3 bg-gray-50 rounded flex justify-between items-center">
                        <span class="font-medium">#${escHtml(o.order_number || o.id.slice(0,8))}</span>
                        <span class="badge badge-success">${escHtml(o.status || 'received')}</span>
                    </div>
                `).join('');
            }
            return;
        }
    } catch (_) {}
    // Fallback: local JSON store
    try {
        const res = await fetch('./order_data/orders.json');
        if (res.ok) {
            const orders = await res.json();
            document.getElementById('totalOrders').textContent = (Array.isArray(orders) ? orders : []).length;
        }
    } catch (err) { console.warn('Orders unavailable:', err); }
}
