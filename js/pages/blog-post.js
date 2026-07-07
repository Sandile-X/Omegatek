import { fetchBlogPostBySlug } from '../api.js';
import { bindNewsletterForm, initUi } from '../ui.js';
import { initAos, initBackToTop, initSiteChrome, onReady } from '../site-shell.js';
import DOMPurify from 'https://cdn.jsdelivr.net/npm/dompurify@3/dist/purify.es.mjs';

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function renderBody(content, excerpt) {
    if (content && /<[a-z][\s\S]*>/i.test(content)) {
        return DOMPurify.sanitize(content);
    }

    if (content) {
        return content
            .split(/\n\n+/)
            .map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`)
            .join('');
    }

    return `<p>${escapeHtml(excerpt || '')}</p>`;
}

function bindShareActions() {
    document.querySelectorAll('[data-share-network]').forEach((button) => {
        button.addEventListener('click', (event) => {
            event.preventDefault();

            const network = button.dataset.shareNetwork;
            const pageUrl = encodeURIComponent(window.location.href);
            const pageTitle = encodeURIComponent(document.title);

            switch (network) {
                case 'facebook':
                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${pageUrl}`, '_blank', 'width=600,height=400');
                    break;
                case 'twitter':
                    window.open(`https://twitter.com/intent/tweet?url=${pageUrl}&text=${pageTitle}`, '_blank', 'width=600,height=400');
                    break;
                case 'linkedin':
                    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${pageUrl}`, '_blank', 'width=600,height=400');
                    break;
                case 'whatsapp':
                    window.open(`https://wa.me/?text=${encodeURIComponent(`${document.title} ${window.location.href}`)}`, '_blank');
                    break;
                default:
                    break;
            }
        });
    });
}

async function loadPost() {
    const slug = new URLSearchParams(window.location.search).get('slug');
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const errorMessage = document.getElementById('errorMessage');
    const wrapper = document.getElementById('postWrapper');

    const showError = (message) => {
        loadingState?.style.setProperty('display', 'none');
        if (errorMessage) {
            errorMessage.textContent = message;
        }
        errorState?.style.setProperty('display', 'block');
    };

    if (!slug) {
        showError('No post specified.');
        return;
    }

    try {
        const post = await fetchBlogPostBySlug(slug);
        if (!post) {
            showError('Post not found.');
            return;
        }

        document.title = `${post.title} | Omegatek Solutions`;

        const image = post.cover_image && !post.cover_image.startsWith('http') && !post.cover_image.startsWith('/')
            ? `../${post.cover_image}`
            : (post.cover_image || '');

        const publishedDate = new Date(post.created_at).toLocaleDateString('en-ZA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        document.getElementById('postTitle').textContent = post.title;
        document.getElementById('postMeta').innerHTML = [
            '<span><i class="fas fa-user"></i> Sandile Milanzi</span>',
            `<span><i class="fas fa-calendar"></i> ${publishedDate}</span>`,
            `<span><i class="fas fa-folder"></i> ${escapeHtml(post.category || 'General')}</span>`
        ].join('');

        if (image) {
            document.getElementById('postImage').innerHTML = `<img src="${image}" alt="${escapeHtml(post.title)}">`;
        } else {
            document.getElementById('postImage').style.display = 'none';
        }

        document.getElementById('postBody').innerHTML = renderBody(post.content, post.excerpt);
        loadingState?.style.setProperty('display', 'none');
        wrapper?.style.setProperty('display', 'block');
    } catch {
        showError('Failed to load post. Please try again later.');
    }
}

async function bootstrapBlogPostPage() {
    await initUi();
    initSiteChrome();
    initAos({ duration: 1000 });
    initBackToTop();
    bindNewsletterForm();
    bindShareActions();
    await loadPost();
}

onReady(() => {
    bootstrapBlogPostPage();
});

export { bootstrapBlogPostPage };