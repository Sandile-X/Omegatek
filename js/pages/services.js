import { bindNewsletterForm, initUi } from '../ui.js';
import { initAos, initSiteChrome, onReady } from '../site-shell.js';

async function bootstrapServicesPage() {
    await initUi();
    initSiteChrome();
    initAos();
    bindNewsletterForm();
}

onReady(() => {
    bootstrapServicesPage();
});

export { bootstrapServicesPage };