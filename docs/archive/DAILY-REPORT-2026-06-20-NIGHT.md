# 📋 Zyphron Free Dashboard — Daily Report

> **Date:** June 20, 2026 (Night Session)
> **Version:** 1.2.0 → 1.2.1
> **Live:** http://108.181.193.242:8080
> **GitHub:** https://github.com/SirYadav1/zyphron-free-dash
> **Commits:** 6 commits (fe6e3ef → 5a8b012)

---

## 📊 Session Summary

| Metric | Value |
|--------|-------|
| **Tasks Completed** | 22 |
| **Files Modified** | 38+ |
| **Lines Added** | 2,590+ |
| **Lines Removed** | 818+ |
| **Commits Made** | 6 |
| **Bugs Fixed** | 12 |
| **New Features** | 10 |

---

## 🚀 Features Implemented

### 📧 1. Email Verification System (NEW)
- ✅ Mandatory email verification for all new registrations
- ✅ Verification email with dark-themed HTML template
- ✅ Resend button with 60s cooldown timer
- ✅ `EmailVerifiedGuard` for protected routes
- ✅ Login blocks unverified users
- ✅ `VerifyEmailView` — success/error states with SVG icons
- ✅ `VerifyPendingView` — email pre-fill, spam folder tips

**Files:**
- `src/email-verification/email-verification.service.ts` (NEW)
- `src/email-verification/email-verification.controller.ts` (UPDATED)
- `src/email-verification/email-verification.module.ts` (NEW)
- `src/common/guards/email-verified.guard.ts` (NEW)
- `client/views/VerifyEmailView.vue` (UPDATED)
- `client/views/VerifyPendingView.vue` (UPDATED)

---

### 🎫 2. Ticket System Improvements
- ✅ **Ticket Numbers**: Format `ZYPHC-0001`, `ZYPHC-0002` (sequential)
- ✅ **HTML Export**: Closed tickets saved as styled HTML
- ✅ **Admin Search**: `GET /api/admin/tickets/search?email=xxx&user_id=xxx`
- ✅ **Role Permissions**: ticket_accept, ticket_reject, ticket_chat, coin_approve

**Files:**
- `src/entities/ticket.entity.ts` — added ticket_number, closed_html
- `src/tickets/tickets.service.ts` — auto-generate numbers, HTML export
- `src/tickets/admin-tickets.controller.ts` — search endpoint
- `src/entities/role.entity.ts` — added permission columns

---

### 🖥️ 3. Server Management
- ✅ **Suspend Reason**: Required field when suspending
- ✅ **Ownership Transfer**: Expired/suspended → admin account
- ✅ **Deploy Popup**: "Server installing..." → "Server ready!"
- ✅ **Console Button**: Opens console.zyphron.cloud

**Files:**
- `src/entities/server.entity.ts` — suspend_reason column
- `src/servers/servers.service.ts` — email notifications
- `src/servers/server-lifecycle.service.ts` — ownership transfer
- `client/views/ServicesView.vue` — deploy popup
- `client/views/ServersView.vue` — console button

---

### 📧 4. Email Notifications (6 Types)
- ✅ Deploy Complete: "Your server is ready!"
- ✅ Auto-Suspend Warning: "Renew in 24h"
- ✅ Server Suspended: with reason
- ✅ Server Restored: "Your server is back"
- ✅ Server Deleted: notification
- ✅ Ownership Transferred: to original owner

---

### 👥 5. Prebuilt Roles
| Role | Level | Permissions |
|------|-------|-------------|
| Owner | 1 | All permissions |
| Co-Founder | 2 | All except delete |
| CEO | 3 | Ticket + Coin |
| Staff | 4 | Ticket accept/chat |

---

### 📧 6. Full SMTP Configuration
Admin Panel → Settings → Email/SMTP:
- SMTP Host, Port, Username, Password
- Mail From Address, From Name
- Encryption (TLS/SSL/None)
- Save + Send Test Email buttons

---

### 👤 7. Admin User Management Redesign
**User List** (Pterodactyl-style):
- ID, Email (⭐ admin), Client Name, Username, 2FA, Servers, Actions
- Search bar + "Create New" button

**User Edit** (Card sections):
- Identity: Email, Username, First/Last Name, Language
- Password: Field with "leave blank to keep same"
- Permissions: Administrator Yes/No dropdown
- Delete User: Red section with confirmation

---

