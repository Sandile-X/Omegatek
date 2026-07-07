import { bindNewsletterForm, initUi } from '../ui.js';
import { initAos, initRevealOnScroll, initSiteChrome, onReady } from '../site-shell.js';

function initShowcaseSlider() {
    const slides = Array.from(document.querySelectorAll('.showcase-slider .slide'));
    const dots = Array.from(document.querySelectorAll('.slider-navigation .nav-dot'));
    if (!slides.length || !dots.length) {
        return;
    }

    let currentSlide = 0;
    let intervalId = null;

    const showSlide = (index) => {
        slides.forEach((slide) => slide.classList.remove('active'));
        dots.forEach((dot) => dot.classList.remove('active'));
        slides[index]?.classList.add('active');
        dots[index]?.classList.add('active');
        currentSlide = index;
    };

    const nextSlide = () => {
        showSlide((currentSlide + 1) % slides.length);
    };

    const stop = () => window.clearInterval(intervalId);
    const start = () => {
        stop();
        intervalId = window.setInterval(nextSlide, 5000);
    };

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            showSlide(index);
            start();
        });
    });

    showSlide(0);
    start();
}

function initPortfolioFilter() {
    const filterButtons = Array.from(document.querySelectorAll('.portfolio-filter .filter-btn'));
    const portfolioItems = Array.from(document.querySelectorAll('.portfolio-item'));
    if (!filterButtons.length || !portfolioItems.length) {
        return;
    }

    filterButtons.forEach((button) => {
        button.addEventListener('click', () => {
            filterButtons.forEach((entry) => entry.classList.remove('active'));
            button.classList.add('active');

            const filter = button.dataset.filter || 'all';
            portfolioItems.forEach((item) => {
                const shouldShow = filter === 'all' || item.classList.contains(filter);
                item.style.opacity = shouldShow ? '1' : '0';
                item.style.transform = shouldShow ? 'scale(1)' : 'scale(0.8)';
                window.setTimeout(() => {
                    item.style.display = shouldShow ? 'block' : 'none';
                }, shouldShow ? 50 : 300);
            });
        });
    });
}

function initQuoteForm() {
    const quoteForm = document.getElementById('quoteForm');
    if (!quoteForm) {
        return;
    }

    quoteForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const name = document.getElementById('name')?.value.trim() || '';
        const email = document.getElementById('email')?.value.trim() || '';
        const phone = document.getElementById('phone')?.value.trim() || '';
        const projectType = document.getElementById('projectType')?.value || '';
        const budget = document.getElementById('budget')?.value || '';
        const projectDescription = document.getElementById('projectDescription')?.value.trim() || '';

        if (!name || !email || !phone || !projectType || !budget || !projectDescription) {
            window.alert('Please fill in all required fields.');
            return;
        }

        const whatsappMessage = [
            '*Web Development Quote Request*',
            `Name: ${name}`,
            `Email: ${email}`,
            `Phone: ${phone}`,
            `Project Type: ${projectType}`,
            `Budget Range: ${budget}`,
            `Project Description: ${projectDescription}`
        ].join('\n');

        window.open(`https://wa.me/27736538207?text=${encodeURIComponent(whatsappMessage)}`, '_blank');
        window.alert('Quote request sent! We will contact you shortly to discuss your project in detail.');
        quoteForm.reset();
    });
}

async function bootstrapWebdevPage() {
    await initUi();
    initSiteChrome();
    initAos();
    bindNewsletterForm();
    initShowcaseSlider();
    initPortfolioFilter();
    initQuoteForm();
    initRevealOnScroll('.service-card, .timeline-item, .tech-category, .portfolio-item');
}

onReady(() => {
    bootstrapWebdevPage();
});

export { bootstrapWebdevPage };