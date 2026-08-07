let menu = document.querySelector('#menu-btn');
let navbarLinks = document.querySelector('.header .navbar .links');

if (menu && navbarLinks) {
   menu.onclick = () => {
      menu.classList.toggle('fa-times');
      navbarLinks.classList.toggle('active');
   }
}

let _scrollTicking = false;
window.addEventListener('scroll', () => {
   if (_scrollTicking) return;
   _scrollTicking = true;
   requestAnimationFrame(() => {
      if (menu && navbarLinks) {
         menu.classList.remove('fa-times');
         navbarLinks.classList.remove('active');
      }

      const navbar = document.querySelector('.header .navbar');
      if (navbar) {
         if(window.scrollY > 60){
            navbar.classList.add('active');
         }else{
            navbar.classList.remove('active');
         }
      }
      _scrollTicking = false;
   });
}, { passive: true });

document.addEventListener("DOMContentLoaded", function() {
   const contactForm = document.getElementById("contactForm");
   
   if (contactForm) {
      contactForm.addEventListener("submit", function(event) {
         event.preventDefault(); 

const userName = document.getElementById("name").value.trim();
         const userPhone = document.getElementById("phone").value.trim();
         const userMessage = document.getElementById("message").value.trim();

if (!userName || !userPhone || !userMessage) {
            alert("All fields are required!");
            return false;
         }

const whatsappNumber = "27736538207"; 
         const whatsappUrl = `https://wa.me/${whatsappNumber}?text=Name:%20${encodeURIComponent(userName)}%0APhone:%20${encodeURIComponent(userPhone)}%0AMessage:%20${encodeURIComponent(userMessage)}`;

window.open(whatsappUrl, "_blank");

contactForm.reset();
      });
   }

});

function validateEmail(email) {
   const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
   return regex.test(email);
}

document.addEventListener("DOMContentLoaded", function() {
    
    initTypewriter();
});

function initTypewriter() {
    const typewriterElement = document.querySelector(".typewriter h2");
    if (typewriterElement) {
        
        const text = typewriterElement.textContent;
        const textLength = text.length;

const typingDuration = Math.max(3.5, textLength * 0.15); 
        const erasingDuration = typingDuration * 0.6; 
        const pauseDuration = 2000; 

function animateTypewriter() {
            
            typewriterElement.style.width = '0';
            typewriterElement.style.animation = `typing ${typingDuration}s steps(${textLength}, end) forwards, blinkCursor 0.75s step-end infinite`;

setTimeout(() => {
                
                typewriterElement.style.width = '100%';
                typewriterElement.style.animation = 'blinkCursor 0.75s step-end infinite';

setTimeout(() => {
                    
                    typewriterElement.style.animation = `erasing ${erasingDuration}s steps(${textLength}, end) forwards, blinkCursor 0.75s step-end infinite`;

setTimeout(() => {
                        animateTypewriter();
                    }, erasingDuration * 1000 + 500); 
                    
                }, pauseDuration);
            }, typingDuration * 1000);
        }

animateTypewriter();
    }
}

document.addEventListener("DOMContentLoaded", function() {
   if (typeof lightGallery === "function" && document.querySelector(".gallery .gallery-container")) {
      lightGallery(document.querySelector(".gallery .gallery-container"));
   }
});

document.addEventListener("DOMContentLoaded", function() {
   const links = document.querySelectorAll(".navbar .links a, .footer .link");
   
   for (const link of links) {
      link.addEventListener("click", function(e) {
         const href = this.getAttribute("href");
         
         if (href.startsWith("#")) {
            e.preventDefault();
            const targetId = href;
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
               window.scrollTo({
                  top: targetElement.offsetTop - 100,
                  behavior: "smooth"
               });

menu.classList.remove('fa-times');
               navbarLinks.classList.remove('active');
            }
         }
      });
   }
});

