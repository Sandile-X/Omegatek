/* ═══════════════════════════════════════════════════════════
   blog.js — Blog CRUD + rich text editor
   ═══════════════════════════════════════════════════════════ */

function blogFmt(cmd, val) {
    if (cmd === 'h2') {
        document.execCommand('formatBlock', false, 'h2');
    } else if (cmd === 'h3') {
        document.execCommand('formatBlock', false, 'h3');
    } else if (cmd === 'ul') {
        document.execCommand('insertUnorderedList', false, null);
    } else if (cmd === 'link') {
        const url = prompt('Enter link URL:', 'https://');
        if (url) document.execCommand('createLink', false, url);
    } else {
        document.execCommand(cmd, false, val || null);
    }
    document.getElementById('blogEditor')?.focus();
    syncBlogContent();
}

function syncBlogContent() {
    const ed = document.getElementById('blogEditor');
    const ta = document.getElementById('blogContent');
    if (ed && ta) ta.value = ed.innerHTML;
}

function handleEditorPaste(e) {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text/plain');
    document.execCommand('insertText', false, text);
    syncBlogContent();
}

function importPlainText() {
    const raw = prompt('Paste your plain text or markdown here (## headings, **bold**, bullet lists, etc.):');
    if (!raw) return;
    document.getElementById('blogEditor').innerHTML = mdToHtml(raw);
    syncBlogContent();
}

function blogInsertImage() {
    const url = prompt('Enter image URL:', 'https://');
    if (!url) return;
    const alt = prompt('Image description (alt text):', '') || '';
    const img = `<img src="${url}" alt="${alt.replace(/"/g,'&quot;')}" style="max-width:100%;height:auto;border-radius:6px;margin:10px 0;display:block;" loading="lazy">`;
    document.getElementById('blogEditor').focus();
    document.execCommand('insertHTML', false, img);
    syncBlogContent();
}

async function generateBlogWithAI() {
    const title = document.getElementById('blogTitle').value.trim();
    if (!title) { alert('Enter a blog post title first, then click AI Write.'); return; }
    const btn = document.querySelector('#addBlogModal [onclick="generateBlogWithAI()"]');
    if (btn) { btn.disabled = true; btn.textContent = '\u23f3 Writing\u2026'; }
    try {
        const sys = 'You are a professional blog writer for Omegatek Solutions, a South African IT & tech repair company. Write a complete, SEO-optimised blog post. Return ONLY valid HTML using <h2>, <h3>, <p>, <ul>, <li> tags. No markdown, no code fences, no extra commentary \u2014 just the HTML body content.';
        const raw = await callAI('Write a full blog post titled: ' + title + '\n\nMake it informative, helpful, approximately 600-900 words, suitable for a South African IT services audience.', sys);
        const clean = raw.replace(/```html?\n?/gi, '').replace(/```/g, '');
        document.getElementById('blogEditor').innerHTML = clean;
        syncBlogContent();
    } catch(e) {
        alert('AI Write failed: ' + e.message);
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = '\u2726 AI Write'; }
    }
}

function showAddBlogModal() {
    document.getElementById('blogEditId').value = '';
    document.getElementById('blogForm').reset();
    document.getElementById('blogModalTitle').textContent = 'Write Blog Post';
    document.getElementById('blogSubmitBtn').textContent = 'Publish Post';
    setCoverPreview('');
    document.getElementById('addBlogModal').classList.add('active');
}

function setCoverPreview(src) {
    const preview    = document.getElementById('coverPreview');
    const previewImg = document.getElementById('coverPreviewImg');
    if (!src) { preview.classList.add('hidden'); return; }
    const resolved = src.startsWith('http') || src.startsWith('/') ? src : '../' + src;
    preview.classList.remove('hidden');
    previewImg.src = resolved;
    previewImg.style.display = 'block';
    previewImg.onerror = function() {
        previewImg.style.display = 'none';
        let note = preview.querySelector('.cover-url-note');
        if (!note) { note = document.createElement('p'); note.className = 'cover-url-note text-xs text-gray-500 mt-1'; preview.appendChild(note); }
        note.textContent = 'Image URL saved (cannot preview external link)';
    };
    previewImg.onload = function() {
        previewImg.style.display = 'block';
        const note = preview.querySelector('.cover-url-note');
        if (note) note.remove();
    };
}

