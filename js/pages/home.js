import { bindNewsletterForm, initUi } from '../ui.js';
import {
    initAos,
    initBackToTop,
    initCountUpOnView,
    initCursorGlow,
    initHeroVideoFallback,
    initLightGallery,
    initMagneticHover,
    initRevealOnScroll,
    initSiteChrome,
    initTiltHover,
    onReady,
    refreshAos
} from '../site-shell.js';

function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) {
        return;
    }

    contactForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const userName = document.getElementById('name')?.value.trim() || '';
        const userPhone = document.getElementById('phone')?.value.trim() || '';
        const userMessage = document.getElementById('message')?.value.trim() || '';

        if (!userName || !userPhone || !userMessage) {
            window.alert('All fields are required!');
            return;
        }

        const whatsappUrl = `https://wa.me/27736538207?text=Name:%20${encodeURIComponent(userName)}%0APhone:%20${encodeURIComponent(userPhone)}%0AMessage:%20${encodeURIComponent(userMessage)}`;
        window.open(whatsappUrl, '_blank');
        contactForm.reset();
    });
}

function initTypewriter() {
    const typewriterElement = document.querySelector('.typewriter h2');
    if (!typewriterElement) {
        return;
    }

    const textLength = typewriterElement.textContent.length;
    const typingDuration = Math.max(3.5, textLength * 0.15);
    const erasingDuration = typingDuration * 0.6;
    const pauseDuration = 2000;

    const animate = () => {
        typewriterElement.style.width = '0';
        typewriterElement.style.animation = `typing ${typingDuration}s steps(${textLength}, end) forwards, blinkCursor 0.75s step-end infinite`;

        window.setTimeout(() => {
            typewriterElement.style.width = '100%';
            typewriterElement.style.animation = 'blinkCursor 0.75s step-end infinite';

            window.setTimeout(() => {
                typewriterElement.style.animation = `erasing ${erasingDuration}s steps(${textLength}, end) forwards, blinkCursor 0.75s step-end infinite`;

                window.setTimeout(() => {
                    animate();
                }, (erasingDuration * 1000) + 500);
            }, pauseDuration);
        }, typingDuration * 1000);
    };

    animate();
}

function initBookingModal() {
    const modal = document.getElementById('bookingModal');
    const openButton = document.getElementById('openBooking');
    const closeButton = document.querySelector('.close-modal');
    const dateInput = document.getElementById('preferredDate');
    const bookingForm = document.getElementById('bookingForm');
    const serviceTypeSelect = document.getElementById('serviceType');
    if (!modal) {
        return;
    }

    if (dateInput) {
        dateInput.setAttribute('min', new Date().toISOString().split('T')[0]);
    }

    const openModal = (presetIndex = null) => {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        if (serviceTypeSelect && Number.isInteger(presetIndex) && serviceTypeSelect.options[presetIndex]) {
            serviceTypeSelect.selectedIndex = presetIndex;
        }
    };

    const closeModal = () => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    };

    openButton?.addEventListener('click', () => openModal());
    closeButton?.addEventListener('click', closeModal);

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    [
        { selector: '#basicRepairBtn', index: 2 },
        { selector: '#standardRepairBtn', index: 1 },
        { selector: '#premiumRepairBtn', index: 4 }
    ].forEach(({ selector, index }) => {
        document.querySelector(selector)?.addEventListener('click', () => openModal(index));
    });

    bookingForm?.addEventListener('submit', (event) => {
        event.preventDefault();

        const name = document.getElementById('bookingName')?.value.trim() || '';
        const phone = document.getElementById('bookingPhone')?.value.trim() || '';
        const serviceType = document.getElementById('serviceType')?.value || '';
        const preferredDate = document.getElementById('preferredDate')?.value || '';
        const preferredTime = document.getElementById('preferredTime')?.value || '';
        const issueDescription = document.getElementById('issueDescription')?.value.trim() || '';

        const message = [
            '*New Booking Request*',
            `Name: ${name}`,
            `Phone: ${phone}`,
            `Service: ${serviceType}`,
            `Date: ${preferredDate}`,
            `Time: ${preferredTime}`,
            `Description: ${issueDescription}`
        ].join('\n');

        window.open(`https://wa.me/27736538207?text=${encodeURIComponent(message)}`, '_blank');
        closeModal();
        bookingForm.reset();
        window.alert("Booking request sent! We'll confirm your appointment shortly.");
    });
}

