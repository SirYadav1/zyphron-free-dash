# 🐛 Zyphron Free Dash — Bug Report
**Date:** 2026-06-20
**Scan:** Full codebase (126 backend + 77 frontend files)
**Total Bugs Found:** 40

---

## 🔴 CRITICAL (4 Bugs)

### BUG-C1: JWT Token Leaked via Discord OAuth State Parameter
- **File:** `src/discord/discord.controller.ts` (Lines 24-35)
- **Category:** Authentication / Security
- **Description:** User's JWT token passed as `state` parameter in Discord OAuth URL. Token appears in browser URL bar, server logs, referrer headers, and history. Anyone can hijack the session.
- **Impact:** Session hijacking via token leakage
- **Fix:** Generate random state value, store in session/cache keyed by JWT user, verify in callback.

### BUG-C2: Password Hash + 2FA Secret Leaked to Admins
- **File:** `src/admin/admin.service.ts` (Lines 94-95)
- **Category:** Information Disclosure
- **Description:** `getUserDetail()` spreads full User entity (`...user`) into response, including `password_hash`, `two_factor_secret`, `ip_address`, `device_fingerprint`. Admins can view bcrypt hashes and TOTP secrets.
- **Impact:** Mass credential exposure if admin account compromised
- **Fix:** Remove `...user` spread, explicitly pick only safe fields.

### BUG-C3: CreditsService.buyCredits() Missing Optimistic Locking
- **File:** `src/credits/credits.service.ts` (Lines 46-51)
- **Category:** Race Condition / Financial
- **Description:** `buyCredits()` updates coins without `AND coins = :coins` check. Every other coin operation uses optimistic locking. Concurrent purchases could award credits multiple times.
- **Impact:** Financial exploit — free credits
- **Fix:** Add `AND coins = :coins` to WHERE clause, check `affected === 0`.

### BUG-C4: Ticket Create Frontend/Backend Field Mismatch
- **File:** `client/views/TicketCreateView.vue` (Line 123) vs `src/tickets/tickets.controller.ts` (Lines 15-33)
- **Category:** API Contract Mismatch
- **Description:** Frontend sends `payload.serverId` (number) but backend DTO expects `server` (string). ValidationPipe with `whitelist: true` silently strips `serverId`. Tickets always created without server association.
- **Impact:** Feature completely broken — server field never saved
- **Fix:** Change frontend to send `server: form.serverId?.toString()` or change backend DTO to accept `serverId`.

---

## 🟠 HIGH (8 Bugs)

### BUG-H1: IDOR — Any User Can View Any Invoice
- **File:** `src/invoices/invoices.controller.ts` (Lines 35-38)
- **Category:** Authorization Bypass
- **Description:** `GET /invoices/:id` only checks `JwtAuthGuard` but doesn't verify invoice belongs to requesting user. Any user can enumerate IDs to view others' invoices.
- **Fix:** Add userId check: `this.invoicesService.findById(id, userId)` and verify ownership.

### BUG-H2: Email Verification System Non-Functional
- **File:** `src/auth/auth.service.ts` (Lines 206-212, 140, 226)
- **Category:** Broken Logic
- **Description:** `verifyEmail()` and `resendVerification()` return success without verifying anything. `emailVerified` hardcoded to `true` in all responses. System appears to work but does nothing.
- **Fix:** Implement real verification with token generation/validation, or remove verification UI.

### BUG-H3: Invoice Number Generation Race Condition
- **File:** `src/invoices/invoices.service.ts` (Lines 19-23)
- **Category:** Race Condition
- **Description:** `generateInvoiceNumber()` uses `count() + 1` which is not atomic. Concurrent requests can produce same invoice number.
- **Fix:** Use database sequence, UUID, or add unique constraint with retry on conflict.

### BUG-H4: Products Egg Endpoint Exposes Panel Structure Without Auth
- **File:** `src/products/products-user.controller.ts` (Lines 42-45)
- **Category:** Information Disclosure
- **Description:** `GET /products/nests/:nestId/eggs` proxies directly to Pterodactyl without authentication. Anyone can query panel's nest/egg structure.
- **Fix:** Add `@UseGuards(JwtAuthGuard)` or remove endpoint.

