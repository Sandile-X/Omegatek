import { fetchPublishedBlogPosts } from '../api.js';
import { bindNewsletterForm, initUi } from '../ui.js';
import { initAos, initBackToTop, initSiteChrome, onReady } from '../site-shell.js';

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function isPagesVariant() {
    return window.location.pathname.replace(/\\/g, '/').includes('/pages/');
}

function blogLink(path) {
    return isPagesVariant() ? `../${path}` : path;
}

function resolvePostLink(post) {
    const staticPosts = new Set([
        'blog-post-maintenance-tips',
        'blog-post-laptop-overheating',
        'blog-post-smartphone-battery',
        'blog-post-diy-ram-upgrade',
        'blog-post-backup-strategy',
        'blog-post-smart-home-security',
        'blog-post-gaming-console-problems'
    ]);

    if (staticPosts.has(post.slug)) {
        return blogLink(`blog/${post.slug}.html`);
    }

    return blogLink(`blog/post.html?slug=${encodeURIComponent(post.slug)}`);
}

function resolveImage(path, fallback) {
    if (!path) {
        return blogLink(fallback);
    }

    if (path.startsWith('http') || path.startsWith('../') || path.startsWith('/')) {
        return path;
    }

    return blogLink(path);
}

function formatDate(isoDate) {
    const date = new Date(isoDate);
    return {
        day: date.getDate().toString().padStart(2, '0'),
        month: date.toLocaleString('en', { month: 'short' }),
        year: date.getFullYear()
    };
}

function renderPosts(posts) {
    const container = document.getElementById('blogPostsContainer');
    if (!container || !posts.length) {
        return;
    }

    const featured = posts[0];
    const rest = posts.slice(1);
    const featuredDate = formatDate(featured.created_at);
    let html = `
        <div class="featured-post">
            <div class="post-image">
                <img src="${resolveImage(featured.cover_image, 'images2/A1.avif')}" alt="${escapeHtml(featured.title)}" loading="lazy">
                <div class="post-date">
                    <span class="day">${featuredDate.day}</span>
                    <span class="month">${featuredDate.month}</span>
                    <span class="year">${featuredDate.year}</span>
                </div>
            </div>
            <div class="post-content">
                <div class="post-meta">
                    <span class="category">${escapeHtml(featured.category || 'General')}</span>
                    <span class="author"><i class="fas fa-user"></i> Sandile Milanzi</span>
                </div>
                <h2>${escapeHtml(featured.title)}</h2>
                <p>${escapeHtml(featured.excerpt || '')}</p>
                <a href="${resolvePostLink(featured)}" class="btn read-more">Read More</a>
            </div>
        </div>
    `;

    if (rest.length) {
        html += '<div class="posts-grid">';
        html += rest.map((post) => {
            const date = formatDate(post.created_at);
            return `
                <div class="post-card">
                    <div class="post-image">
                        <img src="${resolveImage(post.cover_image, 'images2/A2.avif')}" alt="${escapeHtml(post.title)}" loading="lazy">
                        <div class="post-date">
                            <span class="day">${date.day}</span>
                            <span class="month">${date.month}</span>
                            <span class="year">${date.year}</span>
                        </div>
                    </div>
                    <div class="post-content">
                        <div class="post-meta">
                            <span class="category">${escapeHtml(post.category || 'General')}</span>
                            <span class="read-time"><i class="fas fa-clock"></i> 5 min read</span>
                        </div>
                        <h3>${escapeHtml(post.title)}</h3>
                        <p>${escapeHtml(post.excerpt || '')}</p>
                        <a href="${resolvePostLink(post)}" class="btn read-more">Read More</a>
                    </div>
                </div>
            `;
        }).join('');
        html += '</div>';
    }

    html += `
        <div class="blog-pagination">
            <a href="${blogLink('blog.html')}">1</a>
            <a href="${blogLink('blog/blog-page2.html')}">2</a>
            <a href="${blogLink('blog/blog-page3.html')}">3</a>
            <a href="${blogLink('blog/blog-page2.html')}" class="next-page"><i class="fas fa-chevron-right"></i></a>
        </div>
    `;

    container.innerHTML = html;
}

