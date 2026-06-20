# 📋 Zyphron Free Dashboard — Changelog (Consolidated)

> **Live Server:** http://108.181.193.242:8080
> **GitHub:** https://github.com/SirYadav1/zyphron-free-dash
> **Admin Panel:** /admin (admin@zyphron.cloud / Admin123!)
> **Pterodactyl Panel:** https://console.zyphron.cloud

---

## [1.2.1] — 2026-06-20 (Night Session — Final)

### 🚀 New Features
- ✅ Separate pages per service category (`/services/:id`)
- ✅ Server card click → settings page
- ✅ Open Console button in header (next to Deploy Server)
- ✅ Upgrade tab (RAM/CPU/Disk with coins)
- ✅ 8 pre-built professional email templates
- ✅ Message of the Day (MOTD) in admin settings
- ✅ Store package delete + visibility toggle
- ✅ SMTP setup guide (Gmail, Pterodactyl, Resend, SendGrid, Mailgun)
- ✅ Blue theme for services page

### 🎨 UI/UX Changes
- ✅ Services page: Blue-tinted dark theme (#0a0f1a)
- ✅ Admin settings: 5 category tabs (no emojis)
- ✅ Page alignment standardized across all pages
- ✅ Font smoothing (antialiased)
- ✅ Horizontal scroll prevention
- ✅ Consistent card padding, badge sizes, error messages

### 🐛 Bug Fixes
- ✅ Node names "undefined mb" → actual node names
- ✅ Node save button always disabled → type-safe comparison
- ✅ Duplicate RAM/Disk in admin servers → removed
- ✅ Email template modal not opening → teleport to body
- ✅ Admin settings light mode broken → theme tokens
- ✅ Services page near-black background → blue-tinted

### 📁 Files Changed: 11 (692 insertions, 198 deletions)

---

## [1.2.0] — 2026-06-20 (Morning Session)

### 🚀 New Features
- ✅ **Email Verification System** — Mandatory for all new registrations
- ✅ **Ticket Numbers** — Format ZYPHC-0001, ZYPHC-0002
- ✅ **HTML Export** — Closed tickets saved as styled HTML
- ✅ **Admin Ticket Search** — Search by email or user ID
- ✅ **Suspend Reason** — Required field when suspending
- ✅ **Ownership Transfer** — Expired/suspended → admin account
- ✅ **Deploy Popup** — "Server installing..." → "Server ready!"
- ✅ **Email Notifications** — 6 types (deploy, suspend, restore, delete, warning, transfer)
- ✅ **Prebuilt Roles** — Owner, Co-Founder, CEO, Staff
- ✅ **Full SMTP Config** — Host, Port, User, Pass, From, Encryption
- ✅ **User Management Redesign** — Pterodactyl-style table + card edit
- ✅ **Useful Links** — Default: Zyphron Console + Discord

### 🎨 UI/UX Changes
- ✅ Services page: Bigger cards, highlight selected
- ✅ Admin settings: 5 category tabs
- ✅ Admin servers: Icons, dates, bigger buttons
- ✅ Node names: Fixed "undefined mb"
- ✅ Pterodactyl key: Shows masked key after add

### 🐛 Bug Fixes
- ✅ Password change error (password → password_hash + bcrypt)
- ✅ "property language should not exist" error
- ✅ Login broken after password change (JSDoc fix)
- ✅ Settings emojis → Lucide icons
- ✅ Generic login errors → specific messages
- ✅ Power button confusing → removed
- ✅ Email verification routes conflict
- ✅ emailVerified hardcoded → actual value

### 📁 Files Changed: 32 (1898 insertions, 620 deletions)

---

## [1.1.0] — 2026-06-19 (Thursday)

### 🚀 New Features
- ✅ Categories system (Admin CRUD + User browse)
- ✅ Product-based server deployment
- ✅ Auto "-free-dash" suffix for server names
- ✅ Coin Shop (credit purchase system)
- ✅ Pterodactyl-style server cards
- ✅ Admin user management improvements
- ✅ Service card banner images
- ✅ Sidebar menu highlighting & animations
- ✅ Admin panel mobile responsive
- ✅ Login with username or email
- ✅ Auto-sync Pterodactyl account on deploy

### 🎨 UI/UX Changes
- ✅ Professional UI overhaul (Lucide icons, animations)
- ✅ Modern sidebar redesign
- ✅ Card hover effects
- ✅ Gradient section dividers

### 🐛 Bug Fixes
- ✅ 40 bugs fixed (4 Critical, 8 High, 14 Medium, 14 Low)
- ✅ Server creation 404
- ✅ 2FA QR code broken
- ✅ Dark mode not applied
- ✅ Ticket creation error
- ✅ Pterodactyl settings lost on refresh

### 📁 Files Changed: 30+ (2000+ insertions)

---

## [1.0.1] — 2026-06-18 (Wednesday)

### 🚀 New Features
- ✅ Profile customization (first name + last name)
- ✅ Auto-renew toggle
- ✅ Server expiry → owner transfer
- ✅ Useful Links admin CRUD
- ✅ Language switching
- ✅ Ticket system improvements
- ✅ Create server page

### 🎨 UI/UX Changes
- ✅ Enhanced Services page
- ✅ Products → Services rename
- ✅ Coin Shop + Services sidebar
- ✅ Credits → Coins branding

### 🐛 Bug Fixes
- ✅ 40 bugs found and fixed
- ✅ Egg loading issue
- ✅ Upload limit
- ✅ Server provisioning
- ✅ AFK lifetime bug
- ✅ Payment email flow

### 📁 Files Changed: 25+ (1500+ insertions)

---

## [1.0.0] — 2026-06-17 (Tuesday)

### 🚀 New Features
- ✅ Server creation with Pterodactyl plans
- ✅ Discord OAuth redirect fix

### 🛡️ Security Fixes
- ✅ CORS wildcard → whitelist
- ✅ Security headers added
- ✅ Rate limiting active
- ✅ JWT secret validation
- ✅ Hardcoded secrets removed
- ✅ Ticket IDOR fixed
- ✅ Email verification functional

### 🐛 Bug Fixes
- ✅ 8 security issues fixed

### 📁 Files Changed: 15+ (800+ insertions)

---

## [0.9.0] — 2026-06-16 (Sunday)

### 🚀 Initial Release
- ✅ Complete platform initialization
- ✅ NestJS backend with TypeScript
- ✅ Vue.js 3 frontend with Vite
- ✅ SQLite database with TypeORM
- ✅ JWT authentication
- ✅ Basic user registration & login
- ✅ Admin panel
- ✅ Basic server management

### 🐛 Bug Fixes
- ✅ 19 bugs fixed from code review
- ✅ Achievement records fix
- ✅ Expired servers cleanup
- ✅ Admin API key leak
- ✅ XSS in email templates
- ✅ Timing-safe auth

### 📁 Files Changed: 10+ (500+ insertions)

---

## [0.8.0] — 2026-06-15 (Saturday)

### 🚀 Project Init
- ✅ Zyphron Free Dashboard created
- ✅ Basic project structure
- ✅ Core dependencies installed

---

## 📊 Version Summary

| Version | Date | Features | Bugs Fixed | Files Changed |
|---------|------|----------|------------|---------------|
| 0.8.0 | Jun 15 | 5 | 0 | 10+ |
| 0.9.0 | Jun 16 | 1 | 19 | 10+ |
| 1.0.0 | Jun 17 | 2 | 8 | 15+ |
| 1.0.1 | Jun 18 | 7 | 40 | 25+ |
| 1.1.0 | Jun 19 | 16 | 40 | 30+ |
| 1.2.0 | Jun 20 AM | 14 | 16 | 32 |
| 1.2.1 | Jun 20 PM | 11 | 8 | 11 |
| **Total** | **6 days** | **56** | **131** | **133+** |

---

**Last Updated:** June 20, 2026
**Current Version:** 1.2.1
**Status:** ✅ Production Ready
