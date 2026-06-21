# 🔒 Zyphron Free Dashboard — Complete Security Audit Report

**Date:** June 21-22, 2026
**Scope:** Full codebase (backend + frontend) + live endpoint testing
**Method:** White-box code review + active probing (non-destructive)
**Target:** http://108.181.193.242:8080 (Zyphron Free Dashboard)

---

## Architecture

- **Backend:** NestJS + TypeORM + SQLite (port 3000)
- **Frontend:** Vue 3 + Vite + Tailwind CSS (port 8080 via nginx)
- **Auth:** JWT (7-day expiry) + 2FA (TOTP) + Discord OAuth
- **Server Management:** Pterodactyl API integration
- **Database:** SQLite (zyphron.db)
- **Reverse Proxy:** Nginx

---

## 📊 Executive Summary

| Severity | Part 1 (Backend) | Part 2 (Frontend/Infra) | Total |
|----------|------------------|------------------------|-------|
| 🔴 CRITICAL | 3 | 3 | **6** |
| 🔴 HIGH | 4 | 2 | **6** |
| 🟡 MEDIUM | 13 | 6 | **19** |
| 🟢 LOW | 9 | 4 | **13** |
| 🟢 SAFE | 22 | 5 | **27** |
| ⚠️ UNTESTABLE | 0 | 7 | **7** |

**Overall Security Score: 6/10** (Medium risk — critical issues present)

---

## 🔴 CRITICAL FINDINGS (Fix Immediately)

### C-1: JWT Guard Does Not Check Banned/Deleted Users
- **File:** `src/auth/jwt-auth.guard.ts:22-41`
- **Impact:** Banned users can continue using valid JWT tokens for up to 7 days
- **Proof:** Guard only verifies JWT signature, never queries DB for `is_banned`
- **Fix:** Query user from DB after JWT verification, check `is_banned` and existence

### C-2: Stored XSS via v-html in Email Template Editor
- **File:** `client/views/admin/AdminEmailTemplateEditView.vue:99`
- **Impact:** Admin can inject arbitrary HTML/JS that executes in browsers
- **Proof:** `v-html="renderedBody"` renders unsanitized admin-controlled HTML
- **Fix:** Use DOMPurify to sanitize: `v-html="sanitize(renderedBody)"`

### C-3: .env Secrets in Git Repository
- **File:** `.env` (6 production secrets in plaintext)
- **Impact:** JWT_SECRET, PTERODACTYL_API_KEY, DISCORD_BOT_TOKEN, DISCORD_CLIENT_SECRET, ADMIN_KEY, MAIL_PASS all exposed
- **Fix:** Rotate ALL secrets immediately. Remove from git history with BFG Repo-Cleaner

### C-4: Backend Completely Down (502 Bad Gateway)
- **URL:** All `/api/*` endpoints
- **Impact:** Application is non-functional
- **Fix:** Start NestJS backend: `node dist/src/main.js`

### C-5: 2FA Verify-Login Leaks User ID Without Auth
- **File:** `src/auth/two-factor.controller.ts:70-82`
- **Impact:** Attacker with TOTP code gets internal user ID
- **Fix:** Return temporary pre-auth token instead of raw userId

### C-6: 2FA Check Endpoint Enables Email Enumeration
- **File:** `src/auth/two-factor.controller.ts:98-107`
- **Impact:** Attackers can enumerate which emails have 2FA enabled
- **Fix:** Always return same response regardless of email existence

---

## 🔴 HIGH FINDINGS (Fix This Week)

### H-1: JWT Token Stored in sessionStorage
- **File:** `client/api/client.js:11`, `client/stores/auth.js:51`
- **Impact:** XSS can steal JWT token from sessionStorage
- **Fix:** Use httpOnly, Secure, SameSite=Strict cookies

### H-2: No SSL/HTTPS Configured
- **File:** `/etc/nginx/sites-enabled/zyphron`
- **Impact:** All traffic (JWT, passwords) sent in plaintext
- **Fix:** Install Let's Encrypt SSL, configure HTTPS on port 443

