---
name: universal-web-security-skill
description: Production-ready security checklist and implementation patterns for HTML/CSS/JS/PHP websites. Covers authentication, API security, data protection, and modern security standards (2024+).
version: 1.0
author: Claude
---

# Universal Web Security Skill

## 🎯 Overview

This skill provides a **framework for 95%+ security compliance** on websites using HTML, CSS, JavaScript, and PHP. Use this as a reference for any new project.

---

## 1️⃣ AUTHENTICATION SECURITY

### ✅ Best Practices

**Use Managed Auth Services (Not Homemade)**
- **Supabase** (PostgreSQL + Auth) ✅ BEST for startups
- **Firebase** (NoSQL + Auth)
- **Clerk** (Modern, enterprise-ready)
- **Auth0** (Industry standard)
- **DO NOT build your own auth** — vulnerabilities hide

**Password Requirements**
```
- Minimum 8 characters (not 6)
- Support special characters
- No restrictions on length
- Client-side validation for UX
- Server-side validation for security
```

**Session Management**
```
- Use secure, HTTP-only cookies OR
- Use short-lived JWTs (15-30 min) with refresh tokens
- Implement session timeout (30 min inactivity)
- Force re-auth for sensitive actions (delete, password change)
- Revoke all sessions on password change
```

**Rate Limiting**
```
Login attempts: 5 failures in 15 minutes → 5-minute lockout
API calls: 100/minute per user (adjust per endpoint)
Newsletter signup: 2/hour per IP
```

**Forgot Password Flow**
```
1. Generate secure token (crypto.randomUUID())
2. Store with: email, expiry (15 minutes), one-time use flag
3. Send reset link with token (NOT in password reset form)
4. Validate token before showing reset form
5. Invalidate old token after reset
6. DO NOT reveal if email exists (say "Check your inbox")
```

### 🔴 CRITICAL Fixes for Your Code

**Issue 1: Password minimum is 6 characters**
- Current: `if (newPw.length < 6)` (line 686 in auth.js)
- Fix: Change to `if (newPw.length < 8)`

**Issue 2: Delete account has no re-auth**
- Current: Single confirm() dialog then deletion
- Fix: Require password re-entry before deletion (see below)

**Issue 3: Session doesn't timeout on inactivity**
- Current: No visible inactivity timeout
- Fix: Add 30-minute inactivity check in dashboard

---

## 2️⃣ API SECURITY

### ✅ Best Practices

**HTTPS Only**
```
- Redirect http:// to https://
- Use HSTS header (strict-transport-security)
- Certificate should be valid and auto-renewed
```

**CORS Configuration**
```
- NEVER use `Access-Control-Allow-Origin: *` on sensitive endpoints
- Use explicit allowlist of origins
- For public endpoints: explicit set OR trust server-side validation
```

**Input Validation**
```php
// BAD: Trust client input
$email = $_POST['email'];

// GOOD: Validate and sanitize
$email = filter_var($_POST['email'] ?? '', FILTER_SANITIZE_EMAIL);
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    die(json_encode(['error' => 'Invalid email']));
}
```

**SQL/Database Injection Prevention**
```
- Use parameterized queries / ORMs (NOT string concatenation)
- Supabase with RLS (Row Level Security) handles this
- NEVER execute user input as SQL
```

**Authentication Tokens**
```
- JWTs: Verify signature every request
- API Keys: Hash before storage, compare securely
- Bearer tokens: Store in Authorization header (not query string)
- Cache verification results to reduce overhead
```

**Rate Limiting**
```php
// Store in file (like your current approach) OR Redis
// DO NOT rely on client-side rate limiting
// Check: IP address + user ID (if authenticated)
```

### 🔴 CRITICAL Fixes for Your Code

**Issue 1: admin_pin as fallback is risky**
- Current: `if ($pin !== '' && hash_equals(ADMIN_PIN, $pin))` (line 70 in gemini-api.php)
- Risk: PIN could be logged, exposed in POST data
- Fix: Remove PIN fallback in production; use Supabase JWT only

**Issue 2: Newsletter CORS is too permissive**
- Current: `header('Access-Control-Allow-Origin: *')` for public actions (line 22 in newsletter-api.php)
- Risk: Any domain can spam your newsletter signup
- Fix: Still allow CORS, but add stronger rate limiting per IP

**Issue 3: Email validation is weak**
- Current: Basic regex in script.js
- Fix: Use PHP `filter_var($email, FILTER_VALIDATE_EMAIL)` server-side

---

## 3️⃣ DATA PROTECTION

### ✅ Best Practices

**Sensitive Data (never log/expose)**
```
- Passwords (hash with bcrypt/Argon2)
- API keys (store in .env, never in code/comments)
- Credit cards (don't store; use Stripe/PayPal)
- Tokens (short-lived, rotate frequently)
- User SSNs/IDs (encrypt if stored)
```

**Personal Data (GDPR/POPIA compliance)**
```
- Collect only what's needed
- Store securely (hash emails where possible)
- Provide download/delete on request
- Unsubscribe links MUST work (test monthly)
- Privacy policy must be clear and current
```

