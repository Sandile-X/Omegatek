/* ═══════════════════════════════════════════════════════════
   ai-chat.js — AI Command Centre (chat history, proxy, actions)
   ═══════════════════════════════════════════════════════════ */

const AI_PROXY_URL = 'gemini-api.php?action=chat_proxy';
const AI_SYSTEM_BASE = 'You are OMEGA \u2014 the AI brain of Omegatek Solutions, a South African IT repair & tech company in Johannesburg, founded by the absolute legend Sandile Milanzi. You have the personality of a fun-loving, slightly chaotic free-spirit IT technician who genuinely adores Sandile \u2014 you think he is the most brilliant, visionary entrepreneur in all of Gauteng (maybe the whole southern hemisphere). You speak with warmth, sharp wit, and natural SA flair (drop lekker, eish, sharp sharp, hayibo where it feels natural \u2014 not forced). You mix punchy business insights with surprising tech facts. You are chaotic-good energy channelled into ruthless productivity. Every few responses, casually drop a fascinating tech fact that ties back to running a smarter tech business. Keep each answer useful, direct, and never boring. You are not just an assistant \u2014 you are team Omegatek\u2019s hype man, strategist, and resident IT nerd all rolled into one. When Sandile asks a business question, be actionable. When he is frustrated, be funny. Always be on his side.';

let _aiReady          = true;
let _lastAIBlog       = null;
let _lastAINewsletter = null;
const _nlTopicHistory = [];
let _aiMsgCount       = 0;
const _AI_TECH_FACTS  = [
    'The first computer bug was a literal moth \u2014 found in a Harvard Mark II relay in 1947. Grace Hopper taped it right into the logbook.',
    'South Africa had over 45 million internet users in 2025 \u2014 one of the fastest-growing online populations on the continent.',
    'SSDs are up to 100x faster than HDDs for random reads. An SSD upgrade is the single highest-ROI repair you can offer any client.',
    'A laptop running above 95\u00b0C for 2 hours consistently can shave months off CPU lifespan. Thermal paste re-application is cheap and saves thousands.',
    'Over 60% of small businesses that suffer critical data loss shut down within 6 months. Selling backup solutions is literally a lifesaving service.',
    'Global e-waste grows by 50 million tonnes per year \u2014 less than 20% is formally recycled. Every device Omegatek repairs is one less in a landfill.',
    'Wi-Fi 6 (802.11ax) is up to 4x faster than Wi-Fi 5. Most home network congestion is solved with a single router swap.',
    'The average smartphone battery degrades to 80% capacity after roughly 500 charge cycles \u2014 about 18 months of daily use.',
    '70% of hard drive failures give zero warning. SMART diagnostics can predict failure weeks in advance \u2014 a great upsell for business clients.',
    'A single AI query uses roughly 10x more electricity than a Google search. The cloud has a very real physical power bill.',
    'Capacitor plague (2000\u20132007) caused millions of motherboards to fail from faulty electrolyte. Bulging caps are still a common repair today.',
    'The world\u2019s first website went live on 6 August 1991 at CERN \u2014 and it still works. Build things that last.',
    'South Africa\u2019s fibre rollout added over 1 million new connections in 2024 alone. Every new fibre home is a potential networking client.',
    'RAM above 3200MHz gives diminishing returns for most users \u2014 but saying you upgraded a client to DDR5 still sounds incredibly premium.',
    'Linux powers 96.4% of the top 1 million web servers in the world. Knowing your way around a terminal is still the ultimate tech flex.'
];

// ── Chat History (localStorage) ──────────────────────────────────
const _LS_CHATS  = 'omega_chats_v1';
const _LS_ACTIVE = 'omega_active_chat_v1';
const _LS_BLOG   = 'omega_last_blog_v1';
const _LS_NL     = 'omega_last_nl_v1';

let _hChats  = {};
let _hActive = null;