### H-3: AdminGuard Makes N+1 DB Query on Every Request
- **File:** `src/common/guards/admin.guard.ts:19-34`
- **Impact:** Performance degradation, potential auth bypass timing
- **Fix:** Embed `is_admin` in JWT payload or add 60s cache

### H-4: Simulated Payment — Free Credits Exploit
- **File:** `src/credits/credits.service.ts:39-121`
- **Impact:** Anyone can get unlimited credits in production
- **Fix:** Gate behind `NODE_ENV !== 'production'`

### H-5: Profile Photo Upload Hardcoded Path
- **File:** `src/auth/auth.controller.ts:67`
- **Impact:** Predictable upload path, potential file access issues
- **Fix:** Use `process.env.UPLOAD_DIR`

### H-6: Login Response Leaks Pterodactyl User ID
- **File:** `src/auth/auth.service.ts:313`
- **Impact:** Internal infrastructure information exposed to client
- **Fix:** Remove `pterodactylUserId` from login/profile responses

---

## 🟡 MEDIUM FINDINGS (Fix This Month)

### M-1: JWT 7-Day Expiry with No Revocation
- **File:** `src/auth/auth.module.ts:39`
- **Fix:** Implement refresh tokens + token blacklist

### M-2: TOTP Secret Stored in Plaintext
- **File:** `src/entities/user.entity.ts:63`
- **Fix:** Encrypt with AES-256-GCM

### M-3: Missing DTO Validation on 2FA Login
- **File:** `src/auth/auth.controller.ts:41-45`
- **Fix:** Create `Login2faDto` with class-validator

### M-4: Missing DTO Validation on Admin Pterodactyl User Update
- **File:** `src/admin/admin.controller.ts:332-338`
- **Fix:** Create validated DTO

### M-5: Ticket HTML Closure — XSS in Generated HTML
- **File:** `src/tickets/tickets.service.ts:200-230`
- **Fix:** HTML-escape all user values before interpolation

### M-6: SMTP Config Returns Password in Response
- **File:** `src/admin/admin.controller.ts:309`
- **Fix:** Mask SMTP password in API responses

### M-7: Invoices Create Endpoint — No Input Validation
- **File:** `src/invoices/invoices.controller.ts:45-61`
- **Fix:** Create validated DTO

### M-8: Store renewServer Returns Stale Coin Balance
- **File:** `src/store/store.service.ts:283`
- **Fix:** Re-fetch balance after deduction

### M-9: Failed Login Tracking In-Memory Only
- **File:** `src/auth/auth.service.ts:30-32`
- **Fix:** Store in DB/Redis for persistence across restarts

### M-10: Client-Side Admin Guard Only
- **File:** `client/router/index.js:145-147`
- **Fix:** Backend AdminGuard already enforced, but add nginx middleware

### M-11: No CSRF Token
- **File:** `client/api/client.js`
- **Fix:** Implement CSRF middleware

### M-12: No Password Strength Validation on Client
- **File:** `client/views/RegisterView.vue`
- **Fix:** Add client-side strength indicator

### M-13: Missing HSTS Header
- **File:** `/etc/nginx/sites-enabled/zyphron`
- **Fix:** Add `Strict-Transport-Security` header

### M-14: No Nginx Rate Limiting
- **File:** `/etc/nginx/sites-enabled/zyphron`
- **Fix:** Add `limit_req_zone` directives

### M-15: CSP Allows unsafe-eval (Nginx)
- **File:** `/etc/nginx/sites-enabled/zyphron`
- **Fix:** Remove `'unsafe-eval'` from script-src

### M-16: Uploads Directory in Web Root
- **File:** `/var/www/html/uploads/`
- **Fix:** Move outside web root or add access controls

### M-17: v-html in MainLayout Sidebar Icons
- **File:** `client/layouts/MainLayout.vue:65`
- **Fix:** Replace with Lucide Vue components

