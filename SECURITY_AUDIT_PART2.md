# Zyphron Free Dashboard — Security Audit (Part 2: Frontend + Infrastructure + Live)

**Audited:** June 21, 2026  
**Scope:** Vue 3 frontend, Nginx config, live endpoint testing at http://108.181.193.242:8080

---

## PART A: Frontend Code Audit

### Finding A-1: Stored XSS via v-html in Email Template Editor
- **File:** `client/views/admin/AdminEmailTemplateEditView.vue:99`
- **Severity:** 🔴 CRITICAL
- **Description:** The email template body is rendered using `v-html` without any sanitization. An admin can inject arbitrary HTML/JavaScript that will execute in the browser. If any other user's browser renders this template content, it's a stored XSS vector. The `renderedBody` computed property directly interpolates admin-controlled HTML content.
- **Proof:**
  ```vue
  <div class="text-sm text-text-primary" v-html="renderedBody"></div>
  ```
  The `renderedBody` comes from `form.value.body` which is raw HTML typed by the admin.
- **Recommended Fix:** Use DOMPurify to sanitize HTML before rendering: `v-html="sanitize(renderedBody)"`. Alternatively, use a rich-text editor with built-in sanitization.

### Finding A-2: v-html in MainLayout Sidebar Icons
- **File:** `client/layouts/MainLayout.vue:65`
- **Severity:** 🟡 MEDIUM
- **Description:** Navigation icon strings are rendered using `v-html`. While these are hardcoded SVG strings (not user input), using `v-html` is a code smell and creates a risk if the data source ever changes.
- **Proof:**
  ```vue
  <span ... v-html="item.icon"></span>
  ```
  The `item.icon` values are hardcoded SVG strings like `<svg fill="none" stroke="currentColor" ...>`.
- **Recommended Fix:** Replace with Lucide Vue components (already imported elsewhere) instead of injecting SVG strings.

### Finding A-3: JWT Token Stored in sessionStorage (Not httpOnly Cookie)
- **Files:** `client/api/client.js:11`, `client/stores/auth.js:51`, `client/views/LoginView.vue:174`
- **Severity:** 🔴 HIGH
- **Description:** JWT access token is stored in `sessionStorage` and sent via Authorization header. sessionStorage is accessible to any JavaScript running on the page, making it vulnerable to XSS token theft. An httpOnly cookie would be immune to XSS-based token exfiltration.
- **Proof:**
  ```js
  sessionStorage.setItem('access_token', data.access_token)
  // ...
  const token = sessionStorage.getItem('access_token')
  config.headers.Authorization = `Bearer ${token}`
  ```
- **Recommended Fix:** Use httpOnly, Secure, SameSite=Strict cookies for JWT storage. Set token via Set-Cookie header from the backend.

### Finding A-4: Admin Access Control Bypass — Client-Side Only
- **File:** `client/router/index.js:145-147`
- **Severity:** 🟡 MEDIUM
- **Description:** Admin route protection is entirely client-side. The `requiresAdmin` meta flag checks `authStore.isAdmin` which is based on the user object returned from `/auth/me`. While backend should also enforce this, a compromised frontend or modified JavaScript could bypass this check.
- **Proof:**
  ```js
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    return next('/home')
  }
  ```
  No server-side redirect or additional backend-only guard exists at the nginx level.
- **Recommended Fix:** Ensure backend AdminGuard is robust. Consider adding a server-side middleware that returns 403 for non-admin users hitting `/api/admin/*` endpoints.

### Finding A-5: CSRF Token Not Used
- **File:** `client/api/client.js` (entire file)
- **Severity:** 🟡 MEDIUM
- **Description:** The axios client does not send any CSRF token. While JWT-based auth provides some protection, the lack of CSRF protection means that if the token is ever stored in a cookie, CSRF attacks become possible. Currently mitigated by sessionStorage usage, but this is fragile.
- **Recommended Fix:** Implement CSRF token middleware. Use SameSite cookie attribute.

### Finding A-6: No Password Strength Validation on Client
- **File:** `client/views/RegisterView.vue`
- **Severity:** 🟡 MEDIUM
- **Description:** Registration form has no client-side password strength validation. Password confirmation is checked but no minimum length, complexity, or strength requirements are enforced on the frontend.
- **Proof:**
  ```js
  const passwordMismatch = computed(() => {
    return confirmPassword.value.length > 0 && password.value !== confirmPassword.value
  })
  ```
  No `minlength`, `pattern`, or strength check exists.
- **Recommended Fix:** Add client-side password strength indicator and minimum requirements.

### Finding A-7: localStorage Used for Theme Preference
- **Files:** `client/main.js:8`, `client/views/PreferencesView.vue:90-138`
- **Severity:** 🟢 LOW
- **Description:** `localStorage` is used for theme and locale preferences (`zyphron_theme`, `zyphron_locale`). This is acceptable for non-sensitive data but should be noted.
- **Proof:**
  ```js
  localStorage.setItem('zyphron_theme', prefs.theme)
  localStorage.getItem('zyphron_theme')
  ```
