/* ═══════════════════════════════════════════════════════════
   newsletter.js — Newsletter CRUD, editor & send
   ═══════════════════════════════════════════════════════════ */

function nlFmt(cmd) {
    const ed = document.getElementById('nlEditor');
    if (!ed) return;
    ed.focus();
    if (cmd === 'h2') {
        document.execCommand('formatBlock', false, 'h2');
    } else if (cmd === 'h3') {
        document.execCommand('formatBlock', false, 'h3');
    } else if (cmd === 'ul') {
        document.execCommand('insertUnorderedList', false, null);
    } else if (cmd === 'link') {
        const url = prompt('Enter URL:', 'https://');
        if (url) document.execCommand('createLink', false, url);
    } else if (cmd === 'cta') {
        const text = prompt('CTA button text:', 'Book a Repair Now!');
        const url  = prompt('CTA link URL:', 'https://omegateksolutions.co.za/services');
        if (text && url) {
            const btn = `<a href="${url}" style="display:inline-block;background:#b30ce6;color:#fff;padding:12px 28px;border-radius:6px;font-weight:700;font-size:15px;text-decoration:none;margin:12px 0;">${text}</a><br>`;
            document.execCommand('insertHTML', false, btn);
        }
    } else if (cmd === 'divider') {
        document.execCommand('insertHTML', false, '<hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;"><br>');
    } else {
        document.execCommand(cmd, false, null);
    }
    syncNlContent();
}

function syncNlContent() {
    const ed = document.getElementById('nlEditor');
    const ta = document.getElementById('nlContent');
    if (ed && ta) ta.value = ed.innerHTML;
}

function handleNlPaste(event) {
    event.preventDefault();
    const html = event.clipboardData.getData('text/html');
    const text = event.clipboardData.getData('text/plain');
    if (html) {
        document.execCommand('insertHTML', false, html);
    } else if (text) {
        document.execCommand('insertText', false, text);
    }
    syncNlContent();
}

function nlClear() {
    if (!confirm('Clear all newsletter content?')) return;
    const ed = document.getElementById('nlEditor');
    if (ed) { ed.innerHTML = ''; syncNlContent(); }
}

function fillNewsletterFromAI() {
    if (!_lastAINewsletter) { alert('No AI newsletter draft found. Click "Write Newsletter" in the AI Command Centre first.'); return; }
    const subjectEl = document.getElementById('nlSubject');
    const nlEditor  = document.getElementById('nlEditor');
    const nlContent = document.getElementById('nlContent');
    if (!subjectEl || !nlEditor) { alert('Newsletter composer not found. Please refresh and try again.'); return; }
    subjectEl.value    = _lastAINewsletter.subject || '';
    const body         = _lastAINewsletter.body || _lastAINewsletter.content || '';
    nlEditor.innerHTML = body;
    if (nlContent) nlContent.value = body;
    document.getElementById('composeModal').classList.add('active');
}

async function loadNewsletterData() {
    try {
        const res = await fetch('./newsletter-api.php?action=get_subscribers_count');
        if (res.ok) {
            const data = await res.json();
            document.getElementById('totalSubscribers').textContent = data.count || 0;
        }
    } catch (error) { console.log('Newsletter count unavailable.'); }
}