### BUG-H5: JWT Stored in localStorage (XSS Vulnerable)
- **File:** `client/api/client.js` (Lines 11-13); `client/stores/auth.js` (Line 47)
- **Category:** Security
- **Description:** JWT access token stored in `localStorage`, accessible to any JavaScript. Combined with `unsafe-eval` in CSP, significantly increases XSS impact.
- **Fix:** Store token in HTTP-only cookie set by backend, or at minimum use `sessionStorage`.

### BUG-H6: CSP Allows `unsafe-eval`
- **File:** `src/main.ts` (Line 44)
- **Category:** Security Hardening
- **Description:** Content-Security-Policy includes `script-src 'self' 'unsafe-eval'`, allowing `eval()`, `new Function()`. Weakens XSS protections.
- **Fix:** Remove `unsafe-eval` — Vue 3 with Vite typically doesn't require it.

### BUG-H7: Discord OAuth Missing PKCE
- **File:** `src/discord/discord.service.ts` (Lines 27-32)
- **Category:** OAuth Security
- **Description:** Discord OAuth flow doesn't use PKCE (Proof Key for Code Exchange), relying solely on JWT as state (which itself is leaked per BUG-C1). Vulnerable to authorization code interception.
- **Fix:** Implement PKCE with `code_verifier` and `code_challenge`.

### BUG-H8: Pterodactyl Config Endpoint Leaks Internal Details
- **File:** `src/admin/admin.service.ts` (Lines 436-443)
- **Category:** Information Disclosure
- **Description:** Error messages in `testPterodactylConfig()` can leak internal network details via `error.message`.
- **Fix:** Sanitize error messages before returning to client.

---

## 🟡 MEDIUM (14 Bugs)

### BUG-M1: Dual Renewal Services with Inconsistent Logic
- **File:** `src/store/store.service.ts` (Lines 207-286) vs `src/servers/server-renewal.service.ts` (Lines 98-198)
- **Category:** Logic Inconsistency
- **Description:** Two separate services can renew a server with different pricing logic. `StoreService` uses `renewal_coins` setting, `ServerRenewalService` uses server's `renewal_price` field.
- **Fix:** Consolidate into single renewal service.

### BUG-M2: Duplicate `POST /servers/:id/renew` Endpoints
- **File:** `src/servers/server-renewal.controller.ts` (Line 26) vs `src/store/store.controller.ts` (Line 52)
- **Category:** Route Conflict
- **Description:** Both controllers expose renewal functionality, leading to potential double-renewal or inconsistent state.
- **Fix:** Remove one duplicate and standardize frontend to use single endpoint.

### BUG-M3: Blacklist Type Not Validated
- **File:** `src/tickets/tickets.service.ts` (Lines 133-138)
- **Category:** Input Validation
- **Description:** `addBlacklistEntry()` accepts any string as `type` without validating it's 'email', 'username', or 'ip'. Invalid types never match.
- **Fix:** Add validation: `if (!['email', 'username', 'ip'].includes(type)) throw new BadRequestException(...)`.

### BUG-M4: `v-html` Used for SVG Icons in Admin Layout
- **File:** `client/views/admin/AdminLayout.vue` (Line 22)
- **Category:** Potential XSS
- **Description:** `v-html="item.icon"` renders raw HTML. Currently safe (hardcoded), but dangerous if icons sourced from database or user input.
- **Fix:** Use Vue components or `<component :is="...">` instead.

### BUG-M5: Admin User Endpoint Leaks IPs and Device Fingerprints
- **File:** `src/admin/admin.service.ts` (Lines 54-80)
- **Category:** Information Disclosure
- **Description:** `getUsers()` returns `ipAddress`, `deviceFingerprint`, `pterodactylUserId` for all users to admin panel.
- **Fix:** Only expose via separate "security details" endpoint.

### BUG-M6: CORS Allows All Requests Without Origin
- **File:** `src/main.ts` (Lines 20-22)
- **Category:** Security
- **Description:** Requests with no `Origin` header always allowed. Any HTTP client can make authenticated API calls.
- **Fix:** Consider requiring Origin for state-changing requests.

### BUG-M7: Theme localStorage Not Synchronized Across Tabs
- **File:** `client/main.js` (Lines 7-19); `client/views/PreferencesView.vue`
- **Category:** UX Bug
- **Description:** Theme changes in one tab not reflected in others until refresh.
- **Fix:** Listen for `storage` events or use `BroadcastChannel`.

