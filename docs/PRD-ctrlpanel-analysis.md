# 📋 CtrlPanel.gg — Complete PRD & Analysis Report

> **Date:** 2026-06-14
> **Purpose:** Full reverse-engineering of CtrlPanel.gg demo for building a better private hosting panel with blue theme

---

## 1. Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend | Laravel 11 (PHP 8.2+) |
| Frontend | Blade Templates + Livewire + jQuery DataTables |
| Database | MySQL/MariaDB 10.2+ |
| Cache/Queue | Redis |
| Auth | Laravel UI (login/register) + Spatie Permission |
| Theme System | `qirolab/laravel-themer` (hot-swappable from `themes/` folder) |
| Payment | Stripe, PayPal, Mollie, MercadoPago (extension-based) |
| API Client | Guzzle HTTP (Pterodactyl API) |
| Activity Log | Spatie Activity Log |
| Settings | Spatie Laravel Settings (DB-stored, NOT .env) |
| Invoices | `laraveldaily/laravel-invoices` |
| DataTables | `yajra/laravel-datatables-oracle` |
| IDs | NanoID (21-char unique) |
| License | MPL-2.0 |
| Version | v1.2.1 (development branch) |

---

## 2. Demo Login

- **URL:** https://demo.ctrlpanel.gg
- **Credentials:** demo / demo
- **reCAPTCHA:** Google test key `6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI` (always passes)
- **Note:** Database resets every hour. No Pterodactyl instance behind demo.

---

## 3. Complete Sidebar Navigation (Verified from Demo)

### User Section
| Page | URL | Description |
|------|-----|-------------|
| Dashboard | `/home` | Server count, credits, MOTD, useful links, partner program, activity logs |
| Servers | `/servers` | Server list with "Create Server" button, shows `0 / 1` limit |
| Store | `/store` | Credit packages, server slots, redeem code |
| Support Ticket | `/ticket` | DataTable: Category, Title, Priority, Status, Last Updated, Actions |

### Administration Section
| Page | URL | Description |
|------|-----|-------------|
| Overview | `/admin/overview` | Stats cards, Pterodactyl sync, node stats, payments, tax |
| Ticket List | `/admin/ticket` | All tickets moderation |
| Ticket Blacklist | `/admin/ticket/blacklist` | Banned ticket subjects/users |
| Role Management | `/admin/roles` | CRUD roles with granular permissions |
| Settings | `/admin/settings` | 15-tab settings panel |
| Application API | `/admin/api` | API key management |

### Management Section
| Page | URL | Description |
|------|-----|-------------|
| Users | `/admin/users` | DataTable: Avatar, Name, Role, Email, Credits, Servers, Referrals, Verified, Last seen, Actions |
| Servers | `/admin/servers` | All servers management |
| Products | `/admin/products` | DataTable: Active, Name, Price, Billing, Memory, CPU, Swap, Disk, DBs, Backups, OOM, Nodes, Eggs, Min Credits, Servers, Limit, Created |
| Store | `/admin/store` | Shop product management |
| Vouchers | `/admin/vouchers` | Credit voucher management |
| Partners | `/admin/partners` | Partner discount management |
| Coupons | `/admin/coupons` | Discount coupon management |

### Other Section
| Page | URL | Description |
|------|-----|-------------|
| Useful Links | `/admin/usefullinks` | Custom dashboard links |

### Logs Section
| Page | URL | Description |
|------|-----|-------------|
| Payments | `/admin/payments` | Payment history with count badge |
| Activity Logs | `/admin/activitylogs` | Spatie activity log viewer |

---

## 4. Dashboard Layout (Verified from Demo)

### Top Navigation Bar
- Hamburger menu (sidebar toggle)
- "Home" link
- "phpMyAdmin" link
- Credits display: "💰 250.00"
- User dropdown: "demo ▼"

### Dashboard Content
1. **Server Count Card:** "🖥 Servers 0"
2. **Credits Card:** "💰 Credits 250.00"
3. **MOTD Card:** Custom message (configurable in Settings)
4. **Useful Links Card:** Quick links (Pterodactyl Panel, phpMyAdmin, Discord)
5. **Partner Program Card:** Referral URL, referred users count, commission %
6. **Activity Logs Card:** Recent activity

