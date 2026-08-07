import { initUi, bindNewsletterForm } from '../ui.js';
import { initAos, initSiteChrome, onReady } from '../site-shell.js';

async function bootstrapAudioSoftwarePage() {
    await initUi();
    initSiteChrome();
    initAos({ offset: 80 });
    bindNewsletterForm();
}

onReady(() => {
    bootstrapAudioSoftwarePage();
});

export { bootstrapAudioSoftwarePage };