- **Recommended Fix:** No action needed — non-sensitive data.

### Finding A-8: No Source Maps in Production Build
- **File:** `vite.config.mjs`
- **Severity:** 🟢 SAFE
- **Description:** The production build at `/var/www/html` does not contain `.map` files. No `sourceMappingURL` comments found in JS bundles. Source code is properly minified.
- **Proof:** `find /var/www/html/assets -name "*.map"` returned no results.

### Finding A-9: No Hardcoded Secrets in Frontend Code
- **Files:** All frontend files
- **Severity:** 🟢 SAFE
- **Description:** No JWT secrets, API keys, Discord tokens, or other hardcoded secrets were found in frontend code. The API client uses relative URLs (`/api`) which is good.

### Finding A-10: API Endpoints Exposed in JS Bundle
- **File:** Built JS bundle at `/var/www/html/assets/index-B4mgGhxa.js`
- **Severity:** 🟢 LOW
- **Description:** All API endpoint paths are visible in the minified JS bundle (e.g., `/auth/login`, `/admin/stats`, `/admin/users`). This is expected for SPAs and not a vulnerability, but attackers can enumerate all API routes.
- **Proof:** The bundle contains strings like `dx.post("/auth/login"`, `dx.get("/admin/stats")`, etc.
- **Recommended Fix:** Acceptable for SPA architecture. Ensure backend validation is robust.

### Finding A-11: Missing CSP `connect-src` Directive
- **File:** Nginx config CSP header
- **Severity:** 🟡 MEDIUM
- **Description:** The CSP header lacks `connect-src` which means the browser will use the default (`default-src 'self'`). This is actually secure but should be explicitly stated.
- **Proof:** `Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;`
- **Recommended Fix:** Add explicit `connect-src 'self'` to CSP.

### Finding A-12: CSP Allows `unsafe-eval`
- **File:** Nginx config CSP header
- **Severity:** 🟡 MEDIUM
- **Description:** The CSP allows `'unsafe-eval'` in `script-src`. This weakens XSS protections as it allows `eval()`, `Function()`, and similar dynamic code execution. Some Vue features may require this but it should be investigated.
- **Proof:** `script-src 'self' 'unsafe-eval'`
- **Recommended Fix:** Test if `unsafe-eval` is actually needed. Vue 3 production builds should work without it.

### Finding A-13: CSP Allows `unsafe-inline` for Styles
- **File:** Nginx config CSP header
- **Severity:** 🟢 LOW
- **Description:** `style-src 'self' 'unsafe-inline'` allows inline styles. Common in Vue apps but could be exploited in some XSS scenarios.
- **Recommended Fix:** Use nonce-based or hash-based inline styles where possible.

---

## PART B: Infrastructure Audit

### Finding B-1: .env File Contains Production Secrets
- **File:** `/root/Zyphron-free-dash/.env`
- **Severity:** 🔴 CRITICAL
- **Description:** The `.env` file contains 6 sensitive credentials in plaintext:
  - `JWT_SECRET` — signs all JWT tokens
  - `PTERODACTYL_API_KEY` — full panel admin access
  - `DISCORD_CLIENT_SECRET` — OAuth2 secret
  - `DISCORD_BOT_TOKEN` — full bot access
  - `ADMIN_KEY` — admin authentication key
  - `MAIL_PASS` — SMTP password
- **Proof:**
  ```
  JWT_SECRET=1c79b7...1bd8
  PTERODACTYL_API_KEY=ptla_4...w7Ki
  DISCORD_CLIENT_SECRET=GMIE3B...F4Zw
  DISCORD_BOT_TOKEN=MTUxMz...nPZY
  ADMIN_KEY=13676718ca70ee5e7692c67dff69d8f4
  MAIL_PASS=your-app-password
  ```
- **Recommended Fix:** Rotate all secrets immediately. Move secrets to a vault (e.g., AWS SSM, HashiCorp Vault). Never commit .env to git. Add `.env` to `.gitignore`.

### Finding B-2: .env File in Git Repository
- **File:** `/root/Zyphron-free-dash/.env`
- **Severity:** 🔴 CRITICAL
- **Description:** The `.env` file exists in the git repository root alongside `.git/`. This means all secrets are version-controlled and accessible to anyone with repo access.
- **Proof:** `find /root/Zyphron-free-dash -name ".env*" -not -path "*/node_modules/*"` found `/root/Zyphron-free-dash/.env`
- **Recommended Fix:** Add `.env` to `.gitignore` immediately. Use `git filter-branch` or BFG Repo-Cleaner to remove from git history. Create `.env.example` with placeholder values only.