---

## 5. Settings Page (15 Tabs - Verified from Demo)

| Tab | Settings |
|-----|----------|
| Images/Icons | FavIcon, Icon, Login-page Logo uploads |
| General | Store on/off, sales tax, credits name, currency, reCAPTCHA, phpMyAdmin URL, theme, alert banner |
| Terms | Terms of Service, Privacy Policy, AUP content |
| Website | Site name, description, registration on/off |
| Locale | Available languages, default locale, dynamic locale, DataTables locale |
| Mail | SMTP host, port, encryption, username, password, from address |
| Discord | Bot token, client ID/secret, guild ID, role assignments |
| Ticket | Ticket system on/off, info message |
| User | Registration on/off, IP check, email/Discord verification, initial credits, server limit |
| Referral | Referral on/off, commission %, sign-up reward |
| Invoice | Invoice settings |
| Coupon | Coupons on/off, auto-delete expired, max uses per user |
| Server | Server creation on/off, upgrade on/off, allocation limit |
| Voucher | Voucher settings |
| Pterodactyl | Panel URL, admin token, user token, per_page_limit |

---

## 6. Database Schema (14+ Tables)

| Table | Key Fields |
|-------|-----------|
| `users` | id, name, email, password, credits, server_limit, pterodactyl_id, suspended, referral_code, avatar, ip, last_seen |
| `servers` | id, user_id, product_id, pterodactyl_id, name, identifier, status, suspended, last_billed, billing_priority |
| `products` | id, name, price, billing_priority, cpu, ram, swap, disk, databases, backups, oom_killer, disabled |
| `payments` | id, user_id, amount, currency_code, method, status, tax, invoice_id |
| `invoices` | id, payment_id, invoice_name, invoice_user |
| `tickets` | id, user_id, ticket_id, title, ticketcategory_id, priority, status, server |
| `ticketcomments` | id, ticket_id, user_id, comment, is_admin |
| `ticketcategories` | id, name |
| `ticket_blacklist` | id, type, value |
| `vouchers` | id, code, credits, uses, expires_at, memo |
| `coupons` | id, code, type, value, max_uses, expires_at, min_product_price |
| `useful_links` | id, icon, title, link, description, position |
| `partner_discounts` | id, user_id, partner_discount, registered_user_discount |
| `application_apis` | id, memo, token |
| `locations`, `nodes`, `nests`, `eggs` | Pterodactyl resource sync tables |

---

## 7. Permissions System (Spatie - 30+ Permissions)

### Admin Permissions
- `admin.overview.read/sync`
- `admin.users.read/write/suspend/delete`
- `admin.users.write.email/credits/username/password/role/referral/pterodactyl/serverlimit`
- `admin.servers.read/write/suspend/delete`
- `admin.servers.write.owner/identifier`
- `admin.products.read/create/edit/delete`
- `admin.store.read/write/disable`
- `admin.payments.read`
- `admin.voucher.read/write`
- `admin.coupons.read/write`
- `admin.partners.read/write`
- `admin.roles.read/create/edit/delete`
- `admin.logs.read`
- `admin.api.read/write`
- `admin.useful_links.read/write`
- `admin.ticket_blacklist.read/write`
- `admin.tickets.read/write`
- `admin.icons.edit`

### User Permissions
- `user.server.create/upgrade`
- `user.shop.buy`
- `user.ticket.read/write`

---

## 8. Controllers & Services