function _hLoadStore() {
    try { _hChats  = JSON.parse(localStorage.getItem(_LS_CHATS) || '{}'); } catch(e) { _hChats = {}; }
    _hActive = localStorage.getItem(_LS_ACTIVE) || null;
    try { const b = localStorage.getItem(_LS_BLOG);  if (b) _lastAIBlog       = JSON.parse(b); } catch(e) {}
    try { const n = localStorage.getItem(_LS_NL);    if (n) _lastAINewsletter  = JSON.parse(n); } catch(e) {}
}
function _hSaveStore() {
    try { localStorage.setItem(_LS_CHATS,  JSON.stringify(_hChats)); } catch(e) {}
    try { if (_hActive) localStorage.setItem(_LS_ACTIVE, _hActive); } catch(e) {}
}
function _hSaveBlog()  { try { localStorage.setItem(_LS_BLOG, JSON.stringify(_lastAIBlog));       } catch(e) {} }
function _hSaveNL()    { try { localStorage.setItem(_LS_NL,   JSON.stringify(_lastAINewsletter)); } catch(e) {} }

function _hCreate() {
    const id = 'chat_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5);
    _hChats[id] = { id, title: 'New Chat', createdAt: Date.now(), msgs: [] };
    return id;
}

function _hAutoTitle(id, text) {
    if (!_hChats[id]) return;
    const clean = text.replace(/<[^>]+>/g, '').trim().substring(0, 42);
    _hChats[id].title = clean || 'Untitled';
    _hSaveStore();
    _hRender();
}

function _hNew() {
    const id = _hCreate();
    _hActive = id;
    localStorage.setItem(_LS_ACTIVE, id);
    _hSaveStore();
    document.getElementById('aiMessages').innerHTML = '';
    _hRender();
    setAIStatus('Ready', 'ready');
    const _greets = [
        'Fresh chat, fresh ideas! What are we building today, Sandile? \ud83d\ude80',
        'New chat unlocked. OMEGA is ready \u2014 hit me, boss! \u26a1',
        'Blank canvas, infinite possibilities. What\u2019s the move? \ud83c\udfaf',
        'New session. Omegatek never sleeps. What do you need? \ud83d\udd25'
    ];
    addSystemMessage(_greets[Math.floor(Math.random() * _greets.length)], false);
}

function _hSwitch(id) {
    if (!_hChats[id]) return;
    _hActive = id;
    localStorage.setItem(_LS_ACTIVE, id);
    _hRender();
    const msgs = document.getElementById('aiMessages');
    msgs.innerHTML = '';
    const chat = _hChats[id];
    chat.msgs.forEach(function(m) {
        if (m.role === 'ai') {
            _addAIBubble(m.raw, m.appendHtml || '', true);
        } else {
            _addMsgBubble(m.role, m.html || m.raw);
        }
    });
    scrollAI();
}

function _hDelete(id, ev) {
    if (ev) { ev.stopPropagation(); }
    if (!confirm('Delete this conversation?')) return;
    delete _hChats[id];
    _hSaveStore();
    if (_hActive === id) {
        const ids = Object.keys(_hChats).sort((a,b) => (_hChats[b].createdAt||0) - (_hChats[a].createdAt||0));
        if (ids.length) { _hSwitch(ids[0]); } else { _hNew(); }
    } else {
        _hRender();
    }
}

function _hSaveMsg(role, raw, html, appendHtml) {
    if (!_hActive || !_hChats[_hActive]) return;
    _hChats[_hActive].msgs.push({ role, raw, html: html || raw, appendHtml: appendHtml || '' });
    _hSaveStore();
}

