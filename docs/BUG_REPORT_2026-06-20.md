# 🐛 Zyphron Free Dashboard — Bug Report

> **Report Date:** 2026-06-20
> **Version:** 1.2.0
> **Reporter:** Hermes Agent

---

## 📊 Summary

| Severity | Found | Fixed | Open |
|----------|-------|-------|------|
| 🔴 Critical | 6 | 4 | 2 |
| 🟠 High | 8 | 6 | 2 |
| 🟡 Medium | 14 | 10 | 4 |
| 🟢 Low | 14 | 10 | 4 |
| **Total** | **42** | **30** | **12** |

---

## ✅ Bugs Fixed (This Update)

### 🔴 Critical Fixed

| # | Bug | File | Fix |
|---|-----|------|-----|
| 1 | Email verification routes returning "not required for local accounts" | `src/auth/auth.controller.ts` | Removed conflicting old verify/resend routes from AuthController |
| 2 | emailVerified hardcoded to `true` in login response | `src/auth/auth.service.ts` | Changed to `!!user.email_verified` |
| 3 | Registration bypasses email verification | `src/auth/auth.service.ts` | Added email verification check before returning token |
| 4 | Login allows unverified users | `src/auth/auth.service.ts` | Added `requiresEmailVerification` flag in login response |

### 🟠 High Fixed

| # | Bug | File | Fix |
|---|-----|------|-----|
| 5 | Server creation 404 (egg/nest mismatch) | `src/servers/servers.service.ts` | Frontend now sends eggId + nestId correctly |
| 6 | Node names showing "undefined mb" | `client/views/admin/AdminSettingsView.vue` | Fixed to use `node.name \|\| 'Node #' + node.id` |
| 7 | Ticket creation field mismatch | `client/views/TicketCreateView.vue` | Removed category from payload |
| 8 | 2FA QR code broken | `src/auth/two-factor.service.ts` | Converted to PNG via qrcode package |
| 9 | Admin panel not mobile responsive | `client/views/admin/AdminLayout.vue` | Added hamburger menu + mobile sidebar |
| 10 | Dark mode not applied on load | `client/views/PreferencesView.vue` | Immediate `applyTheme()` call |

### 🟡 Medium Fixed

| # | Bug | File | Fix |
|---|-----|------|-----|
| 11 | Services page cluttered | `client/views/ServicesView.vue` | Bigger cards, better spacing, highlight selected |
| 12 | Server RAM/CPU/Disk no icons | `client/views/admin/AdminServersView.vue` | Added lucide icons (MemoryStick, Cpu, HardDrive) |
| 13 | Pterodactyl API key not visible after add | `client/views/admin/AdminSettingsView.vue` | Shows masked key + Update button |
| 14 | Settings page disorganized | `client/views/admin/AdminSettingsView.vue` | 5 category tabs |
| 15 | Useful links admin missing | `client/views/admin/AdminUsefulLinksView.vue` | NEW: Full CRUD |
| 16 | No deploy loading feedback | `client/views/ServicesView.vue` | Deploy popup with animation |
| 17 | Suspend without reason | `src/servers/servers.service.ts` | Added suspend_reason field |
| 18 | Server ownership not transferred | `src/servers/server-lifecycle.service.ts` | Auto-transfer on expiry |
| 19 | No email notifications | `src/servers/servers.service.ts` | 6 email types added |
| 20 | Ticket numbers missing | `src/tickets/tickets.service.ts` | ZYPHC-XXXX format |

### 🟢 Low Fixed

| # | Bug | File | Fix |
|---|-----|------|-----|
| 21 | Login page flash on refresh | `client/views/LoginView.vue` | Static logo from frontend |
| 22 | Emoji icons in sidebar | `client/views/admin/AdminLayout.vue` | Lucide SVG icons |
| 23 | Coin submenu stuck | `client/layouts/MainLayout.vue` | Better styling |
| 24 | Sidebar footer design | `client/layouts/MainLayout.vue` | Gradient card |
| 25 | Service card images too small | `client/views/ServicesView.vue` | Large banner images |
| 26 | Missing role permissions | `src/entities/role.entity.ts` | Added ticket/coin permissions |
| 27 | Default useful links missing | `src/useful-links/useful-links.service.ts` | Auto-seed on startup |
| 28 | Ticket search missing | `src/tickets/admin-tickets.controller.ts` | Added search endpoint |
| 29 | Ticket HTML export missing | `src/tickets/tickets.service.ts` | Save HTML on close |
| 30 | Admin buttons too small | `client/views/admin/AdminServersView.vue` | Bigger with icons |

---

## 🔴 Critical Bugs Still Open

| # | Bug | File | Status |
|---|-----|------|--------|
| 1 | JWT leaked via Discord OAuth state | `src/discord/discord.controller.ts` | ⚠️ OPEN |
| 2 | User entity password hash leaked in admin API | `src/admin/admin.service.ts` | ⚠️ OPEN |

---

## 🟠 High Bugs Still Open

| # | Bug | File | Status |
|---|-----|------|--------|
| 3 | CreditsService.buyCredits() race condition | `src/credits/credits.service.ts` | ⚠️ OPEN |
| 4 | Invoice IDOR vulnerability | `src/invoices/invoices.controller.ts` | ⚠️ OPEN |

---

## 🟡 Medium Bugs Still Open

| # | Bug | File | Status |
|---|-----|------|--------|
| 5 | Email verification guard not applied | `src/common/guards/email-verified.guard.ts` | ⚠️ OPEN |
| 6 | Verify email token in URL bar | `client/views/VerifyEmailView.vue` | ⚠️ OPEN |
| 7 | Resend verification rate limit bypass | `src/email-verification/` | ⚠️ OPEN |
| 8 | CSP allows unsafe-eval | `src/main.ts` | ⚠️ OPEN |

---

## 🟢 Low Bugs Still Open

| # | Bug | File | Status |
|---|-----|------|--------|
| 9 | Admin password weaker than user password | `src/auth/dto/setup-admin.dto.ts` | ⚠️ OPEN |
| 10 | Theme not synced across tabs | `client/main.js` | ⚠️ OPEN |
| 11 | RemainingCoins uses stale data | `src/store/store.service.ts` | ⚠️ OPEN |
| 12 | Dual renewal services | `src/store/store.service.ts` | ⚠️ OPEN |

---

## 📈 Bug Fix Progress

```
Version 1.0 (June 17):  5 bugs fixed
Version 1.1 (June 20):  40 bugs fixed
Version 1.2 (June 20):  30 bugs fixed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Fixed:            75 bugs
Total Open:             12 bugs
Fix Rate:               86%
```

---

**Report Generated:** 2026-06-20
**Next Review:** After fixing Critical/High issues