### Controllers
| Controller | Purpose |
|-----------|---------|
| `HomeController` | User dashboard |
| `ServerController` | User server CRUD, upgrade, cancel |
| `StoreController` | Store browsing |
| `ProductController` | Product info for server creation |
| `ProfileController` | User profile, self-destruct |
| `PreferencesController` | Language/theme preferences |
| `TicketsController` | User ticket CRUD |
| `NotificationController` | Notification center |
| `SocialiteController` | Discord OAuth |
| `TermsController` | Legal pages |
| `Admin\OverViewController` | Admin dashboard with stats |
| `Admin\UserController` | User management (12 permission constants!) |
| `Admin\ServerController` | Server management |
| `Admin\ProductController` | Product CRUD, clone, disable |
| `Admin\ShopProductController` | Store product CRUD |
| `Admin\PaymentController` | Payment history, checkout |
| `Admin\VoucherController` | Voucher CRUD |
| `Admin\CouponController` | Coupon CRUD (single/bulk) |
| `Admin\PartnerController` | Partner discount CRUD |
| `Admin\RoleController` | Role CRUD with permissions |
| `Admin\SettingsController` | Dynamic settings management |
| `Admin\TicketsController` | Ticket moderation |
| `Admin\TicketCategoryController` | Ticket category CRUD |
| `Admin\ActivityLogController` | Activity log viewer |
| `Admin\UsefulLinkController` | Useful link CRUD |
| `Admin\ApplicationApiController` | API key CRUD |
| `Admin\InvoiceController` | Invoice download (single/all ZIP) |

### Services
| Service | Purpose |
|---------|---------|
| `PterodactylClient` | API client for Pterodactyl (user + admin tokens) |
| `ServerCreationService` | Server provisioning with credit reservation, locks, transactions |
| `CreditService` | Credit reserve/refund with concurrency control |
| `CurrencyHelper` | Currency formatting |

### Jobs
| Job | Purpose |
|-----|---------|
| `PostServerCreationJob` | Post-creation setup |
| `ReconcileServerCreationJob` | Reconcile failed creations |

### Events
| Event | Purpose |
|-------|---------|
| `PaymentEvent` | Successful payment |
| `UserUpdateCreditsEvent` | Credits updated |
| `ServerCreatedEvent/DeletedEvent` | Server lifecycle |
| `CouponUsedEvent` | Coupon redeemed |

---

## 9. Notifications (12 Types)

| Notification | Purpose |
|-------------|---------|
| `WelcomeMessage` | New user welcome |
| `QueuedVerifyEmail` | Email verification |
| `DynamicNotification` | Admin-to-user custom messaging |
| `InvoiceNotification` | Invoice delivery |
| `ReferralNotification` | Referral bonus |
| `ServerCreationError` | Server creation failed |
| `ServerSuspensionWarningNotification` | Low credits warning |
| `ServersSuspendedNotification` | Servers suspended |
| `ServersUnsuspendedNotification` | Servers unsuspended |
| `Ticket\Admin\AdminCreateNotification` | Admin notified of new ticket |
| `Ticket\Admin\AdminReplyNotification` | Admin notified of user reply |
| `Ticket\User\CreateNotification` | User ticket confirmation |
| `Ticket\User\ReplyNotification` | User notified of admin reply |
| `ConfirmPaymentNotification` | Payment confirmation |

---

## 10. Theme System

- **Location:** `themes/` folder in project root
- **Default:** `themes/default/` — Dark sidebar, Bootstrap-based
- **BlueInfinity:** `themes/BlueInfinity/` — Blue variant (just layout overrides)
- **Override:** Any view in theme folder overrides default
- **Switching:** Via `GeneralSettings.theme` field
- **Layout files:** `app.blade.php` (wrapper), `main.blade.php` (main layout)

### View Structure
```
themes/default/views/
├── layouts/          → app, main, errors
├── auth/             → login, register, verify, passwords
├── admin/            → 15 sections (overview, users, servers, products, etc.)
│   ├── activitylogs/
│   ├── api/
│   ├── coupons/
│   ├── overview/
│   ├── partners/
│   ├── payments/
│   ├── products/
│   ├── roles/
│   ├── servers/
│   ├── settings/
│   ├── store/
│   ├── ticket/
│   ├── usefullinks/
│   ├── users/
│   └── vouchers/
├── servers/          → create, index, settings
├── store/            → index, checkout
├── ticket/           → index, create, show
├── profile/          → index
├── preferences/      → index
├── components/input/ → checkbox, number, select, text, textarea
├── mail/             → Email templates
├── modals/           → Reusable modals
├── notifications/    → Notification views
└── home.blade.php    → Dashboard
```

