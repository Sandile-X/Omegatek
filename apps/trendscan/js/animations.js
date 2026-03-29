// ===== ADVANCED ANIMATIONS AND INTERACTIONS =====

document.addEventListener('DOMContentLoaded', function() {
    initScrollAnimations();
    initHoverEffects();
    initTypingAnimation();
    initCardAnimations();
    initProgressAnimations();
    initBackgroundEffects();
    initLoadingAnimations();
    
    console.log('Advanced animations initialized');
});

// ===== SCROLL ANIMATIONS =====
function initScrollAnimations() {
    // Create intersection observer for scroll animations
    const animationObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                const animationType = element.dataset.animation || 'fadeInUp';
                const delay = element.dataset.delay || 0;
                
                setTimeout(() => {
                    element.classList.add('animate', animationType);
                }, delay);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    // Add animation classes to elements
    const animatedElements = document.querySelectorAll(
        '.feature-item, .pricing-card, .chart-container, .media-item'
    );
    
    animatedElements.forEach((element, index) => {
        element.dataset.delay = index * 50; // Reduced stagger
        animationObserver.observe(element);
    });
    
    // Parallax scrolling effects
    window.addEventListener('scroll', throttle(() => {
        const scrolled = window.pageYOffset;
        const parallaxElements = document.querySelectorAll('.parallax');
        
        parallaxElements.forEach(element => {
            const speed = element.dataset.speed || 0.5;
            const yPos = -(scrolled * speed);
            element.style.transform = `translateY(${yPos}px)`;
        });
    }, 10));
}

// ===== HOVER EFFECTS =====
function initHoverEffects() {
    // Enhanced card hover effects
    const cards = document.querySelectorAll('.feature-item, .pricing-card, .contact-method');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
            this.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
            
            // Add glow effect
            const glow = document.createElement('div');
            glow.className = 'card-glow';
            glow.style.cssText = `
                position: absolute;
                top: -5px;
                left: -5px;
                right: -5px;
                bottom: -5px;
                background: linear-gradient(45deg, #0066cc, #0099ff, #00cc66, #ffd700);
                border-radius: inherit;
                z-index: -1;
                opacity: 0;
                filter: blur(10px);
                animation: glowPulse 2s infinite;
            `;
            
            this.style.position = 'relative';
            this.appendChild(glow);
            
            setTimeout(() => glow.style.opacity = '0.3', 10);
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = '';
            this.style.boxShadow = '';
            
            const glow = this.querySelector('.card-glow');
            if (glow) {
                glow.remove();
            }
        });
    });
    
    // Button hover effects with ripple
    const buttons = document.querySelectorAll('.btn-primary, .btn-secondary, .plan-button');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('div');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.6);
                border-radius: 50%;
                transform: scale(0);
                animation: rippleEffect 0.6s ease-out;
                pointer-events: none;
            `;
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    });
}

// ===== TYPING ANIMATION =====
function initTypingAnimation() {
    const typeText = document.querySelector('.hero-title');
    if (!typeText) return;
    
    const text = typeText.innerHTML;
    typeText.innerHTML = '';
    
    let index = 0;
    const speed = 50;
    
    function type() {
        if (index < text.length) {
            typeText.innerHTML += text.charAt(index);
            index++;
            setTimeout(type, speed);
        } else {
            // Add blinking cursor
            const cursor = document.createElement('span');
            cursor.className = 'typing-cursor';
            cursor.textContent = '|';
            cursor.style.animation = 'blink 1s infinite';
            typeText.appendChild(cursor);
            
            // Remove cursor after 3 seconds
            setTimeout(() => cursor.remove(), 3000);
        }
    }
    
    // Start typing after hero section is visible
    const heroObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                setTimeout(type, 500);
                heroObserver.disconnect();
            }
        });
    });
    
    heroObserver.observe(typeText);
}

// ===== CARD ANIMATIONS =====
function initCardAnimations() {
    const pricingCards = document.querySelectorAll('.pricing-card');
    
    pricingCards.forEach((card, index) => {
        // Staggered entrance animation
        card.style.opacity = '0';
        card.style.transform = 'translateY(50px) rotateX(10deg)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0) rotateX(0)';
        }, index * 200);
        
        // Floating animation
        card.style.animation = `cardFloat 4s ease-in-out infinite`;
        card.style.animationDelay = `${index * 0.5}s`;
    });
}

// ===== PROGRESS ANIMATIONS =====
function initProgressAnimations() {
    const metrics = document.querySelectorAll('.metric-value');
    
    metrics.forEach(metric => {
        const finalValue = metric.textContent;
        const isPercentage = finalValue.includes('%');
        const isMultiplier = finalValue.includes('x');
        const numericValue = parseFloat(finalValue);
        
        metric.textContent = isPercentage ? '0%' : isMultiplier ? '0x' : '0';
        
        const animateMetric = () => {
            const duration = 2000;
            const start = Date.now();
            const startValue = 0;
            
            const updateValue = () => {
                const elapsed = Date.now() - start;
                const progress = Math.min(elapsed / duration, 1);
                const easeProgress = easeOutQuart(progress);
                const currentValue = startValue + (numericValue - startValue) * easeProgress;
                
                if (isPercentage) {
                    metric.textContent = currentValue.toFixed(1) + '%';
                } else if (isMultiplier) {
                    metric.textContent = currentValue.toFixed(1) + 'x';
                } else {
                    metric.textContent = currentValue.toFixed(1);
                }
                
                if (progress < 1) {
                    requestAnimationFrame(updateValue);
                }
            };
            
            updateValue();
        };
        
        // Trigger animation when metrics section is visible
        const metricsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setTimeout(animateMetric, 500);
                }
            });
        });
        
        metricsObserver.observe(metric);
    });
}

// ===== BACKGROUND EFFECTS =====
function initBackgroundEffects() {
    // Animated gradient background for sections
    const sections = document.querySelectorAll('.hero, .pricing, .trial');
    
    sections.forEach(section => {
        section.addEventListener('mousemove', (e) => {
            const { clientX, clientY } = e;
            const { left, top, width, height } = section.getBoundingClientRect();
            
            const x = ((clientX - left) / width) * 100;
            const y = ((clientY - top) / height) * 100;
            
            section.style.background = `
                radial-gradient(circle at ${x}% ${y}%, 
                rgba(0, 102, 204, 0.1) 0%, 
                transparent 50%),
                ${section.style.background || getComputedStyle(section).background}
            `;
        });
        
        section.addEventListener('mouseleave', () => {
            section.style.background = '';
        });
    });
}

// ===== LOADING ANIMATIONS =====
function initLoadingAnimations() {
    // Page load animation
    const loader = document.createElement('div');
    loader.id = 'page-loader';
    loader.innerHTML = `
        <div class="loader-content">
            <div class="loader-logo">
                <i class="fas fa-chart-line"></i>
                <span>TrendScan</span>
            </div>
            <div class="loader-progress">
                <div class="loader-bar"></div>
            </div>
            <div class="loader-text">Loading amazing content...</div>
        </div>
    `;
    
    loader.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #334155 50%, #475569 75%, #64748b 100%);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
    `;
    
    document.body.appendChild(loader);
    
    // Simulate loading progress
    const progressBar = loader.querySelector('.loader-bar');
    const loadingText = loader.querySelector('.loader-text');
    let progress = 0;
    
    const loadingMessages = [
        'Initializing TrendScan...',
        'Loading inventory data...',
        'Preparing analytics...',
        'Setting up security...',
        'Almost ready!'
    ];
    
    const updateProgress = () => {
        progress += Math.random() * 15;
        progressBar.style.width = Math.min(progress, 100) + '%';
        
        const messageIndex = Math.floor((progress / 100) * loadingMessages.length);
        loadingText.textContent = loadingMessages[Math.min(messageIndex, loadingMessages.length - 1)];
        
        if (progress < 100) {
            setTimeout(updateProgress, Math.random() * 200 + 100);
        } else {
            setTimeout(() => {
                loader.style.opacity = '0';
                loader.style.transition = 'opacity 0.5s ease';
                setTimeout(() => loader.remove(), 500);
            }, 500);
        }
    };
    
    updateProgress();
}

