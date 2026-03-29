document.addEventListener("DOMContentLoaded", function() {
    // Mobile navigation toggle functionality
    const navToggle = document.querySelector(".blog-nav-toggle");
    const categoryList = document.querySelector(".blog-category-list");
    
    if (navToggle && categoryList) {
        navToggle.addEventListener("click", function() {
            const isExpanded = categoryList.classList.contains("active");
            categoryList.classList.toggle("active");
            this.classList.toggle("active");
            
            // Update ARIA attributes
            this.setAttribute("aria-expanded", !isExpanded);
            
            // Focus on first category if opening menu
            if (!isExpanded) {
                const firstCategory = categoryList.querySelector("li a");
                if (firstCategory) {
                    setTimeout(() => {
                        firstCategory.focus();
                    }, 100);
                }
            }
        });
    }
    
    // Handle search functionality for both mobile and desktop
    const searchInputDesktop = document.getElementById("blog-search");
    const searchInputMobile = document.getElementById("blog-search-mobile");
    
    function handleSearch(searchTerm) {
        const posts = document.querySelectorAll(".post-card");
        const featuredPost = document.querySelector(".featured-post");
        
        // Clear category filter when searching
        if (searchTerm.trim() !== "") {
            const categoryLinks = document.querySelectorAll(".blog-category-list li");
            categoryLinks.forEach(item => item.classList.remove("active"));
            const allPostsLink = document.querySelector(".blog-category-list li a[href='#all']");
            if (allPostsLink) allPostsLink.parentElement.classList.add("active");
        }
        
        // Search in featured post
        if (featuredPost) {
            const titleElement = featuredPost.querySelector("h2");
            const contentElement = featuredPost.querySelector("p");
            const categoryElement = featuredPost.querySelector(".category");
            
            if (titleElement && contentElement && categoryElement) {
                const title = titleElement.textContent.toLowerCase();
                const content = contentElement.textContent.toLowerCase();
                const category = categoryElement.textContent.toLowerCase();
                
                if (title.includes(searchTerm) || content.includes(searchTerm) || category.includes(searchTerm)) {
                    featuredPost.style.display = "block";
                } else {
                    featuredPost.style.display = searchTerm === "" ? "block" : "none";
                }
            }
        }
        
        // Search in regular posts
        posts.forEach(post => {
            const titleElement = post.querySelector("h3");
            const contentElement = post.querySelector("p");
            const categoryElement = post.querySelector(".category");
            
            if (titleElement && contentElement && categoryElement) {
                const title = titleElement.textContent.toLowerCase();
                const content = contentElement.textContent.toLowerCase();
                const category = categoryElement.textContent.toLowerCase();
                
                if (title.includes(searchTerm) || content.includes(searchTerm) || category.includes(searchTerm)) {
                    post.style.display = "block";
                } else {
                    post.style.display = searchTerm === "" ? "block" : "none";
                }
            }
        });
    }
    
    if (searchInputDesktop) {
        searchInputDesktop.addEventListener("input", function() {
            const searchTerm = this.value.toLowerCase();
            handleSearch(searchTerm);
            if (searchInputMobile) searchInputMobile.value = searchTerm;
        });
    }
    
    if (searchInputMobile) {
        searchInputMobile.addEventListener("input", function() {
            const searchTerm = this.value.toLowerCase();
            handleSearch(searchTerm);
            if (searchInputDesktop) searchInputDesktop.value = searchTerm;
        });
    }
    
    // Category navigation functionality
    const categoryLinks = document.querySelectorAll(".blog-category-list li a");
    
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
            
            // Close mobile menu after selecting a category
            if (categoryList && categoryList.classList.contains("active") && window.innerWidth <= 768) {
                categoryList.classList.remove("active");
                if (navToggle) navToggle.classList.remove("active");
            }
            
            // Clear any active search before filtering
            if (searchInputDesktop) searchInputDesktop.value = "";
            if (searchInputMobile) searchInputMobile.value = "";
            
            // Filter posts based on category
            if (category === "all") {
                // Show all posts
                document.querySelectorAll(".post-card").forEach(post => {
                    post.style.display = "block";
                });
                const featuredPost = document.querySelector(".featured-post");
                if (featuredPost) featuredPost.style.display = "block";
            } else {
                // Filter featured post by category as well
                const featuredPost = document.querySelector(".featured-post");
                if (featuredPost) {
                    const categoryElement = featuredPost.querySelector(".category");
                    if (categoryElement) {
                        const postCategory = categoryElement.textContent.toLowerCase().trim();
                        const targetCategory = category.toLowerCase().trim();
                        
                        // Apply same flexible matching logic for featured post
                        let shouldShow = false;
                        
                        switch(targetCategory) {
                            case "computers":
                                shouldShow = postCategory.includes("computer") || 
                                           postCategory.includes("pc") || 
                                           postCategory.includes("laptop") ||
                                           postCategory.includes("upgrades") ||
                                           postCategory.includes("classic tech");
                                break;
                            case "smartphones":
                                shouldShow = postCategory.includes("smartphone") || 
                                           postCategory.includes("phone") ||
                                           postCategory.includes("mobile");
                                break;
                            case "maintenance":
                                shouldShow = postCategory.includes("maintenance") ||
                                           postCategory.includes("care") ||
                                           postCategory.includes("cleaning");
                                break;
                            case "diy":
                                shouldShow = postCategory.includes("diy") ||
                                           postCategory.includes("repair") ||
                                           postCategory.includes("emergency repair") ||
                                           postCategory.includes("projects");
                                break;
                            case "tech-news":
                                shouldShow = postCategory.includes("tech news") ||
                                           postCategory.includes("news") ||
                                           postCategory.includes("tech reviews") ||
                                           postCategory.includes("reviews");
                                break;
                            default:
                                shouldShow = postCategory === targetCategory ||
                                           postCategory.includes(targetCategory) ||
                                           targetCategory.includes(postCategory);
                        }
                        
                        featuredPost.style.display = shouldShow ? "block" : "none";
                    } else {
                        featuredPost.style.display = "none";
                    }
                } else {
                    if (featuredPost) featuredPost.style.display = "none";
                }
                
                // Filter posts by category
                document.querySelectorAll(".post-card").forEach(post => {
                    const categoryElement = post.querySelector(".category");
                    if (!categoryElement) {
                        post.style.display = "none";
                        return;
                    }
                    
                    const postCategory = categoryElement.textContent.toLowerCase().trim();
                    const targetCategory = category.toLowerCase().trim();
                    
                    // More flexible category matching
                    let shouldShow = false;
                    
                    switch(targetCategory) {
                        case "computers":
                            shouldShow = postCategory.includes("computer") || 
                                       postCategory.includes("pc") || 
                                       postCategory.includes("laptop") ||
                                       postCategory.includes("upgrades") ||
                                       postCategory.includes("classic tech");
                            break;
                        case "smartphones":
                            shouldShow = postCategory.includes("smartphone") || 
                                       postCategory.includes("phone") ||
                                       postCategory.includes("mobile");
                            break;
                        case "maintenance":
                            shouldShow = postCategory.includes("maintenance") ||
                                       postCategory.includes("care") ||
                                       postCategory.includes("cleaning");
                            break;
                        case "diy":
                            shouldShow = postCategory.includes("diy") ||
                                       postCategory.includes("repair") ||
                                       postCategory.includes("emergency repair") ||
                                       postCategory.includes("projects");
                            break;
                        case "tech-news":
                            shouldShow = postCategory.includes("tech news") ||
                                       postCategory.includes("news") ||
                                       postCategory.includes("tech reviews") ||
                                       postCategory.includes("reviews");
                            break;
                        default:
                            shouldShow = postCategory === targetCategory ||
                                       postCategory.includes(targetCategory) ||
                                       targetCategory.includes(postCategory);
                    }
                    
                    post.style.display = shouldShow ? "block" : "none";
                });
                
                // Check if any posts are visible and show message if none
                const visiblePosts = document.querySelectorAll(".post-card[style*='block']");
                const featuredVisible = featuredPost && featuredPost.style.display !== "none";
                
                if (visiblePosts.length === 0 && !featuredVisible) {
                    // Show a "no results" message or handle empty state
                    // console.log(`No posts found for category: ${category}`);
                }
            }
            
            // Scroll to posts section with a small delay to ensure filtering is complete
            setTimeout(() => {
                const postsSection = document.querySelector(".blog-posts");
                if (postsSection) {
                    postsSection.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });
                }
            }, 100);
        });
    });

    // Add a show all posts function for easy reset
    window.showAllPosts = function() {
        document.querySelectorAll(".post-card").forEach(post => {
            post.style.display = "block";
        });
        const featuredPost = document.querySelector(".featured-post");
        if (featuredPost) featuredPost.style.display = "block";
        
        // Reset active category
        const categoryLinks = document.querySelectorAll(".blog-category-list li");
        categoryLinks.forEach(item => item.classList.remove("active"));
        const allPostsLink = document.querySelector(".blog-category-list li a[href='#all']");
        if (allPostsLink) allPostsLink.parentElement.classList.add("active");
    };

    // We've already handled search functionality in the updated code above

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
            // console.log("Newsletter subscription:", email);
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
            // console.log("Footer newsletter subscription:", email);
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

    // Handle browser back button and URL hash changes
    window.addEventListener('hashchange', function() {
        const hash = window.location.hash;
        if (hash) {
            const targetCategoryLink = document.querySelector(`.blog-category-list li a[href="${hash}"]`);
            if (targetCategoryLink) {
                // Simulate click on the category link
                targetCategoryLink.click();
            }
        }
    });

    // Check if there's a hash in URL on page load
    window.addEventListener('load', function() {
        const hash = window.location.hash;
        if (hash) {
            const targetCategoryLink = document.querySelector(`.blog-category-list li a[href="${hash}"]`);
            if (targetCategoryLink) {
                // Simulate click on the category link
                targetCategoryLink.click();
            }
        }
    });

    // Handle window resize to fix navigation visibility issues
    window.addEventListener('resize', function() {
        const categoryList = document.querySelector(".blog-category-list");
        if (window.innerWidth > 768 && categoryList) {
            categoryList.classList.add("active");
        } else if (window.innerWidth <= 768 && categoryList) {
            const navToggle = document.querySelector(".blog-nav-toggle");
            if (!navToggle || !navToggle.classList.contains("active")) {
                categoryList.classList.remove("active");
            }
        }
    });
});