---

## 11. Key Composer Packages

```json
{
  "laravel/framework": "^11.32",
  "laravel/ui": "^4.5.2",
  "spatie/laravel-permission": "^6.10",
  "spatie/laravel-settings": "^3.4",
  "spatie/laravel-activitylog": "^4.9",
  "spatie/laravel-query-builder": "^6.2",
  "yajra/laravel-datatables-oracle": "^11.1",
  "laraveldaily/laravel-invoices": "^4.0.0",
  "qirolab/laravel-themer": "^2.3.3",
  "hidehalo/nanoid-php": "^1.1.12",
  "stripe/stripe-php": "^7.128",
  "paypal/paypal-checkout-sdk": "^1.0.2",
  "socialiteproviders/discord": "^4.1.2",
  "predis/predis": "*",
  "guzzlehttp/guzzle": "^7.5",
  "doctrine/dbal": "^4.0.4",
  "biscolab/laravel-recaptcha": "^6.1",
  "coderflex/laravel-turnstile": "^2.1",
  "josiasmontag/laravel-recaptchav3": "^1.0",
  "league/flysystem-aws-s3-v3": "^3.28.0",
  "symfony/http-client": "^7.1.8",
  "symfony/intl": "^7.1.8",
  "symfony/mailgun-mailer": "^7.1.6"
}
```

---

## 12. .env Configuration

```
APP_NAME=CtrlPanel.gg
APP_ENV=production
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=dashboard
REDIS_HOST=127.0.0.1
CACHE_DRIVER=file
QUEUE_CONNECTION=database
SESSION_DRIVER=file
```

---

## 13. CtrlPanel Limitations (Humara Advantage)

| CtrlPanel Lacks | Humara Panel |
|----------------|-------------|
| Public registration | ❌ Admin-only user creation (invite tokens) |
| No 2FA | ✅ Mandatory 2FA for admin |
| No server monitoring | ✅ CPU/RAM/disk alerts |
| No web hosting features | ✅ cPanel-like hosting management |
| No automated backups | ✅ Scheduled backups |
| No webhooks | ✅ Event-driven webhooks |
| Basic dashboard | ✅ Modern Livewire/Filament dashboard |
| No API rate limiting | ✅ Proper throttling |
| No session management | ✅ Force logout, session tracking |
| No resource alerts | ✅ Usage threshold notifications |
| No file manager | ✅ Web-based file manager |
| No email management | ✅ Email account management |
| No DNS management | ✅ DNS zone editor |
| No SSL management | ✅ Auto SSL (Let's Encrypt) |
| No cron management | ✅ Cron job editor |

---

## 14. Server Creation Flow (Verified)

1. User clicks "Create Server"
2. Select Location → Nest → Egg → Product
3. Enter server name
4. System validates:
   - Server creation enabled?
   - User has permission?
   - User has enough credits?
   - User has available server slots?
5. Credits reserved (with DB lock for concurrency)
6. Server record created in DB (status: provisioning)
7. API call to Pterodactyl to create server
8. PostServerCreationJob runs
9. If failed → ReconcileServerCreationJob

---

## 15. Billing System

- **Billing Priorities:** hourly, daily, weekly, monthly, quarterly, half-annually, annually
- **Credit System:** Credits = currency, deducted per billing cycle
- **Auto-suspend:** When credits insufficient, server suspended
- **Warnings:** Suspension warning notification before suspend
- **Invoice Generation:** PDF invoices via laraveldaily/laravel-invoices

---

## 16. Payment Gateways (Extension-Based)

- Located in `app/Extensions/PaymentGateways/`
- Each gateway has its own Settings class
- Enabled/disabled via Extension Settings
- Checkout flow: Select product → Choose gateway → Process → Credit account

---

**Report Complete.** Ready to build the blue-theme hosting panel based on this analysis.
