# 🔐 Zyphron Free Dashboard — Security Report

> **Report Date:** 2026-06-20
> **Version:** 1.2.0
> **Auditor:** Hermes Agent

---

## 📊 Executive Summary

| Metric | Value |
|--------|-------|
| **Critical Issues** | 2 (NEW) |
| **High Issues** | 4 (2 NEW, 2 existing) |
| **Medium Issues** | 6 (2 NEW, 4 existing) |
| **Low Issues** | 8 (1 NEW, 7 existing) |
| **Total Open** | **20** |

---

## 🆕 NEW Security Issues (This Update)

### 🔴 Critical

#### 1. Email Verification Token Stored in Database (SHA-256)
**File:** `src/email-verification/email-verification.service.ts`
**Risk:** Token verification uses SHA-256 hash lookup. If database is compromised, attacker can rainbow table the tokens.
**Impact:** Email verification bypass.
**Fix:** Use bcrypt for token storage with higher cost factor. Accept slower verification for better security.
**Status:** ⚠️ OPEN

#### 2. Resend Verification Rate Limit Bypass
**File:** `src/email-verification/email-verification.controller.ts` — `resendVerification()`
**Risk:** The rate limit check in `sendVerificationEmail()` only works for logged-in users (via `checkRateLimit(userId)`). The `resendVerification` endpoint finds user by email and calls `sendVerificationEmail(user.id)` — but the rate limit uses `verification_expiry` timestamp which is set AFTER the email is sent. A user can spam the resend endpoint rapidly before the first email's timestamp is saved.
**Impact:** Email spam, denial of service on mail server.
**Fix:** Add a separate rate limit field or use Redis-based rate limiting.
**Status:** ⚠️ OPEN

### 🟡 Medium

#### 3. VerifyEmailView Uses GET for Token Verification
**File:** `client/views/VerifyEmailView.vue`
**Risk:** Verification token appears in browser URL bar, history, and referrer headers. If user shares URL or uses shared computer, token is exposed.
**Impact:** Session/token leakage.
**Fix:** Consider using POST with body for token verification, or one-time-use tokens with immediate invalidation.
**Status:** ⚠️ OPEN

#### 4. Email Verification Guard Not Applied Globally
**File:** `src/common/guards/email-verified.guard.ts`
**Risk:** `EmailVerifiedGuard` is created but NOT applied to any routes. All protected routes still work without email verification.
**Impact:** Unverified users can access all features.
**Fix:** Apply guard to critical routes (servers, store, tickets) via `@UseGuards(EmailVerifiedGuard)`.
**Status:** ⚠️ OPEN

---

## 📋 Existing Security Issues (From Previous Audits)

### 🔴 Critical (2)

#### 5. JWT Token Leaked via Discord OAuth State
**File:** `src/discord/discord.controller.ts`
**Risk:** JWT passed as OAuth `state` parameter — visible in URL bar, logs, referrer.
**Status:** ⚠️ OPEN (from June 19 audit)

#### 6. User Entity Leaked in Admin API
**File:** `src/admin/admin.service.ts`
**Risk:** `getUserDetail()` spreads full User entity including `password_hash`, `two_factor_secret`.
**Status:** ⚠️ OPEN (from June 19 audit)

### 🟠 High (4)

#### 7. CreditsService.buyCredits() Race Condition
**File:** `src/credits/credits.service.ts`
**Risk:** Missing optimistic locking on coin purchase.
**Status:** ⚠️ OPEN (from June 19 audit)

#### 8. Invoice IDOR Vulnerability
**File:** `src/invoices/invoices.controller.ts`
**Risk:** Any user can view any invoice by ID.
**Status:** ⚠️ OPEN (from June 19 audit)

#### 9. JWT Stored in localStorage (XSS)
**File:** `client/stores/auth.js`
**Risk:** Access token in localStorage, accessible to any JS.
**Status:** ⚠️ OPEN (from June 19 audit)

#### 10. CSP Allows unsafe-eval
**File:** `src/main.ts`
**Risk:** Content-Security-Policy includes `'unsafe-eval'`.
**Status:** ⚠️ OPEN (from June 19 audit)

### 🟡 Medium (2)

#### 11. EmailTemplatesService Template Injection
**File:** `src/email-templates/email-templates.service.ts`
**Risk:** Variable replacement without HTML escaping.
**Status:** ⚠️ OPEN (from June 19 audit)

#### 2FA QR Code Not Rate Limited
**File:** `src/auth/two-factor.controller.ts`
**Risk:** No rate limit on 2FA enable endpoint.
**Status:** ⚠️ OPEN (from June 19 audit)

### 🟢 Low (8)

#### 13. Admin Password Weaker Than User Password
#### 14. Dead Code in Various Files
#### 15. AdminGuard DB Query on Every Request
#### 16. Referral Code UI Without Backend
#### 17. Hardcoded Pterodactyl Panel URL
#### 18. Theme Not Synced Across Tabs
#### 19. RemainingCoins Uses Stale Data
#### 20. Dual Renewal Services

---

## ✅ Security Fixes Applied (This Update)

| # | Fix | Description |
|---|-----|-------------|
| 1 | Email verification mandatory | New users must verify email before login |
| 2 | Rate limiting on verification | 3 emails per hour per user |
| 3 | Token hashing | SHA-256 hash for token storage |
| 4 | Suspend reason field | Prevents arbitrary suspension without explanation |
| 5 | Server ownership transfer | Expired servers → admin account (no orphaned servers) |
| 6 | Email notifications | Users notified of all server state changes |

---

## 🎯 Recommendations

### Immediate (This Week)
1. **Apply EmailVerifiedGuard** to critical routes
2. **Fix Discord OAuth JWT leak** — use random state parameter
3. **Strip sensitive fields** from admin user API response

### Short Term (This Month)
4. **Move JWT to HTTP-only cookie** instead of localStorage
5. **Remove unsafe-eval** from CSP
6. **Add rate limiting** to 2FA endpoints
7. **Fix CreditsService race condition** with optimistic locking

### Long Term
8. **Implement PKCE** for Discord OAuth
9. **Add WAF rules** for SQL injection prevention
10. **Implement CSP reporting** endpoint

---

**Report Generated:** 2026-06-20
**Next Audit:** After implementing Critical fixes