function initReviewsSlider() {
    const reviewsSlides = Array.from(document.querySelectorAll('.reviews-slide'));
    const navigationDots = Array.from(document.querySelectorAll('.reviews-nav .dot'));
    if (!reviewsSlides.length || !navigationDots.length) {
        return;
    }

    let currentSlide = 0;
    let intervalId = null;

    const showSlide = (slideIndex) => {
        reviewsSlides.forEach((slide) => slide.classList.remove('active'));
        navigationDots.forEach((dot) => dot.classList.remove('active'));
        reviewsSlides[slideIndex]?.classList.add('active');
        navigationDots[slideIndex]?.classList.add('active');
        currentSlide = slideIndex;
    };

    const nextSlide = () => {
        showSlide((currentSlide + 1) % reviewsSlides.length);
    };

    const start = () => {
        intervalId = window.setInterval(nextSlide, 90000);
    };

    const stop = () => {
        window.clearInterval(intervalId);
    };

    navigationDots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            stop();
            showSlide(index);
            start();
        });
    });

    document.querySelector('.reviews-container')?.addEventListener('mouseenter', stop);
    document.querySelector('.reviews-container')?.addEventListener('mouseleave', start);

    showSlide(0);
    start();
}

function activatePortfolioTab(tabName, scrollIntoView = false) {
    document.querySelectorAll('.portfolio-tab-btn').forEach((button) => {
        button.classList.toggle('active', button.dataset.tab === tabName);
    });

    document.querySelectorAll('.portfolio-tab-content').forEach((panel) => {
        panel.classList.remove('active');
    });

    const targetPanel = document.getElementById(`tab-${tabName}`);
    if (targetPanel) {
        targetPanel.classList.add('active');
        refreshAos();
    }

    if (scrollIntoView) {
        document.getElementById('portfolio')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function initPortfolioTabs() {
    document.querySelectorAll('.portfolio-tab-btn').forEach((button) => {
        button.addEventListener('click', () => {
            activatePortfolioTab(button.dataset.tab || 'android', false);
        });
    });

    document.querySelectorAll('[data-portfolio-target]').forEach((link) => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            activatePortfolioTab(link.dataset.portfolioTarget || 'android', true);
        });
    });
}