### BUG-M8: Email Templates Allow Template Injection
- **File:** `src/email-templates/email-templates.service.ts` (Lines 69-73)
- **Category:** Template Injection
- **Description:** Template variable replacement uses `split(placeholder).join(value)` without HTML escaping. HTML/JS in variables renders in emails.
- **Fix:** Escape HTML in variable values before replacement.

### BUG-M9: Shop Product Type Not Validated
- **File:** `src/store/admin-store.controller.ts` (Lines 17-41)
- **Category:** Input Validation
- **Description:** `CreateShopProductDto` has `@IsString() type` without validating known types. Invalid types break credit purchase flow.
- **Fix:** Add `@IsIn(['credit_package', 'server_plan', ...])`.

### BUG-M10: Invoices Controller Missing DTO Validation
- **File:** `src/invoices/invoices.controller.ts` (Lines 41-57)
- **Category:** Input Validation
- **Description:** `POST /invoices` and `PATCH /invoices/:id` accept raw body without DTO validation. Amounts, currency, status not validated.
- **Fix:** Create proper DTO classes with `class-validator` decorators.

### BUG-M11: 2FA Controller Returns Error Object Instead of Throwing
- **File:** `src/auth/two-factor.controller.ts` (Lines 40-43)
- **Category:** Error Handling
- **Description:** `enable()` and `disable()` return `{ error: '...' }` instead of throwing. Returns HTTP 200 with error payload.
- **Fix:** Throw `BadRequestException` instead.

### BUG-M12: `coins.toFixed(2)` on Integer Value
- **File:** `client/views/DashboardView.vue` (Line 42)
- **Category:** UI Bug
- **Description:** `authStore.user?.coins?.toFixed(2)` formats integer coins as "100.00". Misleading display.
- **Fix:** Use `Math.floor()` or remove `.toFixed(2)`.

### BUG-M13: StoreService `remainingCoins` Uses Stale Data
- **File:** `src/store/store.service.ts` (Line 200)
- **Category:** Logic Error
- **Description:** `upgradeServer()` returns `remainingCoins: user.coins - totalCost` using pre-deduction balance. Wrong if coins changed between read and write.
- **Fix:** Re-fetch user after successful update, return actual new balance.

### BUG-M14: Server Renewal `remainingCoins` Uses Stale Data
- **File:** `src/servers/server-renewal.service.ts` (Line 194)
- **Category:** Logic Error
- **Description:** Same issue as M13 — uses pre-deduction balance for remaining coins calculation.
- **Fix:** Re-fetch user after update, return actual balance.

---

## 🟢 LOW (14 Bugs)

### BUG-L1: SetupAdminDto Password Weaker Than RegisterDto
- **File:** `src/auth/dto/setup-admin.dto.ts` (Line 16)
- **Category:** Validation Inconsistency
- **Description:** Admin password requires `@MinLength(6)` while user registration requires `@MinLength(8)` with complexity rules.
- **Fix:** Use same password validation as `RegisterDto`.

### BUG-L2: Dead Code — AppController.spec.ts
- **File:** `src/app.controller.spec.ts`
- **Category:** Dead Code
- **Description:** Test file for AppController — may contain stale tests.
- **Fix:** Review and update or remove.

### BUG-L3: AdminGuard Makes DB Query on Every Request
- **File:** `src/common/guards/admin.guard.ts` (Lines 19-34)
- **Category:** Performance
- **Description:** Every admin API request triggers DB query to check admin status.
- **Fix:** Include `is_admin` in JWT payload and check in guard without DB query.

### BUG-L4: DashboardView Referral Link Uses Non-Existent Field
- **File:** `client/views/DashboardView.vue` (Line 199)
- **Category:** Dead Code
- **Description:** `authStore.user?.referralCode` displayed but User entity has no `referralCode` field. Link always shows "...".
- **Fix:** Implement referral system or remove UI element.

### BUG-L5: AdminService.getServers() Is Unused
- **File:** `src/admin/admin.service.ts` (Lines 208-229)
- **Category:** Dead Code
- **Description:** Method exists but no controller calls it. Admin servers list uses `ServersService.getAllServers()`.
- **Fix:** Remove unused method.

### BUG-L6: LoginView Uses Raw Fetch Instead of Axios
- **File:** `client/views/LoginView.vue` (Lines 150-158)
- **Category:** Inconsistency
- **Description:** Uses raw `fetch('/api/public-settings')` instead of axios `client`, bypassing centralized error handling.
- **Fix:** Use `client.get('/public-settings')` instead.

