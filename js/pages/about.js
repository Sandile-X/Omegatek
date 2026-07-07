import { bindNewsletterForm, initUi } from '../ui.js';
import { initAos, initRevealOnScroll, initSiteChrome, onReady } from '../site-shell.js';

async function bootstrapAboutPage() {
    await initUi();
    initSiteChrome();
    initAos();
    bindNewsletterForm();
    initRevealOnScroll('.timeline-item');
}

onReady(() => {
    bootstrapAboutPage();
});

export { bootstrapAboutPage };