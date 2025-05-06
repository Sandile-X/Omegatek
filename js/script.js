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
         const whatsappNumber = "0736538207"; 
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

