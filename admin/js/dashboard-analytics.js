/* ═══════════════════════════════════════════════════════════
   dashboard-analytics.js — Charts, Map, Greeting & Metrics
   Depends on: Chart.js, Leaflet, _sb (Supabase), app.js
   ═══════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    // ── Greeting ──────────────────────────────────────────
    function setGreeting() {
        const h = new Date().getHours();
        let g = 'Good evening';
        if (h < 12) g = 'Good morning';
        else if (h < 17) g = 'Good afternoon';
        const el = document.getElementById('dashGreeting');
        if (el) el.textContent = g + ', Admin';
        const dateEl = document.getElementById('dashDate');
        if (dateEl) dateEl.textContent = new Date().toLocaleDateString('en-ZA', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    }

    // ── Animated Counter ──────────────────────────────────
    function animateValue(el, end, duration) {
        if (!el) return;
        const start = parseInt(el.textContent) || 0;
        if (start === end) return;
        const range = end - start;
        const startTime = performance.now();
        function step(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(start + range * eased);
            if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    // ── Subscriber Growth Chart ───────────────────────────
    let subsChartInst = null;
    async function renderSubsChart() {
        const canvas = document.getElementById('subsChart');
        if (!canvas || typeof Chart === 'undefined') return;

        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const { data: subs } = await _sb
                .from('newsletter_subscribers')
                .select('subscribed_at')
                .gte('subscribed_at', thirtyDaysAgo.toISOString())
                .order('subscribed_at', { ascending: true });

            // Bucket into days
            const buckets = {};
            for (let i = 0; i < 30; i++) {
                const d = new Date();
                d.setDate(d.getDate() - 29 + i);
                buckets[d.toISOString().slice(0, 10)] = 0;
            }
            (subs || []).forEach(s => {
                const key = s.subscribed_at?.slice(0, 10);
                if (key && buckets.hasOwnProperty(key)) buckets[key]++;
            });

            const labels = Object.keys(buckets).map(d => {
                const dt = new Date(d + 'T00:00:00');
                return dt.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
            });
            const values = Object.values(buckets);

            // Cumulative
            let cumulative = [];
            let total = 0;
            values.forEach(v => { total += v; cumulative.push(total); });

            if (subsChartInst) subsChartInst.destroy();
            subsChartInst = new Chart(canvas, {
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: 'New Subs',
                        data: values,
                        borderColor: '#b30ce6',
                        backgroundColor: 'rgba(179,12,230,0.08)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 2,
                        pointHoverRadius: 5,
                        borderWidth: 2.5,
                    }, {
                        label: 'Cumulative',
                        data: cumulative,
                        borderColor: '#00f5d4',
                        backgroundColor: 'rgba(0,245,212,0.06)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        borderWidth: 2,
                        borderDash: [5, 3],
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: true, position: 'top', labels: { usePointStyle: true, padding: 16, font: { size: 11 } } } },
                    scales: {
                        x: { grid: { display: false }, ticks: { font: { size: 10 }, maxRotation: 45 } },
                        y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 10 } }, grid: { color: '#f1f5f9' } }
                    }
                }
            });
        } catch (err) { console.error('Subs chart error:', err); }
    }

    // ── Orders by Status Chart ────────────────────────────
    let ordersChartInst = null;
    async function renderOrdersChart() {
        const canvas = document.getElementById('ordersChart');
        if (!canvas || typeof Chart === 'undefined') return;

        try {
            const { data: orders } = await _sb
                .from('orders')
                .select('status');

            const counts = {};
            (orders || []).forEach(o => {
                const s = o.status || 'unknown';
                counts[s] = (counts[s] || 0) + 1;
            });

            const labels = Object.keys(counts);
            const values = Object.values(counts);
            const colors = labels.map(l => {
                const map = { pending: '#f59e0b', confirmed: '#3b82f6', shipped: '#8b5cf6', delivered: '#22c55e', cancelled: '#ef4444' };
                return map[l] || '#94a3b8';
            });

            if (ordersChartInst) ordersChartInst.destroy();
            ordersChartInst = new Chart(canvas, {
                type: 'doughnut',
                data: {
                    labels: labels.map(l => l.charAt(0).toUpperCase() + l.slice(1)),
                    datasets: [{
                        data: values,
                        backgroundColor: colors,
                        borderWidth: 2,
                        borderColor: '#fff',
                        hoverOffset: 6,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '60%',
                    plugins: {
                        legend: { position: 'bottom', labels: { usePointStyle: true, padding: 14, font: { size: 11 } } }
                    }
                }
            });

            // Animate orders count
            animateValue(document.getElementById('totalOrders'), (orders || []).length, 800);
        } catch (err) { console.error('Orders chart error:', err); }
    }

    // ── South Africa Subscriber Map (live geo only — no dummy data) ────
    let saMapInst = null;
    let mapMarkers = [];

    async function renderSAMap() {
        const container = document.getElementById('saMap');
        if (!container || typeof L === 'undefined') return;

        if (saMapInst) { saMapInst.remove(); saMapInst = null; }
        mapMarkers = [];

        saMapInst = L.map(container, {
            center: [-28.5, 25.5],
            zoom: 5,
            zoomControl: true,
            scrollWheelZoom: false,
            attributionControl: false,
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 18,
            subdomains: 'abcd',
        }).addTo(saMapInst);

        L.control.attribution({ prefix: false })
            .addAttribution('&copy; <a href="https://carto.com">CARTO</a>')
            .addTo(saMapInst);

        // Fetch ONLY subscribers with real geo coordinates — zero dummy fallback
        const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
        let subscribers = [];
        try {
            const { data, error } = await _sb
                .from('newsletter_subscribers')
                .select('email,city,latitude,longitude,subscribed_at,status')
                .eq('status', 'active')
                .not('latitude', 'is', null)
                .not('longitude', 'is', null);
            if (error) throw error;
            subscribers = data || [];
        } catch (e) { console.error('Map fetch error:', e); }

        // Plot real geo-located subscribers only
        subscribers.forEach(s => addMarkerToMap(s, sevenDaysAgo));

        // Legend
        const legend = L.control({ position: 'bottomleft' });
        legend.onAdd = function () {
            const div = L.DomUtil.create('div', 'map-legend');
            div.innerHTML = `
                <div style="background:rgba(15,23,42,0.85);padding:8px 12px;border-radius:8px;font-size:11px;color:#e2e8f0;line-height:1.8">
                    <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#00f5d4;margin-right:4px"></span> New (7 days)<br>
                    <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#b30ce6;margin-right:4px"></span> Regular subscriber
                </div>`;
            return div;
        };
        legend.addTo(saMapInst);

        setTimeout(() => saMapInst.invalidateSize(), 300);
    }

    // Add a single marker — reused for initial load AND real-time new arrivals
    function addMarkerToMap(subscriber, sevenDaysAgo) {
        if (!saMapInst || !subscriber.latitude || !subscriber.longitude) return null;
        if (!sevenDaysAgo) sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

        const isNew = subscriber.subscribed_at && subscriber.subscribed_at > sevenDaysAgo;
        const color = isNew ? '#00f5d4' : '#b30ce6';
        const pulseClass = isNew ? 'map-pulse-new' : 'map-pulse-regular';

        const icon = L.divIcon({
            className: 'map-marker-wrapper',
            html: `<div class="${pulseClass}"><div class="map-marker-dot" style="background:${color}"></div></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
        });

        const marker = L.marker([subscriber.latitude, subscriber.longitude], { icon })
            .addTo(saMapInst)
            .bindPopup(`<strong>${subscriber.city || 'Unknown location'}</strong><br>${isNew ? '🟢 New subscriber' : '🟣 Regular subscriber'}`);

        mapMarkers.push(marker);
        return marker;
    }

    // ── Gallery count ─────────────────────────────────────
    async function updateGalleryCount() {
        try {
            const { data } = await _sb.storage.from('gallery').list('', { limit: 500 });
            const count = (data || []).length;
            animateValue(document.getElementById('totalGallery'), count, 600);
        } catch (e) {
            const el = document.getElementById('totalGallery');
            if (el) el.textContent = '-';
        }
    }

    // ── Notification tone (Web Audio API two-note chime) ──
    function playNotifTone() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            [880, 1320].forEach((freq, i) => {
                const osc  = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'sine';
                osc.frequency.value = freq;
                const t = ctx.currentTime + i * 0.18;
                gain.gain.setValueAtTime(0, t);
                gain.gain.linearRampToValueAtTime(0.35, t + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
                osc.start(t);
                osc.stop(t + 0.5);
            });
        } catch (e) { /* AudioContext unavailable */ }
    }

    // ── Nav notification dot ──────────────────────────────
    let pendingNotifCount = 0;

    function showNavNotifDot(tabName) {
        const navItem = document.querySelector(`.nav-item[data-tab="${tabName}"]`);
        if (!navItem) return;
        let dot = navItem.querySelector('.nav-notif-dot');
        if (!dot) {
            dot = document.createElement('span');
            dot.className = 'nav-notif-dot';
            navItem.appendChild(dot);
        }
        pendingNotifCount++;
        dot.textContent = pendingNotifCount > 9 ? '9+' : String(pendingNotifCount);
        dot.style.display = 'flex';
    }

    function clearNavNotifDot(tabName) {
        const navItem = document.querySelector(`.nav-item[data-tab="${tabName}"]`);
        if (!navItem) return;
        const dot = navItem.querySelector('.nav-notif-dot');
        if (dot) dot.style.display = 'none';
        pendingNotifCount = 0;
    }

    // ── Real-time subscriber listener (Supabase Realtime) ─
    // NOTE: Requires "newsletter_subscribers" added to the
    // supabase_realtime publication in Supabase → Database → Replication
    let rtChannel = null;

    function startRealtimeSubscribers() {
        if (rtChannel) { try { _sb.removeChannel(rtChannel); } catch (e) {} rtChannel = null; }
        rtChannel = _sb
            .channel('rt_newsletter_subscribers')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'newsletter_subscribers',
            }, (payload) => {
                const newSub = payload.new;

                // 1. Increment subscriber stat card
                const counterEl = document.getElementById('totalSubscribers');
                if (counterEl) animateValue(counterEl, (parseInt(counterEl.textContent) || 0) + 1, 400);

                // 2. Increment newsletter section counters if tab is open
                const nlTotalEl  = document.getElementById('nlTotal');
                const nlActiveEl = document.getElementById('nlActive');
                if (nlTotalEl)  animateValue(nlTotalEl,  (parseInt(nlTotalEl.textContent)  || 0) + 1, 400);
                if (nlActiveEl && newSub.status === 'active')
                    animateValue(nlActiveEl, (parseInt(nlActiveEl.textContent) || 0) + 1, 400);

                // 3. Drop live marker if geo is available
                if (newSub.latitude && newSub.longitude) {
                    addMarkerToMap(newSub);
                }

                // 4. Play notification chime
                playNotifTone();

                // 5. Notification dot on Newsletter nav item
                showNavNotifDot('newsletter');
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('[RT] Live subscriber listener active');
                }
            });
    }

    // ── Init on Dashboard Load ────────────────────────────
    async function initDashboardAnalytics() {
        setGreeting();

        // Fetch live subscriber count
        try {
            const { count } = await _sb
                .from('newsletter_subscribers')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'active');
            animateValue(document.getElementById('totalSubscribers'), count || 0, 800);
        } catch (e) { console.error('Subscriber count error:', e); }

        renderSAMap();
        renderSubsChart();
        renderOrdersChart();
        updateGalleryCount();
        startRealtimeSubscribers();   // ← live real-time listener
    }

    // Run after DOMContentLoaded (app.js initialises first)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(initDashboardAnalytics, 200));
    } else {
        setTimeout(initDashboardAnalytics, 200);
    }

    // Map invalidate on tab switch; clear notif dot on newsletter open
    const origSwitchTab = window.switchTab;
    window.switchTab = function (tabName) {
        origSwitchTab(tabName);
        if (tabName === 'dashboard' && saMapInst) {
            setTimeout(() => saMapInst.invalidateSize(), 100);
        }
        if (tabName === 'newsletter') {
            clearNavNotifDot('newsletter');
        }
    };
})();
