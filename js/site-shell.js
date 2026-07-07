function asArray(value) {
    if (Array.isArray(value)) {
        return value;
    }

    if (!value) {
        return [];
    }

    return [value];
}

function queryAll(selectors) {
    return asArray(selectors).flatMap((selector) => Array.from(document.querySelectorAll(selector)));
}

export function onReady(callback) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback, { once: true });
        return;
    }

    callback();
}

export function initAos(options = {}) {
    if (!window.AOS) {
        return;
    }

    window.AOS.init({
        duration: 800,
        easing: 'ease-out-cubic',
        once: true,
        offset: 100,
        ...options
    });
}

export function refreshAos() {
    if (!window.AOS) {
        return;
    }

    if (typeof window.AOS.refreshHard === 'function') {
        window.AOS.refreshHard();
        return;
    }

    if (typeof window.AOS.refresh === 'function') {
        window.AOS.refresh();
    }
}

export function initSiteChrome(options = {}) {
    const {
        menuButtonSelector = '#menu-btn',
        linksSelector = '.header .navbar .links',
        navbarSelector = '.header .navbar',
        progressBarId = 'site-scroll-progress',
        enableProgressBar = true,
        smoothLinkSelector = '.navbar .links a, .footer .link, a[href^="#"]'
    } = options;

    const menuButton = document.querySelector(menuButtonSelector);
    const navbarLinks = document.querySelector(linksSelector);
    const navbar = document.querySelector(navbarSelector);

    if (menuButton && navbarLinks && !document.getElementById('site-menu-backdrop')) {
        const backdrop = document.createElement('div');
        backdrop.id = 'site-menu-backdrop';
        backdrop.className = 'mobile-menu-backdrop';
        backdrop.style.cssText = [
            'position:fixed',
            'inset:0',
            'background:rgba(0,0,0,0.45)',
            'backdrop-filter:blur(8px)',
            '-webkit-backdrop-filter:blur(8px)',
            'z-index:999',
            'opacity:0',
            'pointer-events:none',
            'transition:opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        ].join(';');
        document.body.appendChild(backdrop);

        const syncMenuState = () => {
            const isOpen = navbarLinks.classList.contains('active');
            menuButton.classList.toggle('fa-times', isOpen);
            backdrop.style.opacity = isOpen ? '1' : '0';
            backdrop.style.pointerEvents = isOpen ? 'auto' : 'none';
            document.body.style.overflow = isOpen ? 'hidden' : '';
        };

        menuButton.addEventListener('click', () => {
            navbarLinks.classList.toggle('active');
            syncMenuState();
        });

        backdrop.addEventListener('click', () => {
            navbarLinks.classList.remove('active');
            syncMenuState();
        });

        navbarLinks.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => {
                navbarLinks.classList.remove('active');
                syncMenuState();
            });
        });

        syncMenuState();
    }

    const updateNavbarState = () => {
        if (!navbar) {
            return;
        }

        navbar.classList.toggle('active', window.scrollY > 60);
        navbar.classList.toggle('scrolled', window.scrollY > 100);
    };

    updateNavbarState();
    window.addEventListener('scroll', updateNavbarState, { passive: true });

    if (enableProgressBar && !document.getElementById(progressBarId)) {
        const progressBar = document.createElement('div');
        progressBar.id = progressBarId;
        progressBar.style.cssText = [
            'position:fixed',
            'top:0',
            'left:0',
            'width:0%',
            'height:4px',
            'background:linear-gradient(90deg, #b30ce6, #9333ea, #7c3aed)',
            'z-index:10000',
            'transition:width 0.1s ease',
            'box-shadow:0 2px 8px rgba(179, 12, 230, 0.4)'
        ].join(';');
        document.body.appendChild(progressBar);

        window.addEventListener('scroll', () => {
            const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const percent = scrollHeight > 0 ? (window.scrollY / scrollHeight) * 100 : 0;
            progressBar.style.width = `${percent}%`;
        }, { passive: true });
    }

    queryAll(smoothLinkSelector).forEach((link) => {
        if (link.dataset.smoothBound === 'true') {
            return;
        }

        const href = link.getAttribute('href') || '';
        if (!href.startsWith('#') || href === '#') {
            return;
        }

        link.dataset.smoothBound = 'true';
        link.addEventListener('click', (event) => {
            const target = document.querySelector(href);
            if (!target) {
                return;
            }

            event.preventDefault();
            const offset = navbar?.offsetHeight || 0;
            const top = target.getBoundingClientRect().top + window.scrollY - offset - 20;
            window.scrollTo({ top, behavior: 'smooth' });
        });
    });
}

export function initLightGallery(selector) {
    if (typeof window.lightGallery !== 'function') {
        return;
    }

    const target = document.querySelector(selector);
    if (!target || target.dataset.galleryBound === 'true') {
        return;
    }

    target.dataset.galleryBound = 'true';
    window.lightGallery(target);
}