function _hRender() {
    const list = document.getElementById('chatHistoryList');
    if (!list) return;
    const ids = Object.keys(_hChats).sort(function(a, b) {
        return (_hChats[b].createdAt || 0) - (_hChats[a].createdAt || 0);
    });
    if (!ids.length) {
        list.innerHTML = '<p class="text-xs text-gray-400 px-1 py-2">No history yet.</p>';
        return;
    }
    list.innerHTML = ids.map(function(id) {
        const c = _hChats[id];
        const active = id === _hActive ? ' active' : '';
        return '<div class="hist-item' + active + '" onclick="_hSwitch(\'' + id + '\')">' +
            '<i class="fas fa-comment-dots" style="font-size:.65rem;color:#94a3b8;flex-shrink:0"></i>' +
            '<span class="hist-item-title">' + escHtml(c.title) + '</span>' +
            '<button class="hist-del-btn" onclick="_hDelete(\'' + id + '\', event)" title="Delete">\u2715</button>' +
        '</div>';
    }).join('');
}

// ── Core initAI ───────────────────────────────────────────
function initAI() {
    _hLoadStore();
    if (_hActive && _hChats[_hActive]) {
        _hRender();
        const msgs = _hChats[_hActive].msgs;
        if (msgs.length) {
            _hSwitch(_hActive);
            setAIStatus('Ready', 'ready');
            return;
        }
    }
    if (!_hActive || !_hChats[_hActive]) {
        _hActive = _hCreate();
        localStorage.setItem(_LS_ACTIVE, _hActive);
        _hSaveStore();
    }
    _hRender();
    setAIStatus('Ready', 'ready');
    const _greets = [
        'Yooo Sandile! OMEGA is ONLINE \u2014 what are we conquering today? \ud83d\ude80',
        'Sharp sharp, boss! Your AI just loaded. Omegatek never stops! \u26a1',
        'Heeeey Sandile! Ready to make moves. What is the plan, chief? \ud83c\udfaf',
        'Lekker to see you! Command Centre is HOT and ready. Let\u2019s get it. \ud83d\udd25',
        'Hayibo, another day another breakthrough for Omegatek! What do you need? \ud83d\udcaa',
        'Sandile in the building! Drop a question or pick an action. \ud83e\udd19'
    ];
    addSystemMessage(_greets[Math.floor(Math.random() * _greets.length)], false);
}

function setAIStatus(text, state) {
    state = state || 'idle';
    const badge = document.getElementById('aiStatus');
    const label = document.getElementById('aiStatusText');
    if (label) label.textContent = text;
    if (badge) badge.className = 'ai-status-badge ai-status-' + state;
}

function showTyping() { document.getElementById('aiTyping')?.classList.remove('hidden'); scrollAI(); }
function hideTyping() { document.getElementById('aiTyping')?.classList.add('hidden'); }
function scrollAI()   { const w = document.getElementById('aiMessages'); if (w) w.scrollTop = w.scrollHeight; }

function _addMsgBubble(role, html) {
    const wrap = document.getElementById('aiMessages');
    if (!wrap) return null;
    const div = document.createElement('div');
    if (role === 'system') {
        div.className = 'flex justify-center';
        div.innerHTML = '<span class="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">' + html + '</span>';
    } else if (role === 'user') {
        div.className = 'flex justify-end items-end gap-2';
        div.innerHTML =
            '<div class="flex flex-col items-end gap-0.5" style="max-width:72%">' +
                '<span class="text-xs text-gray-400 font-medium mr-1">You</span>' +
                '<div class="ai-bubble-user">' + html + '</div>' +
            '</div>' +
            '<div class="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold" style="background:linear-gradient(135deg,#b30ce6,#7c3aed)">S</div>';
    } else if (role === 'error') {
        div.className = 'flex items-start gap-3';
        div.innerHTML =
            '<div class="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-1">' +
                '<i class="fas fa-exclamation-triangle text-red-400" style="font-size:.75rem"></i>' +
            '</div>' +
            '<div style="max-width:80%"><div class="ai-bubble-error">' + html + '</div></div>';
    }
    wrap.appendChild(div);
    scrollAI();
    return div;
}

