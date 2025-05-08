document.addEventListener("DOMContentLoaded", function() {
    // Category navigation functionality
    const categoryLinks = document.querySelectorAll(".blog-categories ul li a");
    
    categoryLinks.forEach(link => {
        link.addEventListener("click", function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            categoryLinks.forEach(item => {
                item.parentElement.classList.remove("active");
            });
            
            // Add active class to clicked link
            this.parentElement.classList.add("active");
            
            // Get the category ID from href attribute
            const category = this.getAttribute("href").substring(1);
            
            // Filter posts based on category
            if (category === "all") {
                // Show all posts
                document.querySelectorAll(".post-card").forEach(post => {
                    post.style.display = "block";
                });
            } else {
                // Filter posts by category
                document.querySelectorAll(".post-card").forEach(post => {
                    if (post.id === category || post.querySelector(".category").textContent.toLowerCase() === category.toLowerCase()) {
                        post.style.display = "block";
                    } else {
                        post.style.display = "none";
                    }
                });
            }
            
            // Smooth scroll to posts section
            document.querySelector(".blog-posts").scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        });
    });
    
    // Newsletter form submission
    const newsletterForm = document.querySelector(".newsletter-form");
    if (newsletterForm) {
        newsletterForm.addEventListener("submit", function(e) {
            e.preventDefault();
            
            const emailInput = this.querySelector("input[type='email']");
            const email = emailInput.value.trim();
            
            if (!email) {
                alert("Please enter your email address");
                return;
            }
            
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert("Please enter a valid email address");
                return;
            }
            
            // In a real site, you would send this to your backend
            // For demo purposes, we'll just show a success message
            alert("Thank you for subscribing to our newsletter!");
            emailInput.value = "";
        });
    }
    
    // Read More button functionality
    // Only intercept links that don't have proper destinations
    const readMoreButtons = document.querySelectorAll(".read-more");
    readMoreButtons.forEach(button => {
        // Check if the link is just a placeholder "#" link
        if (button.getAttribute("href") === "#") {
            button.addEventListener("click", function(e) {
                e.preventDefault();
                
                // Get the post title
                let postTitle;
                if (this.closest(".featured-post")) {
                    postTitle = this.closest(".featured-post").querySelector("h2").textContent;
                } else {
                    postTitle = this.closest(".post-card").querySelector("h3").textContent;
                }
                
                alert(`Full article for "${postTitle}" coming soon! This would normally link to the full blog post.`);
            });
        }
        // Let links with real destinations (like blog-post-maintenance-tips.html) work normally
    });
    
    // Pagination functionality (for demonstration)
    const paginationLinks = document.querySelectorAll(".blog-pagination a");
    paginationLinks.forEach(link => {
        link.addEventListener("click", function(e) {
            e.preventDefault();
            
            // Remove active class from all pagination links
            paginationLinks.forEach(item => {
                item.classList.remove("active");
            });
            
            // Add active class to clicked link
            if (!this.classList.contains("next-page")) {
                this.classList.add("active");
            }
            
            // In a real implementation, this would load the next page of posts
            // For demo purposes, we'll just show a message
            alert("In a complete implementation, this would navigate to the next page of blog posts.");
        });
    });
    
    // Add sticky behavior for category navigation
    window.addEventListener("scroll", function() {
        const categories = document.querySelector(".blog-categories");
        const header = document.querySelector(".header");
        
        if (window.scrollY > 300) {
            categories.style.top = header.offsetHeight + "px";
        } else {
            categories.style.top = "0";
        }
    });
});