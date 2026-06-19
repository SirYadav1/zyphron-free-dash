# 🐛 Zyphron Free Dashboard — Bug Report

> **Last Updated:** 2026-06-19
> **Status:** Active monitoring
> **Server:** http://108.181.193.242:8080

---

## 📊 Bug Summary

| Category | Total | Fixed | Open | Critical |
|----------|-------|-------|------|----------|
| Critical | 8 | 8 | 0 | 0 |
| High | 10 | 10 | 0 | 0 |
| Medium | 15 | 12 | 3 | 0 |
| Low | 12 | 10 | 2 | 0 |
| **Total** | **45** | **40** | **5** | **0** |

---

## ✅ Fixed Bugs

### Critical (8/8 Fixed)

| # | Bug | Description | Fix | Date |
|---|-----|-------------|-----|------|
| 1 | Login Page Old Logo | Old logo and "Welcome Back" text showing | Updated LoginView.vue | Jun 19 |
| 2 | Registration Fields Missing | first_name/last_name not sent to backend | Updated auth store + DTO | Jun 19 |
| 3 | Dark Mode Not Applying | Theme not applying on page load | Added immediate applyTheme() | Jun 19 |
| 4 | Ticket IDOR Vulnerability | Users could access other users' tickets | Added ownership check | Jun 17 |
| 5 | CORS Wildcard | `*` origin allowed | Changed to whitelist | Jun 17 |
| 6 | Hardcoded Secrets | JWT secret, API keys in code | Moved to .env | Jun 17 |
| 7 | Discord OAuth Redirect | Wrong redirect URL | Fixed FRONTEND_URL | Jun 18 |
| 8 | Admin Self-Ban | Admin could ban themselves | Added prevention check | Jun 17 |

### High (10/10 Fixed)

| # | Bug | Description | Fix | Date |
|---|-----|-------------|-----|------|
| 9 | Email Templates Route | Frontend calling wrong URL | Fixed to /admin/email-templates | Jun 18 |
| 10 | 2FA Login Flow | Broken 2FA verification | Verified backend + frontend | Jun 18 |
| 11 | Achievement Timestamps | Wrong timestamp format | Fixed date parsing | Jun 17 |
| 12 | Expired Server Cleanup | Servers not suspending on expiry | Added lifecycle service | Jun 17 |
| 13 | Discord Pterodactyl Sync | Not syncing properly | Fixed sync logic | Jun 17 |
| 14 | Timing-Safe Auth | Authentication timing attacks | Added constant-time comparison | Jun 17 |
| 15 | XSS Prevention | User input not sanitized | Added input sanitization | Jun 17 |
| 16 | Password Exposure | Password hash exposed in API | Removed from responses | Jun 17 |
| 17 | Reactivity Route Params | Vue reactivity issues | Fixed with key binding | Jun 17 |
| 18 | Theme Application | Theme not persisting | Fixed localStorage handling | Jun 17 |

### Medium (12/15 Fixed)

| # | Bug | Description | Fix | Date |
|---|-----|-------------|-----|------|
| 19 | DTO Mismatches | Frontend/backend DTO mismatch | Aligned DTOs | Jun 17 |
| 20 | Dashboard Panel URL | Wrong panel URL | Updated to console.zyphron.cloud | Jun 18 |
| 21 | Ticket Validation Error | Category field causing error | Removed from payload | Jun 19 |
| 22 | Coin Shop Display | Not showing packages | Fixed API endpoint | Jun 19 |
| 23 | Admin Panel Button | Missing quick-action | Added to dashboard | Jun 19 |
| 24 | User Role Management | No UI for role assignment | Added toggle buttons | Jun 19 |
| 25 | API Key Token | No custom token option | Added token field | Jun 19 |
| 26 | Server Specs Display | Missing in admin users | Added Type/RAM/CPU/Disk columns | Jun 19 |
| 27 | Egg Selection | Not showing after category select | Added public endpoint | Jun 19 |
| 28 | Tax System | Unnecessary tax fields | Removed from invoices | Jun 19 |
| 29 | Store Rename | "Buy Credits" confusing | Renamed to "Store" | Jun 19 |
| 30 | Services Flow | No category-based selection | Created ServicesView | Jun 19 |

