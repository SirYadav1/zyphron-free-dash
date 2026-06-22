# 🔒 Security Audit Report — Zyphron Free Dashboard
**Date:** June 22, 2026  
**Target:** http://108.181.193.242:8080 (Frontend) + :3000 (Backend API)  
**Method:** Defensive (white-box), non-destructive  
**Stack:** NestJS + Vue 3 + SQLite + nginx

---

## 🟠 HIGH

### 1. Port 80 — Directory Listing Enabled (`autoindex on`)
- **What:** Port 80 server block has `autoindex on`, exposing directory listings for `/assets/`, `/images/`, etc.
- **Impact:** Attackers can enumerate all static files, JS bundles, and potentially sensitive filenames.
- **Evidence:** `curl http://108.181.193.242/assets/` returns `Index of /assets/` with full file listing.
- **Fix:** Change `autoindex on` to `autoindex off` in the port 80 server block, or remove port 80 entirely if not needed.

### 2. No SSL/TLS — HTTP Only
- **What:** All traffic (including login credentials, JWT tokens) transmitted over plain HTTP.
- **Impact:** Man-in-the-middle attacks can intercept credentials, tokens, and session data.
- **Fix:** Configure SSL certificate (Let's Encrypt) and redirect HTTP → HTTPS.

---

## 🟡 MEDIUM

### 3. Port 80 Missing Security Headers
- **What:** Port 80 server block has no security headers (X-Frame-Options, CSP, etc.).
- **Impact:** Clickjacking, XSS, and other client-side attacks possible on port 80.
- **Fix:** Add same security headers as port 8080, or disable port 80.

### 4. `NODE_ENV=development` in Production
- **What:** `.env` file has `NODE_ENV=development`.
- **Impact:** May enable debug features, stack traces, or development-only code paths.
- **Fix:** Set `NODE_ENV=production` in `.env`.

### 5. CORS Allows No-Origin Requests
- **What:** `if (!origin) return callback(null, true)` allows requests with no Origin header.
- **Impact:** Server-to-server requests, curl, and mobile apps bypass CORS. While intentional, could be exploited by non-browser clients.
- **Status:** Acceptable for API design, but document this decision.

---

## 🟢 LOW

### 6. JWT Secret in .env (Not Rotated)
- **What:** JWT secret is static in `.env` file.
- **Impact:** If `.env` is ever compromised, all JWT tokens are forgeable.
- **Fix:** Rotate JWT secret periodically. Consider using a stronger secret (256+ bits).

### 7. Discord Client Secret in .env
- **What:** Discord OAuth client secret stored in `.env`.
- **Impact:** If `.env` is compromised, Discord OAuth can be hijacked.
- **Fix:** Rotate Discord credentials periodically.

---

## ✅ GOOD (Confirmed Working)

| Check | Status |
|-------|--------|
| Security Headers (port 8080) | ✅ X-Frame-Options, CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |
| CORS Configuration | ✅ Validates allowed origins, blocks evil domains |
| Rate Limiting (Login) | ✅ 5 attempts → 429 Too Many Requests |
| Account Lockout | ✅ 5 failed attempts → 15 min lockout |
| Password Policy | ✅ Min 8 chars, uppercase + lowercase + number required |
| Auth Endpoint Protection | ✅ All admin/protected endpoints return 401 without JWT |
| Input Validation | ✅ ValidationPipe with whitelist + forbidNonWhitelisted |
| Body Size Limits | ✅ 5MB JSON, 10MB URL-encoded |
| JWT Secret (not hardcoded) | ✅ Loaded from environment variable |
| X-Powered-By Disabled | ✅ `app.disable('x-powered-by')` |
| JS Bundle (no secrets) | ✅ No API keys, tokens, or credentials in client bundle |
| .env Not Exposed via Web | ✅ SPA catch-all returns HTML, not .env content |
| Directory Listing (port 8080) | ✅ `autoindex off` |
| SQLite DB Not Exposed | ✅ Not accessible via web |
| Admin Guard | ✅ All admin endpoints protected with AdminGuard |

---

## 🔧 Priority Action Plan

### Day 1 (Immediate)
1. **Fix port 80 `autoindex on`** → Change to `autoindex off`
2. **Set `NODE_ENV=production`** in `.env`

### Week 1
3. **Configure SSL/TLS** — Get Let's Encrypt cert, redirect HTTP → HTTPS
4. **Disable port 80** if not needed (only 8080 should be public)

### Month 1
5. **Rotate JWT secret** and Discord credentials
6. **Add CAPTCHA** to registration endpoint (anti-bot)

---

## What Was NOT Tested
- SQL injection (SQLite with TypeORM parameterized queries — low risk)
- XSS in user inputs (CSP header mitigates most vectors)
- Business logic flaws (requires domain-specific knowledge)
- Subdomain takeover (no subdomains configured)
- Source map exposure (Vite production build — no .map files)

---

**Overall Score: 7/10** — Good security posture with a few critical fixes needed.
