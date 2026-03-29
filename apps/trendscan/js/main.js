// ===== MAIN JAVASCRIPT FOR TRENDSCAN WEBSITE =====

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initScrollEffects();
    initAnimationCounters();
    initNavigation();
    initFormValidation();
    initModalHandlers();
    initSmoothScroll();
    initMobileMenu();
    
    console.log('TrendScan Website Initialized - Omega TekSolutions');
});

// ===== SCROLL EFFECTS =====
function initScrollEffects() {
    const navbar = document.querySelector('.navbar');
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');

    const onScroll = () => {
        // Navbar scroll effect
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        // Section highlighting
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 150;
            if (scrollY >= sectionTop) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    };

    window.addEventListener('scroll', throttle(onScroll, 50));
    
    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
            }
        });
    }, observerOptions);
    
    // Observe all animated elements
    document.querySelectorAll('.feature-item, .pricing-card, .chart-container, .media-item').forEach(el => {
        observer.observe(el);
    });
}

// ===== ANIMATION COUNTERS =====
function initAnimationCounters() {
    const counters = document.querySelectorAll('.stat-number');
    let hasAnimated = false;
    
    const animateCounters = () => {
        if (hasAnimated) return;
        
        counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-target'));
            const duration = 2000; // 2 seconds
            const increment = target / (duration / 16); // 60fps
            let current = 0;
            
            const updateCounter = () => {
                if (current < target) {
                    current += increment;
                    counter.textContent = Math.floor(current);
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.textContent = target;
                }
            };
            
            updateCounter();
        });
        
        hasAnimated = true;
    };
    
    // Trigger animation when hero section is visible
    const heroObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                setTimeout(animateCounters, 500);
            }
        });
    });
    
    const heroSection = document.querySelector('.hero');
    if (heroSection) {
        heroObserver.observe(heroSection);
    }
}

// ===== NAVIGATION =====
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ===== SMOOTH SCROLL =====
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// ===== MOBILE MENU =====
function initMobileMenu() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
        
        // Close menu when clicking on a link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
            });
        });
    }
}

// ===== FORM VALIDATION =====
function initFormValidation() {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const formData = new FormData(contactForm);
            const name = document.getElementById('contactName').value;
            const email = document.getElementById('contactEmail').value;
            const phone = document.getElementById('contactPhone').value;
            const company = document.getElementById('contactCompany').value;
            const plan = document.getElementById('contactPlan').value;
            const message = document.getElementById('contactMessage').value;
            
            // Basic validation
            if (!name || !email || !phone || !company || !plan) {
                showNotification('Please fill in all required fields.', 'error');
                return;
            }
            
            // Email validation
            if (!isValidEmail(email)) {
                showNotification('Please enter a valid email address.', 'error');
                return;
            }
            
            // Send form data (replace with actual implementation)
            submitContactForm({
                name, email, phone, company, plan, message
            });
        });
    }
}

// ===== MODAL HANDLERS =====
function initModalHandlers() {
    const modal = document.getElementById('licenseModal');
    const closeBtn = document.querySelector('.modal-close');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            closeModal();
        });
    }
    
    // Close modal when clicking outside
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
    
    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            closeModal();
        }
    });
}

// ===== UTILITY FUNCTIONS =====
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        color: white;
        font-weight: 600;
        z-index: 10001;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        background: ${type === 'error' ? '#ff3366' : type === 'success' ? '#00cc66' : '#0066cc'};
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

function submitContactForm(data) {
    // Show loading state
    const submitButton = document.querySelector('.contact-submit');
    const originalText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    submitButton.disabled = true;
    
    // Simulate API call (replace with actual implementation)
    setTimeout(() => {
        // Reset button
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
        
        // Show success message
        showNotification('Thank you! We will contact you within 24 hours.', 'success');
        
        // Create WhatsApp message
        const whatsappMessage = encodeURIComponent(
            `New TrendScan Demo Request:\n\n` +
            `Name: ${data.name}\n` +
            `Company: ${data.company}\n` +
            `Email: ${data.email}\n` +
            `Phone: ${data.phone}\n` +
            `Interest: ${data.plan}\n` +
            `Message: ${data.message}`
        );
        
        // Open WhatsApp
        window.open(`https://wa.me/27736538207?text=${whatsappMessage}`, '_blank');
        
        // Reset form
        document.getElementById('contactForm').reset();
    }, 2000);
}

function closeModal() {
    const modal = document.getElementById('licenseModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// ===== GLOBAL FUNCTIONS FOR HTML EVENTS =====
window.scrollToTrial = function() {
    const trialSection = document.getElementById('trial');
    if (trialSection) {
        trialSection.scrollIntoView({ behavior: 'smooth' });
    }
};

window.downloadAPK = function() {
    showNotification('APK download will be available after license generation.', 'info');
    // In real implementation, trigger actual download
    console.log('Download APK triggered');
};

window.contactSales = function(planType) {
    const message = encodeURIComponent(
        `Hi! I'm interested in the TrendScan ${planType.replace('_', ' ')} plan. Please provide more information and pricing details.`
    );
    window.open(`https://wa.me/27736538207?text=${message}`, '_blank');
};

window.downloadFiles = function() {
    showNotification('Download package includes APK + License Generator + Documentation', 'info');
    // In real implementation, trigger download of complete package
    setTimeout(() => {
        // Simulate download links
        const downloads = [
            { name: 'TrendScan.apk', url: '#' },
            { name: 'License_Generator.exe', url: '#' },
            { name: 'Documentation.pdf', url: '#' }
        ];
        
        downloads.forEach((file, index) => {
            setTimeout(() => {
                showNotification(`Downloading ${file.name}...`, 'success');
                // In real implementation: window.open(file.url, '_blank');
            }, index * 1000);
        });
    }, 1000);
};

// ===== FLOATING PARTICLES ANIMATION =====
function createFloatingParticles() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    
    for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.className = 'floating-particle';
        particle.style.cssText = `
            position: absolute;
            width: ${Math.random() * 4 + 2}px;
            height: ${Math.random() * 4 + 2}px;
            background: rgba(255, 215, 0, 0.6);
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: floatParticle ${Math.random() * 10 + 10}s infinite linear;
            pointer-events: none;
        `;
        hero.appendChild(particle);
    }
}

// Add particle animation CSS
const particleStyle = document.createElement('style');
particleStyle.textContent = `
    @keyframes floatParticle {
        0% {
            transform: translateY(100vh) rotate(0deg);
            opacity: 0;
        }
        10% {
            opacity: 1;
        }
        90% {
            opacity: 1;
        }
        100% {
            transform: translateY(-100vh) rotate(360deg);
            opacity: 0;
        }
    }
    
    .floating-particle {
        z-index: 1;
    }
`;
document.head.appendChild(particleStyle);

// Initialize particles after DOM load
document.addEventListener('DOMContentLoaded', () => {
    // Keep a light sprinkle of floating particles; main background is handled by particles.js
    setTimeout(createFloatingParticles, 1000);
});

// ===== PERFORMANCE OPTIMIZATION =====
// Throttle scroll events
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

// Apply throttling placeholder for any future scroll-dependent animations
window.addEventListener('scroll', throttle(function() {
    // Reserved for lightweight scroll effects
}, 100));