async function loadNewsletterSection() {
    try {
        const [{ data: subs, error: e1 }, { data: nls, error: e2 }] = await Promise.all([
            _sb.from('newsletter_subscribers')
                .select('id,email,name,status,subscribed_at,city,latitude,longitude')
                .order('subscribed_at', { ascending: false }),
            _sb.from('newsletters')
                .select('id,subject,status,sent_at,sent_count,created_at')
                .order('created_at', { ascending: false })
                .limit(50)
        ]);
        if (e1) throw e1;
        if (e2) throw e2;

        const subscribers = subs || [];
        const newsletters  = nls  || [];
        const active       = subscribers.filter(s => s.status === 'active');

        document.getElementById('nlTotal').textContent  = subscribers.length;
        document.getElementById('nlActive').textContent = active.length;
        const tsEl = document.getElementById('totalSubscribers');
        if (tsEl) tsEl.textContent = active.length;

        document.getElementById('subscribersList').innerHTML = subscribers.length === 0
            ? '<p class="text-gray-500 text-sm">No subscribers yet.</p>'
            : subscribers.map(s => `
                <div class="flex items-center justify-between p-2 bg-gray-50 rounded text-sm hover:bg-gray-100 transition-colors group">
                    <div class="min-w-0 mr-2">
                        <span class="font-medium">${escHtml(s.name || '\u2014')}</span>
                        <span class="text-gray-500 ml-2 text-xs">${escHtml(s.email)}</span>
                    </div>
                    <div class="flex items-center gap-2 flex-shrink-0">
                        <span class="text-xs font-bold ${s.status === 'active' ? 'text-green-600' : 'text-gray-400'}">${s.status}</span>
                        <button onclick="deleteSubscriber('${escHtml(s.id)}', this)" class="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity text-xs px-1 py-0.5 rounded" title="Remove subscriber">\u2715</button>
                    </div>
                </div>`).join('');

        const nlSentEl = document.getElementById('nlSent');
        if (nlSentEl) nlSentEl.textContent = newsletters.filter(n => n.status === 'sent').length;

        document.getElementById('newsletterHistory').innerHTML = newsletters.length === 0
            ? '<p class="text-gray-500 text-sm">No newsletters yet.</p>'
            : newsletters.map(n => `
                <div class="p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors group">
                    <div class="flex justify-between items-start gap-2">
                        <span class="font-medium text-sm flex-1 min-w-0 truncate" title="${escHtml(n.subject)}">${escHtml(n.subject)}</span>
                        <div class="flex items-center gap-2 flex-shrink-0">
                            <span class="badge ${n.status === 'sent' ? 'badge-success' : 'badge-warning'}">${n.status}</span>
                            <button onclick="deleteNewsletterById('${escHtml(n.id)}')" class="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity text-xs" title="Delete">\u2715</button>
                        </div>
                    </div>
                    <div class="text-xs text-gray-500 mt-1">
                        ${new Date(n.created_at).toLocaleDateString('en-ZA')}
                        ${n.status === 'sent' ? `&bull; Sent to ${n.sent_count} subscriber${n.sent_count !== 1 ? 's' : ''}` : ''}
                    </div>
                </div>`).join('');
    } catch (err) { console.error('Newsletter section error:', err); }
}

async function deleteSubscriber(id, btn) {
    if (!confirm('Remove this subscriber permanently?')) return;
    btn.disabled = true;
    const prev = btn.textContent;
    btn.textContent = '\u2026';
    const { error } = await _sb.from('newsletter_subscribers').delete().eq('id', id);
    if (error) {
        btn.disabled = false;
        btn.textContent = prev;
        alert('Error: ' + error.message);
        return;
    }
    loadNewsletterSection();
}

async function deleteNewsletterById(id) {
    if (!confirm('Delete this newsletter permanently?')) return;
    const { error } = await _sb.from('newsletters').delete().eq('id', id);
    if (error) { alert('Error: ' + error.message); return; }
    loadNewsletterSection();
}

function showComposeModal() {
    document.getElementById('composeModal').classList.add('active');
}

async function handleSendNewsletter(e) {
    e.preventDefault();
    const subject = document.getElementById('nlSubject').value.trim();
    const content = (document.getElementById('nlContent')?.value || document.getElementById('nlEditor')?.innerHTML || '').trim();
    if (!subject) { alert('Please enter a subject line.'); return; }
    if (!content || content === '<br>') { alert('Please add some content before sending.'); return; }
    const btn = document.getElementById('nlSendBtn');
    if (!confirm(`Send "${subject}" to all active subscribers?`)) return;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Sending...';
    try {
        const { data: nlRow, error: nlErr } = await _sb
            .from('newsletters')
            .insert([{ title: subject, subject, content, status: 'draft' }])
            .select()
            .single();
        if (nlErr) throw new Error(nlErr.message);

        const token   = await getAccessToken();
        const sendRes = await fetch('./newsletter-api.php?action=send_newsletter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ id: nlRow.id })
        });
        const sendData = await sendRes.json();
        if (!sendData.success) throw new Error(sendData.message);
        alert(sendData.message);
        closeModal('composeModal');
        document.getElementById('nlSubject').value = '';
        const nlEd = document.getElementById('nlEditor');
        if (nlEd) { nlEd.innerHTML = ''; syncNlContent(); }
        loadNewsletterSection();
    } catch (err) { alert('Error: ' + err.message); }
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i>Send to All Subscribers';
}

function previewNewsletter() {
    const content = (document.getElementById('nlContent')?.value || document.getElementById('nlEditor')?.innerHTML || '').trim();
    if (!content) { alert('Enter content first.'); return; }
    const win = window.open('', '_blank');
    win.document.write(content.replace(/{{name}}/g, 'Preview User').replace(/{{email}}/g, 'preview@example.com'));
    win.document.close();
}
