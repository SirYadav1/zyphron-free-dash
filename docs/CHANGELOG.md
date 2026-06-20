# 📋 Zyphron Free Dashboard — Changelog

> **Live Server:** http://108.181.193.242:8080
> **GitHub:** https://github.com/SirYadav1/zyphron-free-dash
> **Admin Panel:** /admin (admin@zyphron.cloud / Admin123!)
> **Pterodactyl Panel:** https://console.zyphron.cloud

---

## [1.2.0] — 2026-06-20 (Late Night Update)

### 🚀 New Features

#### 📧 Email Verification System
- **Mandatory email verification** for all new registrations
- Verification email with spam-friendly HTML template (dark theme, Zyphron branding)
- Resend verification link with 60s cooldown timer
- `EmailVerifiedGuard` — unverified users blocked from protected routes
- Login flow blocks unverified users with redirect to verification page
- `VerifyEmailView` — success/error states with SVG icons
- `VerifyPendingView` — email pre-fill, spam folder tips, resend button

#### 🎫 Ticket System Improvements
- **Ticket Numbers**: Format `ZYPHC-0001`, `ZYPHC-0002` (sequential, zero-padded)
- **HTML Export**: Closed tickets saved as styled HTML snapshot in `closed_html` column
- **Admin Ticket Search**: `GET /api/admin/tickets/search?email=xxx&user_id=xxx`
- Search by user email or user_id to find all tickets

#### 🖥️ Server Management
- **Suspend Reason**: Required field when suspending a server (`suspend_reason` column)
- **Ownership Transfer**: Expired/suspended servers transfer to admin account
  - Configurable via `server_owner_transfer_email` setting (default: admin@zyphron.cloud)
  - Original owner receives email notification
- **Deploy Popup**: "Your server is being installed..." modal with loading animation
  - Shows "Server ready! You will receive an email." on completion

#### 📧 Email Notifications (6 Types)
- ✅ **Deploy Complete**: "Your server X is ready! Manage from dashboard."
- ✅ **Auto-Suspend Warning**: "Your server X is expiring in 24 hours. Renew now."
- ✅ **Server Suspended**: "Your server X has been suspended." (with reason)
- ✅ **Server Restored**: "Your server X has been restored."
- ✅ **Server Deleted**: "Your server X has been deleted."
- ✅ **Ownership Transferred**: "Your server X ownership has been transferred."

#### 🔐 Role Permissions
- **Ticket Permissions**: `ticket_accept`, `ticket_reject`, `ticket_chat`
- **Coin Permission**: `coin_approve`
- Added to role entity, controller, and default permission seeds

#### 🔗 Useful Links
- **Default Links**: Zyphron Console + Discord Server (auto-seeded if none exist)
- **Admin CRUD**: Add/Edit/Delete with title, URL, description, position

### 🎨 UI/UX Changes

#### Services Page
- **Bigger Cards**: p-7 padding, text-xl titles, text-lg specs, text-2xl prices
- **Selected Highlight**: Accent border + ring glow + check icon on selected service
- **Deploy Popup**: Professional loading modal with animation

#### Admin Servers
- **Icons**: MemoryStick (RAM), Cpu, HardDrive, Calendar, Clock
- **Values**: Proper format (e.g. "1.5 GB RAM", "10240 MB Disk")
- **Dates**: "Created on" and "Expires on" with date icons
- **Bigger Buttons**: Delete/Suspend/Unban with text + icons
- **Suspend Reason**: Input field when suspending

#### Admin Settings
- **5 Category Tabs**: General, Pterodactyl, Email/SMTP, Server Defaults, Security
- **Node Names Fixed**: Shows actual node names (not "undefined mb")
- **Pterodactyl Key**: Shows masked key after add (e.g. `ptla_****Ki`)
- **Update Key Button**: Change API key without re-entering panel URL

### 🐛 Bug Fixes
- **Email Verification Routes**: Removed conflicting routes from old AuthController
- **emailVerified Response**: Now uses actual `user.email_verified` (was hardcoded `true`)
- **Login Flow**: Unverified users redirected to verification page (not dashboard)
- **Registration Flow**: Redirects to `/verify?email=...` after signup

### 📁 Files Changed (32 files, 1898 insertions, 620 deletions)

