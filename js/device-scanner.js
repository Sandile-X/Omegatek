/* device-scanner.js — Interactive Device Health Scanner
   Reads real browser/device APIs and presents a fun "diagnostic"
   that naturally leads to a repair booking CTA.
*/

(function () {
    const SCAN_DELAY_MS  = 420;   /* delay between each result appearing */
    const BEAM_DURATION  = 2200;  /* ms the beam scans before first result */

    /* ── Helpers ──────────────────────────────────────────── */
    function qs(sel) { return document.querySelector(sel); }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function createResultItem(icon, label, value, status) {
        const div = document.createElement('div');
        div.className = 'scan-result-item ' + status;
        div.innerHTML =
            '<span class="scan-result-icon"><i class="fas fa-' + icon + '"></i></span>' +
            '<span class="scan-result-text">' +
                '<div class="scan-result-label">' + label + '</div>' +
                '<div class="scan-result-value">' + value + '</div>' +
            '</span>';
        return div;
    }

    /* ── Gather device data ───────────────────────────────── */
    async function collectData() {
        const data = {};

        /* Screen */
        data.screen = {
            w: screen.width,
            h: screen.height,
            dpr: window.devicePixelRatio || 1,
            colorDepth: screen.colorDepth
        };

        /* Connection */
        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        data.network = conn ? {
            type: conn.effectiveType || conn.type || 'unknown',
            downlink: conn.downlink,
            saveData: conn.saveData
        } : null;

        /* Memory */
        data.memory = navigator.deviceMemory || null;

        /* CPU cores */
        data.cores = navigator.hardwareConcurrency || null;

        /* Platform */
        data.platform = navigator.platform || 'Unknown';
        data.ua = navigator.userAgent;
        data.touch = navigator.maxTouchPoints > 0;

        /* Battery */
        try {
            if (navigator.getBattery) {
                const batt = await navigator.getBattery();
                data.battery = {
                    level: Math.round(batt.level * 100),
                    charging: batt.charging,
                    dischargingTime: batt.dischargingTime
                };
            }
        } catch (_) { data.battery = null; }

        return data;
    }

    /* ── Build result list from data ──────────────────────── */
    function buildResults(data) {
        const results = [];

        /* Battery */
        if (data.battery !== null) {
            const lvl = data.battery.level;
            let status, value;
            if (data.battery.charging) {
                status = 'good';
                value  = lvl + '% — Currently charging';
            } else if (lvl >= 80) {
                status = 'good';
                value  = lvl + '% — Battery health looks great';
            } else if (lvl >= 40) {
                status = 'warn';
                value  = lvl + '% — Consider a charge soon';
            } else {
                status = 'bad';
                value  = lvl + '% — Battery critically low. Replacement may be needed';
            }
            results.push({ icon: 'battery-half', label: 'Battery Level', value, status });
        } else {
            results.push({ icon: 'battery-half', label: 'Battery', value: 'API not available in your browser', status: 'info' });
        }

        /* Screen resolution */
        const px = data.screen.w * data.screen.h;
        let screenStatus = 'good';
        let screenVal = data.screen.w + ' × ' + data.screen.h + ' @ ' + data.screen.dpr + 'x';
        if (data.screen.colorDepth < 24) {
            screenStatus = 'warn';
            screenVal += ' — Low colour depth detected';
        } else {
            screenVal += ' — Display looks healthy';
        }
        results.push({ icon: 'desktop', label: 'Screen', value: screenVal, status: screenStatus });

        /* RAM */
        if (data.memory) {
            let memStatus, memVal;
            if (data.memory >= 8) {
                memStatus = 'good';
                memVal    = data.memory + 'GB RAM — Excellent performance';
            } else if (data.memory >= 4) {
                memStatus = 'good';
                memVal    = data.memory + 'GB RAM — Adequate for daily use';
            } else {
                memStatus = 'warn';
                memVal    = data.memory + 'GB RAM — Consider a RAM upgrade';
            }
            results.push({ icon: 'microchip', label: 'Memory (RAM)', value: memVal, status: memStatus });
        }

        /* CPU cores */
        if (data.cores) {
            const coreStatus = data.cores >= 4 ? 'good' : 'warn';
            const coreVal    = data.cores + ' logical cores — ' + (data.cores >= 4 ? 'Good processing power' : 'May struggle with heavy tasks');
            results.push({ icon: 'server', label: 'Processor', value: coreVal, status: coreStatus });
        }

        /* Network */
        if (data.network) {
            let netStatus = 'good';
            let netVal = data.network.type.toUpperCase();
            if (data.network.downlink) netVal += ' · ' + data.network.downlink + ' Mbps';
            if (data.network.saveData) {
                netStatus = 'warn';
                netVal += ' (Data Saver ON)';
            }
            if (data.network.type === 'slow-2g' || data.network.type === '2g') {
                netStatus = 'bad';
                netVal += ' — Very slow connection detected';
            }
            results.push({ icon: 'wifi', label: 'Network', value: netVal, status: netStatus });
        }

        /* Touch / mobile */
        results.push({
            icon: data.touch ? 'mobile-alt' : 'laptop',
            label: 'Device Type',
            value: data.touch ? 'Touch-enabled device' : 'Desktop / non-touch device',
            status: 'info'
        });

        return results;
    }

    /* ── Determine if CTA should show ────────────────────── */
    function shouldShowCta(results) {
        return results.some(r => r.status === 'bad' || r.status === 'warn');
    }

    /* ── Main scan flow ───────────────────────────────────── */
    async function runScan() {
        const btn      = qs('#start-scan-btn');
        const beam     = qs('#scanner-beam');
        const statusEl = qs('#scanner-status');
        const resultsEl = qs('#scanner-results');
        const ctaEl    = qs('#scanner-cta');

        if (!btn || !resultsEl) return;

        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Scanning…';
        resultsEl.innerHTML = '';
        if (ctaEl) ctaEl.style.display = 'none';

        if (beam)    beam.classList.add('scanning');
        if (statusEl) statusEl.textContent = 'Reading device specs…';

        await sleep(BEAM_DURATION);

        const data    = await collectData();
        const results = buildResults(data);

        if (beam)    beam.classList.remove('scanning');
        if (statusEl) statusEl.textContent = 'Scan complete — ' + results.length + ' items checked';

        for (let i = 0; i < results.length; i++) {
            await sleep(SCAN_DELAY_MS);
            const r = results[i];
            const item = createResultItem(r.icon, r.label, r.value, r.status);
            item.style.animationDelay = '0ms';
            resultsEl.appendChild(item);
        }

        /* Show CTA after all results */
        await sleep(500);
        if (ctaEl) {
            ctaEl.style.display = 'block';
            const ctaText = shouldShowCta(results)
                ? 'We spotted some potential issues — bring it in!'
                : 'Your device looks healthy! But we\'re here when you need us.';
            const ctaTextEl = ctaEl.querySelector('.scanner-cta-text');
            if (ctaTextEl) ctaTextEl.textContent = ctaText;
        }

        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-redo"></i> Scan Again';
    }

    /* ── Wire up buttons ──────────────────────────────────── */
    document.addEventListener('DOMContentLoaded', function () {
        const btn = qs('#start-scan-btn');
        if (btn) btn.addEventListener('click', runScan);

        const bookBtn = qs('#scanner-book-btn');
        if (bookBtn) {
            bookBtn.addEventListener('click', function () {
                const modal = document.getElementById('bookingModal');
                if (modal) {
                    modal.style.display = 'block';
                    document.body.style.overflow = 'hidden';
                }
            });
        }
    });
})();