function initFrameSequence() {
    const section = document.getElementById('subhero-section');
    const sticky = document.getElementById('subhero-sticky');
    const canvas = document.getElementById('subhero-canvas');
    const cta = document.getElementById('subhero-cta');
    const cards = Array.from(document.querySelectorAll('.sh-card'));
    if (!section || !sticky || !canvas || !cta || !cards.length) {
        return;
    }

    const frameCount = 96;
    const frames = new Array(frameCount);
    const context = canvas.getContext('2d');
    let canvasWidth = 0;
    let canvasHeight = 0;
    let currentFrame = 0;
    let loadedCount = 0;
    let rafPending = false;
    let scrollProgress = 0;

    const drawFrame = (index) => {
        const image = frames[index];
        if (!image || !canvasWidth || !context) {
            return;
        }

        const width = image.naturalWidth || 1280;
        const height = image.naturalHeight || 720;
        const scale = Math.max(canvasWidth / width, canvasHeight / height);
        const drawWidth = width * scale;
        const drawHeight = height * scale;
        const drawX = (canvasWidth - drawWidth) / 2;
        const drawY = (canvasHeight - drawHeight) / 2;
        context.clearRect(0, 0, canvasWidth, canvasHeight);
        context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
    };

    const resizeCanvas = () => {
        canvasWidth = window.innerWidth;
        canvasHeight = window.innerHeight;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        drawFrame(currentFrame);
    };

    const render = () => {
        rafPending = false;
        const frameIndex = Math.min(frameCount - 1, Math.floor(scrollProgress * frameCount));
        if (frameIndex !== currentFrame) {
            currentFrame = frameIndex;
            drawFrame(currentFrame);
        }

        cards.forEach((card) => {
            const show = Number.parseFloat(card.dataset.show);
            const hide = Number.parseFloat(card.dataset.hide);
            card.classList.toggle('visible', scrollProgress >= show && scrollProgress < hide);
        });

        cta.classList.toggle('visible', scrollProgress >= 0.92);
    };

    const onScroll = () => {
        const sectionHeight = section.offsetHeight - window.innerHeight;
        scrollProgress = Math.max(0, Math.min(1, -section.getBoundingClientRect().top / sectionHeight));
        if (!rafPending) {
            rafPending = true;
            window.requestAnimationFrame(render);
        }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            const isIntersecting = entries[0]?.isIntersecting;
            sticky.classList.toggle('sh-active', Boolean(isIntersecting));

            if (isIntersecting) {
                return;
            }

            cards.forEach((card) => card.classList.remove('visible'));
            cta.classList.remove('visible');
        }, { threshold: 0 });

        observer.observe(section);
    }

    // Frames are ~12MB total — don't pull them on every homepage load.
    // Start fetching only once the section is within a screen's reach,
    // so a visitor who never scrolls this far never pays for it.
    let framesLoading = false;
    const loadFrames = () => {
        if (framesLoading) {
            return;
        }
        framesLoading = true;

        for (let index = 0; index < frameCount; index += 1) {
            const image = new Image();
            image.decoding = 'async';
            image.src = `demo/frames/frame_${String(index + 1).padStart(4, '0')}.jpg`;
            image.onload = () => {
                frames[index] = image;
                loadedCount += 1;
                if (loadedCount === 1) {
                    drawFrame(0);
                }
            };
            image.onerror = () => {
                loadedCount += 1;
            };
        }
    };

    if ('IntersectionObserver' in window) {
        const preloadObserver = new IntersectionObserver((entries) => {
            if (entries[0]?.isIntersecting) {
                loadFrames();
                preloadObserver.disconnect();
            }
        }, { rootMargin: '600px 0px' });

        preloadObserver.observe(section);
    } else {
        // No IntersectionObserver support — fall back to loading immediately.
        loadFrames();
    }
}

function initGlassCards() {
    document.querySelectorAll('.services .box-container .box').forEach((box) => {
        box.classList.add('glass-card');
    });
}

async function bootstrapHomePage() {
    await initUi();
    initSiteChrome();
    initAos();
    bindNewsletterForm();
    initLightGallery('.gallery .gallery-container');
    initHeroVideoFallback('.hero-video-bg');
    initBackToTop();
    initTypewriter();
    initContactForm();
    initBookingModal();
    initReviewsSlider();
    initPortfolioTabs();
    initFrameSequence();
    initCursorGlow('#cursorGlow');
    initGlassCards();
    initRevealOnScroll('.slide-in-on-scroll', { className: 'slide-in-visible' });
    initRevealOnScroll('.services .box-container .box, .glass-card');
    initCountUpOnView();
    initMagneticHover(['.book-btn', '.floating-button button']);
    initTiltHover('.services .box', {
        rotateDivisor: 10,
        scale: 1.05,
        boxShadow: '0 20px 40px rgba(179, 12, 230, 0.3)'
    });
    initTiltHover('.price-box', {
        rotateDivisor: 20,
        scale: 1.02
    });
}

onReady(() => {
    bootstrapHomePage();
});

export { activatePortfolioTab, bootstrapHomePage };