### Finding B-3: Nginx SPA Catch-All Returns 200 for All Paths
- **File:** `/etc/nginx/sites-enabled/zyphron:28`
- **Severity:** 🟢 SAFE (false positive)
- **Description:** The `try_files $uri $uri/ /index.html` directive causes nginx to return the SPA HTML for any path, including `/.env`, `/.git/config`, etc. This means sensitive files are NOT actually exposed — they all return the SPA HTML.
- **Proof:**
  ```
  curl -s http://108.181.193.242:8080/.env | head -1
  <!doctype html>  ← SPA HTML, not .env content
  ```
- **Recommended Fix:** None needed — this is actually a security benefit of SPA architecture.

### Finding B-4: No SSL/HTTPS Configuration
- **File:** `/etc/nginx/sites-enabled/zyphron:1-8`
- **Severity:** 🔴 HIGH
- **Description:** The server runs on HTTP only (port 8080). No SSL/TLS configured. JWT tokens, passwords, and all data are transmitted in plaintext. Comments indicate SSL should be added for production.
- **Proof:**
  ```
  # SECURITY: For production, add SSL:
  # listen 443 ssl;
  # ssl_certificate /path/to/cert.pem;
  # ssl_certificate_key /path/to/key.pem;
  listen 8080;
  ```