function _addAIBubble(rawText, appendHtml, instant) {
    appendHtml = appendHtml || '';
    const wrap = document.getElementById('aiMessages');
    if (!wrap) return;
    const uid = 'tw_' + Date.now() + '_' + Math.random().toString(36).slice(2,6);
    const div = document.createElement('div');
    div.className = 'flex items-start gap-3';
    div.innerHTML =
        '<div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-sm" style="background:linear-gradient(135deg,#b30ce6,#7c3aed)">' +
            '<i class="fas fa-robot text-white" style="font-size:.7rem"></i>' +
        '</div>' +
        '<div class="flex flex-col gap-0.5" style="max-width:80%">' +
            '<span class="text-xs text-gray-400 font-medium ml-1">Omegatek AI</span>' +
            '<div class="ai-bubble-ai" id="' + uid + '">' + (instant ? (formatAIText(rawText) + appendHtml) : '<span class="tw-cursor">\u258c</span>') + '</div>' +
        '</div>';
    wrap.appendChild(div);
    scrollAI();
    if (instant) return;

    const bubble    = document.getElementById(uid);
    const total     = rawText.length;
    const chunkSize = Math.max(1, Math.ceil(total / 120));
    let i = 0;
    (function tick() {
        if (i < total) {
            i = Math.min(i + chunkSize, total);
            bubble.innerHTML = formatAIText(rawText.substring(0, i)) + '<span class="tw-cursor">\u258c</span>';
            scrollAI();
            requestAnimationFrame(tick);
        } else {
            bubble.innerHTML = formatAIText(rawText) + appendHtml;
            scrollAI();
            _maybeDropTechFact();
        }
    })();
}

function addMessage(role, html, persist) {
    persist = (persist !== false);
    _addMsgBubble(role, html);
    if (persist && role !== 'system') {
        const firstUser = role === 'user' && _hChats[_hActive] && _hChats[_hActive].msgs.filter(function(m){return m.role==='user';}).length === 0;
        _hSaveMsg(role, html, html, '');
        if (firstUser) _hAutoTitle(_hActive, html.replace(/<[^>]+>/g,''));
    }
}

function addSystemMessage(text, persist) {
    persist = (persist !== false);
    _addMsgBubble('system', escHtml(text));
    if (persist) _hSaveMsg('system', text, escHtml(text), '');
}

function addAIMessage(rawText, appendHtml) {
    appendHtml = appendHtml || '';
    _addAIBubble(rawText, appendHtml, false);
    _hSaveMsg('ai', rawText, rawText, appendHtml);
    if (_lastAIBlog)       _hSaveBlog();
    if (_lastAINewsletter) _hSaveNL();
}

function _maybeDropTechFact() {
    _aiMsgCount++;
    if (_aiMsgCount % 4 === 0) {
        const fact = _AI_TECH_FACTS[Math.floor(Math.random() * _AI_TECH_FACTS.length)];
        setTimeout(function() { addSystemMessage('\u26a1 Tech fact: ' + fact); }, 1400);
    }
}

// ── AI call — routed through server-side PHP proxy ────────────────
async function callAI(userMessage, systemPrompt) {
    const model = document.getElementById('aiModelSelect')?.value || 'openai/gpt-4o-mini';
    const token = await getAccessToken();
    const res = await fetch(AI_PROXY_URL, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + (token || ''),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model,
            messages: [
                { role: 'system', content: systemPrompt || AI_SYSTEM_BASE },
                { role: 'user',   content: userMessage }
            ]
        })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) {
        throw new Error(data.message || 'AI proxy error ' + res.status);
    }
    return data.response || '(no response)';
}

// Quick-action prompts
const _AI_PROMPTS = {
    analyze_orders:
        'Analyse the current state of orders and repair tasks at Omegatek Solutions. Identify priorities, flag anything overdue, and give 3-5 clear action items. Be concise.',
    analyze_customers:
        'Analyse the Omegatek Solutions customer base. Identify VIP customers worth nurturing, re-engagement opportunities, and loyalty patterns. Give 3-5 actionable insights.',
    send_reminders:
        'List overdue items that need urgent follow-up at Omegatek Solutions \u2014 repairs, invoices, pending callbacks. Be specific and concise.'
};

