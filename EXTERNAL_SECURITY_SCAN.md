# 🔒 Zyphron Cloud — External Security Scan Report
## (Without Login — Attacker's Perspective)

**Date:** June 21, 2026
**Target:** http://108.181.193.242:8080
**Method:** External black-box scan (no authentication)
**Scanner:** Hermes Agent

---

## 📊 Executive Summary

| Category | Status | Findings |
|----------|--------|----------|
| Security Headers | ✅ GOOD | 6/7 headers present |
| SPA Catch-All | ✅ SAFE | All paths return SPA HTML |
| Directory Listing | ✅ SAFE | 403 Forbidden |
| Source Maps | ✅ SAFE | SPA catch-all (not real maps) |
| CORS | ✅ SAFE | No CORS headers (secure default) |
| API Endpoints | ⚠️ UNTESTABLE | Backend down (502) |
| CSP | 🟠 ISSUE | `unsafe-eval` still present |
| X-Powered-By | ✅ SAFE | Not exposed |
| Server Version | ✅ SAFE | No version leaked |
| Cookies | ✅ SAFE | No cookies set |
| HTTP Methods | ✅ SAFE | Only GET allowed |

**Overall External Security Score: 7/10**

---

## ✅ GOOD FINDINGS (What's Secure)

### 1. SPA Catch-All Protects Sensitive Files
All paths (`.env`, `.git/config`, `robots.txt`, `package.json`, etc.) return the SPA HTML (491 bytes), NOT actual file content. This is the correct SPA behavior.

**Proof:**
```
curl -s http://108.181.193.242:8080/.env | head -1
<!doctype html>  ← SPA HTML, not .env content

curl -s http://108.181.193.242:8080/.git/config | head -1
<!doctype html>  ← SPA HTML, not git config
```

**Verdict:** ✅ SAFE — Attackers cannot access sensitive files via web.

### 2. Security Headers Present
```
X-Frame-Options: DENY ✅
X-Content-Type-Options: nosniff ✅
X-XSS-Protection: 1; mode=block ✅
Referrer-Policy: strict-origin-when-cross-origin ✅
Permissions-Policy: camera=(), microphone=(), geolocation=() ✅
Content-Security-Policy: present ✅
```

### 3. No CORS Misconfiguration
No `Access-Control-Allow-Origin` headers returned. Cross-origin requests are blocked by default. ✅

### 4. Directory Listing Disabled
`/uploads/` returns 403 Forbidden. No directory listing exposed. ✅

### 5. Source Maps Not Exposed
`.map` files return the SPA HTML (491 bytes), not actual source maps. ✅

### 6. No X-Powered-By Header
Express/NestJS version not leaked. ✅

### 7. Server Version Hidden
`Server: nginx` without version number. ✅

### 8. No Cookies Set
No session cookies, no tracking cookies. Clean response. ✅

### 9. HTTP Methods Restricted
Only GET allowed on frontend. POST/PUT/DELETE/OPTIONS return 405. ✅

### 10. No Hardcoded Secrets in JS Bundle
Axios library code and app logic found, but no API keys, tokens, or passwords. ✅

---

## 🟠 ISSUES FOUND

### Issue 1: CSP Still Has `unsafe-eval` (NOT DEPLOYED)
- **Severity:** 🟠 HIGH
- **Header:** `Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval'; ...`
- **Impact:** Allows `eval()`, `Function()`, and dynamic code execution. Weakens XSS protection.
- **Root Cause:** The nginx config fix was applied locally but NOT deployed to the live server.
- **Fix:** Deploy the updated nginx config to the VPS:
  ```bash
  # On VPS:
  sed -i "s/'unsafe-eval' //" /etc/nginx/sites-enabled/zyphron
  nginx -t && systemctl reload nginx
  ```

### Issue 2: Backend Down (502 Bad Gateway)
- **Severity:** 🔴 CRITICAL (Service Down)
- **Impact:** All API endpoints return 502. Application is non-functional.
- **Proof:**
  ```
  curl -s http://108.181.193.242:8080/api/auth/login
  <html><head><title>502 Bad Gateway</title></head>...
  ```
- **Fix:** Start the NestJS backend:
  ```bash
  cd /root/Zyphron-free-dash
  pm2 start dist/src/main.js --name zyphron-backend
  ```

### Issue 3: No HTTPS/SSL
- **Severity:** 🟠 HIGH
- **Impact:** All traffic (JWT, passwords) transmitted in plaintext.
- **Fix:** Install Let's Encrypt SSL certificate.

### Issue 4: No HSTS Header
- **Severity:** 🟡 MEDIUM
- **Impact:** Browsers won't enforce HTTPS even if SSL is added later.
- **Fix:** Add `Strict-Transport-Security` header in nginx.

### Issue 5: No Nginx Rate Limiting
- **Severity:** 🟡 MEDIUM
- **Impact:** No DDoS protection at nginx level.
- **Fix:** Add `limit_req_zone` directives.

---

## 📋 Comparison: Before vs After

| Check | Status | Notes |
|-------|--------|-------|
| .env exposed? | ✅ NO | SPA catch-all returns HTML |
| .git exposed? | ✅ NO | SPA catch-all returns HTML |
| Source maps? | ✅ NO | SPA catch-all returns HTML |
| Directory listing? | ✅ NO | 403 Forbidden |
| CORS wildcard? | ✅ NO | No CORS headers |
| X-Powered-By? | ✅ NO | Header removed |
| Server version? | ✅ NO | Version hidden |
| CSP safe-eval? | ❌ YES | Still has unsafe-eval |
| HTTPS? | ❌ NO | HTTP only |
| Backend running? | ❌ NO | 502 Bad Gateway |

---

## 🎯 Priority Fixes

1. **IMMEDIATE:** Start NestJS backend (502 on all API endpoints)
2. **IMMEDIATE:** Deploy nginx config without `unsafe-eval`
3. **HIGH:** Install SSL/TLS (Let's Encrypt)
4. **HIGH:** Add HSTS header
5. **MEDIUM:** Add nginx rate limiting

---

**Report Generated:** 2026-06-21
**Scanner:** Hermes Agent (External Security Scan)
**Target:** http://108.181.193.242:8080
