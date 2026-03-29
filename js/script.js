let menu = document.querySelector('#menu-btn');
let navbarLinks = document.querySelector('.header .navbar .links');

if (menu && navbarLinks) {
   menu.onclick = () => {
      menu.classList.toggle('fa-times');
      navbarLinks.classList.toggle('active');
   }
}

window.onscroll = () => {
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
}

// Contact form handling
document.addEventListener("DOMContentLoaded", function() {
   const contactForm = document.getElementById("contactForm");
   
   if (contactForm) {
      contactForm.addEventListener("submit", function(event) {
         event.preventDefault(); // Prevent default form submission
         
         // Get user inputs
         const userName = document.getElementById("name").value.trim();
         const userPhone = document.getElementById("phone").value.trim();
         const userMessage = document.getElementById("message").value.trim();
         
         // Validate form
         if (!userName || !userPhone || !userMessage) {
            alert("All fields are required!");
            return false;
         }
         
         // Create WhatsApp message content
         const whatsappNumber = "27736538207"; 
         const whatsappUrl = `https://wa.me/${whatsappNumber}?text=Name:%20${encodeURIComponent(userName)}%0APhone:%20${encodeURIComponent(userPhone)}%0AMessage:%20${encodeURIComponent(userMessage)}`;
         
         // Redirect to WhatsApp
         window.open(whatsappUrl, "_blank");
         
         // Reset form
         contactForm.reset();
      });
   }
   
   // Newsletter subscription is handled by the PHP-backed handler in index.html / page scripts.
   // This legacy localStorage stub has been removed to prevent duplicate submissions.
});

// Email validation helper function
function validateEmail(email) {
   const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
   return regex.test(email);
}

// Typewriter effect for hero section
document.addEventListener("DOMContentLoaded", function() {
    // Initialize the typewriter animation
    initTypewriter();
});

function initTypewriter() {
    const typewriterElement = document.querySelector(".typewriter h2");
    if (typewriterElement) {
        // Get text content for animation
        const text = typewriterElement.textContent;
        const textLength = text.length;
        
        // Calculate typing speed based on text length (more natural)
        const typingDuration = Math.max(3.5, textLength * 0.15); // Slower typing (about 7 chars per second)
        const erasingDuration = typingDuration * 0.6; // Erasing is faster than typing
        const pauseDuration = 2000; // Pause at full text (2 seconds)
        
        // Function to handle the complete animation cycle
        function animateTypewriter() {
            // 1. Typing animation
            typewriterElement.style.width = '0';
            typewriterElement.style.animation = `typing ${typingDuration}s steps(${textLength}, end) forwards, blinkCursor 0.75s step-end infinite`;
            
            // 2. Pause at full text
            setTimeout(() => {
                // Keep width at 100% but change animation to just cursor blinking
                typewriterElement.style.width = '100%';
                typewriterElement.style.animation = 'blinkCursor 0.75s step-end infinite';
                
                // 3. Start erasing after pause
                setTimeout(() => {
                    // Erasing animation
                    typewriterElement.style.animation = `erasing ${erasingDuration}s steps(${textLength}, end) forwards, blinkCursor 0.75s step-end infinite`;
                    
                    // 4. Restart cycle after erasing completes
                    setTimeout(() => {
                        animateTypewriter();
                    }, erasingDuration * 1000 + 500); // Add small delay after erasing
                    
                }, pauseDuration);
            }, typingDuration * 1000);
        }
        
        // Start the animation cycle
        animateTypewriter();
    }
}

// Gallery lightbox initialization
document.addEventListener("DOMContentLoaded", function() {
   if (typeof lightGallery === "function" && document.querySelector(".gallery .gallery-container")) {
      lightGallery(document.querySelector(".gallery .gallery-container"));
   }
});

// Smooth scrolling for navigation links
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
               
               // Close mobile menu if open
               menu.classList.remove('fa-times');
               navbarLinks.classList.remove('active');
            }
         }
      });
   }
});