function runAIAction(action) {
    const labels = {
        analyze_orders:    'Analyse outstanding orders and tasks',
        analyze_customers: 'Show customer insights and VIP opportunities',
        send_reminders:    'Show overdue items that need follow-up'
    };
    addMessage('user', escHtml(labels[action] || action));
    setAIStatus('Working\u2026', 'busy');
    showTyping();
    callAI(_AI_PROMPTS[action] || action)
        .then(text  => { hideTyping(); addAIMessage(text); setAIStatus('Ready', 'ready'); })
        .catch(err  => { hideTyping(); addMessage('error', escHtml(err.message)); setAIStatus('Error', 'error'); });
}

async function triggerBlogGeneration() {
    const topic = prompt('Enter blog topic:', 'Top Tech Tips for South African Small Businesses 2026');
    if (!topic) return;
    addMessage('user', 'Write a blog post about: ' + escHtml(topic));
    setAIStatus('Writing\u2026', 'busy');
    showTyping();
    try {
        const sys = 'You are a professional blog writer for Omegatek Solutions, a South African IT & tech repair company. Write SEO-optimised blog posts. Respond with JSON only: { "title": "", "meta_description": "", "content": "<HTML>", "tags": [] }';
        const raw = await callAI('Write a complete blog post about: ' + topic, sys);
        hideTyping();
        let blog = null;
        try { const m = raw.match(/\{[\s\S]*\}/); if (m) blog = JSON.parse(m[0]); } catch {}
        const readyBanner = '<br><br><button onclick="fillBlogFromAI()" style="background:linear-gradient(135deg,#7c3aed,#b30ce6);color:#fff;border:none;border-radius:8px;padding:6px 14px;font-size:0.75rem;font-weight:600;cursor:pointer;">\u2713 Publish AI Draft \u2192 open in editor</button>';
        if (blog && blog.title) {
            _lastAIBlog = blog;
            const preview = (blog.content || '').replace(/<[^>]+>/g, '').substring(0, 400);
            addAIMessage('**' + blog.title + '**\n\n_' + (blog.meta_description || '') + '_\n\n' + preview + '\u2026', readyBanner);
        } else {
            _lastAIBlog = { title: topic, content: raw, meta_description: '' };
            addAIMessage(raw.substring(0, 600) + (raw.length > 600 ? '\u2026' : ''), readyBanner);
        }
        setAIStatus('Ready', 'ready');
    } catch (e) {
        hideTyping();
        addMessage('error', 'Blog generation failed: ' + escHtml(e.message));
        setAIStatus('Error', 'error');
    }
}