**Encryption**
```
- In transit: HTTPS (automatic with proper certs)
- At rest: Encrypt PII using AES-256 (or rely on DB provider)
- Keys: Never commit to Git; use .env
```

### 🔴 CRITICAL Fixes for Your Code

**Issue 1: Unsubscribe token handling**
- Current: Token passed in URL query string (line in unsubscribe.php)
- Risk: Logged in server logs, browser history
- Fix: Use POST request with token in body

**Issue 2: Newsletter emails stored in plain text (likely)**
- Current: No visible encryption
- Fix: Use Supabase's encryption OR hash with salt for storage (but need plaintext to send)
- Acceptable approach: Store plaintext with strong DB access control + HTTPS

**Issue 3: Order data in JSON file**
- Current: `order_data/orders.json` (local file)
- Risk: No encryption, backups might leak data
- Fix: Move to Supabase with Row Level Security (RLS)

---

## 4️⃣ FRONTEND SECURITY

### ✅ Best Practices

**XSS Prevention (Cross-Site Scripting)**
```javascript
// BAD: User input directly in HTML
element.innerHTML = userInput;

// GOOD: Use textContent for text, sanitize for HTML
element.textContent = userInput;

// If you need HTML: use DOMPurify library
import DOMPurify from 'https://cdn.jsdelivr.net/npm/dompurify/...';
element.innerHTML = DOMPurify.sanitize(userInput);
```

**CSRF Prevention**
```
- Use SameSite=Strict cookies (automatic with modern browsers)
- Include CSRF tokens in forms (if using form-based POST)
- Supabase auth handles this automatically
```

**Password Field Security**
```html
<!-- GOOD: Autocomplete allows password managers -->
<input type="password" autocomplete="current-password">

<!-- For password confirmation -->
<input type="password" autocomplete="new-password">
```

**Secure Headers (Server-side)**
```php
// In your PHP files:
header('X-Content-Type-Options: nosniff');           // Prevent MIME sniffing
header('X-Frame-Options: SAMEORIGIN');               // Prevent clickjacking
header('X-XSS-Protection: 1; mode=block');           // Old browsers
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Content-Security-Policy: default-src \'self\'; script-src \'self\' https://cdn.jsdelivr.net');
```

### 🔴 CRITICAL Fixes for Your Code

**Issue 1: No Content-Security-Policy header**
- Risk: XSS attacks can run arbitrary JavaScript
- Fix: Add CSP header in PHP files

**Issue 2: User data in localStorage (if present)**
- Risk: XSS can steal tokens/sensitive data
- Fix: Use httpOnly cookies for sensitive data, localStorage only for non-sensitive (cart, theme)

**Issue 3: Typewriter effect DOM manipulation**
- Current: Uses direct animation on user-facing text
- Risk: Low, but validate newsletter content server-side if user-generated

---

## 5️⃣ ADMIN DASHBOARD SECURITY

### ✅ Best Practices

**Admin Access Control**
```
- Require re-auth for: delete, export, settings changes
- Session timeout: 8 hours absolute, 30 min inactivity
- Log all admin actions with timestamp + IP
- Alert on unusual activity (multiple failed logins, API errors)
- 2FA required for production (TOTP/email)
```

**API Rate Limiting**
```
- Admin endpoints: 1000/hour per user
- Public endpoints: 100/hour per IP
- Dashboard AI calls: 10/minute (AI is expensive)
```

**Data Export Security**
```
- Require password re-entry
- Log who exported what and when
- Encrypt sensitive exports
- Set expiry on download links (24 hours)
```

### 🔴 CRITICAL Fixes for Your Code

**Issue 1: Gemini/OpenRouter API calls not rate-limited per admin**
- Current: Only global rate limiting
- Fix: Add per-user daily budget (e.g., 100 calls/day)

**Issue 2: AI responses not validated**
- Current: Trust OpenRouter output directly
- Risk: Injection attacks via AI response
- Fix: Sanitize AI output before displaying (use DOMPurify)

**Issue 3: Dashboard session could be longer**
- Current: Check admin_login_at timestamp, but no visible 8-hour limit
- Fix: Enforce maximum 8-hour session, always require re-auth on sensitive actions

---

## 6️⃣ THIRD-PARTY INTEGRATIONS

### ✅ Best Practices

**API Keys & Secrets**
```
- Store in .env file (never in code)
- Use environment-specific configs
- Rotate keys every 90 days
- Revoke immediately if leaked
```

**Webhooks (if receiving from Stripe, SendGrid, etc.)**
```
- Verify signature before trusting data
- Use HTTPS only
- Retry on timeout; implement idempotency
- Log all webhook events
```

**CDN/Third-party Scripts**
```
- Use Subresource Integrity (SRI) hashes
- Use specific versions (not `@latest`)
- Minimize external dependencies
```

### 🔴 CRITICAL Fixes for Your Code