export function initHeroVideoFallback(selector = '.hero-video-bg') {
    const video = document.querySelector(selector);
    if (!video) {
        return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth <= 768;
    const isSlowConnection = Boolean(
        navigator.connection?.effectiveType &&
        ['slow-2g', '2g'].includes(navigator.connection.effectiveType)
    );

    if (isMobile || isSlowConnection || prefersReducedMotion) {
        video.style.display = 'none';
        return;
    }

    video.playbackRate = 1;
    video.volume = 0;

    video.addEventListener('error', () => {
        video.style.display = 'none';
    });

    if (!('IntersectionObserver' in window)) {
        void video.play().catch(() => {});
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                void video.play().catch(() => {});
                return;
            }

            video.pause();
        });
    }, { threshold: 0.1 });

    observer.observe(video);
}

export function initBackToTop(selector = '.back-to-top, #scrollToTop', threshold = 400) {
    const buttons = queryAll(selector);
    if (!buttons.length) {
        return;
    }

    const updateVisibility = () => {
        const visible = window.scrollY > threshold;

        buttons.forEach((button) => {
            if (button.classList.contains('hidden')) {
                button.classList.toggle('hidden', !visible);
                return;
            }

            button.style.display = visible ? 'flex' : 'none';
        });
    };

    buttons.forEach((button) => {
        if (button.dataset.backToTopBound === 'true') {
            return;
        }

        button.dataset.backToTopBound = 'true';
        button.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });
}

export function initMagneticHover(selectors, options = {}) {
    const {
        strength = 0.1,
        scale = 1.05
    } = options;

    queryAll(selectors).forEach((element) => {
        if (element.dataset.magneticBound === 'true') {
            return;
        }

        element.dataset.magneticBound = 'true';
        element.addEventListener('mousemove', (event) => {
            const rect = element.getBoundingClientRect();
            const x = event.clientX - rect.left - rect.width / 2;
            const y = event.clientY - rect.top - rect.height / 2;
            element.style.transform = `translate(${x * strength}px, ${y * strength}px) scale(${scale})`;
        });
        element.addEventListener('mouseleave', () => {
            element.style.transform = 'translate(0px, 0px) scale(1)';
        });
    });
}

export function initTiltHover(selectors, options = {}) {
    const {
        rotateDivisor = 20,
        perspective = 1000,
        scale = 1,
        boxShadow = ''
    } = options;

    queryAll(selectors).forEach((element) => {
        if (element.dataset.tiltBound === 'true') {
            return;
        }

        element.dataset.tiltBound = 'true';
        element.addEventListener('mousemove', (event) => {
            const rect = element.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / rotateDivisor;
            const rotateY = (centerX - x) / rotateDivisor;
            element.style.transform = `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`;
            if (boxShadow) {
                element.style.boxShadow = boxShadow;
            }
        });

        element.addEventListener('mouseleave', () => {
            element.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
            if (boxShadow) {
                element.style.boxShadow = '';
            }
        });
    });
}

export function initCursorGlow(selector = '#cursorGlow') {
    const glow = document.querySelector(selector);
    if (!glow || window.matchMedia('(hover: none)').matches) {
        return;
    }

    document.addEventListener('mousemove', (event) => {
        glow.style.left = `${event.clientX}px`;
        glow.style.top = `${event.clientY}px`;
    });

    document.addEventListener('mouseleave', () => {
        glow.style.opacity = '0';
    });

    document.addEventListener('mouseenter', () => {
        glow.style.opacity = '1';
    });
}

export function initCountUpOnView(options = {}) {
    const {
        sectionSelector = '.fun-fact',
        counterSelector = '.fun-fact .box h3',
        duration = 1800
    } = options;

    const counters = queryAll(counterSelector);
    const section = document.querySelector(sectionSelector);
    if (!counters.length || !section) {
        return;
    }

    let animated = false;

    const animateCounters = () => {
        if (animated) {
            return;
        }

        counters.forEach((element) => {
            const target = Number.parseInt(element.textContent, 10);
            if (Number.isNaN(target)) {
                return;
            }

            element.textContent = '0';
            let startTime = null;
            const step = (timestamp) => {
                if (!startTime) {
                    startTime = timestamp;
                }

                const progress = Math.min((timestamp - startTime) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                element.textContent = Math.floor(eased * target).toString();
                if (progress < 1) {
                    window.requestAnimationFrame(step);
                    return;
                }

                element.textContent = target.toString();
            };

            window.requestAnimationFrame(step);
        });

        animated = true;
    };

    if (!('IntersectionObserver' in window)) {
        animateCounters();
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) {
                return;
            }

            animateCounters();
            observer.disconnect();
        });
    }, { threshold: 0.3 });

    observer.observe(section);
}

export function initRevealOnScroll(selector, options = {}) {
    const {
        className = 'animate',
        threshold = 0.12,
        once = true
    } = options;

    const elements = queryAll(selector);
    if (!elements.length) {
        return;
    }

    if (!('IntersectionObserver' in window)) {
        elements.forEach((element) => element.classList.add(className));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) {
                return;
            }

            entry.target.classList.add(className);
            if (once) {
                observer.unobserve(entry.target);
            }
        });
    }, { threshold });

    elements.forEach((element) => observer.observe(element));
}