let menu = document.querySelector('#menu-btn');
let navbarLinks = document.querySelector('.header .navbar .links');

menu.onclick = () =>{
   menu.classList.toggle('fa-times');
   navbarLinks.classList.toggle('active');
}

window.onscroll = () =>{
   menu.classList.remove('fa-times');
   navbarLinks.classList.remove('active');

   if(window.scrollY > 60){
      document.querySelector('.header .navbar').classList.add('active');
   }else{
      document.querySelector('.header .navbar').classList.remove('active');
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
   
   // Newsletter subscription form
   const newsletterForm = document.querySelector(".footer form");
   if (newsletterForm) {
      newsletterForm.addEventListener("submit", function(event) {
         event.preventDefault();
         
         const emailInput = this.querySelector(".email");
         const email = emailInput.value.trim();
         
         if (!email || !validateEmail(email)) {
            alert("Please enter a valid email address");
            return false;
         }
         
         // Store email in localStorage for demo purposes
         // In production, this would be sent to a server
         let subscribers = JSON.parse(localStorage.getItem("newsletter_subscribers") || "[]");
         subscribers.push(email);
         localStorage.setItem("newsletter_subscribers", JSON.stringify(subscribers));
         
         alert("Thank you for subscribing to our newsletter!");
         this.reset();
      });
   }
});

// Email validation helper function
function validateEmail(email) {
   const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
   return regex.test(email);
}

// Typewriter effect for hero section
document.addEventListener("DOMContentLoaded", function() {
   const typewriterElement = document.querySelector(".typewriter h2");
   if (typewriterElement) {
      typewriterElement.style.animation = "typing 3s steps(30, end) forwards, blink 0.7s step-end infinite alternate";
   }
});

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