function categoryMatches(postCategory, targetCategory) {
    const category = postCategory.toLowerCase().trim();
    const target = targetCategory.toLowerCase().trim();

    switch (target) {
        case 'computers':
            return category.includes('computer') || category.includes('pc') || category.includes('laptop') || category.includes('upgrades') || category.includes('classic tech');
        case 'smartphones':
            return category.includes('smartphone') || category.includes('phone') || category.includes('mobile');
        case 'maintenance':
            return category.includes('maintenance') || category.includes('care') || category.includes('cleaning');
        case 'diy':
            return category.includes('diy') || category.includes('repair') || category.includes('emergency repair') || category.includes('projects');
        case 'tech-news':
            return category.includes('tech news') || category.includes('news') || category.includes('tech reviews') || category.includes('reviews');
        default:
            return category === target || category.includes(target) || target.includes(category);
    }
}

function initBlogFilters() {
    const categoryToggle = document.querySelector('.blog-nav-toggle');
    const categoryList = document.querySelector('.blog-category-list');
    const searchInputs = Array.from(document.querySelectorAll('#blog-search, #blog-search-mobile'));
    const featuredPost = document.querySelector('.featured-post');

    categoryToggle?.addEventListener('click', () => {
        const expanded = categoryList?.classList.toggle('active');
        categoryToggle.classList.toggle('active', Boolean(expanded));
        categoryToggle.setAttribute('aria-expanded', String(Boolean(expanded)));
    });

    const filterPosts = ({ searchTerm = '', category = 'all' } = {}) => {
        const normalizedSearch = searchTerm.toLowerCase().trim();
        const cards = Array.from(document.querySelectorAll('.post-card'));

        const shouldShowNode = (node) => {
            const categoryNode = node.querySelector('.category');
            const titleNode = node.querySelector('h2, h3');
            const excerptNode = node.querySelector('p');
            const categoryText = categoryNode?.textContent || '';
            const searchMatch = !normalizedSearch || [titleNode?.textContent, excerptNode?.textContent, categoryText]
                .some((value) => String(value || '').toLowerCase().includes(normalizedSearch));
            const categoryMatch = category === 'all' || categoryMatches(categoryText, category);
            return searchMatch && categoryMatch;
        };

        if (featuredPost) {
            featuredPost.style.display = shouldShowNode(featuredPost) ? 'block' : 'none';
        }

        cards.forEach((card) => {
            card.style.display = shouldShowNode(card) ? 'block' : 'none';
        });
    };

    searchInputs.forEach((input) => {
        input?.addEventListener('input', () => {
            searchInputs.forEach((otherInput) => {
                if (otherInput !== input) {
                    otherInput.value = input.value;
                }
            });

            document.querySelectorAll('.blog-category-list li').forEach((item) => item.classList.remove('active'));
            document.querySelector('.blog-category-list li a[href="#all"]')?.parentElement?.classList.add('active');
            filterPosts({ searchTerm: input.value, category: 'all' });
        });
    });

    document.querySelectorAll('.blog-category-list li a').forEach((link) => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const category = (link.getAttribute('href') || '#all').slice(1);
            document.querySelectorAll('.blog-category-list li').forEach((item) => item.classList.remove('active'));
            link.parentElement?.classList.add('active');
            searchInputs.forEach((input) => {
                input.value = '';
            });
            filterPosts({ searchTerm: '', category });

            if (categoryList?.classList.contains('active') && window.innerWidth <= 768) {
                categoryList.classList.remove('active');
                categoryToggle?.classList.remove('active');
            }

            document.querySelector('.blog-posts')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
}

async function bootstrapBlogListingPage() {
    await initUi();
    initSiteChrome();
    initAos();
    initBackToTop();
    bindNewsletterForm({
        formSelector: '#blogNewsletterForm',
        emailSelector: '#blogNewsletterEmail',
        messageSelector: '#blogNewsletterMessage',
        loadingLabel: 'Subscribing...',
        idleLabel: 'Subscribe'
    });

    try {
        const posts = await fetchPublishedBlogPosts();
        if (posts.length) {
            renderPosts(posts);
        }
    } catch {
        // Preserve static markup if the remote fetch fails.
    }

    initBlogFilters();
}

onReady(() => {
    bootstrapBlogListingPage();
});

export { bootstrapBlogListingPage };