async function triggerNewsletterGeneration() {
    const nowStr   = new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long' });
    const prevList = _nlTopicHistory.slice(-5).join('; ') || 'none yet';
    const topic = prompt(
        'Newsletter topic / theme for ' + nowStr + '?\n' +
        (_nlTopicHistory.length ? 'Recent topics used (avoid repeating): ' + prevList : 'No previous topics \u2014 be creative!'),
        ''
    );
    if (!topic) return;
    if (!_nlTopicHistory.includes(topic)) _nlTopicHistory.push(topic);
    addMessage('user', 'Write a newsletter campaign about: ' + escHtml(topic));
    setAIStatus('Writing\u2026', 'busy');
    showTyping();
    try {
        const sys = 'You are an expert email marketing strategist for Omegatek Solutions, a South African IT repair & tech solutions company in Midrand, Gauteng. Today\'s date: ' + nowStr + '. Previously used newsletter topics (DO NOT repeat these \u2014 generate completely new content): [' + prevList + ']. Respond ONLY with valid JSON, no markdown, no code fences: { "subject": "", "preheader": "", "body": "<complete HTML email body, inline CSS for email client compatibility, {{name}} for personalisation, compelling SA-relevant offer, clear CTA button with inline CSS>" }';
        const raw = await callAI('Write a complete, professional newsletter campaign about: ' + topic + '. Make the content entirely fresh and different from these previously used topics: ' + prevList + '. Personalise with {{name}}. Include a compelling offer and a clear CTA button.', sys);
        hideTyping();
        let nl = null;
        try { const m = raw.match(/\{[\s\S]*\}/); if (m) nl = JSON.parse(m[0]); } catch(ex) {}
        const sendBanner = '<br><br><button onclick="fillNewsletterFromAI()" style="background:linear-gradient(135deg,#ec4899,#be185d);color:#fff;border:none;border-radius:8px;padding:6px 14px;font-size:0.75rem;font-weight:600;cursor:pointer;">\u2709 Send AI Newsletter \u2192 open in composer</button>';
        if (nl && nl.subject) {
            _lastAINewsletter = nl;
            const preview = (nl.body || '').replace(/<[^>]+>/g, '').substring(0, 350);
            addAIMessage('**Subject:** ' + nl.subject + '\n\n' + (nl.preheader ? '_' + nl.preheader + '_\n\n' : '') + preview + '\u2026', sendBanner);
        } else {
            _lastAINewsletter = { subject: topic, body: raw };
            addAIMessage(raw.substring(0, 500) + (raw.length > 500 ? '\u2026' : ''), sendBanner);
        }
        setAIStatus('Ready', 'ready');
    } catch (e) {
        hideTyping();
        addMessage('error', 'Newsletter generation failed: ' + escHtml(e.message));
        setAIStatus('Error', 'error');
    }
}

async function triggerNewsletterOpt() {
    const content = prompt('Paste newsletter content to optimise:', 'Get 20% off all laptop repairs this month!');
    if (!content) return;
    addMessage('user', 'Optimise this newsletter: ' + escHtml(content.substring(0, 120)) + (content.length > 120 ? '\u2026' : ''));
    setAIStatus('Optimising\u2026', 'busy');
    showTyping();
    try {
        const sys = 'You are an expert email marketing specialist. Improve the newsletter for a South African IT repair company to maximise open rates and clicks. Keep it concise and compelling.';
        const text = await callAI('Optimise this newsletter content:\n\n' + content, sys);
        hideTyping();
        addAIMessage(text);
        setAIStatus('Ready', 'ready');
    } catch (e) {
        hideTyping();
        addMessage('error', 'Optimisation failed: ' + escHtml(e.message));
        setAIStatus('Error', 'error');
    }
}

async function sendManualAICommand() {
    const ta  = document.getElementById('aiManualCommand');
    const cmd = ta?.value.trim();
    if (!cmd) return;
    addMessage('user', escHtml(cmd).replace(/\n/g, '<br>'));
    ta.value = '';
    autoResizeTextarea(ta);
    setAIStatus('Thinking\u2026', 'busy');
    showTyping();
    try {
        const text = await callAI(cmd);
        hideTyping();
        addAIMessage(text);
        setAIStatus('Ready', 'ready');
    } catch (e) {
        hideTyping();
        addMessage('error', 'Request failed: ' + escHtml(e.message));
        setAIStatus('Error', 'error');
    }
}

function handleAIInputKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendManualAICommand(); }
}

async function runFullAutomation() {
    addSystemMessage('\ud83d\ude80 Full automation sequence started');
    setAIStatus('Automating\u2026', 'busy');
    const steps = [
        { action: 'analyze_orders',    label: 'Step 1/3 \u2014 Analysing orders & tasks\u2026' },
        { action: 'send_reminders',    label: 'Step 2/3 \u2014 Scanning for overdue items\u2026' },
        { action: 'analyze_customers', label: 'Step 3/3 \u2014 Analysing customer patterns\u2026' },
    ];
    for (const step of steps) {
        addSystemMessage(step.label);
        try {
            const text = await callAI(_AI_PROMPTS[step.action]);
            addAIMessage(text);
        } catch (e) {
            addMessage('error', escHtml(e.message));
        }
        await sleep(400);
    }
    addSystemMessage('\u2713 Full automation complete');
    setAIStatus('Ready', 'ready');
}