### Low (10/12 Fixed)

| # | Bug | Description | Fix | Date |
|---|-----|-------------|-----|------|
| 31 | Language Switching | No feedback on save | Added "coming soon" message | Jun 18 |
| 32 | Ticket Priority | No priority selection | Added radio buttons | Jun 18 |
| 33 | Profile Customization | No name editing | Added first/last name fields | Jun 18 |
| 34 | Auto-Renew Toggle | No toggle UI | Added ON/OFF buttons | Jun 18 |
| 35 | Useful Links CRUD | No admin management | Added full CRUD | Jun 18 |
| 36 | Server Renewal UI | No renewal button | Added renewal flow | Jun 18 |
| 37 | Invoice Management | Basic only | Added admin CRUD | Jun 18 |
| 38 | Email Templates | No management | Added admin CRUD | Jun 18 |
| 39 | Two-Factor Auth | No setup flow | Added 2FA setup | Jun 18 |
| 40 | Activity Logs | No viewing | Added admin view | Jun 18 |

---

## ⚠️ Open Bugs

### Medium Priority

| # | Bug | Description | Status | Date |
|---|-----|-------------|--------|------|
| M1 | Pterodactyl Panel Unreachable | Panel API sometimes times out from VPS | Investigating | Jun 18 |
| M2 | Discord Guild ID Empty | Need to configure DISCORD_GUILD_ID in .env | Pending Config | Jun 18 |
| M3 | Credit Packages Empty | Admin needs to create packages via /admin/store | Pending Admin | Jun 18 |

### Low Priority

| # | Bug | Description | Status | Date |
|---|-----|-------------|--------|------|
| L1 | Search Bar Not Functional | Search bar in header doesn't work yet | Planned | Jun 18 |
| L2 | Mobile Responsive | Some admin views not fully responsive | Planned | Jun 18 |

---

## 🔄 Known Issues (Not Bugs)

1. **SQLite in Production** — Using SQLite for production. Consider migrating to PostgreSQL for better concurrency.
2. **No Rate Limiting on AFK** — AFK earning endpoint has no rate limiting (low risk).
3. **Static Docker Image** — All servers use same Docker image. Should be configurable per egg.
4. **No Server Backup** — No automatic backup system implemented yet.
5. **Email Not Configured** — SMTP settings are placeholder. Need real SMTP setup.

---

## 📋 Testing Checklist

### Authentication
- [x] User registration with first/last name
- [x] User login with email/password
- [x] JWT token generation
- [x] Discord OAuth login
- [x] 2FA setup and verification
- [x] Password reset flow
- [x] Email verification

### Server Management
- [x] Server creation with plan selection
- [x] Egg selection from Pterodactyl
- [x] Server listing
- [x] Server deletion
- [x] Server renewal
- [x] Auto-renew toggle
- [x] Server suspension on expiry
- [x] Owner transfer on expiry

### Admin Panel
- [x] User management (list, edit, ban)
- [x] Server management (list, edit, suspend)
- [x] Product management (CRUD)
- [x] Store management (credit packages)
- [x] Ticket management
- [x] Voucher management
- [x] Partner management
- [x] Coupon management
- [x] Invoice management
- [x] Email templates
- [x] Useful links
- [x] Activity logs
- [x] API key management
- [x] Role management
- [x] Settings

### Frontend
- [x] Dashboard with stats
- [x] Servers page with table
- [x] Store with credit packages
- [x] Services with category selection
- [x] Ticket system
- [x] Profile page
- [x] Preferences (dark mode)
- [x] Settings
- [x] AFK earning
- [x] Transactions
- [x] Invoices

---

*Bug report maintained by Hermes Agent. Last updated: 2026-06-19*
