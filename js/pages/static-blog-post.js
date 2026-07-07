import { bindNewsletterForm } from '../ui.js';
import { initAos, initBackToTop, initSiteChrome, onReady } from '../site-shell.js';

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

async function bootstrapStaticBlogPost() {
    initSiteChrome();
    initAos({ duration: 1000, offset: 100 });
    initBackToTop();
    bindNewsletterForm();
    bindShareActions();
}

onReady(() => {
    bootstrapStaticBlogPost();
});

export { bootstrapStaticBlogPost };