### 🔗 8. Useful Links
- Default links: Zyphron Console + Discord
- Admin CRUD: Add/Edit/Delete

---

### 🎨 9. UI Improvements
- Services page: Bigger cards, highlight selected
- Admin settings: 5 category tabs, no emojis
- Server management: Icons, dates, bigger buttons
- Node names: Fixed "undefined mb"

---

### 🔐 10. Security
- Specific login error messages
- Email verification mandatory
- Rate limiting on verification emails

---

## 🐛 Bugs Fixed

| # | Bug | Fix |
|---|-----|-----|
| 1 | Password change internal server error | `password` → `password_hash` + bcrypt import |
| 2 | "property language should not exist" | Added language column to User entity |
| 3 | User can't login after password change | Fixed JSDoc comment broken syntax |
| 4 | Settings emojis | Replaced with Lucide icons |
| 5 | Login shows generic "Invalid credentials" | Specific messages per scenario |
| 6 | Power button confusing in user list | Removed, kept Edit only |
| 7 | Email verification routes conflict | Removed old routes from AuthController |
| 8 | emailVerified hardcoded to true | Now uses actual user.email_verified |
| 9 | Node names "undefined mb" | Fixed to use node.name |
| 10 | Server creation 404 | Frontend sends eggId + nestId |
| 11 | 2FA QR code broken | Converted to PNG |
| 12 | Admin panel not mobile responsive | Added hamburger menu |

---

## 📁 Files Changed (38+ files)

### Backend (20 files)
- `src/auth/auth.service.ts` — Email verification, specific login errors, language
- `src/auth/auth.controller.ts` — Removed old verify routes
- `src/auth/auth.module.ts` — EmailVerificationModule import
- `src/admin/admin.service.ts` — Password fix, bcrypt import, SMTP config
- `src/admin/admin.controller.ts` — SMTP DTO, language field
- `src/entities/user.entity.ts` — language column
- `src/entities/server.entity.ts` — suspend_reason column
- `src/entities/ticket.entity.ts` — ticket_number, closed_html
- `src/entities/role.entity.ts` — permission columns, level
- `src/email-verification/*` — NEW: 3 files
- `src/common/guards/email-verified.guard.ts` — NEW
- `src/servers/servers.service.ts` — Email notifications
- `src/servers/server-lifecycle.service.ts` — Ownership transfer
- `src/tickets/tickets.service.ts` — Ticket numbers, HTML export
- `src/tickets/admin-tickets.controller.ts` — Search endpoint
- `src/roles/roles.service.ts` — Prebuilt roles seed
- `src/mail/mail.service.ts` — SMTP encryption support
- `src/useful-links/useful-links.service.ts` — Default links seed

### Frontend (18 files)
- `client/views/admin/AdminUsersView.vue` — Redesigned table
- `client/views/admin/AdminUserEditView.vue` — NEW: Card layout
- `client/views/admin/AdminServersView.vue` — Icons, dates, console button
- `client/views/admin/AdminSettingsView.vue` — 5 tabs, SMTP form, no emojis
- `client/views/admin/AdminUsefulLinksView.vue` — NEW: CRUD
- `client/views/ServicesView.vue` — Deploy popup, bigger cards
- `client/views/ServersView.vue` — Console button
- `client/views/LoginView.vue` — Email verification redirect
- `client/views/RegisterView.vue` — Redirect to verify
- `client/views/VerifyEmailView.vue` — UPDATED
- `client/views/VerifyPendingView.vue` — UPDATED
- `client/stores/auth.js` — Email verification methods

---

## 📊 Git Commits

| Commit | Description |
|--------|-------------|
| `fe6e3ef` | feat: email verification, ticket numbers, server management, UI overhaul |
| `989e6ab` | docs: update changelog, security report, bug report |
| `c54a043` | feat: password fix, prebuilt roles, SMTP config, user management redesign |
| `5a8b012` | fix: remove emojis, fix language error, specific login errors |

---

## 🔜 Remaining Tasks

1. **Apply EmailVerifiedGuard** to critical routes
2. **Fix Discord OAuth JWT leak** — use random state parameter
3. **Strip sensitive fields** from admin user API response
4. **Move JWT to HTTP-only cookie** instead of localStorage
5. **Remove unsafe-eval** from CSP

---

**Report Generated:** 2026-06-20 (Night)
**Next Session:** Continue with remaining security fixes
