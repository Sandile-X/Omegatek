// Additional mobile compatibility fixes
document.addEventListener('DOMContentLoaded', function() {
    // Force reflow on menu button to ensure it's visible
    const menuBtn = document.querySelector('#menu-btn');
    if (menuBtn) {
        menuBtn.style.display = 'none';
        menuBtn.offsetHeight; // Force reflow
        menuBtn.style.display = '';
        
        // Add fallback for older browsers
        if (!menuBtn.addEventListener) {
            menuBtn.attachEvent('onclick', function() {
                const navbar = document.querySelector('.header .navbar .links');
                if (navbar) {
                    navbar.classList.toggle('active');
                }
            });
        }
    }
    
    // Ensure viewport meta tag exists
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
        viewport = document.createElement('meta');
        viewport.name = 'viewport';
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
        document.head.appendChild(viewport);
    }
});

// Fix iOS Safari specific issues
if (navigator.userAgent.match(/iPad|iPhone|iPod/)) {
    document.addEventListener('touchstart', function(){}, {passive: true});
}

// Prevent zoom on input focus (mobile)
document.addEventListener('DOMContentLoaded', function() {
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            const viewport = document.querySelector('meta[name="viewport"]');
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0');
        });
        
        input.addEventListener('blur', function() {
            const viewport = document.querySelector('meta[name="viewport"]');
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
        });
    });
});