async function editPost(id) {
    const { data: post, error } = await _sb.from('blog_posts').select('*').eq('id', id).single();
    if (error || !post) { alert('Could not load post.'); return; }
    document.getElementById('blogEditId').value   = post.id;
    document.getElementById('blogTitle').value    = post.title    || '';
    document.getElementById('blogCategory').value = post.category || '';
    document.getElementById('blogExcerpt').value  = post.excerpt  || '';
    document.getElementById('blogCoverImage').value = post.cover_image || '';
    setCoverPreview(post.cover_image || '');

    let content = post.content || '';
    if (!content) {
        const staticSlugs = ['blog-post-maintenance-tips','blog-post-laptop-overheating',
            'blog-post-smartphone-battery','blog-post-diy-ram-upgrade','blog-post-backup-strategy',
            'blog-post-smart-home-security','blog-post-gaming-console-problems'];
        if (staticSlugs.includes(post.slug)) {
            try {
                const res = await fetch(`../blog/${post.slug}.html`);
                if (res.ok) {
                    const html = await res.text();
                    const doc  = new DOMParser().parseFromString(html, 'text/html');
                    const el   = doc.querySelector('.post-content');
                    if (el) {
                        el.querySelector('.post-author')?.remove();
                        content = el.innerHTML.trim();
                    }
                }
            } catch(e) {}
        }
    }
    document.getElementById('blogEditor').innerHTML = content;
    document.getElementById('blogContent').value = content;

    document.getElementById('blogModalTitle').textContent  = 'Edit Blog Post';
    document.getElementById('blogSubmitBtn').textContent   = 'Update Post';
    document.getElementById('addBlogModal').classList.add('active');
}

async function handleAddBlog(e) {
    e.preventDefault();
    syncBlogContent();
    const editId     = document.getElementById('blogEditId').value;
    const title      = document.getElementById('blogTitle').value.trim();
    const category   = document.getElementById('blogCategory').value.trim() || 'General';
    const content    = document.getElementById('blogContent').value.trim();
    const excerptVal = document.getElementById('blogExcerpt').value.trim();
    const coverImage = document.getElementById('blogCoverImage').value.trim();
    if (!title || !content) { alert('Title and content are required.'); return; }
    const excerpt = excerptVal || content.replace(/<[^>]+>/g, '').substring(0, 150) + '...';

    if (editId) {
        const { error } = await _sb.from('blog_posts')
            .update({ title, category, content, excerpt, cover_image: coverImage })
            .eq('id', editId);
        if (error) { alert('Failed to update post: ' + error.message); return; }
    } else {
        const slug = title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/^-+|-+$/g, '') + '-' + Date.now();
        const { error } = await _sb.from('blog_posts').insert([{ title, slug, content, category, excerpt, cover_image: coverImage, published: true }]);
        if (error) { alert('Failed to save post: ' + error.message); return; }
    }
    closeModal('addBlogModal');
    document.getElementById('blogForm').reset();
    bustBlogCache();
    loadBlogPosts();
}

async function saveBlogAsDraft() {
    syncBlogContent();
    const title      = document.getElementById('blogTitle').value.trim();
    const category   = document.getElementById('blogCategory').value.trim() || 'General';
    const content    = document.getElementById('blogContent').value.trim();
    const excerptVal = document.getElementById('blogExcerpt').value.trim();
    const coverImage = document.getElementById('blogCoverImage').value.trim();
    if (!title || !content) { alert('Title and content are required.'); return; }
    const excerpt = excerptVal || content.replace(/<[^>]+>/g, '').substring(0, 150) + '...';
    const slug = title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/^-+|-+$/g, '') + '-' + Date.now();
    const { error } = await _sb.from('blog_posts').insert([{ title, slug, content, category, excerpt, cover_image: coverImage, published: false }]);
    if (error) { alert('Failed to save draft: ' + error.message); return; }
    closeModal('addBlogModal');
    document.getElementById('blogForm').reset();
    bustBlogCache();
    loadBlogPosts();
}