// ===== UTILITY FUNCTIONS =====
function easeOutQuart(t) {
    return 1 - (--t) * t * t * t;
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// ===== ANIMATION KEYFRAMES CSS =====
const animationStyles = document.createElement('style');
animationStyles.textContent = `
    @keyframes glowPulse {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 0.6; }
    }
    
    @keyframes rippleEffect {
        to {
            transform: scale(2);
            opacity: 0;
        }
    }
    
    @keyframes blink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0; }
    }
    
    @keyframes cardFloat {
        0%, 100% { transform: translateY(0px) rotateY(0deg); }
        25% { transform: translateY(-5px) rotateY(1deg); }
        50% { transform: translateY(-10px) rotateY(0deg); }
        75% { transform: translateY(-5px) rotateY(-1deg); }
    }
    
    .animate {
        animation: fadeInUp 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    }
    
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .loader-content {
        text-align: center;
    }
    
    .loader-logo {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        font-size: 2rem;
        font-weight: 800;
        margin-bottom: 2rem;
        animation: pulse 2s infinite;
    }
    
    .loader-logo i {
        font-size: 3rem;
        color: #ffd700;
    }
    
    .loader-progress {
        width: 300px;
        height: 4px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 2px;
        overflow: hidden;
        margin: 0 auto 1rem;
    }
    
    .loader-bar {
        height: 100%;
        background: linear-gradient(90deg, #0066cc, #0099ff, #00cc66);
        border-radius: 2px;
        transition: width 0.3s ease;
        width: 0%;
    }
    
    .loader-text {
        font-size: 1rem;
        opacity: 0.8;
        animation: fadeInOut 2s infinite;
    }
    
    @keyframes fadeInOut {
        0%, 100% { opacity: 0.8; }
        50% { opacity: 1; }
    }
`;
document.head.appendChild(animationStyles);