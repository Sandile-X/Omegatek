/**
 * Enhanced UI Interactions - Phase 1
 * Sophisticated typography and UI enhancements
 * Backdrop blur effects and modern interactions
 */

document.addEventListener('DOMContentLoaded', function() {
    
    // Add backdrop blur to page when mobile menu is open
    const menuBtn = document.querySelector('#menu-btn');
    const navbarLinks = document.querySelector('.header .navbar .links');
    
    if (menuBtn && navbarLinks) {
        // Create backdrop element
        const backdrop = document.createElement('div');
        backdrop.className = 'mobile-menu-backdrop';
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            z-index: 999;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        `;
        document.body.appendChild(backdrop);
        
        // Toggle backdrop when menu opens/closes
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.attributeName === 'class') {
                    if (navbarLinks.classList.contains('active')) {
                        backdrop.style.opacity = '1';
                        backdrop.style.pointerEvents = 'auto';
                        document.body.style.overflow = 'hidden';
                    } else {
                        backdrop.style.opacity = '0';
                        backdrop.style.pointerEvents = 'none';
                        document.body.style.overflow = '';
                    }
                }
            });
        });
        
        observer.observe(navbarLinks, { attributes: true });
        
        // Close menu when clicking backdrop
        backdrop.addEventListener('click', function() {
            menuBtn.classList.remove('fa-times');
            navbarLinks.classList.remove('active');
        });
    }
    
    // Enhanced button hover effects
    const buttons = document.querySelectorAll('.btn, button[type="submit"]');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function(e) {
            const ripple = document.createElement('span');
            ripple.style.cssText = `
                position: absolute;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                width: 100px;
                height: 100px;
                margin-top: -50px;
                margin-left: -50px;
                animation: ripple 0.6s ease-out;
                pointer-events: none;
            `;
            
            const rect = this.getBoundingClientRect();
            ripple.style.left = (e.clientX - rect.left) + 'px';
            ripple.style.top = (e.clientY - rect.top) + 'px';
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    });
    
    // Add CSS for ripple animation
    if (!document.querySelector('#ripple-animation-styles')) {
        const style = document.createElement('style');
        style.id = 'ripple-animation-styles';
        style.textContent = `
            @keyframes ripple {
                from {
                    transform: scale(0);
                    opacity: 1;
                }
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Enhanced form input animations
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        // Add floating label effect
        const parent = input.parentElement;
        
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('input-focused');
        });
        
        input.addEventListener('blur', function() {
            if (!this.value) {
                this.parentElement.classList.remove('input-focused');
            }
        });
        
        // Check if already has value on load
        if (input.value) {
            input.parentElement.classList.add('input-focused');
        }
    });
    
    // Smooth scroll with offset for fixed header
    const smoothScrollLinks = document.querySelectorAll('a[href^="#"]');
    smoothScrollLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#' && href.length > 1) {
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    const headerHeight = document.querySelector('.header .navbar').offsetHeight;
                    const targetPosition = target.offsetTop - headerHeight - 20;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                    
                    // Close mobile menu if open
                    if (navbarLinks && navbarLinks.classList.contains('active')) {
                        menuBtn.classList.remove('fa-times');
                        navbarLinks.classList.remove('active');
                    }
                }
            }
        });
    });
    
    // Add loading skeleton for images
    const images = document.querySelectorAll('img[data-src]');
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    img.classList.add('fade-in');
                    observer.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    }
    
    // Enhanced card hover parallax effect
    const cards = document.querySelectorAll('.services .box-container .box, .glass-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;
            
            this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });
    
    // Add scroll progress indicator
    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 0%;
        height: 4px;
        background: linear-gradient(90deg, #b30ce6, #9333ea, #7c3aed);
        z-index: 10000;
        transition: width 0.1s ease;
        box-shadow: 0 2px 8px rgba(179, 12, 230, 0.4);
    `;
    document.body.appendChild(progressBar);
    
    window.addEventListener('scroll', function() {
        const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (window.scrollY / windowHeight) * 100;
        progressBar.style.width = scrolled + '%';
    });
    
    // Enhance navbar on scroll
    let lastScroll = 0;
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.header .navbar');
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        lastScroll = currentScroll;
    });
    
    // Add performance optimization: reduce animations on low-end devices
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
        document.body.classList.add('reduce-animations');
        const style = document.createElement('style');
        style.textContent = `
            .reduce-animations * {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    // console.log('✨ Phase 1: Enhanced UI Loaded - Sophisticated Typography & Interactions Active');
});

// Utility function for smooth animations
function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Export for use in other scripts
window.omegatekUI = {
    animateValue: animateValue
};
