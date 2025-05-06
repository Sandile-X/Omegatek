document.addEventListener('DOMContentLoaded', function() {
    // Add animation to timeline items
    const timelineItems = document.querySelectorAll('.timeline-item');
    
    // Function to check if an element is in viewport
    function isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
    
    // Function to add animation class when element is in viewport
    function animateOnScroll() {
        timelineItems.forEach(item => {
            if (isInViewport(item)) {
                item.classList.add('animate');
            }
        });
    }
    
    // Add animation on scroll
    window.addEventListener('scroll', animateOnScroll);
    
    // Trigger once on page load
    animateOnScroll();
    
    // Mobile menu toggle (reusing the main site functionality)
    let menu = document.querySelector('#menu-btn');
    let navbarLinks = document.querySelector('.header .navbar .links');
    
    if (menu) {
        menu.onclick = () => {
            menu.classList.toggle('fa-times');
            navbarLinks.classList.toggle('active');
        }
    }
});