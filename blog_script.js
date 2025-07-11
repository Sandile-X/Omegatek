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
                const featuredPost = document.querySelector(".featured-post");
                if (featuredPost) featuredPost.style.display = "block";
            } else {
                // Hide featured post if not showing all
                const featuredPost = document.querySelector(".featured-post");
                if (featuredPost) featuredPost.style.display = "none";
                
                // Filter posts by category
                document.querySelectorAll(".post-card").forEach(post => {
                    const postCategory = post.querySelector(".category").textContent.toLowerCase();
                    if (postCategory === category.toLowerCase() || 
                        postCategory.includes(category.toLowerCase()) ||
                        category.toLowerCase().includes(postCategory)) {
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

    // Search functionality
    const searchInput = document.getElementById("blog-search");
    if (searchInput) {
        searchInput.addEventListener("input", function() {
            const searchTerm = this.value.toLowerCase();
            const posts = document.querySelectorAll(".post-card");
            const featuredPost = document.querySelector(".featured-post");
            
            // Search in featured post
            if (featuredPost) {
                const title = featuredPost.querySelector("h2").textContent.toLowerCase();
                const content = featuredPost.querySelector("p").textContent.toLowerCase();
                const category = featuredPost.querySelector(".category").textContent.toLowerCase();
                
                if (title.includes(searchTerm) || content.includes(searchTerm) || category.includes(searchTerm)) {
                    featuredPost.style.display = "block";
                } else {
                    featuredPost.style.display = searchTerm === "" ? "block" : "none";
                }
            }
            
            // Search in regular posts
            posts.forEach(post => {
                const title = post.querySelector("h3").textContent.toLowerCase();
                const content = post.querySelector("p").textContent.toLowerCase();
                const category = post.querySelector(".category").textContent.toLowerCase();
                
                if (title.includes(searchTerm) || content.includes(searchTerm) || category.includes(searchTerm)) {
                    post.style.display = "block";
                } else {
                    post.style.display = searchTerm === "" ? "block" : "none";
                }
            });
        });
    }

    // Newsletter form submission
    const newsletterForm = document.querySelector(".newsletter-form");
    if (newsletterForm) {
        newsletterForm.addEventListener("submit", function(e) {
            e.preventDefault();
            
            const emailInput = this.querySelector("input[type='email']");
            const email = emailInput.value.trim();
            
            if (!email) {
                showNotification("Please enter your email address", "error");
                return;
            }
            
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showNotification("Please enter a valid email address", "error");
                return;
            }
            
            // Show success message
            showNotification("Thank you for subscribing! We'll keep you updated with our latest tech tips.", "success");
            
            // Reset form
            emailInput.value = "";
            
            // Here you would typically send the email to your backend
            console.log("Newsletter subscription:", email);
        });
    }
    
    // Footer newsletter subscription
    const footerNewsletterForm = document.querySelector(".footer form");
    if (footerNewsletterForm) {
        footerNewsletterForm.addEventListener("submit", function(e) {
            e.preventDefault();
            
            const emailInput = this.querySelector("input[type='email']");
            const email = emailInput.value.trim();
            
            if (!email) {
                showNotification("Please enter your email address", "error");
                return;
            }
            
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showNotification("Please enter a valid email address", "error");
                return;
            }
            
            showNotification("Thank you for subscribing! We'll keep you updated with our latest tech tips.", "success");
            emailInput.value = "";
            console.log("Footer newsletter subscription:", email);
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
                
                showNotification(`Full article for "${postTitle}" coming soon! This would normally link to the full blog post.`, "info");
            });
        }
        // Let links with real destinations (like blog-post-maintenance-tips.html) work normally
    });

    // Pagination functionality (for demonstration)
    const paginationLinks = document.querySelectorAll(".blog-pagination a");
    paginationLinks.forEach(link => {
        link.addEventListener("click", function(e) {
            // Don't prevent default for actual page links
            const href = this.getAttribute("href");
            if (href && !href.includes("#")) {
                // Let the page navigate normally
                return;
            }
            
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
            showNotification("In a complete implementation, this would navigate to the next page of blog posts.", "info");
        });
    });

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Reading progress indicator
    const progressBar = document.querySelector(".reading-progress");
    if (progressBar) {
        window.addEventListener("scroll", function() {
            const article = document.querySelector(".blog-single .post-content");
            if (article) {
                const articleTop = article.offsetTop;
                const articleHeight = article.offsetHeight;
                const scrollTop = window.pageYOffset;
                const windowHeight = window.innerHeight;
                
                const progress = Math.min(100, Math.max(0, 
                    ((scrollTop - articleTop + windowHeight) / articleHeight) * 100
                ));
                
                progressBar.style.width = progress + "%";
            }
        });
    }

    // Back to top button
    const backToTopBtn = document.querySelector(".back-to-top");
    if (backToTopBtn) {
        window.addEventListener("scroll", function() {
            if (window.pageYOffset > 300) {
                backToTopBtn.classList.add("show");
            } else {
                backToTopBtn.classList.remove("show");
            }
        });
        
        backToTopBtn.addEventListener("click", function() {
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        });
    }

    // Add sticky behavior for category navigation
    window.addEventListener("scroll", function() {
        const categories = document.querySelector(".blog-categories");
        const header = document.querySelector(".header");
        
        if (categories && header) {
            if (window.scrollY > 300) {
                categories.style.top = header.offsetHeight + "px";
            } else {
                categories.style.top = "0";
            }
        }
    });

    // Copy article URL functionality
    const copyUrlBtn = document.querySelector(".copy-url");
    if (copyUrlBtn) {
        copyUrlBtn.addEventListener("click", function() {
            navigator.clipboard.writeText(window.location.href).then(function() {
                showNotification("Article URL copied to clipboard!", "success");
            });
        });
    }

    // Notification system
    function showNotification(message, type = "info") {
        const notification = document.createElement("div");
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
                <button class="close-notification">&times;</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => {
            notification.classList.add("show");
        }, 100);
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            hideNotification(notification);
        }, 5000);
        
        // Close button functionality
        notification.querySelector(".close-notification").addEventListener("click", function() {
            hideNotification(notification);
        });
    }
    
    function hideNotification(notification) {
        notification.classList.remove("show");
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
});