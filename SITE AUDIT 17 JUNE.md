Omegatek Website — Comprehensive Audit Report
Audited: 2026-06-17

SECURITY — Critical Issues First
CRITICAL
1. Exposed Supabase API Key
The anon JWT token is hardcoded in js/supabaseClient.js and embedded in 9+ HTML pages (blog.html, checkout.html, products.html, admin-login.html, etc.). A second publishable key also sits in js/auth.js:12.

Risk: Anyone can inspect source and use the token to query your Supabase database directly
Fix: Rotate both keys immediately. Move Supabase calls to a PHP proxy so the key never reaches the browser, or ensure Row-Level Security (RLS) policies are airtight on every table
2. Hardcoded Admin Email in Source
milanzisandile5@gmail.com is visible in admin/admin-login.html:69.

Fix: Remove it; let the login form be generic
3. XSS via Unsanitized innerHTML
js/auth.js uses innerHTML with backtick template literals at lines 58, 148, 207, 537, 562, 575, 601 — injecting order data from the API directly into the DOM.

Risk: If any order field (name, address, note) contains <script> or event handlers, it executes
Fix: Use textContent for text, createElement + appendChild for structure, or a library like DOMPurify
4. Zero CSRF Protection
No CSRF tokens exist on any form or API endpoint. api/contact_us.php, admin/newsletter-api.php, admin/orders-api-v2.php — all accept POST with no origin verification beyond CORS headers.

Fix: Implement the token logic in config/csrf.php (which exists but isn't wired up) across all endpoints
5. Client-Side Brute-Force Protection
admin/admin-login.html:97-113 locks out after 5 failed attempts using sessionStorage — which any attacker can clear in DevTools or by opening a new tab.

Fix: Move lockout tracking to server-side (PHP session or rate-limit table)
HIGH
6. Insecure Direct Object Reference (IDOR)
orders-api-v2.php fetches customer orders using $userId from the session token, but doesn't verify at the SQL level that the requested order belongs to that user. A crafted request could potentially access other customers' repairs.

7. Email Header Injection
newsletter-api.php uses str_replace() on newsletter content and user-supplied fields before passing to mail functions — insufficient to prevent CRLF injection if a field contains \r\n.

Fix: Use filter_var($email, FILTER_VALIDATE_EMAIL) and strip all newlines from name/subject fields
8. Race Condition in File-Based Rate Limiter
config/rate-limit.php writes to files without atomic locking. Under concurrent requests, two requests can pass the check simultaneously before either increments the counter.

Fix: Use flock() or switch to a database-backed counter
9. Gemini API Admin PIN is a Weak Fallback
admin/gemini-api.php:20-83 has a POST path that falls back to a plaintext PIN comparison. If .env leaks, full AI admin access is open.

FLAWS & VULNERABILITIES
Unprotected Admin Dashboard HTML — admin/admin-dashboard.html loads fully before the JS auth check fires. A brief page flash is visible; server-side auth guard needed
URL Structure Inconsistency — sitemap.xml references /pages/about, but robots.txt allows /about.html. Google sees two different canonical signals
getSubscribers() loads all rows into memory — admin/newsletter-api.php around line 301 fetches all subscribers without pagination. Will break under load with large lists
Open Redirect Risk — Newsletter unsubscribe uses a ?token= parameter; no rate limit on token guessing attempts
SEO
Working well:

Meta title, description, Open Graph & Twitter Cards on all key pages
JSON-LD structured data (Organization, LocalBusiness, ContactPoint) on index.html
Canonical tags present sitewide
Breadcrumb schema on about.html and services.html
sitemap.xml and robots.txt both present
Issues:

Issue	Location	Impact
3x <h1> tags on one page	index.html	Google dilutes keyword authority
Heading jump: H1 → H3 (no H2)	index.html hero section	Broken semantic structure
26+ images with empty alt=""	index.html:1169–1174 (gallery)	Image search ranking loss + WCAG fail
sitemap.xml vs robots.txt URL mismatch	sitemap.xml:16, 25	Conflicting canonical signals
Page title "Omegatek Solutions" — no keyword	index.html:6	Missed primary keyword opportunity
Quick SEO wins:

Change index.html to have exactly one <h1> (the brand/hero headline)
Add descriptive alt text to every gallery and service icon image
Standardize URLs — pick either /pages/about or /about and stick to it in both sitemap and robots.txt
UI / UX
Strengths:

Smooth scroll, AOS animations, typewriter effect — visually polished
Mobile viewport configured, Tailwind responsive classes used
font-display: swap on custom fonts (good for CLS)
Preconnect to Google Fonts CDN in <head>
Issues:

Accessibility (WCAG failures):

26+ images with no alt text — screen reader users get nothing
Modal dialogs in js/auth.js lack role="dialog" and aria-modal="true"
Buttons generated via innerHTML have no aria-label
Skip-to-content link exists (good), but heading structure is broken so it doesn't help much
autocomplete="username" on an email field in admin/admin-login.html:36 — should be "email"
Interaction smoothness:

window.onscroll in js/script.js:11-25 fires on every scroll pixel with no throttle — causes jank on lower-end devices
Typewriter animation re-triggers layout repaints on each character step
No will-change: transform applied to animated elements
PERFORMANCE
Working well:

AVIF format for hero image
preload="metadata" on video
gzip compression in .htaccess
content-visibility: auto attempted in CSS
Issues:

Issue	Location	Impact
26 unminified JS files	js/ directory	Larger download, slower parse
8+ separate CSS files loaded	index.html <head>	8+ blocking HTTP requests
No loading="lazy" on gallery images	index.html:1169–1174	All images load on first paint
Tailwind CSS loaded from CDN (runtime)	index.html:8	~80KB render-blocking; should be compiled
Font Awesome entire library loaded	multiple pages	~70KB+ for partial icon use
No Brotli compression	.htaccess	gzip is ~20–26% less efficient than Brotli
No hero image <link rel="preload">	index.html <head>	LCP delayed
Scroll listener not throttled	js/script.js:11	FID/INP score hurt
Biggest quick wins:

Add loading="lazy" to every below-fold image
Bundle and minify all JS/CSS (Vite or esbuild — takes one config file)
Compile Tailwind at build time instead of pulling the CDN runtime
Add <link rel="preload" as="image"> for the hero AVIF
Enable Brotli in .htaccess
Priority Action Plan
Do This Week (Security — Production Risk)
Rotate both Supabase keys — old ones are burned
Remove admin email from HTML source
Replace all innerHTML in auth.js with safe DOM methods (or add DOMPurify)
Wire up CSRF tokens — the config exists, just needs to be used
Move login lockout to server-side
Do This Month (Quality & SEO)
Fix heading structure — 1x H1, then H2s, then H3s
Add descriptive alt text to all 26+ gallery/service images
Standardize URL structure across sitemap + robots.txt
Add ARIA roles to modals and dynamically generated buttons
Throttle the scroll event listener with requestAnimationFrame
Do This Quarter (Performance)
Set up Vite or esbuild — bundle + minify all assets in one step
Compile Tailwind at build time (removes the 80KB CDN hit)
Add loading="lazy" everywhere below the fold
Enable Brotli in .htaccess
Paginate the newsletter subscriber fetch