// Booking modal functionality
document.addEventListener("DOMContentLoaded", function() {
    // Get modal elements
    const modal = document.getElementById("bookingModal");
    const openBtn = document.getElementById("openBooking");
    const closeBtn = document.querySelector(".close-modal");
    
    // Set minimum date for booking to today
    const dateInput = document.getElementById("preferredDate");
    if (dateInput) {
        const today = new Date().toISOString().split("T")[0];
        dateInput.setAttribute("min", today);
    }
    
    // Open modal when button is clicked
    if (openBtn) {
        openBtn.addEventListener("click", function() {
            modal.style.display = "block";
            document.body.style.overflow = "hidden"; // Prevent scrolling behind modal
        });
    }
    
    // Close modal when X is clicked
    if (closeBtn) {
        closeBtn.addEventListener("click", function() {
            modal.style.display = "none";
            document.body.style.overflow = "auto"; // Re-enable scrolling
        });
    }
    
    // Close modal when clicking outside of it
    window.addEventListener("click", function(event) {
        if (event.target === modal) {
            modal.style.display = "none";
            document.body.style.overflow = "auto";
        }
    });
    
    // Handle booking form submission
    const bookingForm = document.getElementById("bookingForm");
    if (bookingForm) {
        bookingForm.addEventListener("submit", function(event) {
            event.preventDefault();
            
            // Get form values
            const name = document.getElementById("bookingName").value.trim();
            const phone = document.getElementById("bookingPhone").value.trim();
            const serviceType = document.getElementById("serviceType").value;
            const preferredDate = document.getElementById("preferredDate").value;
            const preferredTime = document.getElementById("preferredTime").value;
            const issueDescription = document.getElementById("issueDescription").value.trim();
            
            // Create WhatsApp message
            const message = `*New Booking Request*\n` +
                            `Name: ${name}\n` +
                            `Phone: ${phone}\n` +
                            `Service: ${serviceType}\n` +
                            `Date: ${preferredDate}\n` +
                            `Time: ${preferredTime}\n` +
                            `Description: ${issueDescription}`;
            
            // Open WhatsApp with pre-filled message
            const whatsappNumber = "27736538207";
            const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, "_blank");
            
            // Close modal and reset form
            modal.style.display = "none";
            document.body.style.overflow = "auto";
            bookingForm.reset();
            
            // Show confirmation message
            alert("Booking request sent! We'll confirm your appointment shortly.");
        });
    }
});

// Connect pricing buttons to booking modal
document.addEventListener("DOMContentLoaded", function() {
    // Get pricing buttons
    const basicRepairBtn = document.getElementById("basicRepairBtn");
    const standardRepairBtn = document.getElementById("standardRepairBtn");
    const premiumRepairBtn = document.getElementById("premiumRepairBtn");
    
    // Get booking modal elements
    const modal = document.getElementById("bookingModal");
    const serviceTypeSelect = document.getElementById("serviceType");
    
    // Add click event listeners to pricing buttons
    if (basicRepairBtn) {
        basicRepairBtn.addEventListener("click", function() {
            modal.style.display = "block";
            document.body.style.overflow = "hidden";
            // Set first two options (typically smartphone/basic repairs)
            if (serviceTypeSelect && serviceTypeSelect.options.length >= 3) {
                serviceTypeSelect.selectedIndex = 2; // Smartphone Repair option
            }
        });
    }
    
    if (standardRepairBtn) {
        standardRepairBtn.addEventListener("click", function() {
            modal.style.display = "block";
            document.body.style.overflow = "hidden";
            // Set to computer/laptop options
            if (serviceTypeSelect && serviceTypeSelect.options.length >= 2) {
                serviceTypeSelect.selectedIndex = 1; // Computer Repair option
            }
        });
    }
    
    if (premiumRepairBtn) {
        premiumRepairBtn.addEventListener("click", function() {
            modal.style.display = "block";
            document.body.style.overflow = "hidden";
            // Set to multimedia or game console options
            if (serviceTypeSelect && serviceTypeSelect.options.length >= 5) {
                serviceTypeSelect.selectedIndex = 4; // Multimedia Repair option
            }
        });
    }
});

// Reviews Slideshow
document.addEventListener("DOMContentLoaded", function() {
    const reviewsSlides = document.querySelectorAll(".reviews-slide");
    const navigationDots = document.querySelectorAll(".reviews-nav .dot");
    let currentSlide = 0;
    let slideshowInterval;

    // Function to show a specific slide
    function showSlide(slideIndex) {
        // Hide all slides
        reviewsSlides.forEach(slide => {
            slide.classList.remove("active");
        });
        
        // Remove active class from all dots
        navigationDots.forEach(dot => {
            dot.classList.remove("active");
        });
        
        // Show the current slide
        reviewsSlides[slideIndex].classList.add("active");
        navigationDots[slideIndex].classList.add("active");
        
        // Update current slide index
        currentSlide = slideIndex;
    }
    
    // Function to show the next slide
    function nextSlide() {
        let nextIndex = currentSlide + 1;
        if (nextIndex >= reviewsSlides.length) {
            nextIndex = 0; // Loop back to the first slide
        }
        showSlide(nextIndex);
    }
    
    // Start automatic slideshow with 90-second intervals (1.5 minutes)
    function startSlideshow() {
        slideshowInterval = setInterval(nextSlide, 90000); // 90000 ms = 1.5 minutes
    }
    
    // Stop the automatic slideshow
    function stopSlideshow() {
        clearInterval(slideshowInterval);
    }
    
    // Initialize the slideshow
    if (reviewsSlides.length > 0) {
        showSlide(0); // Show the first slide
        startSlideshow(); // Start automatic transitions
        
        // Add click event listeners to navigation dots
        navigationDots.forEach((dot, index) => {
            dot.addEventListener("click", function() {
                stopSlideshow(); // Stop the automatic slideshow when manual navigation is used
                showSlide(index); // Show the clicked slide
                startSlideshow(); // Restart automatic transitions
            });
        });
        
        // Pause slideshow when user hovers over the slideshow area
        const reviewsContainer = document.querySelector(".reviews-container");
        if (reviewsContainer) {
            reviewsContainer.addEventListener("mouseenter", stopSlideshow);
            reviewsContainer.addEventListener("mouseleave", startSlideshow);
        }
    }
});