**Backend (14 files):**
- `src/auth/auth.controller.ts` — Removed old verify/resend routes
- `src/auth/auth.module.ts` — Added EmailVerificationModule import
- `src/auth/auth.service.ts` — Email verification in login/register, inject EmailVerificationService
- `src/common/guards/email-verified.guard.ts` — NEW: Guard for unverified users
- `src/email-verification/email-verification.controller.ts` — Updated with resend endpoint
- `src/entities/role.entity.ts` — Added ticket/coin permission columns
- `src/entities/server.entity.ts` — Added suspend_reason column
- `src/entities/ticket.entity.ts` — Added ticket_number, closed_html columns
- `src/roles/roles.controller.ts` — Added new permission fields
- `src/roles/roles.service.ts` — Added default permission seeds
- `src/servers/admin-servers.controller.ts` — Suspend reason in body
- `src/servers/server-lifecycle.service.ts` — Ownership transfer + email notifications
- `src/servers/servers.service.ts` — Email notifications, suspend reason
- `src/tickets/admin-tickets.controller.ts` — Ticket search endpoint

**Frontend (18 files):**
- `client/layouts/MainLayout.vue` — Useful links in sidebar
- `client/stores/auth.js` — Email verification store methods
- `client/views/DashboardView.vue` — Updated dashboard
- `client/views/LoginView.vue` — Email verification redirect
- `client/views/ProfileView.vue` — Updated profile
- `client/views/RegisterView.vue` — Redirect to verify after signup
- `client/views/ServersView.vue` — Updated server list
- `client/views/ServicesView.vue` — Bigger cards, deploy popup
- `client/views/TicketCreateView.vue` — Updated ticket creation
- `client/views/TicketShowView.vue` — Updated ticket view
- `client/views/TicketsView.vue` — Updated ticket list
- `client/views/VerifyEmailView.vue` — NEW: Email verification page
- `client/views/VerifyPendingView.vue` — NEW: Verification pending page
- `client/views/admin/AdminServersView.vue` — Icons, dates, bigger buttons
- `client/views/admin/AdminSettingsView.vue` — 5 category tabs, fixed nodes
- `client/views/admin/AdminUsefulLinksView.vue` — NEW: Useful links CRUD

---

## [1.1.0] — 2026-06-20

### 🚀 New Features
- **Neutral Egg Option** — Admin can set egg as "Neutral — Let User Choose" when creating/editing services
  - If admin selects specific egg → user sees "Pre-configured by admin" (locked)
  - If admin keeps egg neutral → user sees all available eggs and picks one
