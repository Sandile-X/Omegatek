/**
 * Cookie Consent Banner - GDPR/POPIA Compliant
 * Phase 2: Legal & Compliance
 */

(function() {
    'use strict';
    
    const COOKIE_NAME = 'omegatek_cookie_consent';
    const COOKIE_EXPIRY_DAYS = 365;
    
    // Cookie categories
    const cookieCategories = {
        necessary: {
            required: true,
            name: 'Necessary',
            description: 'Essential cookies for website functionality',
            cookies: ['session_id', 'csrf_token', 'omegatek_cookie_consent']
        },
        analytics: {
            required: false,
            name: 'Analytics',
            description: 'Help us understand how visitors use our website',
            cookies: ['_ga', '_gid', '_gat']
        },
        marketing: {
            required: false,
            name: 'Marketing',
            description: 'Used to track visitors across websites for marketing',
            cookies: ['_fbp', 'fr']
        }
    };
    
    // Check if consent already given
    function getCookieConsent() {
        const consent = getCookie(COOKIE_NAME);
        return consent ? JSON.parse(consent) : null;
    }
    
    // Set cookie helper
    function setCookie(name, value, days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = 'expires=' + date.toUTCString();
        document.cookie = name + '=' + value + ';' + expires + ';path=/;SameSite=Lax';
    }
    
    // Get cookie helper
    function getCookie(name) {
        const nameEQ = name + '=';
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }
    
    // Delete cookie helper
    function deleteCookie(name) {
        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/';
    }
    
    // Save consent
    function saveConsent(preferences) {
        const consent = {
            necessary: true, // Always true
            analytics: preferences.analytics || false,
            marketing: preferences.marketing || false,
            timestamp: new Date().toISOString()
        };
        
        setCookie(COOKIE_NAME, JSON.stringify(consent), COOKIE_EXPIRY_DAYS);
        
        // Apply consent settings
        applyConsent(consent);
        
        return consent;
    }
    
    // Apply consent settings
    function applyConsent(consent) {
        // If analytics not consented, remove analytics cookies
        if (!consent.analytics) {
            deleteCookie('_ga');
            deleteCookie('_gid');
            deleteCookie('_gat');
        }
        
        // If marketing not consented, remove marketing cookies
        if (!consent.marketing) {
            deleteCookie('_fbp');
            deleteCookie('fr');
        }
        
        // Dispatch event for other scripts to listen to
        window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { detail: consent }));
    }
    
    // Create banner HTML
    function createBanner() {
        const banner = document.createElement('div');
        banner.id = 'cookie-consent-banner';
        banner.className = 'cookie-consent-banner';
        banner.innerHTML = `
            <div class="cookie-consent-container">
                <div class="cookie-consent-content">
                    <div class="cookie-icon">
                        <i class="fas fa-cookie-bite"></i>
                    </div>
                    <div class="cookie-text">
                        <h3>We value your privacy</h3>
                        <p>We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies. You can manage your preferences or learn more in our <a href="privacy-policy.html" target="_blank">Privacy Policy</a>.</p>
                    </div>
                </div>
                <div class="cookie-consent-actions">
                    <button class="cookie-btn cookie-btn-settings" id="cookie-settings-btn">
                        <i class="fas fa-cog"></i> Manage Preferences
                    </button>
                    <button class="cookie-btn cookie-btn-reject" id="cookie-reject-btn">
                        Reject All
                    </button>
                    <button class="cookie-btn cookie-btn-accept" id="cookie-accept-btn">
                        Accept All
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(banner);
        
        // Add event listeners
        document.getElementById('cookie-accept-btn').addEventListener('click', acceptAll);
        document.getElementById('cookie-reject-btn').addEventListener('click', rejectAll);
        document.getElementById('cookie-settings-btn').addEventListener('click', showSettings);
        
        // Animate in
        setTimeout(() => banner.classList.add('show'), 100);
    }
    
    // Create settings modal
    function createSettingsModal() {
        const modal = document.createElement('div');
        modal.id = 'cookie-settings-modal';
        modal.className = 'cookie-settings-modal';
        modal.innerHTML = `
            <div class="cookie-modal-backdrop"></div>
            <div class="cookie-modal-content">
                <div class="cookie-modal-header">
                    <h2><i class="fas fa-cookie-bite"></i> Cookie Preferences</h2>
                    <button class="cookie-modal-close" id="cookie-modal-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="cookie-modal-body">
                    <p class="cookie-modal-intro">We use different types of cookies to optimize your experience on our website. You can choose which categories you want to allow.</p>
                    
                    <div class="cookie-category">
                        <div class="cookie-category-header">
                            <div class="cookie-category-info">
                                <h3><i class="fas fa-check-circle"></i> Necessary Cookies</h3>
                                <p>These cookies are essential for the website to function properly. They cannot be disabled.</p>
                            </div>
                            <label class="cookie-toggle">
                                <input type="checkbox" checked disabled>
                                <span class="cookie-toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="cookie-category">
                        <div class="cookie-category-header">
                            <div class="cookie-category-info">
                                <h3><i class="fas fa-chart-line"></i> Analytics Cookies</h3>
                                <p>Help us understand how visitors interact with our website by collecting and reporting information anonymously.</p>
                            </div>
                            <label class="cookie-toggle">
                                <input type="checkbox" id="analytics-toggle">
                                <span class="cookie-toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="cookie-category">
                        <div class="cookie-category-header">
                            <div class="cookie-category-info">
                                <h3><i class="fas fa-bullhorn"></i> Marketing Cookies</h3>
                                <p>Used to track visitors across websites to display relevant advertisements and measure campaign effectiveness.</p>
                            </div>
                            <label class="cookie-toggle">
                                <input type="checkbox" id="marketing-toggle">
                                <span class="cookie-toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                </div>
                <div class="cookie-modal-footer">
                    <button class="cookie-btn cookie-btn-secondary" id="cookie-save-settings">
                        Save Preferences
                    </button>
                    <button class="cookie-btn cookie-btn-accept" id="cookie-accept-all-modal">
                        Accept All
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listeners
        document.getElementById('cookie-modal-close').addEventListener('click', closeModal);
        document.querySelector('.cookie-modal-backdrop').addEventListener('click', closeModal);
        document.getElementById('cookie-save-settings').addEventListener('click', saveSettings);
        document.getElementById('cookie-accept-all-modal').addEventListener('click', acceptAllFromModal);
        
        // Show modal
        setTimeout(() => modal.classList.add('show'), 100);
    }
    
    // Accept all cookies
    function acceptAll() {
        saveConsent({ analytics: true, marketing: true });
        hideBanner();
    }
    
    // Reject all non-essential cookies
    function rejectAll() {
        saveConsent({ analytics: false, marketing: false });
        hideBanner();
    }
    
    // Show settings modal
    function showSettings() {
        const existingModal = document.getElementById('cookie-settings-modal');
        if (existingModal) {
            existingModal.remove();
        }
        createSettingsModal();
        
        // Load current preferences
        const consent = getCookieConsent();
        if (consent) {
            document.getElementById('analytics-toggle').checked = consent.analytics;
            document.getElementById('marketing-toggle').checked = consent.marketing;
        }
    }
    
    // Close settings modal
    function closeModal() {
        const modal = document.getElementById('cookie-settings-modal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }
    }
    
    // Save custom settings
    function saveSettings() {
        const preferences = {
            analytics: document.getElementById('analytics-toggle').checked,
            marketing: document.getElementById('marketing-toggle').checked
        };
        
        saveConsent(preferences);
        closeModal();
        hideBanner();
    }
    
    // Accept all from modal
    function acceptAllFromModal() {
        saveConsent({ analytics: true, marketing: true });
        closeModal();
        hideBanner();
    }
    
    // Hide banner
    function hideBanner() {
        const banner = document.getElementById('cookie-consent-banner');
        if (banner) {
            banner.classList.remove('show');
            setTimeout(() => banner.remove(), 300);
        }
    }
    
    // Initialize
    function init() {
        // Check if consent already given
        const consent = getCookieConsent();
        
        if (!consent) {
            // Show banner if no consent
            createBanner();
        } else {
            // Apply existing consent
            applyConsent(consent);
        }
    }
    
    // Public API
    window.OmegatekCookieConsent = {
        getConsent: getCookieConsent,
        showSettings: showSettings,
        resetConsent: function() {
            deleteCookie(COOKIE_NAME);
            location.reload();
        }
    };
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