### M-18: Registration Leaks Internal User ID
- **File:** `src/auth/auth.service.ts:172`
- **Fix:** Don't return userId in registration response

### M-19: CSP Lacks connect-src Directive
- **File:** Nginx CSP header
- **Fix:** Add explicit `connect-src 'self'`

---

## 🟢 LOW FINDINGS (Fix When Convenient)

1. Email verification endpoints are stubbed (auth.service.ts:391-397)
2. email-verified.guard.ts leaks email in error (email-verified.guard.ts:27-31)
3. JWT Guard has unused userRepo injection (jwt-auth.guard.ts:14-20)
4. Server error messages may leak internal details (servers.service.ts:439)
5. synchronize: true in non-production DB (app.module.ts:56)
6. CSP allows unsafe-inline for styles (main.ts:49)
7. getCron exposes panel URL to users (servers.service.ts:784)
8. No rate limiting on admin endpoints (admin.controller.ts)
9. Ticket sequential number race condition (tickets.service.ts:53-62)
10. localStorage used for theme preference (client/main.js:8)
11. API endpoints visible in JS bundle (client build)
12. Server header identifies nginx (live headers)
13. CSP inline styles allowed (nginx config)

---

## 🟢 SAFE FINDINGS (Good Practices Verified)

1. ✅ Bcrypt password hashing (10 rounds)
2. ✅ Generic "Invalid credentials" error (prevents enumeration)
3. ✅ Timing-safe comparison for admin key
4. ✅ Optimistic locking for coin operations
5. ✅ Rate limiting on register/login/2FA
6. ✅ File upload validation (mimetype + size)
7. ✅ Strong input validation with class-validator (DTOs)
8. ✅ CORS properly configured
9. ✅ Security headers present (X-Frame-Options, etc.)
10. ✅ ValidationPipe with whitelist + forbidNonWhitelisted
11. ✅ Global ThrottlerGuard (100 req/60s)
12. ✅ DB-backed admin verification
13. ✅ User ID filtering prevents IDOR
14. ✅ Ownership checks on tickets
15. ✅ IDOR fix on invoices
16. ✅ Sensitive fields stripped from admin responses
17. ✅ .env in .gitignore
18. ✅ x-powered-by disabled
19. ✅ 2FA requires code verification
20. ✅ No source maps in production
21. ✅ No hardcoded secrets in frontend
22. ✅ SPA catch-all works correctly
23. ✅ Directory listing disabled
24. ✅ No CORS misconfiguration
25. ✅ All createQueryBuilder use parameterized queries
26. ✅ Body size limits reduced (5mb/10mb)
27. ✅ Account lockout after 5 failed attempts

---

## 🎯 Priority Action Plan

### Day 1 (Immediate)
1. Start NestJS backend (currently 502)
2. Rotate ALL .env secrets
3. Remove .env from git history
4. Fix JWT guard to check banned users
5. Sanitize v-html in email template editor

### Week 1
6. Implement SSL/TLS (Let's Encrypt)
7. Move JWT to httpOnly cookies
8. Gate simulated payment behind NODE_ENV
9. Add nginx rate limiting
10. Add HSTS header

### Month 1
11. Implement refresh tokens + token blacklist
12. Encrypt TOTP secrets at rest
13. Add proper DTOs for all admin endpoints
14. HTML-escape ticket closure output
15. Add CSRF protection

---

## What Was NOT Tested

- Actual exploit attempts (defensive audit only)
- Denial of Service testing
- Internal network scanning
- Physical security
- Social engineering
- Third-party dependency CVE scanning (npm audit)
- Mobile app security (no mobile app exists)

---

**Report Generated:** 2026-06-22
**Auditor:** Hermes Agent (Defensive Security)
**Total Findings:** 78 (6 Critical, 6 High, 19 Medium, 13 Low, 27 Safe, 7 Untestable)
