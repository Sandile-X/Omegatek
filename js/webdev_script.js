
document.addEventListener("DOMContentLoaded", function() {
    
    initSlider();

initPortfolioFilter();

initQuoteForm();
});

function initSlider() {
    const slides = document.querySelectorAll('.showcase-slider .slide');
    const dots = document.querySelectorAll('.slider-navigation .nav-dot');
    let currentSlide = 0;
    let slideshowInterval;

function showSlide(slideIndex) {
        
        slides.forEach(slide => {
            slide.classList.remove('active');
        });

dots.forEach(dot => {
            dot.classList.remove('active');
        });

slides[slideIndex].classList.add('active');
        dots[slideIndex].classList.add('active');
        currentSlide = slideIndex;
    }

function nextSlide() {
        let nextIndex = currentSlide + 1;
        if (nextIndex >= slides.length) {
            nextIndex = 0; 
        }
        showSlide(nextIndex);
    }

function startSlideshow() {
        slideshowInterval = setInterval(nextSlide, 5000); 
    }

function stopSlideshow() {
        clearInterval(slideshowInterval);
    }

dots.forEach((dot, index) => {
        dot.addEventListener('click', function() {
            stopSlideshow();  
            showSlide(index); 
            startSlideshow(); 
        });
    });

if (slides.length > 0) {
        showSlide(0);
        startSlideshow();
    }
}

function initPortfolioFilter() {
    const filterBtns = document.querySelectorAll('.portfolio-filter .filter-btn');
    const portfolioItems = document.querySelectorAll('.portfolio-item');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            
            filterBtns.forEach(btn => {
                btn.classList.remove('active');
            });

this.classList.add('active');

const filter = this.getAttribute('data-filter');

portfolioItems.forEach(item => {
                if (filter === 'all' || item.classList.contains(filter)) {
                    item.style.display = 'block';

setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'scale(1)';
                    }, 50);
                } else {
                    item.style.opacity = '0';
                    item.style.transform = 'scale(0.8)';
                    
                    setTimeout(() => {
                        item.style.display = 'none';
                    }, 300); 
                }
            });
        });
    });
}

function initQuoteForm() {
    const quoteForm = document.getElementById('quoteForm');
    
    if (quoteForm) {
        quoteForm.addEventListener('submit', function(event) {
            event.preventDefault(); 

const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const projectType = document.getElementById('projectType').value;
            const budget = document.getElementById('budget').value;
            const projectDescription = document.getElementById('projectDescription').value.trim();

if (!name || !email || !phone || !projectType || !budget || !projectDescription) {
                alert('Please fill in all required fields.');
                return;
            }

const whatsappNumber = "27736538207"; 
            const whatsappMessage = 
                `*Web Development Quote Request*\n` +
                `Name: ${name}\n` +
                `Email: ${email}\n` +
                `Phone: ${phone}\n` +
                `Project Type: ${projectType}\n` +
                `Budget Range: ${budget}\n` +
                `Project Description: ${projectDescription}`;

const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

window.open(whatsappUrl, '_blank');

alert('Quote request sent! We will contact you shortly to discuss your project in detail.');

quoteForm.reset();
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    
    const animatedElements = document.querySelectorAll('.service-card, .timeline-item, .tech-category, .portfolio-item');

const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                
                entry.target.classList.add('animate');
                observer.unobserve(entry.target); 
            }
        });
    }, {
        threshold: 0.1 
    });

animatedElements.forEach(element => {
        observer.observe(element);
    });
});