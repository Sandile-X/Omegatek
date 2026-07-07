document.addEventListener('DOMContentLoaded', function() {
    
    const timelineItems = document.querySelectorAll('.timeline-item');

function isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

function animateOnScroll() {
        timelineItems.forEach(item => {
            if (isInViewport(item)) {
                item.classList.add('animate');
            }
        });
    }

window.addEventListener('scroll', animateOnScroll);

animateOnScroll();

let menu = document.querySelector('#menu-btn');
    let navbarLinks = document.querySelector('.header .navbar .links');
    
    menu.onclick = () => {
        menu.classList.toggle('fa-times');
        navbarLinks.classList.toggle('active');
    };
    
    window.onscroll = () => {
        menu.classList.remove('fa-times');
        navbarLinks.classList.remove('active');

if(window.scrollY > 60){
            document.querySelector('.header .navbar').classList.add('active');
        } else {
            document.querySelector('.header .navbar').classList.remove('active');
        }
    };
});