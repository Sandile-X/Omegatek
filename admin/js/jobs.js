/* ═══════════════════════════════════════════════════════════
   jobs.js — Repair Jobs CRUD, WhatsApp & email
   ═══════════════════════════════════════════════════════════ */

let _allJobs = [];
let _editingJobId = null;

async function loadJobs() {
    const container = document.getElementById('jobsContainer');
    if (container) container.innerHTML = '<p class="text-gray-500 text-sm p-4">Loading jobs\u2026</p>';
    try {
        const { data: jobs, error } = await _sb
            .from('repair_jobs')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        _allJobs = jobs || [];
        renderJobs(_allJobs);
        const activeCount = _allJobs.filter(j => !['collected','cancelled'].includes(j.status)).length;
        const el = document.getElementById('totalRepairs');
        if (el) el.textContent = activeCount;
    } catch(e) {
        if (container) container.innerHTML = `<div class="card"><p class="text-red-500 text-sm">Could not load jobs: ${escHtml(e.message)}</p><p class="text-xs text-gray-400 mt-2">Make sure the repair_jobs table exists in Supabase.</p></div>`;
    }
}

function renderJobs(jobs) {
    const container = document.getElementById('jobsContainer');
    if (!container) return;
    if (!jobs.length) {
        container.innerHTML = '<div class="card"><p class="text-gray-500">No repair jobs found. Log your first job!</p></div>';
        return;
    }
    const statusColors = {
        received: 'badge-received', diagnosed: 'badge-diagnosed',
        in_progress: 'badge-in_progress', ready: 'badge-ready',
        collected: 'badge-collected', cancelled: 'bg-gray-200 text-gray-600'
    };
    const statusLabels = {
        received: 'Received', diagnosed: 'Diagnosed',
        in_progress: 'In Progress', ready: 'Ready', collected: 'Collected', cancelled: 'Cancelled'
    };
    container.innerHTML = jobs.map(job => `
        <div class="card">
            <div class="flex items-start justify-between gap-4 flex-wrap">
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-3 flex-wrap">
                        <h3 class="font-bold text-gray-800">${escHtml(job.customer_name)}</h3>
                        <span class="badge ${statusColors[job.status] || 'bg-gray-200 text-gray-600'}">${statusLabels[job.status] || job.status}</span>
                    </div>
                    <p class="text-sm text-gray-600 mt-1">${escHtml(job.device_type || '')} ${escHtml(job.device_model || '')} &mdash; ${escHtml(job.problem_description)}</p>
                    <div class="flex gap-4 mt-2 text-xs text-gray-400 flex-wrap">
                        ${job.customer_phone ? `<span><i class="fas fa-phone mr-1"></i>${escHtml(job.customer_phone)}</span>` : ''}
                        ${job.customer_email ? `<span><i class="fas fa-envelope mr-1"></i>${escHtml(job.customer_email)}</span>` : ''}
                        ${job.estimated_cost ? `<span><i class="fas fa-tag mr-1"></i>R${parseFloat(job.estimated_cost).toFixed(2)}</span>` : ''}
                        <span><i class="fas fa-calendar mr-1"></i>${new Date(job.created_at).toLocaleDateString('en-ZA')}</span>
                    </div>
                    ${job.technician_notes ? `<p class="text-xs text-gray-500 mt-2 italic">${escHtml(job.technician_notes)}</p>` : ''}
                </div>
                <div class="flex gap-2 flex-wrap shrink-0">
                    <select onchange="updateJobStatus('${job.id}', this.value)" class="text-xs border rounded-lg px-2 py-1 bg-white">
                        <option value="received" ${job.status==='received'?'selected':''}>Received</option>
                        <option value="diagnosed" ${job.status==='diagnosed'?'selected':''}>Diagnosed</option>
                        <option value="in_progress" ${job.status==='in_progress'?'selected':''}>In Progress</option>
                        <option value="ready" ${job.status==='ready'?'selected':''}>Ready</option>
                        <option value="collected" ${job.status==='collected'?'selected':''}>Collected</option>
                        <option value="cancelled" ${job.status==='cancelled'?'selected':''}>Cancelled</option>
                    </select>
                    ${job.customer_phone ? `<button onclick="sendWhatsApp('${escHtml(job.customer_phone)}','${escHtml(job.customer_name)}','${job.status}')" class="px-3 py-1 text-xs rounded-lg bg-green-500 text-white hover:bg-green-600"><i class="fab fa-whatsapp mr-1"></i>WhatsApp</button>` : ''}
                    ${job.customer_email ? `<button onclick="sendJobEmail('${escHtml(job.customer_email)}','${escHtml(job.customer_name)}','${job.status}','${escHtml(job.device_type||'')} ${escHtml(job.device_model||'')}')" class="px-3 py-1 text-xs rounded-lg bg-blue-500 text-white hover:bg-blue-600"><i class="fas fa-envelope mr-1"></i>Email</button>` : ''}
                    <button onclick="editJob('${job.id}')" class="px-3 py-1 text-xs rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"><i class="fas fa-edit mr-1"></i>Edit</button>
                </div>
            </div>
        </div>
    `).join('');
}

