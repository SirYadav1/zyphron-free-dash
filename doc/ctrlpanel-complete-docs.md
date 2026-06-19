# 🔧 CtrlPanel.gg — Complete Technical Documentation

> **Purpose:** Complete reference for recreating CtrlPanel as a better private hosting panel
> **Date:** 2026-06-14
> **Version:** CtrlPanel 1.2.x (Latest)

---

## Table of Contents

1. [Installation Guide](#1-installation-guide)
2. [Basic Configuration](#2-basic-configuration)
3. [Database Schema](#3-database-schema)
4. [Theme System](#4-theme-system)
5. [Extension System](#5-extension-system)
6. [API Reference](#6-api-reference)
7. [Server Creation Flow](#7-server-creation-flow)
8. [Billing System](#8-billing-system)
9. [Payment Gateways](#9-payment-gateways)
10. [Migration & Backup](#10-migration--backup)
11. [Updating](#11-updating)
12. [Uninstall](#12-uninstall)
13. [Complete Code Reference](#13-complete-code-reference)

---

## 1. Installation Guide

### Dependencies
- **PHP:** 8.2, 8.3 (recommended), or 8.4
- **PHP Extensions:** cli, gd, mysql, mbstring, bcmath, xml/dom, curl, zip, openssl, PDO, tokenizer, redis, intl, fpm (for NGINX)
- **Database:** MySQL 5.7.22+ (MySQL 8 recommended) OR MariaDB 10.2+
- **Cache:** Redis (redis-server)
- **Web Server:** NGINX or Apache
- **Other:** curl, git, composer

### Supported OS
| OS | Version | Status |
|----|---------|--------|
| Debian | 11 | ❌ EOL |
| Debian | 12 | ✅ Supported |
| Debian | 13 | ✅ Supported |
| Ubuntu | 20.04 | ❌ EOL |
| Ubuntu | 22.04 | ✅ Supported |
| Ubuntu | 24.04 | ✅ Supported |

### Installation Steps (Debian 12)

```bash
# 1. Install basic dependencies
apt -y install software-properties-common curl apt-transport-https ca-certificates gnupg lsb-release

# 2. Add PHP repository
wget -O /etc/apt/trusted.gpg.d/php.gpg https://packages.sury.org/php/apt.gpg
echo "deb https://packages.sury.org/php/ $(lsb_release -sc) main" | tee /etc/apt/sources.list.d/php.list

# 3. Add Redis repository
curl -fsSL https://packages.redis.io/gpg | sudo gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/redis.list

# 4. Add MariaDB repository
curl -LsS https://r.mariadb.com/downloads/mariadb_repo_setup | bash

# 5. Update and install
apt update -y
apt install -y php8.3 php8.3-{common,cli,gd,mysql,mbstring,bcmath,xml,fpm,curl,zip,intl,redis} mariadb-server nginx git redis-server

# 6. Enable Redis on boot
systemctl enable --now redis-server

# 7. Install Composer
curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# 8. Create panel directory
mkdir -p /var/www/ctrlpanel && cd /var/www/ctrlpanel

# 9. Clone repository
git clone https://github.com/Ctrlpanel-gg/panel.git ./

# 10. Create database
mysql -u root -p
CREATE USER 'ctrlpaneluser'@'127.0.0.1' IDENTIFIED BY 'USE_YOUR_OWN_PASSWORD';
CREATE DATABASE ctrlpanel;
GRANT ALL PRIVILEGES ON ctrlpanel.* TO 'ctrlpaneluser'@'127.0.0.1';
FLUSH PRIVILEGES;
EXIT;

# 11. Install composer packages
COMPOSER_ALLOW_SUPERUSER=1 composer install --no-dev --optimize-autoloader

# 12. Create storage symlink
php artisan storage:link

# 13. Configure NGINX (see below)

# 14. Navigate to installer in browser
```

### NGINX Configuration

```nginx
server {
    listen 80;
    server_name <your-domain>;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name <your-domain>;

    root /var/www/ctrlpanel/public;
    index index.php;

    ssl_certificate /etc/letsencrypt/live/<your-domain>/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/<your-domain>/privkey.pem;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}

# Queue worker (systemd service)
# /etc/systemd/system/ctrlpanel.service
[Unit]
Description=CtrlPanel Queue Worker
After=network.target

[Service]
User=www-data
Group=www-data
Restart=always
ExecStart=/usr/bin/php /var/www/ctrlpanel/artisan queue:work --sleep=3 --tries=3 --max-time=3600

[Install]
WantedBy=multi-user.target
```

### Systemd Service
```bash
# Create service file
nano /etc/systemd/system/ctrlpanel.service

# Enable and start
systemctl enable --now ctrlpanel
systemctl start ctrlpanel

# Cron job
* * * * * php /var/www/ctrlpanel/artisan schedule:run >> /dev/null 2>&1
```

### SSL Certificate
```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d <your-domain>
```

---

## 2. Basic Configuration

### Images and Icons
- **Favicon:** 64x64 ICO format (browser address bar)
- **Icon:** 1:1 aspect ratio (SEO, embeds, top-right corner)
- **Login-page Logo:** Above login form

### reCAPTCHA Options
CtrlPanel supports 3 CAPTCHA options:
1. **reCAPTCHA v2** — "I'm not a robot" checkbox
2. **reCAPTCHA v3** — Invisible, score-based
3. **Cloudflare Turnstile** — Cloudflare's alternative

⚠️ **Warning:** Be careful with CAPTCHA keys. Wrong config can lock you out.

### SMTP Configuration
- **Mail Host:** Provider-specific
- **Mail Port:** 465 (SSL) or 587 (STARTTLS)
- **Mail Username:** Usually email address
- **Mail Password:** Account password or app-specific key
- **Mail Encryption:** SSL or TLS
- **Mail From Address:** Sender email
- **Mail From Name:** Display name

### Discord Integration
1. Create app at https://discord.com/developers/applications
2. Get bot token, client ID, client secret
3. Add redirect URL: `https://your.ctrlpanel.url/auth/callback`
4. Invite bot: `https://discord.com/api/oauth2/authorize?client_id=<CLIENT_ID>&permissions=8&scope=bot`
5. Bot assigns verified role and client role

### Settings Categories (15 Tabs)
1. **Images/Icons** — Favicon, Icon, Login Logo
2. **General** — Store on/off, sales tax, credits name, currency, reCAPTCHA, phpMyAdmin URL, theme, alert banner
3. **Terms** — Terms of Service, Privacy Policy, AUP
4. **Website** — Site name, description
5. **Locale** — Languages, default locale, dynamic locale
6. **Mail** — SMTP settings
7. **Discord** — Bot token, roles
8. **Ticket** — Ticket system on/off
9. **User** — Registration, verification, initial credits
10. **Referral** — Referral system settings
11. **Invoice** — Invoice generation
12. **Coupon** — Coupon system
13. **Server** — Server creation, allocation limit
14. **Voucher** — Voucher system
15. **Pterodactyl** — Panel URL, API tokens

---

## 3. Database Schema

### Core Tables

```sql
-- Users
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified_at TIMESTAMP NULL,
    password VARCHAR(255) NOT NULL,
    avatar VARCHAR(255) NULL,
    credits DECIMAL(10,2) DEFAULT 0.00,
    server_limit INT DEFAULT 1,
    pterodactyl_id INT UNSIGNED NULL,
    suspended TINYINT DEFAULT 0,
    suspended_at TIMESTAMP NULL,
    ip VARCHAR(45) NULL,
    last_seen TIMESTAMP NULL,
    referral_code VARCHAR(36) NULL,
    mac VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Servers
CREATE TABLE servers (
    id VARCHAR(21) PRIMARY KEY,  -- NanoID
    user_id BIGINT UNSIGNED REFERENCES users(id),
    product_id VARCHAR(21) REFERENCES products(id),
    pterodactyl_id INT UNSIGNED NULL,
    name VARCHAR(255) NOT NULL,
    identifier VARCHAR(21) UNIQUE NOT NULL,
    status ENUM('provisioning','active','failed','pending_reconciliation') DEFAULT 'provisioning',
    suspended TIMESTAMP NULL,
    suspension_warning_sent_at TIMESTAMP NULL,
    last_billed TIMESTAMP NULL,
    canceled TINYINT DEFAULT 0,
    billing_priority ENUM('hourly','daily','weekly','monthly','quarterly','half_annually','annually') DEFAULT 'monthly',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Products (Server Plans)
CREATE TABLE products (
    id VARCHAR(21) PRIMARY KEY,  -- NanoID
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    price INT NOT NULL,  -- in cents
    billing_priority ENUM('hourly','daily','weekly','monthly','quarterly','half_annually','annually') DEFAULT 'monthly',
    minimum_credits INT DEFAULT 0,
    cpu INT DEFAULT 1,
    ram INT DEFAULT 1024,  -- MB
    swap INT DEFAULT 1024,  -- MB
    disk INT DEFAULT 10240,  -- MB
    databases INT DEFAULT 1,
    backups INT DEFAULT 1,
    oom_killer TINYINT DEFAULT 1,
    allocations INT DEFAULT 0,
    server_limit INT DEFAULT 1,
    disabled TINYINT DEFAULT 0,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Shop Products (Store Items)
CREATE TABLE shop_products (
    id VARCHAR(21) PRIMARY KEY,
    type ENUM('credits','server_slots') NOT NULL,
    currency_code VARCHAR(3) DEFAULT 'EUR',
    price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL,
    description VARCHAR(60) NOT NULL,
    display VARCHAR(60) NOT NULL,
    disabled TINYINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Payments
CREATE TABLE payments (
    id VARCHAR(21) PRIMARY KEY,
    user_id BIGINT UNSIGNED REFERENCES users(id),
    shop_product_id VARCHAR(21) REFERENCES shop_products(id),
    amount DECIMAL(10,2) NOT NULL,
    currency_code VARCHAR(3) DEFAULT 'EUR',
    method VARCHAR(50) NOT NULL,
    status ENUM('pending','paid','failed','cancelled','refunded') DEFAULT 'pending',
    tax DECIMAL(10,2) DEFAULT 0.00,
    transaction_id VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Invoices
CREATE TABLE invoices (
    id VARCHAR(21) PRIMARY KEY,
    payment_id VARCHAR(21) REFERENCES payments(id),
    invoice_name VARCHAR(255) NOT NULL,
    invoice_user VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tickets
CREATE TABLE tickets (
    id VARCHAR(21) PRIMARY KEY,
    ticket_id VARCHAR(8) UNIQUE NOT NULL,  -- Random 8-char ID
    user_id BIGINT UNSIGNED REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    ticketcategory_id BIGINT UNSIGNED NULL,
    priority ENUM('Low','Medium','High') DEFAULT 'Medium',
    status ENUM('Open','Closed','Reopened') DEFAULT 'Open',
    server VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Ticket Comments
CREATE TABLE ticketcomments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ticket_id VARCHAR(21) REFERENCES tickets(id),
    user_id BIGINT UNSIGNED REFERENCES users(id),
    comment TEXT NOT NULL,
    is_admin TINYINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ticket Categories
CREATE TABLE ticketcategories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ticket Blacklist
CREATE TABLE ticket_blacklist (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    type ENUM('email','title','message') NOT NULL,
    value VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vouchers
CREATE TABLE vouchers (
    id VARCHAR(21) PRIMARY KEY,
    code VARCHAR(36) UNIQUE NOT NULL,
    credits INT NOT NULL,
    uses INT DEFAULT 1,
    expires_at TIMESTAMP NULL,
    memo TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Voucher Usage
CREATE TABLE user_voucher (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED REFERENCES users(id),
    voucher_id VARCHAR(21) REFERENCES vouchers(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Coupons
CREATE TABLE coupons (
    id VARCHAR(21) PRIMARY KEY,
    code VARCHAR(255) UNIQUE NOT NULL,
    type ENUM('amount','percentage') NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    max_uses INT NULL,
    min_product_price DECIMAL(10,2) DEFAULT 0.00,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Useful Links
CREATE TABLE useful_links (
    id VARCHAR(21) PRIMARY KEY,
    icon VARCHAR(255) NOT NULL,
    title VARCHAR(60) NOT NULL,
    link VARCHAR(191) NOT NULL,
    description TEXT NOT NULL,
    position VARCHAR(255) NOT NULL,  -- comma-separated: dashboard,navbar
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Partner Discounts
CREATE TABLE partner_discounts (
    id VARCHAR(21) PRIMARY KEY,
    user_id BIGINT UNSIGNED REFERENCES users(id),
    partner_discount INT DEFAULT 0,
    registered_user_discount INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Application API Keys
CREATE TABLE application_apis (
    id VARCHAR(21) PRIMARY KEY,
    memo VARCHAR(60) NULL,
    token VARCHAR(64) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- User Referrals
CREATE TABLE user_referrals (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    referral_id BIGINT UNSIGNED REFERENCES users(id),
    user_id BIGINT UNSIGNED REFERENCES users(id),
    deleted_at TIMESTAMP NULL,
    deleted_user_id BIGINT UNSIGNED NULL,
    deleted_username VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity Log (Spatie)
CREATE TABLE activity_log (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    log_name VARCHAR(255) NULL,
    description TEXT NOT NULL,
    subject_type VARCHAR(255) NULL,
    subject_id BIGINT UNSIGNED NULL,
    event VARCHAR(255) NULL,
    causer_type VARCHAR(255) NULL,
    causer_id BIGINT UNSIGNED NULL,
    properties JSON NULL,
    batch_uuid CHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Settings (Spatie)
CREATE TABLE settings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    group VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    value TEXT NULL,
    type VARCHAR(20) DEFAULT 'string',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE notifications (
    id CHAR(36) PRIMARY KEY,
    type VARCHAR(255) NOT NULL,
    notifiable_type VARCHAR(255) NOT NULL,
    notifiable_id BIGINT UNSIGNED NOT NULL,
    data JSON NOT NULL,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- PayPal Products
CREATE TABLE paypal_products (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    shop_product_id VARCHAR(21) REFERENCES shop_products(id),
    paypal_product_id VARCHAR(255) NOT NULL,
    display TINYINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. Theme System

### How It Works
CtrlPanel uses `qirolab/laravel-themer` module for hot-swappable themes.

### Creating a Theme
```bash
php artisan make:theme
```

### Theme Structure
```
themes/
├── default/              # Default theme
│   └── views/
│       ├── layouts/
│       │   ├── app.blade.php      # Main wrapper
│       │   ├── main.blade.php     # Main layout (sidebar, navbar)
│       │   └── errors.blade.php   # Error layout
│       ├── auth/
│       │   ├── login.blade.php
│       │   ├── register.blade.php
│       │   └── verify.blade.php
│       ├── home.blade.php         # User dashboard
│       ├── servers/
│       │   ├── index.blade.php
│       │   ├── create.blade.php
│       │   └── settings.blade.php
│       ├── store/
│       │   ├── index.blade.php
│       │   └── checkout.blade.php
│       ├── ticket/
│       │   ├── index.blade.php
│       │   ├── create.blade.php
│       │   └── show.blade.php
│       ├── profile/
│       │   └── index.blade.php
│       ├── preferences/
│       │   └── index.blade.php
│       ├── admin/
│       │   ├── overview/index.blade.php
│       │   ├── users/{index,show,edit,notifications}.blade.php
│       │   ├── servers/{index,edit}.blade.php
│       │   ├── products/{index,create,edit}.blade.php
│       │   ├── store/{index,create,edit}.blade.php
│       │   ├── vouchers/{index,create,edit,users}.blade.php
│       │   ├── partners/{index,create,edit,users}.blade.php
│       │   ├── coupons/{index,create,edit}.blade.php
│       │   ├── payments/index.blade.php
│       │   ├── roles/{index,edit}.blade.php
│       │   ├── settings/index.blade.php
│       │   ├── api/{index,create,edit}.blade.php
│       │   ├── ticket/{index,show,blacklist}.blade.php
│       │   ├── activitylogs/index.blade.php
│       │   └── usefullinks/{index,create,edit}.blade.php
│       ├── mail/                   # Email templates
│       ├── modals/                 # Reusable modals
│       ├── notifications/          # Notification views
│       ├── components/input/       # Form components
│       │   ├── checkbox.blade.php
│       │   ├── number.blade.php
│       │   ├── select.blade.php
│       │   ├── text.blade.php
│       │   └── textarea.blade.php
│       ├── information/            # Legal pages
│       └── errors/                 # Error pages
└── BlueInfinity/          # Blue theme variant
    └── views/
        └── layouts/
            ├── app.blade.php
            └── main.blade.php
```

### CSS Customization
```html
<!-- In your theme's layout file -->
<link rel="stylesheet" href="{{ asset('themes/<YourThemeName>/app.css') }}">

<!-- Remove the default Vite import -->
@vite('themes/default/sass/app.scss')
```

### Switching Themes
Go to Settings → General → Theme → Select your theme

---

## 5. Extension System

### Extension Types
- **PaymentGateways** — Custom payment processors
- **Themes** — Visual customizations

### Extension Location
```
app/Extensions/
├── PaymentGateways/
│   ├── PayPal/
│   ├── Stripe/
│   ├── Mollie/
│   └── MercadoPago/
└── [Other extension types]
```

### Extension Structure
Each extension has:
- Settings class (extends Spatie Settings)
- Controller for webhook handling
- Configuration file
- Migration files

### Helper Functions
```php
// ExtensionHelper.php
ExtensionHelper::getAllExtensions()
ExtensionHelper::getAllExtensionsByNamespace('PaymentGateways')
ExtensionHelper::getExtensionSettings($extensionName)
ExtensionHelper::getExtensionConfig($extensionName, 'key')
ExtensionHelper::getAllExtensionSettingsClasses()
```

---

## 6. API Reference

### Authentication
- **Type:** HTTP Bearer Auth
- **Header:** `Authorization: Bearer <api_token>`

### API Routes
```
GET    /api/servers          # List user's servers
POST   /api/servers          # Create server
GET    /api/servers/{id}     # Get server details
DELETE /api/servers/{id}     # Delete server
GET    /api/users            # List users (admin)
GET    /api/users/{id}       # Get user details (admin)
```

### Admin API
```
GET    /admin/api            # List API keys
POST   /admin/api            # Create API key
DELETE /admin/api/{id}       # Delete API key
```

---

## 7. Server Creation Flow

### Step-by-Step Flow
1. User clicks "Create Server"
2. System validates:
   - Server creation enabled?
   - User has permission (`user.server.create`)?
   - User has enough credits?
   - User has available server slots?
3. User selects: Location → Nest → Egg → Product → Server Name
4. **Credit Reservation** (with DB lock for concurrency):
   ```php
   // CreditService.php
   public function reserve(User $user, int $amount): void
   {
       $reserved = User::where('id', $user->id)
           ->where('credits', '>=', $amount)
           ->decrement('credits', $amount);
       if ($reserved === 0) {
           throw new Exception('Insufficient credits or concurrent provisioning');
       }
   }
   ```
5. Server record created in DB (status: provisioning)
6. API call to Pterodactyl to create server
7. `PostServerCreationJob` runs
8. If failed → `ReconcileServerCreationJob`

### Server Statuses
- `provisioning` — Being created
- `active` — Running
- `failed` — Creation failed
- `pending_reconciliation` — Needs manual intervention

---

## 8. Billing System

### Billing Priorities (Cycles)
```php
const BILLING_PERIODS = [
    'hourly' => 3600,
    'daily' => 86400,
    'weekly' => 604800,
    'monthly' => 2592000,
    'quarterly' => 7776000,
    'half-annually' => 15552000,
    'annually' => 31104000
];
```

### Credit System
- Credits = currency (e.g., 1 credit = €0.01)
- Prices stored in cents in database
- Display formatted via `CurrencyHelper`

### Auto-Suspension
- When credits insufficient → server suspended
- Warning notification sent before suspension
- `ServerSuspensionWarningNotification`
- `ServersSuspendedNotification`
- `ServersUnsuspendedNotification`

---

## 9. Payment Gateways

### PayPal Configuration
1. Create app at PayPal Developer Portal
2. Get Client ID and Secret Key
3. Add webhook: `https://your.ctrlpanel.url/payment/PayPalWebhook`
4. Events: Checkout order approved, Payment capture completed/pending/denied/declined/refunded/reversed
5. Copy Webhook ID

### Stripe Configuration
1. Setup "company" on Stripe Dashboard
2. Get Secret Key from Developer → API Keys
3. Add webhook: `https://your.ctrlpanel.url/payment/StripeWebhooks`
4. Events: payment_intent.succeeded, payment_intent.processing, payment_intent.payment_failed
5. Copy Endpoint Secret

### Checkout Flow
1. User selects product in Store
2. Choose payment gateway
3. Redirect to gateway
4. Process payment
5. Webhook confirms payment
6. Credits added to user account
7. Invoice generated

---

## 10. Migration & Backup

### Database Backup
```bash
# MySQL
mysqldump -u root -p ctrlpanel > /var/www/ctrlpanel/backup.sql

# MariaDB
mariadb-dump -u root -p ctrlpanel > /var/www/ctrlpanel/backup.sql
```

### Database Restore
```bash
# Drop old database
mysql -u root -p ctrlpanel -e "DROP DATABASE ctrlpanel"

# Create fresh database
mysql -u root -p
CREATE DATABASE ctrlpanel;
GRANT ALL PRIVILEGES ON ctrlpanel.* TO 'ctrlpaneluser'@'127.0.0.1';
FLUSH PRIVILEGES;

# Restore
mysql -u root -p ctrlpanel < /var/www/ctrlpanel/backup.sql
```

### Automatic Backup (Cron)
```bash
# Create backup user
CREATE USER 'ctrlpanelbackupuser'@'127.0.0.1' IDENTIFIED BY 'PASSWORD';
GRANT LOCK TABLES, SELECT ON ctrlpanel.* TO 'ctrlpanelbackupuser'@'127.0.0.1';

# Cron job (daily at midnight)
0 0 * * * mysqldump -u ctrlpanelbackupuser --password=PASSWORD --single-transaction --quick --lock-tables=false ctrlpanel > /var/www/ctrlpanel/backups-$(date +\%F).sql
```

### APP_KEY Backup
> ⚠️ **CRITICAL:** Never lose your APP_KEY. Without it, you lose all encrypted data.

```bash
# View APP_KEY
nano /var/www/ctrlpanel/.env
# Copy APP_KEY value to safe location
```

---

## 11. Updating

### From 1.2.x to 1.2.x
```bash
cd /var/www/ctrlpanel
php artisan down
git stash
git pull
chmod -R 755 /var/www/ctrlpanel
COMPOSER_ALLOW_SUPERUSER=1 composer install --no-dev --optimize-autoloader
php artisan migrate --seed --force
php artisan view:clear
php artisan config:clear
chown -R www-data:www-data /var/www/ctrlpanel/
php artisan queue:restart
php artisan up
```

### From 1.1.x to 1.2.x
```bash
cd /var/www/ctrlpanel
php artisan down
git stash
git pull
chmod -R 755 /var/www/ctrlpanel
COMPOSER_ALLOW_SUPERUSER=1 composer install --no-dev --optimize-autoloader
php artisan migrate --seed --force
php artisan cache:clear
php artisan route:clear
php artisan view:clear
php artisan config:clear
php artisan settings:clear-cache
# Rebuild settings cache via UI (Settings → User → Save)
chown -R www-data:www-data /var/www/ctrlpanel/
php artisan queue:restart
php artisan up
```

---

## 12. Uninstall

```bash
# Stop services
cd /var/www/ctrlpanel
php artisan down
systemctl stop ctrlpanel
systemctl disable ctrlpanel
rm /etc/systemd/system/ctrlpanel.service
systemctl daemon-reload
systemctl reset-failed

# Remove cron
crontab -e  # Remove: * * * * * php /var/www/ctrlpanel/artisan schedule:run

# Remove nginx config
unlink /etc/nginx/sites-enabled/ctrlpanel.conf
rm /etc/nginx/sites-available/ctrlpanel.conf
systemctl reload nginx

# Remove SSL
certbot delete --cert-name <domain>

# Remove database
mysql -u root -p
DROP DATABASE ctrlpanel;
DROP USER 'ctrlpaneluser'@'127.0.0.1';
FLUSH PRIVILEGES;

# Remove files
rm -rf /var/www/ctrlpanel

# Optional: Remove PHP extensions
apt remove php8.3-{intl,redis}

# Remove Pterodactyl API key
# Login to Pterodactyl → Admin → API → Delete key
```

---

## 13. Complete Code Reference

### Key Files & Locations

| File | Purpose |
|------|---------|
| `app/Http/Controllers/Admin/OverViewController.php` | Admin dashboard stats |
| `app/Http/Controllers/Admin/UserController.php` | User management (12 permission constants) |
| `app/Http/Controllers/Admin/ServerController.php` | Server management |
| `app/Http/Controllers/Admin/ProductController.php` | Product CRUD |
| `app/Http/Controllers/Admin/SettingsController.php` | Dynamic settings |
| `app/Http/Controllers/ServerController.php` | User server creation |
| `app/Http/Controllers/TicketsController.php` | User tickets |
| `app/Http/Controllers/StoreController.php` | Store browsing |
| `app/Classes/PterodactylClient.php` | Pterodactyl API client |
| `app/Services/ServerCreationService.php` | Server provisioning |
| `app/Services/CreditService.php` | Credit management |
| `app/Helpers/CurrencyHelper.php` | Currency formatting |
| `app/Helpers/ExtensionHelper.php` | Extension management |
| `app/Settings/*.php` | All settings classes (15) |
| `app/Models/User.php` | User model |
| `app/Models/Server.php` | Server model |
| `app/Models/Product.php` | Product model |
| `routes/web.php` | All web routes |
| `themes/default/` | Default theme |
| `themes/BlueInfinity/` | Blue theme variant |

### Key Composer Packages
```json
{
  "laravel/framework": "^11.32",
  "laravel/ui": "^4.5.2",
  "spatie/laravel-permission": "^6.10",
  "spatie/laravel-settings": "^3.4",
  "spatie/laravel-activitylog": "^4.9",
  "yajra/laravel-datatables-oracle": "^11.1",
  "laraveldaily/laravel-invoices": "^4.0.0",
  "qirolab/laravel-themer": "^2.3.3",
  "hidehalo/nanoid-php": "^1.1.12",
  "stripe/stripe-php": "^7.128",
  "paypal/paypal-checkout-sdk": "^1.0.2",
  "socialiteproviders/discord": "^4.1.2",
  "predis/predis": "*",
  "guzzlehttp/guzzle": "^7.5"
}
```

---

**End of Documentation.** This document provides everything needed to recreate CtrlPanel as a better private hosting panel with blue theme.