- **2FA QR Code Fix** — Fixed broken QR code generation (was using otpauth:// URL as img src, now converts to PNG via qrcode package)
- **Admin Panel Mobile Responsive** — Added hamburger menu, mobile sidebar toggle, overlay for Android/phone users
- **Pterodactyl Settings Persistence** — Panel type and API key status now load correctly on page refresh
- **Discord OAuth Fix** — Updated to correct Discord application credentials (Client ID: 1513776167470108832)

### 🎨 UI/UX Changes
- **Modern Sidebar Redesign** — Gradient section dividers, glowing active indicator bar, icon containers with rounded backgrounds
- **Earning Section Submenu** — Visual nesting with accent border, gradient background, indented items
- **Service Card Banner Images** — Category cards now have large banner images with gradient fade overlay
- **Sidebar Footer** — Gradient card design for coin balance display

### 🐛 Bug Fixes
- **Server Creation 404 Fix** — Frontend now sends eggId + nestId to backend (was missing, caused Pterodactyl 404)
- **2FA Secret Key Display** — Shows manual entry key below QR code for users who can't scan
- **Pterodactyl Config Loading** — loadPterodactylConfig() now loads panelType from API response
- **API Key Persistence** — Empty apiKey no longer overwrites existing key on save

### 📁 Files Changed
- `client/views/ServicesView.vue` — Banner images, neutral egg support, deployServer fix
- `client/views/TwoFactorView.vue` — QR code generation via qrcode package
- `client/layouts/MainLayout.vue` — Sidebar redesign with modern styling
- `client/views/admin/AdminLayout.vue` — Mobile responsive sidebar
- `client/views/admin/AdminSettingsView.vue` — Pterodactyl config persistence
- `client/views/admin/AdminProductCreateView.vue` — Neutral egg option
- `client/views/admin/AdminProductEditView.vue` — Neutral egg option
- `client/style.css` — Submenu CSS rules, scrollbar-thin styles
- `src/pterodactyl/pterodactyl.service.ts` — apiKeyConfigured flag, optional apiKey
- `src/admin/admin.service.ts` — getPterodactylConfig returns panelType
- `src/admin/admin.controller.ts` — apiKey optional in DTO
- `.env` — Updated Discord + Pterodactyl credentials

---

## [1.0.0] — 2026-06-19 (Latest Push)

### 🚀 New Features
- **Services Page** (`/services`) — New 4-step server deployment flow:
  - Step 1: Select service category (Minecraft / Bot Hosting)
  - Step 2: Select plan (RAM/CPU/Disk specs + coin price)
  - Step 3: Select egg from Pterodactyl (live fetch)
  - Step 4: Enter server name → Deploy
- **Store Rename** — "Buy Credits" sidebar renamed to "Store" with credit packages
- **Public Egg Endpoint** — `/products/nests/:nestId/eggs` for non-admin egg fetching

### 🎨 UI/UX Changes
- Sidebar: "Buy Credits" → "Store" (points to credit packages)
- Dashboard: "Create Server" button → "Deploy Server" (redirects to /services)
- Servers page: "Deploy New Server" button when no servers exist
- Admin Store: Price shows "₹10" format, Quantity shows "1000 coins" format
- Admin Store Create/Edit: "Price (₹)" and "Coins Quantity" labels

### 🐛 Bug Fixes
- Fixed egg selection not showing after selecting Minecraft category
- Added public endpoint for fetching eggs (was admin-only)

### ❌ Removed
- Tax system removed from invoices (user + admin views)
- Tax Amount field removed from admin invoice creation
- "Buy Credits" sidebar entry removed (merged into Store)

### 📦 Files Changed
- `client/views/ServicesView.vue` (NEW)
- `client/layouts/MainLayout.vue`
- `client/router/index.js`
- `client/views/CoinShopView.vue`
- `client/views/DashboardView.vue`
- `client/views/ServersView.vue`
- `client/views/InvoicesView.vue`
- `client/views/admin/AdminInvoicesView.vue`
- `client/views/admin/AdminStoreCreateView.vue`
- `client/views/admin/AdminStoreEditView.vue`
- `client/views/admin/AdminStoreView.vue`
- `src/products/products-user.controller.ts`

---

## [0.9.0] — 2026-06-19 (GitHub Push)

### 🚀 New Features
- **Coin Shop → Store** — Credit packages with "1000 coins = ₹10" display
- **Registration Fields** — first_name, last_name, confirm password, eye toggle
- **Pterodactyl Auto-Registration** — On user signup, auto-creates Pterodactyl account
- **Dark Mode Fix** — Immediate applyTheme() on page load (not waiting for onMounted)
- **Admin Panel Button** — Quick-action button + "Open Panel" sidebar link
- **User Role Management** — Toggle buttons in admin user detail
- **API Key Custom Token** — Optional custom token in create form
- **Ticket Fix** — Removed category field from payload (caused validation error)
- **Coin Shop View** — New Vue component for credit packages
- **Credits Module** — Backend controller, service, module
- **Products User Controller** — Public endpoint for products

### 🎨 UI/UX Changes
- Panel URL updated: panel.zyphron.cloud → console.zyphron.cloud
- Admin users: Added Type/RAM/CPU/Disk columns for server specs
- Registration: Added first_name, last_name fields with eye toggle
- Preferences: Dark mode applies immediately

### 🐛 Bug Fixes
- Fixed login page showing old logo and "Welcome Back" text
- Fixed registration fields not being sent to backend
- Fixed dark mode not applying on page load
- Fixed admin panel button not appearing
- Fixed ticket creation validation error

### 📦 Files Changed
- 52 files, 2472 insertions, 517 deletions

---

## [0.8.0] — 2026-06-18 (Features + Fixes)

### 🚀 New Features
- **Invoice System** — Tax configuration, invoice management
- **Two-Factor Authentication** — 2FA setup and login flow
- **Email Templates** — Admin CRUD for email templates
- **Server Renewal** — Renew servers with coins
- **Server Suspension** — Auto-suspend on expiry
- **Auto-Renew Toggle** — ON/OFF toggle per server
- **Useful Links** — Admin CRUD for useful links
- **Profile Customization** — First name, last name editing
- **Language Switching** — Save preference with "coming soon" message
- **Ticket Priority** — Low/Medium/High/Critical radio buttons

### 🐛 Bug Fixes
- Discord OAuth redirect URL fixed
- Email templates route fixed (wrong URL)
- 2FA login flow verified
- Admin self-ban prevention
- Dashboard panel URL updated

### 📦 Files Changed
- 28 files, multiple commits

---

## [0.7.0] — 2026-06-17 (Bug Fixes + Security)

### 🛡️ Security Fixes (10)
- CORS wildcard → whitelist
- Security headers (CSP, X-Frame-Options, etc.)
- Ticket IDOR vulnerability fixed
- Rate limiting active
- JWT secret validation
- Email verification now actually calls API
- Hardcoded secrets removed from code
- Timing-safe authentication
- XSS prevention
- Password exposure fixed

### 🐛 Critical Bugs Fixed (8)
- Achievement timestamps
- Expired server cleanup
- Discord Pterodactyl sync
- Reactivity route params
- Theme application
- DTO mismatches
- Admin self-ban prevention
- Dashboard panel URL

### 📦 Files Changed
- Multiple commits across backend and frontend

---

## [0.6.0] — 2026-06-17 (Server Plan System)

### 🚀 New Features
- **Server Plans from Products** — Products table now serves as server plans
- **Plan Selection UI** — Select plan → Enter name → Deploy
- **Pterodactyl Integration** — Create servers with Paper egg (Minecraft)
- **Coin Cost from Plan** — Each plan has coin_price
- **Auto-append "-free-dash"** — Server names automatically suffixed
- **Server Expiry** — Configurable validity days
- **Server Limits** — Max per user + max total

### 📦 Files Changed
- `src/servers/servers.service.ts` — Major rewrite for plan-based creation
- `src/servers/dto/create-server.dto.ts` — Added planId field
- `src/servers/servers.controller.ts` — Added plans endpoint
- `client/views/CreateServerView.vue` — Plan selection UI
- `client/stores/servers.js` — Added fetchPlans action

---

## [0.5.0] — 2026-06-17 (Initial Implementation)

### 🚀 Features Implemented
- User registration/login with JWT
- Pterodactyl auto-registration
- Server CRUD (create, list, delete)
- Coin system (earn via AFK, spend on servers)
- Admin dashboard with full management
- Ticket system with replies
- Transaction logging
- Invoice management
- Voucher system
- Partner system
- Coupon system
- Role-based access control
- Activity logging
- API key management
- Server renewal system
- Server suspension on expiry
- Owner transfer on expiry

### 🏗️ Architecture
- **Backend:** NestJS + TypeORM + SQLite
- **Frontend:** Vue 3 + Pinia + Vite
- **Panel:** Pterodactyl (console.zyphron.cloud)
- **Auth:** JWT + Discord OAuth
- **Database:** SQLite (zyphron.db)

---

## 📊 Development Timeline

| Date | Time (IST) | Session | Key Changes |
|------|-----------|---------|-------------|
| Jun 17, 2026 | 10:23 AM | Session 1 | Server plan system, Products → Plans |
| Jun 17, 2026 | 2:00 PM | Session 2 | Bug fixes, security hardening |
| Jun 17, 2026 | 6:00 PM | Session 3 | Features: 2FA, email templates, renewal |
| Jun 18, 2026 | 1:11 AM | Session 4 | Auto-renew, useful links, profile |
| Jun 18, 2026 | 8:36 AM | Session 5 | Testing, deployment verification |
| Jun 19, 2026 | 12:46 AM | Session 6 | Major update push (52 files) |
| Jun 19, 2026 | 5:54 AM | Session 7 | Login fix, GitHub push |
| Jun 19, 2026 | 9:46 AM | Session 8 | Store rename, services page, tax removal |

---

## 🔧 Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend | NestJS 11 + TypeORM |
| Frontend | Vue 3 + Pinia + Vite |
| Database | SQLite (zyphron.db) |
| Panel | Pterodactyl (console.zyphron.cloud) |
| Auth | JWT + Discord OAuth |
| Server | Node.js + Nginx (port 8080) |
| VPS | 108.181.193.242 (Dallas TX) |

---

## 📝 Notes

- All servers get "-free-dash" suffix automatically
- Credit packages configurable via admin panel (/admin/store)
- Products (server plans) configurable via admin panel (/admin/products)
- Eggs fetched live from Pterodactyl panel
- Server validity configurable per product (default: 7 days)
- Auto-renew deducts coins and extends expiry
- Server expiry transfers ownership to admin

---

*This changelog is maintained by Hermes Agent. Last updated: 2026-06-19*