function filterJobs(status) {
    document.querySelectorAll('.job-filter-btn').forEach(b => b.classList.remove('active'));
    event?.target.classList.add('active');
    if (status === 'all') return renderJobs(_allJobs);
    renderJobs(_allJobs.filter(j => j.status === status));
}

async function updateJobStatus(id, status) {
    const { error } = await _sb.from('repair_jobs').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) { alert('Failed to update status: ' + error.message); return; }
    await loadJobs();
}

function showAddJobModal() {
    _editingJobId = null;
    document.getElementById('jobForm')?.reset();
    document.getElementById('jobModalTitle').textContent = 'Log New Repair Job';
    document.getElementById('addJobModal').classList.add('active');
}

async function editJob(id) {
    const job = _allJobs.find(j => j.id === id);
    if (!job) return;
    _editingJobId = id;
    document.getElementById('jobCustomerName').value  = job.customer_name || '';
    document.getElementById('jobPhone').value         = job.customer_phone || '';
    document.getElementById('jobEmail').value         = job.customer_email || '';
    document.getElementById('jobDeviceType').value   = job.device_type || '';
    document.getElementById('jobDeviceModel').value  = job.device_model || '';
    document.getElementById('jobProblem').value      = job.problem_description || '';
    document.getElementById('jobCost').value         = job.estimated_cost || '';
    document.getElementById('jobStatus').value       = job.status || 'received';
    document.getElementById('jobNotes').value        = job.technician_notes || '';
    document.getElementById('jobModalTitle').textContent = 'Edit Repair Job';
    document.getElementById('addJobModal').classList.add('active');
}

async function handleJobSubmit(e) {
    e.preventDefault();
    const jobData = {
        customer_name:       document.getElementById('jobCustomerName').value.trim(),
        customer_phone:      document.getElementById('jobPhone').value.trim(),
        customer_email:      document.getElementById('jobEmail').value.trim(),
        device_type:         document.getElementById('jobDeviceType').value.trim(),
        device_model:        document.getElementById('jobDeviceModel').value.trim(),
        problem_description: document.getElementById('jobProblem').value.trim(),
        estimated_cost:      parseFloat(document.getElementById('jobCost').value) || null,
        status:              document.getElementById('jobStatus').value,
        technician_notes:    document.getElementById('jobNotes').value.trim(),
        updated_at:          new Date().toISOString()
    };
    if (!jobData.customer_name || !jobData.problem_description) {
        alert('Customer name and problem description are required.');
        return;
    }
    let error;
    if (_editingJobId) {
        ({ error } = await _sb.from('repair_jobs').update(jobData).eq('id', _editingJobId));
    } else {
        ({ error } = await _sb.from('repair_jobs').insert([jobData]));
    }
    if (error) { alert('Failed to save job: ' + error.message); return; }
    closeModal('addJobModal');
    document.getElementById('jobForm')?.reset();
    _editingJobId = null;
    await loadJobs();
}

function sendWhatsApp(phone, name, status) {
    const statusMessages = {
        received:    `Hi ${name}, your device has been received at Omegatek Solutions and we are reviewing it. We will be in touch shortly.`,
        diagnosed:   `Hi ${name}, we have diagnosed your device at Omegatek Solutions and you will receive a quote/update soon.`,
        in_progress: `Hi ${name}, great news! Your device is currently being repaired at Omegatek Solutions.`,
        ready:       `Hi ${name}, your device is ready for collection at Omegatek Solutions! Please visit us during business hours.`,
        collected:   `Hi ${name}, thank you for choosing Omegatek Solutions! We hope your device is working perfectly.`
    };
    const msg = statusMessages[status] || `Hi ${name}, here is an update on your device from Omegatek Solutions.`;
    const clean = phone.replace(/\D/g, '');
    const intl = clean.startsWith('0') ? '27' + clean.slice(1) : clean;
    window.open(`https://wa.me/${intl}?text=${encodeURIComponent(msg)}`, '_blank');
}

function sendJobEmail(email, name, status, device) {
    const statusMessages = {
        received:    `Your device (${device}) has been received and is being reviewed.`,
        diagnosed:   `We have diagnosed your device (${device}) and will contact you with a quote.`,
        in_progress: `Your device (${device}) is currently being repaired by our technicians.`,
        ready:       `Your device (${device}) is ready for collection! Please visit us during business hours.`,
        collected:   `Thank you for choosing Omegatek Solutions! We hope your device is working perfectly.`
    };
    const body = `Hi ${name},\n\n${statusMessages[status] || 'Here is an update on your device.'}\n\nRegards,\nOmegatek Solutions Team`;
    const subject = `Omegatek Solutions \u2014 Repair Update: ${device}`;
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

async function loadRepairs() {
    try {
        const { data: jobs, error } = await _sb.from('repair_jobs').select('id, status');
        if (!error && jobs) {
            const active = jobs.filter(j => !['collected','cancelled'].includes(j.status)).length;
            const el = document.getElementById('totalRepairs');
            if (el) el.textContent = active;
        }
    } catch(e) { /* silent */ }
}
