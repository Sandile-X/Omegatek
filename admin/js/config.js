/* ═══════════════════════════════════════════════════════════
   config.js — Supabase init, constants & shared helpers
   ═══════════════════════════════════════════════════════════ */

const SUPABASE_URL      = 'https://pefjkiijqratjixskmdx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlZmpraWlqcXJhdGppeHNrbWR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0MzkwNDQsImV4cCI6MjA4ODAxNTA0NH0.x6s38k7avvoszJATabbUcp2zv9kjUVYRjKPT7n-pQJA';
const { createClient } = window.supabase;
const _sb              = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false,
            storageKey: 'sb-admin-auth-token' }
});

async function getAccessToken() {
    const { data: { session } } = await _sb.auth.getSession();
    return session?.access_token || null;
}

function escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function inlineMd(s) {
    return s
        .replace(/\*\*([^*\n<]+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*\n<]+?)\*/g,     '<em>$1</em>')
        .replace(/_([^_\n<]+?)_/g,        '<em>$1</em>')
        .replace(/`([^`\n]+?)`/g,         '<code style="background:#f1f5f9;padding:2px 4px;border-radius:3px;font-size:.9em">$1</code>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
}

function mdToHtml(raw) {
    if (!raw) return '';
    const s = raw.trim();
    if (/^<[a-zA-Z]/.test(s) || (s.match(/<\/(p|h[2-6]|ul|ol|li|div)>/gi) || []).length > 1) {
        return s
            .replace(/(?<![<"'])\*\*([^*<\n]+?)\*\*/g, '<strong>$1</strong>')
            .replace(/(?<![<"'])\*([^*<\n]+?)\*/g,    '<em>$1</em>');
    }
    const lines = s.split('\n');
    let html = '',  inList = false;
    for (const line of lines) {
        const t = line.trim();
        if (!t) {
            if (inList) { html += '</ul>'; inList = false; }
            html += '<p><br></p>';
        } else if (t.startsWith('### ')) {
            if (inList) { html += '</ul>'; inList = false; }
            html += `<h3>${inlineMd(escHtml(t.slice(4)))}</h3>`;
        } else if (t.startsWith('## ')) {
            if (inList) { html += '</ul>'; inList = false; }
            html += `<h2>${inlineMd(escHtml(t.slice(3)))}</h2>`;
        } else if (t.startsWith('# ')) {
            if (inList) { html += '</ul>'; inList = false; }
            html += `<h2>${inlineMd(escHtml(t.slice(2)))}</h2>`;
        } else if (/^[-*] /.test(t)) {
            if (!inList) { html += '<ul>'; inList = true; }
            html += `<li>${inlineMd(escHtml(t.slice(2)))}</li>`;
        } else {
            if (inList) { html += '</ul>'; inList = false; }
            html += `<p>${inlineMd(escHtml(t))}</p>`;
        }
    }
    if (inList) html += '</ul>';
    return html || `<p>${inlineMd(escHtml(s))}</p>`;
}

function formatAIText(raw) {
    if (!raw) return '';
    let s = escHtml(raw);
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/_([^_\n]+?)_/g, '<em class="text-gray-500">$1</em>');
    s = s.replace(/^#{1,3}\s+(.+)$/gm, '<p class="font-semibold text-purple-800 mt-2 mb-0.5">$1</p>');
    s = s.replace(/^[\-\u2022]\s+(.+)$/gm, '<li class="ml-4 list-disc list-outside">$1</li>');
    s = s.replace(/(<li[\s\S]*?<\/li>)+/g, function(m) { return '<ul class="space-y-0.5 my-1">' + m + '</ul>'; });
    s = s.replace(/\n/g, '<br>');
    return s;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function autoResizeTextarea(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 128) + 'px';
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}
