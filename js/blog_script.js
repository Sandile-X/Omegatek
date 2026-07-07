document.addEventListener("DOMContentLoaded", function() {
    
    const navToggle = document.querySelector(".blog-nav-toggle");
    const categoryList = document.querySelector(".blog-category-list");
    
    if (navToggle && categoryList) {
        navToggle.addEventListener("click", function() {
            const isExpanded = categoryList.classList.contains("active");
            categoryList.classList.toggle("active");
            this.classList.toggle("active");

this.setAttribute("aria-expanded", !isExpanded);

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

const searchInputDesktop = document.getElementById("blog-search");
    const searchInputMobile = document.getElementById("blog-search-mobile");
    
    function handleSearch(searchTerm) {
        const posts = document.querySelectorAll(".post-card");
        const featuredPost = document.querySelector(".featured-post");

if (searchTerm.trim() !== "") {
            const categoryLinks = document.querySelectorAll(".blog-category-list li");
            categoryLinks.forEach(item => item.classList.remove("active"));
            const allPostsLink = document.querySelector(".blog-category-list li a[href='#all']");
            if (allPostsLink) allPostsLink.parentElement.classList.add("active");
        }

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

const categoryLinks = document.querySelectorAll(".blog-category-list li a");
    
    categoryLinks.forEach(link => {
        link.addEventListener("click", function(e) {
            e.preventDefault();

categoryLinks.forEach(item => {
                item.parentElement.classList.remove("active");
            });

this.parentElement.classList.add("active");

const category = this.getAttribute("href").substring(1);

if (categoryList && categoryList.classList.contains("active") && window.innerWidth <= 768) {
                categoryList.classList.remove("active");
                if (navToggle) navToggle.classList.remove("active");
            }

if (searchInputDesktop) searchInputDesktop.value = "";
            if (searchInputMobile) searchInputMobile.value = "";

if (category === "all") {
                
                document.querySelectorAll(".post-card").forEach(post => {
                    post.style.display = "block";
                });
                const featuredPost = document.querySelector(".featured-post");
                if (featuredPost) featuredPost.style.display = "block";
            } else {
                
                const featuredPost = document.querySelector(".featured-post");
                if (featuredPost) {
                    const categoryElement = featuredPost.querySelector(".category");
                    if (categoryElement) {
                        const postCategory = categoryElement.textContent.toLowerCase().trim();
                        const targetCategory = category.toLowerCase().trim();

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

document.querySelectorAll(".post-card").forEach(post => {
                    const categoryElement = post.querySelector(".category");
                    if (!categoryElement) {
                        post.style.display = "none";
                        return;
                    }
                    
                    const postCategory = categoryElement.textContent.toLowerCase().trim();
                    const targetCategory = category.toLowerCase().trim();

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

const visiblePosts = document.querySelectorAll(".post-card[style*='block']");
                const featuredVisible = featuredPost && featuredPost.style.display !== "none";
                
                if (visiblePosts.length === 0 && !featuredVisible) {

}
            }

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

window.showAllPosts = function() {
        document.querySelectorAll(".post-card").forEach(post => {
            post.style.display = "block";
        });
        const featuredPost = document.querySelector(".featured-post");
        if (featuredPost) featuredPost.style.display = "block";

const categoryLinks = document.querySelectorAll(".blog-category-list li");
        categoryLinks.forEach(item => item.classList.remove("active"));
        const allPostsLink = document.querySelector(".blog-category-list li a[href='#all']");
        if (allPostsLink) allPostsLink.parentElement.classList.add("active");
    };

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

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showNotification("Please enter a valid email address", "error");
                return;
            }

showNotification("Thank you for subscribing! We'll keep you updated with our latest tech tips.", "success");

emailInput.value = "";

});
    }

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

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showNotification("Please enter a valid email address", "error");
                return;
            }
            
            showNotification("Thank you for subscribing! We'll keep you updated with our latest tech tips.", "success");
            emailInput.value = "";
            
        });
    }

const readMoreButtons = document.querySelectorAll(".read-more");
    readMoreButtons.forEach(button => {
        
        if (button.getAttribute("href") === "#") {
            button.addEventListener("click", function(e) {
                e.preventDefault();

let postTitle;
                if (this.closest(".featured-post")) {
                    postTitle = this.closest(".featured-post").querySelector("h2").textContent;
                } else {
                    postTitle = this.closest(".post-card").querySelector("h3").textContent;
                }
                
                showNotification(`Full article for "${postTitle}" coming soon! This would normally link to the full blog post.`, "info");
            });
        }
        
    });

const paginationLinks = document.querySelectorAll(".blog-pagination a");
    paginationLinks.forEach(link => {
        link.addEventListener("click", function(e) {
            
            const href = this.getAttribute("href");
            if (href && !href.includes("#")) {
                
                return;
            }
            
            e.preventDefault();

paginationLinks.forEach(item => {
                item.classList.remove("active");
            });

if (!this.classList.contains("next-page")) {
                this.classList.add("active");
            }

showNotification("In a complete implementation, this would navigate to the next page of blog posts.", "info");
        });
    });

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

const copyUrlBtn = document.querySelector(".copy-url");
    if (copyUrlBtn) {
        copyUrlBtn.addEventListener("click", function() {
            navigator.clipboard.writeText(window.location.href).then(function() {
                showNotification("Article URL copied to clipboard!", "success");
            });
        });
    }

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

setTimeout(() => {
            notification.classList.add("show");
        }, 100);

setTimeout(() => {
            hideNotification(notification);
        }, 5000);

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

window.addEventListener('hashchange', function() {
        const hash = window.location.hash;
        if (hash) {
            const targetCategoryLink = document.querySelector(`.blog-category-list li a[href="${hash}"]`);
            if (targetCategoryLink) {
                
                targetCategoryLink.click();
            }
        }
    });

window.addEventListener('load', function() {
        const hash = window.location.hash;
        if (hash) {
            const targetCategoryLink = document.querySelector(`.blog-category-list li a[href="${hash}"]`);
            if (targetCategoryLink) {
                
                targetCategoryLink.click();
            }
        }
    });

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