/* ═══════════════════════════════════════════════════════════
   gallery.js — Gallery media management (Supabase Storage)
   ═══════════════════════════════════════════════════════════ */

const GALLERY_BUCKET = 'gallery-images';
let _galleryItems = [];

async function loadGallery() {
    const grid = document.getElementById('galleryGrid');
    if (!grid) return;
    grid.innerHTML = '<p class="text-gray-500 p-4">Loading gallery&hellip;</p>';

    try {
        const { data, error } = await _sb.storage.from(GALLERY_BUCKET).list('', {
            limit: 200, sortBy: { column: 'created_at', order: 'desc' }
        });
        if (error) throw error;
        _galleryItems = (data || []).filter(f => f.name && !f.name.endsWith('/'));

        if (!_galleryItems.length) {
            grid.innerHTML = `<div class="gallery-empty">
                <i class="fas fa-images"></i>
                <p>No media uploaded yet. Drop files above to get started.</p>
            </div>`;
            return;
        }

        grid.innerHTML = _galleryItems.map(f => {
            const url = _sb.storage.from(GALLERY_BUCKET).getPublicUrl(f.name).data.publicUrl;
            const isVideo = /\.(mp4|webm|mov)$/i.test(f.name);
            const sizeKB = f.metadata?.size ? (f.metadata.size / 1024).toFixed(1) + ' KB' : '';
            return `<div class="gallery-item">
                ${isVideo
                    ? `<video src="${escHtml(url)}" class="gallery-thumb" muted preload="metadata"></video>`
                    : `<img src="${escHtml(url)}" alt="${escHtml(f.name)}" class="gallery-thumb" loading="lazy">`}
                <div class="gallery-overlay">
                    <span class="text-xs truncate max-w-full">${escHtml(f.name)}</span>
                    ${sizeKB ? `<span class="text-xs opacity-75">${sizeKB}</span>` : ''}
                    <div class="flex gap-2 mt-1">
                        <button onclick="copyGalleryUrl('${escHtml(url)}')" class="text-xs bg-white/20 hover:bg-white/40 rounded px-2 py-0.5" title="Copy URL">
                            <i class="fas fa-link"></i>
                        </button>
                        <button onclick="deleteGalleryItem('${escHtml(f.name)}')" class="text-xs bg-red-500/60 hover:bg-red-500 rounded px-2 py-0.5" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>`;
        }).join('');
    } catch (err) {
        console.error('Gallery load error:', err);
        grid.innerHTML = `<div class="gallery-empty">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Could not load gallery. Make sure the <strong>${GALLERY_BUCKET}</strong> bucket exists in Supabase Storage.</p>
        </div>`;
    }
}

async function handleGalleryUpload(e) {
    const files = e.target.files;
    if (!files?.length) return;
    await uploadGalleryFiles(Array.from(files));
    e.target.value = '';
}

function handleGalleryDrop(e) {
    const files = e.dataTransfer?.files;
    if (!files?.length) return;
    uploadGalleryFiles(Array.from(files));
}

async function uploadGalleryFiles(files) {
    const grid = document.getElementById('galleryGrid');
    let uploaded = 0, failed = 0;

    for (const file of files) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `${Date.now()}_${safeName}`;
        try {
            const { error } = await _sb.storage.from(GALLERY_BUCKET).upload(path, file, {
                cacheControl: '3600',
                upsert: false
            });
            if (error) throw error;
            uploaded++;
        } catch (err) {
            console.error('Upload failed:', safeName, err);
            failed++;
        }
    }

    const msg = `Uploaded ${uploaded} file${uploaded !== 1 ? 's' : ''}${failed ? `, ${failed} failed` : ''}`;
    showToast(msg, failed ? 'warning' : 'success');
    await loadGallery();
}

async function deleteGalleryItem(name) {
    if (!confirm(`Delete "${name}" from gallery?`)) return;
    try {
        const { error } = await _sb.storage.from(GALLERY_BUCKET).remove([name]);
        if (error) throw error;
        showToast('Deleted', 'success');
        await loadGallery();
    } catch (err) {
        console.error('Delete error:', err);
        showToast('Delete failed', 'error');
    }
}

function copyGalleryUrl(url) {
    navigator.clipboard.writeText(url).then(() => {
        showToast('URL copied to clipboard', 'success');
    }).catch(() => {
        prompt('Copy this URL:', url);
    });
}

function showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
}