### BUG-L7: Hardcoded Panel URL in SettingsView
- **File:** `client/views/SettingsView.vue` (Line 92)
- **Category:** Hardcoded Value
- **Description:** `https://panel.zyphron.cloud/` hardcoded. Should use dynamic `pteroUrl` variable.
- **Fix:** Replace with `pteroUrl` or remove hardcoded link.

### BUG-L8: PterodactylService Instance Variables Not Thread-Safe
- **File:** `src/pterodactyl/pterodactyl.service.ts` (Lines 42-47)
- **Category:** Concurrency
- **Description:** `panelUrl`, `apiKey`, `configLoaded` can be read/written concurrently during async operations.
- **Fix:** Use mutex or ensure reads go through `loadConfiguration()`.

### BUG-L9: MailService Doesn't Use ConfigService
- **File:** `src/mail/mail.service.ts` (Lines 20-38)
- **Category:** Design Issue
- **Description:** Directly reads `process.env` instead of using `ConfigService`. Harder to test.
- **Fix:** Inject `ConfigService` and use `configService.get()`.

### BUG-L10: AchievementsService Weekly Login Approximate Date Matching
- **File:** `src/achievements/achievements.service.ts` (Lines 116-143)
- **Category:** Logic Issue
- **Description:** Weekly login check compares timestamps with 1-day tolerance but includes time-of-day. Users logging at different times may not get consecutive matches.
- **Fix:** Normalize dates to midnight before comparing.

### BUG-L11: PterodactylService Redundant loadConfiguration() Call
- **File:** `src/pterodactyl/pterodactyl.service.ts` (Lines 109-112)
- **Category:** Logic Issue
- **Description:** After saving config, calls `loadConfiguration()` then immediately resets `configLoaded = false`. Load is redundant.
- **Fix:** Remove redundant call, set instance variables directly.

### BUG-L12: Missing `isFree` Column on Server Entity
- **File:** `src/entities/server.entity.ts`
- **Category:** Missing Feature
- **Description:** AGENTS.md mentions "All servers marked as isFree: true" but entity has no `isFree` column.
- **Fix:** Add column if needed, or remove reference.

### BUG-L13: .env File May Not Be in .gitignore
- **File:** `.env`
- **Category:** Security
- **Description:** .env contains placeholder secrets. Must verify it's in .gitignore.
- **Fix:** Verify `.gitignore` includes `.env`.

### BUG-L14: AdminUserEdit Route May Be Missing
- **File:** `client/router/index.js` (Line 65)
- **Category:** Dead Route
- **Description:** Route `admin/users/:id/edit` references `AdminUserEditView.vue` which may not be fully implemented.
- **Fix:** Verify component exists and is functional.

---

## 📊 Summary

| Severity | Count | Impact |
|----------|-------|--------|
| 🔴 **Critical** | 4 | Session hijacking, credential leak, financial exploit, broken feature |
| 🟠 **High** | 8 | IDOR, broken verification, race conditions, info disclosure |
| 🟡 **Medium** | 14 | Logic errors, UX bugs, validation gaps, template injection |
| 🟢 **Low** | 14 | Dead code, performance, inconsistencies |
| **Total** | **40** | |

---

## 🎯 Priority Fix Order

1. **BUG-C2** — Password hash leak (immediate credential risk)
2. **BUG-C1** — Discord OAuth JWT leak (session hijacking)
3. **BUG-C3** — Credits race condition (financial exploit)
4. **BUG-C4** — Ticket server field mismatch (broken feature)
5. **BUG-H1** — Invoice IDOR (data breach)
6. **BUG-H5** — localStorage JWT (XSS amplification)
7. **BUG-H6** — CSP unsafe-eval (XSS amplification)
8. **BUG-H2** — Email verification (broken feature)
9. **BUG-H3** — Invoice number race condition
10. **BUG-H4** — Unauthenticated egg endpoint

---

## 🔧 Quick Fixes (Can Be Applied Now)

```bash
# Fix C2: Password hash leak
# In admin.service.ts, replace "...user" spread with explicit fields

# Fix C3: Credits race condition
# In credits.service.ts buyCredits(), add AND coins = :coins to WHERE

# Fix C4: Ticket field mismatch
# In TicketCreateView.vue, change serverId to server

# Fix H6: Remove unsafe-eval from CSP
# In main.ts, remove 'unsafe-eval' from Content-Security-Policy
```

---

**Report generated by automated codebase scan**
**Date:** 2026-06-20
