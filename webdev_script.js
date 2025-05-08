// Web Development Page JavaScript
document.addEventListener("DOMContentLoaded", function() {
    // Device Showcase Slider
    initSlider();

    // Portfolio Filtering
    initPortfolioFilter();

    // Quote Form Submission
    initQuoteForm();
});

// Initialize device showcase slider
function initSlider() {
    const slides = document.querySelectorAll('.showcase-slider .slide');
    const dots = document.querySelectorAll('.slider-navigation .nav-dot');
    let currentSlide = 0;
    let slideshowInterval;

    // Function to show a specific slide
    function showSlide(slideIndex) {
        // Hide all slides
        slides.forEach(slide => {
            slide.classList.remove('active');
        });
        
        // Remove active class from all dots
        dots.forEach(dot => {
            dot.classList.remove('active');
        });
        
        // Show the current slide and activate its dot
        slides[slideIndex].classList.add('active');
        dots[slideIndex].classList.add('active');
        currentSlide = slideIndex;
    }
    
    // Function to advance to the next slide
    function nextSlide() {
        let nextIndex = currentSlide + 1;
        if (nextIndex >= slides.length) {
            nextIndex = 0; // Loop back to the first slide
        }
        showSlide(nextIndex);
    }
    
    // Set up automatic slideshow
    function startSlideshow() {
        slideshowInterval = setInterval(nextSlide, 5000); // Change slide every 5 seconds
    }
    
    // Stop the slideshow (for when user interacts with slider)
    function stopSlideshow() {
        clearInterval(slideshowInterval);
    }
    
    // Add click events to navigation dots
    dots.forEach((dot, index) => {
        dot.addEventListener('click', function() {
            stopSlideshow();  // Stop automatic slideshow when user clicks
            showSlide(index); // Show selected slide
            startSlideshow(); // Restart slideshow
        });
    });
    
    // Initialize with the first slide and start the slideshow
    if (slides.length > 0) {
        showSlide(0);
        startSlideshow();
    }
}

// Initialize portfolio filtering
function initPortfolioFilter() {
    const filterBtns = document.querySelectorAll('.portfolio-filter .filter-btn');
    const portfolioItems = document.querySelectorAll('.portfolio-item');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            filterBtns.forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Get the filter value
            const filter = this.getAttribute('data-filter');
            
            // Show/hide portfolio items based on filter
            portfolioItems.forEach(item => {
                if (filter === 'all' || item.classList.contains(filter)) {
                    item.style.display = 'block';
                    
                    // Animate items coming into view
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'scale(1)';
                    }, 50);
                } else {
                    item.style.opacity = '0';
                    item.style.transform = 'scale(0.8)';
                    
                    setTimeout(() => {
                        item.style.display = 'none';
                    }, 300); // Match this with CSS transition duration
                }
            });
        });
    });
}

// Initialize quote form
function initQuoteForm() {
    const quoteForm = document.getElementById('quoteForm');
    
    if (quoteForm) {
        quoteForm.addEventListener('submit', function(event) {
            event.preventDefault(); // Prevent default form submission
            
            // Get form inputs
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const projectType = document.getElementById('projectType').value;
            const budget = document.getElementById('budget').value;
            const projectDescription = document.getElementById('projectDescription').value.trim();
            
            // Validate form
            if (!name || !email || !phone || !projectType || !budget || !projectDescription) {
                alert('Please fill in all required fields.');
                return;
            }
            
            // Create WhatsApp message content
            const whatsappNumber = "27736538207"; 
            const whatsappMessage = 
                `*Web Development Quote Request*\n` +
                `Name: ${name}\n` +
                `Email: ${email}\n` +
                `Phone: ${phone}\n` +
                `Project Type: ${projectType}\n` +
                `Budget Range: ${budget}\n` +
                `Project Description: ${projectDescription}`;
            
            // Create WhatsApp URL
            const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
            
            // Open WhatsApp with pre-filled message
            window.open(whatsappUrl, '_blank');
            
            // Show success message
            alert('Quote request sent! We will contact you shortly to discuss your project in detail.');
            
            // Reset form
            quoteForm.reset();
        });
    }
}

// Animate elements on scroll
document.addEventListener('DOMContentLoaded', function() {
    // Select elements to animate
    const animatedElements = document.querySelectorAll('.service-card, .timeline-item, .tech-category, .portfolio-item');
    
    // Create intersection observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Add animation class when element is visible
                entry.target.classList.add('animate');
                observer.unobserve(entry.target); // Stop observing once animated
            }
        });
    }, {
        threshold: 0.1 // Trigger when at least 10% of the element is visible
    });
    
    // Observe each element
    animatedElements.forEach(element => {
        observer.observe(element);
    });
});