function fillBlogFromAI() {
    if (!_lastAIBlog) { alert('Generate a blog post from the AI panel first.'); return; }
    document.getElementById('blogEditId').value = '';
    document.getElementById('blogTitle').value = _lastAIBlog.title || '';
    const htmlContent = mdToHtml(_lastAIBlog.content || '');
    const ed = document.getElementById('blogEditor');
    if (ed) ed.innerHTML = htmlContent;
    document.getElementById('blogContent').value = htmlContent;
    document.getElementById('blogExcerpt').value = _lastAIBlog.meta_description || '';
    document.getElementById('blogCategory').value = 'Tech';
    document.getElementById('blogCoverImage').value = '';
    document.getElementById('blogModalTitle').textContent = 'Write Blog Post';
    document.getElementById('blogSubmitBtn').textContent = 'Publish Post';
    switchTab('blog');
    document.getElementById('addBlogModal').classList.add('active');
}

function bustBlogCache() {
    try { localStorage.removeItem('omegatek_blog_posts_v1'); } catch(e) {}
}

async function togglePostPublish(id, publish) {
    const { error } = await _sb.from('blog_posts').update({ published: publish }).eq('id', id);
    if (error) { alert('Error: ' + error.message); return; }
    bustBlogCache();
    loadBlogPosts();
}

async function deletePostById(id) {
    if (!confirm('Delete this post permanently?')) return;
    const { error } = await _sb.from('blog_posts').delete().eq('id', id);
    if (error) { alert('Error: ' + error.message); return; }
    bustBlogCache();
    loadBlogPosts();
}

async function loadBlogPosts() {
    try {
        const { data: posts, error } = await _sb
            .from('blog_posts')
            .select('id, title, slug, excerpt, category, published, created_at')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const count = (posts || []).filter(p => p.published).length;
        document.getElementById('totalBlogPosts').textContent = count;

        const container = document.getElementById('blogContainer');
        if (!posts || posts.length === 0) {
            container.innerHTML = `<div class="card"><p class="text-gray-600">No blog posts yet. Create your first post!</p></div>`;
            return;
        }

        container.innerHTML = posts.map(post => `
            <div class="card flex items-center justify-between gap-4">
                <div class="flex-1 min-w-0">
                    <h3 class="font-bold text-gray-800 truncate">${escHtml(post.title)}</h3>
                    <p class="text-sm text-gray-500 mt-1 truncate">${escHtml(post.excerpt || '')}</p>
                    <div class="flex items-center gap-3 mt-2">
                        <span class="text-xs text-gray-400">${escHtml(post.category || 'General')}</span>
                        <span class="badge ${post.published ? 'badge-success' : 'badge-warning'}">
                            ${post.published ? 'Published' : 'Draft'}
                        </span>
                        <span class="text-xs text-gray-400">${new Date(post.created_at).toLocaleDateString('en-ZA')}</span>
                    </div>
                </div>
                <div class="flex gap-2 shrink-0">
                    <button onclick="editPost('${post.id}')"
                        class="px-3 py-1 text-xs rounded-lg border border-blue-300 text-blue-600 hover:bg-blue-50 transition-colors">
                        Edit
                    </button>
                    <button onclick="togglePostPublish('${post.id}', ${!post.published})"
                        class="px-3 py-1 text-xs rounded-lg border ${post.published ? 'border-yellow-400 text-yellow-700 hover:bg-yellow-50' : 'border-green-400 text-green-700 hover:bg-green-50'} transition-colors">
                        ${post.published ? 'Unpublish' : 'Publish'}
                    </button>
                    <button onclick="deletePostById('${post.id}')"
                        class="px-3 py-1 text-xs rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-colors">
                        Delete
                    </button>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading blog posts:', error);
        document.getElementById('blogContainer').innerHTML = `
            <div class="card">
                <p class="text-red-500">Error loading posts: ${error.message}</p>
                <p class="text-sm text-gray-500 mt-2">Make sure the blog_posts table exists in Supabase. See supabase-blog-schema.sql.</p>
            </div>`;
    }
}