document.addEventListener("DOMContentLoaded", function() {
    
    const modal = document.getElementById("bookingModal");
    const openBtn = document.getElementById("openBooking");
    const closeBtn = document.querySelector(".close-modal");

const dateInput = document.getElementById("preferredDate");
    if (dateInput) {
        const today = new Date().toISOString().split("T")[0];
        dateInput.setAttribute("min", today);
    }

if (openBtn) {
        openBtn.addEventListener("click", function() {
            modal.style.display = "block";
            document.body.style.overflow = "hidden"; 
        });
    }

if (closeBtn) {
        closeBtn.addEventListener("click", function() {
            modal.style.display = "none";
            document.body.style.overflow = "auto"; 
        });
    }

window.addEventListener("click", function(event) {
        if (event.target === modal) {
            modal.style.display = "none";
            document.body.style.overflow = "auto";
        }
    });

const bookingForm = document.getElementById("bookingForm");
    if (bookingForm) {
        bookingForm.addEventListener("submit", function(event) {
            event.preventDefault();

const name = document.getElementById("bookingName").value.trim();
            const phone = document.getElementById("bookingPhone").value.trim();
            const serviceType = document.getElementById("serviceType").value;
            const preferredDate = document.getElementById("preferredDate").value;
            const preferredTime = document.getElementById("preferredTime").value;
            const issueDescription = document.getElementById("issueDescription").value.trim();

const message = `*New Booking Request*\n` +
                            `Name: ${name}\n` +
                            `Phone: ${phone}\n` +
                            `Service: ${serviceType}\n` +
                            `Date: ${preferredDate}\n` +
                            `Time: ${preferredTime}\n` +
                            `Description: ${issueDescription}`;

const whatsappNumber = "27736538207";
            const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, "_blank");

modal.style.display = "none";
            document.body.style.overflow = "auto";
            bookingForm.reset();

alert("Booking request sent! We'll confirm your appointment shortly.");
        });
    }
});

document.addEventListener("DOMContentLoaded", function() {
    
    const basicRepairBtn = document.getElementById("basicRepairBtn");
    const standardRepairBtn = document.getElementById("standardRepairBtn");
    const premiumRepairBtn = document.getElementById("premiumRepairBtn");

const modal = document.getElementById("bookingModal");
    const serviceTypeSelect = document.getElementById("serviceType");

if (basicRepairBtn) {
        basicRepairBtn.addEventListener("click", function() {
            modal.style.display = "block";
            document.body.style.overflow = "hidden";
            
            if (serviceTypeSelect && serviceTypeSelect.options.length >= 3) {
                serviceTypeSelect.selectedIndex = 2; 
            }
        });
    }
    
    if (standardRepairBtn) {
        standardRepairBtn.addEventListener("click", function() {
            modal.style.display = "block";
            document.body.style.overflow = "hidden";
            
            if (serviceTypeSelect && serviceTypeSelect.options.length >= 2) {
                serviceTypeSelect.selectedIndex = 1; 
            }
        });
    }
    
    if (premiumRepairBtn) {
        premiumRepairBtn.addEventListener("click", function() {
            modal.style.display = "block";
            document.body.style.overflow = "hidden";
            
            if (serviceTypeSelect && serviceTypeSelect.options.length >= 5) {
                serviceTypeSelect.selectedIndex = 4; 
            }
        });
    }
});

document.addEventListener("DOMContentLoaded", function() {
    const reviewsSlides = document.querySelectorAll(".reviews-slide");
    const navigationDots = document.querySelectorAll(".reviews-nav .dot");
    let currentSlide = 0;
    let slideshowInterval;

function showSlide(slideIndex) {
        
        reviewsSlides.forEach(slide => {
            slide.classList.remove("active");
        });

navigationDots.forEach(dot => {
            dot.classList.remove("active");
        });

reviewsSlides[slideIndex].classList.add("active");
        navigationDots[slideIndex].classList.add("active");

currentSlide = slideIndex;
    }

function nextSlide() {
        let nextIndex = currentSlide + 1;
        if (nextIndex >= reviewsSlides.length) {
            nextIndex = 0; 
        }
        showSlide(nextIndex);
    }

function startSlideshow() {
        slideshowInterval = setInterval(nextSlide, 90000); 
    }

function stopSlideshow() {
        clearInterval(slideshowInterval);
    }

if (reviewsSlides.length > 0) {
        showSlide(0); 
        startSlideshow(); 

navigationDots.forEach((dot, index) => {
            dot.addEventListener("click", function() {
                stopSlideshow(); 
                showSlide(index); 
                startSlideshow(); 
            });
        });

const reviewsContainer = document.querySelector(".reviews-container");
        if (reviewsContainer) {
            reviewsContainer.addEventListener("mouseenter", stopSlideshow);
            reviewsContainer.addEventListener("mouseleave", startSlideshow);
        }
    }
});

