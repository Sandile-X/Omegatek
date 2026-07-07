
document.addEventListener('DOMContentLoaded', function() {
    
    const menuBtn = document.querySelector('#menu-btn');
    if (menuBtn) {
        menuBtn.style.display = 'none';
        menuBtn.offsetHeight; 
        menuBtn.style.display = '';

if (!menuBtn.addEventListener) {
            menuBtn.attachEvent('onclick', function() {
                const navbar = document.querySelector('.header .navbar .links');
                if (navbar) {
                    navbar.classList.toggle('active');
                }
            });
        }
    }

let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
        viewport = document.createElement('meta');
        viewport.name = 'viewport';
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
        document.head.appendChild(viewport);
    }
});

if (navigator.userAgent.match(/iPad|iPhone|iPod/)) {
    document.addEventListener('touchstart', function(){}, {passive: true});
}

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