**Issue 1: OpenRouter API key not rotated**
- Fix: Set calendar reminder to rotate every 90 days

**Issue 2: AI API error messages expose internal details**
- Current: Line 221 in gemini-api.php logs full response
- Risk: Sensitive info could be exposed in logs
- Fix: Log details to file, send generic message to frontend

---

## 7️⃣ DEPLOYMENT & OPERATIONS

### ✅ Best Practices

**Environment Setup**
```
- Never commit .env or config files
- Use CI/CD to deploy (not manual FTP)
- Test all security headers in staging before production
- Keep dependencies updated (security patches)
```

**Monitoring & Logging**
```
- Log failed auth attempts
- Alert on: multiple 401s, 403s, SQL errors
- Monitor API response times (slow = potential DDoS)
- Review logs weekly for anomalies
```

**Backups**
```
- Daily automated backups
- Test restore monthly
- Encrypt backups
- Store off-site
```

**Certificate & HTTPS**
```
- Auto-renew certificates (Let's Encrypt)
- Test SSL configuration: ssllabs.com
- Use HSTS (force HTTPS for 1 year)
```

---

## 8️⃣ SECURITY CHECKLIST (Pre-Launch)

Use this before going live:

### Authentication ✅
- [ ] Password minimum 8 characters
- [ ] Forgot password requires secure token
- [ ] Delete account requires re-auth (password)
- [ ] Session timeout: 30 min inactivity
- [ ] Rate limiting on login (5 fails / 15 min)
- [ ] No password hints or recovery questions
- [ ] Password reset tokens expire (15 min)

### API Security ✅
- [ ] HTTPS only (redirect http→https)
- [ ] CORS allowlist configured (no `*` on sensitive endpoints)
- [ ] Input validation on all endpoints
- [ ] Rate limiting per IP + user
- [ ] JWT verification on every request
- [ ] No sensitive data in logs
- [ ] API keys in .env (never hardcoded)

### Data Protection ✅
- [ ] PII encrypted in transit (HTTPS)
- [ ] Passwords never logged
- [ ] Unsubscribe links work (test)
- [ ] Delete account also deletes personal data
- [ ] Privacy policy updated and linked
- [ ] No unnecessary data collection

### Frontend ✅
- [ ] CSP header set
- [ ] No sensitive data in localStorage
- [ ] Form fields have autocomplete hints
- [ ] XSS protection: DOMPurify or textContent
- [ ] No eval() or innerHTML with user input
- [ ] External scripts use SRI hashes

### Admin Dashboard ✅
- [ ] Admin login requires strong password
- [ ] Session timeout: 8 hours max, 30 min inactivity
- [ ] 2FA enabled (email OTP minimum)
- [ ] AI API calls rate-limited
- [ ] AI output sanitized before display
- [ ] All admin actions logged

### Deployment ✅
- [ ] SSL certificate valid and auto-renewing
- [ ] .env not committed to Git
- [ ] No default credentials
- [ ] Error pages don't expose stack traces
- [ ] Security headers tested (ssllabs.com)
- [ ] Backups configured and tested

---

## 9️⃣ SECURITY RESOURCES

**Frameworks & Tools**
```
- OWASP Top 10 (web vulnerabilities): owasp.org/top10
- CSP Generator: csp-evaluator.withgoogle.com
- SSL Tester: ssllabs.com/ssltest
- Security Headers: securityheaders.com
- Dependency scanning: snyk.io (free tier)
```

**Code Examples**
```javascript
// Secure localStorage (non-sensitive only)
localStorage.setItem('theme', 'dark'); // ✅ OK
sessionStorage.setItem('temp_id', '123'); // ✅ OK

// Never store these:
localStorage.setItem('jwt', token); // ❌ NO
localStorage.setItem('password', pw); // ❌ NO
```

```php
// Secure email validation
$email = filter_var($_POST['email'], FILTER_SANITIZE_EMAIL);
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid email']);
    exit;
}

// Secure password verification
if (hash_equals(hash_password($pw), $stored_hash)) {
    // Passwords match
}
```

---

## 🔟 QUICK START: Apply to Your Project

**Priority 1 (Critical, fix immediately):**
1. Change password minimum to 8 chars (auth.js)
2. Require password re-entry for delete account
3. Remove admin_pin fallback from gemini-api.php
4. Add CSP header to all PHP files
5. Add rate limiting to newsletter signup (per IP)

**Priority 2 (Important, fix this week):**
1. Implement 2FA on admin login
2. Add session timeout to dashboard
3. Encrypt unsubscribe token (POST instead of GET)
4. Move orders.json to Supabase with RLS
5. Sanitize AI output (DOMPurify)

**Priority 3 (Nice-to-have, polish):**
1. Implement webhook logging
2. Add security audit logging
3. Automate SSL cert renewal monitoring
4. Create deployment checklist

---

This skill is **version-agnostic** — apply it to any new project. Reference it in your team docs, CI/CD pipeline, or deployment checklist.

For your specific project, start with **Priority 1** items. Each should take < 30 min to implement.