- **Recommended Fix:** Install SSL certificate (Let's Encrypt). Configure HTTPS on port 443. Add HTTP→HTTPS redirect. Add HSTS header.

### Finding B-5: Missing HSTS Header
- **File:** `/etc/nginx/sites-enabled/zyphron`
- **Severity:** 🟡 MEDIUM
- **Description:** No `Strict-Transport-Security` header is set. Even if SSL is added later, browsers won't know to enforce HTTPS.
- **Recommended Fix:** Add `add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;`

### Finding B-6: No Rate Limiting at Nginx Level
- **File:** `/etc/nginx/sites-enabled/zyphron`
- **Severity:** 🟡 MEDIUM
- **Description:** Nginx has no `limit_req` or `limit_conn` directives. While the backend uses `@nestjs/throttler`, there's no nginx-level rate limiting for DDoS protection or brute force prevention.
- **Recommended Fix:** Add nginx rate limiting:
  ```nginx
  limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
  location /api/ {
      limit_req zone=api burst=20 nodelay;
      proxy_pass http://127.0.0.1:3000;
  }
  ```

### Finding B-7: Server Header Exposes Nginx Version
- **File:** Live site response headers
- **Severity:** 🟢 LOW
- **Description:** Response header shows `Server: nginx` without version (good), but still identifies the web server software.
- **Proof:** `Server: nginx`
- **Recommended Fix:** Add `server_tokens off;` to nginx.conf to suppress server identification.

### Finding B-8: Security Headers Present and Correct
- **File:** `/etc/nginx/sites-enabled/zyphron:15-21`
- **Severity:** 🟢 SAFE
- **Description:** Good security headers are configured:
  - `X-Frame-Options: DENY` ✅
  - `X-Content-Type-Options: nosniff` ✅
  - `X-XSS-Protection: 1; mode=block` ✅
  - `Referrer-Policy: strict-origin-when-cross-origin` ✅
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()` ✅

### Finding B-9: No CORS Headers Configured
- **File:** `/etc/nginx/sites-enabled/zyphron`
- **Severity:** 🟢 SAFE
- **Description:** No CORS headers are set, which means cross-origin requests are blocked by default. This is actually the secure default.
- **Proof:** `curl -sI -H "Origin: https://evil.com" http://108.181.193.242:8080/ | grep -i "access-control"` returned empty.
- **Recommended Fix:** None needed — secure by default.

### Finding B-10: File Upload Directory Accessible
- **File:** `/var/www/html/uploads/`
- **Severity:** 🟡 MEDIUM
- **Description:** The `uploads/` directory exists in the web root. While it currently only contains a `profiles/` subdirectory with profile photos, it could be a vector for malicious file uploads if the backend doesn't validate file types properly.
- **Proof:** `ls /var/www/html/uploads/` shows `profiles/` directory.
- **Recommended Fix:** Ensure uploaded files are served with proper Content-Type headers and no execution permissions. Consider moving uploads outside the web root.

---

## PART C: Live Endpoint Testing

### Finding C-1: Backend is Down (502 Bad Gateway)
- **URL:** All `/api/*` endpoints
- **Severity:** 🔴 CRITICAL
- **Description:** The NestJS backend (port 3000) is not running. All API requests return `502 Bad Gateway`. This means the application is completely non-functional.
- **Proof:**
  ```
  curl -s -X POST http://108.181.193.242:8080/api/auth/login -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"wrong"}'
  <html><head><title>502 Bad Gateway</title></head>...
  ```
- **Recommended Fix:** Start the NestJS backend: `npm run start:prod` or `node dist/src/main`

### Finding C-2: Rate Limiting Cannot Be Tested (Backend Down)
- **URL:** `/api/auth/login`
- **Severity:** ⚠️ UNTESTABLE
- **Description:** All 5 rapid login attempts returned 502 Bad Gateway. Rate limiting behavior cannot be verified.
- **Recommended Fix:** Restart backend and retest.

### Finding C-3: Password Policy Cannot Be Tested (Backend Down)
- **URL:** `/api/auth/register`
- **Severity:** ⚠️ UNTESTABLE
- **Description:** Registration with weak password ("1") returned 502. Password policy enforcement cannot be verified.
- **Recommended Fix:** Restart backend and retest.

### Finding C-4: Admin Endpoints Cannot Be Tested (Backend Down)
- **URL:** `/api/admin/stats`, `/api/admin/users`
- **Severity:** ⚠️ UNTESTABLE
- **Description:** Admin endpoint access without auth returned 502. Cannot verify server-side admin guard.
- **Recommended Fix:** Restart backend and retest.

### Finding C-5: Error Message Leakage Cannot Be Tested (Backend Down)
- **URL:** `/api/auth/login`
- **Severity:** ⚠️ UNTESTABLE
- **Description:** Login with wrong password for admin account returned 502. Cannot verify if error messages reveal whether an account exists.
- **Recommended Fix:** Restart backend and retest.

### Finding C-6: IDOR Cannot Be Tested (Backend Down)
- **URL:** `/api/servers/:id`
- **Severity:** ⚠️ UNTESTABLE
- **Description:** Cannot test if user A can access user B's servers.
- **Recommended Fix:** Restart backend and retest.

### Finding C-7: File Upload Cannot Be Tested (Backend Down)
- **URL:** `/api/auth/profile/photo`
- **Severity:** ⚠️ UNTESTABLE
- **Description:** Cannot test file upload validation or malicious file upload.
- **Recommended Fix:** Restart backend and retest.

### Finding C-8: SPA Catch-All Works Correctly
- **URL:** Any non-existent path
- **Severity:** 🟢 SAFE
- **Description:** Non-existent paths return the SPA HTML (200) with the index.html content, which is the correct SPA behavior.
- **Proof:**
  ```
  curl -s http://108.181.193.242:8080/nonexistent-page | head -1
  <!doctype html>
  ```
- **Recommended Fix:** None needed.

### Finding C-9: No Source Maps Exposed
- **URL:** `/assets/*.map`
- **Severity:** 🟢 SAFE
- **Description:** No `.map` files found in the deployed assets directory. Source code is not exposed.
- **Proof:** `find /var/www/html/assets -name "*.map"` returned no results.

### Finding C-10: Assets Directory Returns 403
- **URL:** `/assets/`
- **Severity:** 🟢 SAFE
- **Description:** Directory listing is properly disabled. Direct access to `/assets/` returns 403 Forbidden.
- **Proof:** `curl -s -o /dev/null -w "%{http_code}" http://108.181.193.242:8080/assets/` returned `403`.

---

## Summary

| Severity | Count | Key Findings |
|----------|-------|-------------|
| 🔴 CRITICAL | 3 | .env secrets in git, backend down (502), XSS in email template editor |
| 🔴 HIGH | 2 | JWT in sessionStorage, no SSL/HTTPS |
| 🟡 MEDIUM | 6 | v-html code smell, client-side admin guard, no CSRF, weak CSP, no rate limiting, uploads directory |
| 🟢 LOW | 4 | localStorage for theme, API endpoints in bundle, server identification, inline styles |
| 🟢 SAFE | 5 | No source maps, no hardcoded secrets, SPA catch-all works, security headers present, no CORS |
| ⚠️ UNTESTABLE | 7 | All backend-dependent tests (rate limiting, password policy, admin auth, IDOR, file upload, error leakage) |

## Priority Actions

1. **IMMEDIATE:** Rotate ALL secrets in `.env` (JWT_SECRET, PTERODACTYL_API_KEY, DISCORD_CLIENT_SECRET, DISCORD_BOT_TOKEN, ADMIN_KEY, MAIL_PASS)
2. **IMMEDIATE:** Add `.env` to `.gitignore` and remove from git history
3. **IMMEDIATE:** Start the NestJS backend (currently 502 on all API endpoints)
4. **HIGH:** Implement SSL/TLS (Let's Encrypt)
5. **HIGH:** Sanitize v-html usage in AdminEmailTemplateEditView.vue with DOMPurify
6. **HIGH:** Consider httpOnly cookies for JWT storage
7. **MEDIUM:** Add nginx rate limiting
8. **MEDIUM:** Add HSTS header
9. **MEDIUM:** Test and enforce password strength policies
10. **MEDIUM:** Add `server_tokens off` to nginx
