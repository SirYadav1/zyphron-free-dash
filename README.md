<p align="center">
  <img src="https://litter.catbox.moe/95lej9.png" width="120" alt="Zyphron Cloud Logo" />
</p>

<h1 align="center">Zyphron Free Dashboard</h1>

<p align="center">
  <strong>Free Game Server Hosting Platform with Credits-Based Economy</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Version-1.2.1-blue?style=flat-square" alt="Version" />
  <img src="https://img.shields.io/badge/NestJS-10-red?style=flat-square&logo=nestjs" alt="NestJS" />
  <img src="https://img.shields.io/badge/Vue-3-green?style=flat-square&logo=vuedotjs" alt="Vue 3" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3-blue?style=flat-square&logo=tailwindcss" alt="Tailwind" />
  <img src="https://img.shields.io/badge/SQLite-3-orange?style=flat-square&logo=sqlite" alt="SQLite" />
</p>

<p align="center">
  <a href="https://zyphron.cloud" target="_blank">Website</a> •
  <a href="https://console.zyphron.cloud" target="_blank">Panel</a> •
  <a href="https://github.com/SirYadav1/zyphron-free-dash" target="_blank">GitHub</a>
</p>

---

## What is This?

Zyphron Free Dashboard is a **complete hosting management platform** that lets users deploy and manage game servers for **free** using a credits-based economy. Users earn coins through daily logins, AFK sessions, and a coin shop. These coins are used to deploy servers via Pterodactyl Panel.

**Think of it as:** A free alternative to paid hosting — users earn credits, deploy servers, manage everything from one dashboard.

---

## Complete Documentation

| Document | Description | Link |
|----------|-------------|------|
| **Project Documentation** | Full project guide (dark PDF, 19 sections) | [Download PDF](https://litter.catbox.moe/950cfs.pdf) |
| **API Documentation** | All 130+ endpoints (dark PDF) | [Download PDF](https://litter.catbox.moe/r6qvvu.pdf) |
| **All Reports ZIP** | 16 reports in one ZIP | [Download ZIP](https://litter.catbox.moe/b8jwjd.zip) |
| **Master Report** | 7-day development timeline | [MASTER-REPORT-JUNE-15-21.md](docs/MASTER-REPORT-JUNE-15-21.md) |
| **Security Audit** | 78 findings, 30 fixes | [SECURITY_AUDIT_FULL.md](SECURITY_AUDIT_FULL.md) |
| **Bug Report** | 41 bugs found and fixed | [BUG-MASTER-REPORT.md](docs/BUG-MASTER-REPORT.md) |

---

## How to Build This Panel (Step-by-Step)

### Step 1: Prerequisites

```
- Node.js 18+
- npm or yarn
- Nginx
- PM2 (npm install -g pm2)
- Pterodactyl Panel (running separately)
- Ubuntu VPS (recommended)
```

### Step 2: Clone & Install

```bash
# Clone
git clone https://github.com/SirYadav1/zyphron-free-dash.git
cd zyphron-free-dash

# Install backend
npm install

# Install frontend
cd client && npm install && cd ..
```

### Step 3: Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
# JWT
JWT_SECRET=your-random-secret-key-min-32-chars

# Server
PORT=3000
NODE_ENV=production

# Database
DB_TYPE=sqlite
DB_DATABASE=zyphron.db

# Pterodactyl
PTERODACTYL_PANEL_URL=https://your-panel.com/
PTERODACTYL_API_KEY=ptla_your-api-key

# SMTP
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password
MAIL_FROM=noreply@zyphron.cloud

# Discord OAuth
DISCORD_CLIENT_ID=your-client-id
DISCORD_CLIENT_SECRET=your-client-secret

# Admin
ADMIN_KEY=your-secure-admin-key

# Frontend
FRONTEND_URL=http://your-domain.com
```

### Step 4: Build Frontend

```bash
cd client
npm run build
cd ..

# Copy to nginx root
cp -r client/dist/* /var/www/html/
```

### Step 5: Start Backend

```bash
# Build backend
npm run build

# Start with PM2
pm2 start dist/src/main.js --name zyphron-backend

# Save PM2 config
pm2 save
pm2 startup
```

### Step 6: Configure Nginx

Create `/etc/nginx/sites-available/zyphron`:

```nginx
server {
    client_max_body_size 10M;
    listen 80;
    server_name your-domain.com;

    root /var/www/html;
    index index.html;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;" always;

    autoindex off;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/zyphron /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### Step 7: Setup Admin

1. Open `http://your-domain.com/setup-admin`
2. Enter your `ADMIN_KEY` from `.env`
3. Create admin account (username, email, password)
4. Login at `http://your-domain.com/login`

### Step 8: Configure Pterodactyl

1. Login as admin
2. Go to **Admin > Settings > Pterodactyl**
3. Enter your panel URL and API key
4. Click **Test Connection**
5. Select default node and allocation

---

## Architecture

```
User (Browser)
    |
    v
Nginx (Port 80) ----> Vue 3 SPA (Static Files)
    |
    v
Nginx /api/* ----> NestJS Backend (Port 3000)
    |
    v
TypeORM ----> SQLite (zyphron.db)
    |
    v
Pterodactyl API ----> Game Servers
```

### Request Flow

1. User opens browser → Nginx serves Vue 3 SPA
2. SPA loads → Vue Router handles client-side routing
3. API call → Axios sends request with JWT Bearer token
4. Nginx proxies `/api/*` to NestJS backend
5. JwtAuthGuard verifies token → AdminGuard checks role
6. Controller → Service → TypeORM → SQLite
7. Response returned → Pinia store updates → UI re-renders

---

## Tech Stack

### Backend (NestJS)

| Technology | Purpose |
|-----------|---------|
| NestJS 10 | Enterprise Node.js framework |
| TypeORM | TypeScript ORM |
| SQLite | Database (zero-config) |
| JWT | Authentication (7-day expiry) |
| bcrypt | Password hashing (10 rounds) |
| class-validator | Input validation |
| @nestjs/throttler | Rate limiting (100/60s) |
| nodemailer | SMTP email |
| otpauth | 2FA (TOTP) |

### Frontend (Vue 3)

| Technology | Purpose |
|-----------|---------|
| Vue 3 | JavaScript framework |
| Vite | Build tool |
| Tailwind CSS 3 | Styling |
| Pinia | State management |
| Vue Router 4 | Client-side routing |
| Axios | HTTP client |
| Lucide Icons | Icon library |

### Infrastructure

| Technology | Purpose |
|-----------|---------|
| Nginx | Reverse proxy (port 80) |
| PM2 | Process manager |
| Ubuntu VPS | Production server |
| Pterodactyl | Game server management |
| GitHub | Version control |

---

## Database Schema (20+ Entities)

### Core Entities

| Entity | Key Columns |
|--------|-------------|
| **User** | id, username, email, password_hash, coins, is_admin, is_banned, email_verified, two_factor_enabled, pterodactyl_user_id, discord_id |
| **Server** | id, user_id, name, pterodactyl_server_id, status, is_free, ram, cpu, disk, expiry_date, auto_renew |
| **Ticket** | id, user_id, ticket_number, subject, status, priority, assigned_to |
| **Product** | id, name, price, coins, ram, cpu, disk, egg_id, nest_id, category_id |
| **ServiceCategory** | id, name, description, image_url, display_order |
| **Invoice** | id, user_id, invoice_number, amount, status |
| **Transaction** | id, user_id, type, amount, description |
| **CoinOrder** | id, user_id, coins_amount, price, status, screenshot_url |
| **Voucher** | id, code, credits, uses_left, max_uses |
| **EmailTemplate** | id, name, subject, body, type, is_active |
| **Setting** | id, key, value |
| **ActivityLog** | id, log_name, description, event, causer_id |
| **DailyLogin** | id, user_id, login_date, coins_earned |
| **AfkSession** | id, user_id, started_at, coins_earned |
| **Achievement** | id, user_id, badge_name, unlocked_at |
| **Role** | id, name, permissions |
| **ApiKey** | id, user_id, name, token, permissions |
| **UsefulLink** | id, title, url, icon, display_order |

---

## Backend Modules (20+)

| Module | Description |
|--------|-------------|
| auth/ | JWT, 2FA, Discord OAuth, email verification |
| servers/ | CRUD, deploy, suspend, restore, delete, renewal |
| tickets/ | Create, chat, assign, close, blacklist |
| credits/ | Coin balance, transactions, daily login |
| store/ | Coin packages, payment flow, renewal |
| products/ | Service categories, plans, Pterodactyl mapping |
| admin/ | User management, settings, Pterodactyl config |
| pterodactyl/ | API integration, user sync |
| mail/ | SMTP email, templates, notifications |
| roles/ | RBAC with permissions |
| invoices/ | Auto-generated billing |
| activity-logs/ | User action tracking |
| email-templates/ | Template CRUD, test send |
| coin-orders/ | Payment orders, admin approval |
| afk/ | Idle earning system |
| achievements/ | Gamification badges |
| partners/ | Partner discount system |
| vouchers/ | Coupon redemption |
| preferences/ | User settings |
| discord/ | OAuth, guild verification |

---

## API Endpoints (130+)

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | Public | Register new user |
| POST | /api/auth/login | Public | Login (email/username + password) |
| POST | /api/auth/login-2fa | Public | Complete 2FA login |
| GET | /api/auth/me | User | Get profile |
| PUT | /api/auth/me | User | Update profile |
| POST | /api/auth/profile/photo | User | Upload photo |
| POST | /api/auth/setup-admin | Public | Create first admin |
| POST | /api/auth/2fa/generate | User | Generate 2FA secret |
| POST | /api/auth/2fa/enable | User | Enable 2FA |
| POST | /api/auth/2fa/disable | User | Disable 2FA |

### Servers

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/servers | User | List user servers |
| POST | /api/servers | User | Deploy server |
| GET | /api/servers/:id | User | Get server details |
| PUT | /api/servers/:id | User | Update server |
| DELETE | /api/servers/:id | User | Delete server |
| GET | /api/servers/stats | User | Server statistics |
| POST | /api/servers/:id/renew | User | Renew server |
| POST | /api/servers/:id/auto-renew-toggle | User | Toggle auto-renew |

### Tickets

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/tickets | User | List tickets |
| POST | /api/tickets | User | Create ticket |
| GET | /api/tickets/:id | User | Get ticket |
| POST | /api/tickets/:id/reply | User | Reply to ticket |
| POST | /api/tickets/:id/close | User | Close ticket |

### Credits & Store

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/credits/packages | User | Get coin packages |
| POST | /api/credits/buy | User | Buy coins |
| POST | /api/coin-orders | User | Create order |
| POST | /api/coin-orders/:id/screenshot | User | Upload screenshot |
| GET | /api/store/:serverId | User | Get upgrade options |
| POST | /api/store/:serverId/upgrade | User | Upgrade server |

### Admin (30+ Endpoints)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/admin/stats | Admin | Dashboard stats |
| GET | /api/admin/users | Admin | List users |
| PUT | /api/admin/users/:id | Admin | Update user |
| POST | /api/admin/users/:id/ban | Admin | Ban user |
| GET | /api/admin/servers | Admin | List all servers |
| POST | /api/admin/servers/:id/suspend | Admin | Suspend server |
| GET | /api/admin/settings | Admin | Get settings |
| PUT | /api/admin/settings/:key | Admin | Update setting |
| PUT | /api/admin/settings/smtp | Admin | Update SMTP |
| POST | /api/admin/email/test | Admin | Test email |
| PUT | /api/admin/pterodactyl/config | Admin | Update panel config |
| GET | /api/admin/pterodactyl/nodes | Admin | Get nodes |
| GET | /api/admin/email-templates | Admin | List templates |
| POST | /api/admin/email-templates/:id/test | Admin | Test template |

*Full API documentation: [API PDF](https://litter.catbox.moe/r6qvvu.pdf)*

---

## Features (64 Total)

### User Features

- Dashboard with stats, earning section, useful links, MOTD
- Server deploy with plan selection and coin payment
- Server settings (console, restart, stop, kill)
- Server upgrade (RAM/CPU/Disk with coin cost)
- Server renewal (extend validity)
- Service browsing by category
- Ticket system (create, chat, priority, status)
- Coin shop (QR payment, screenshot upload, admin approval)
- Profile customization (name, photo)
- 2FA setup with QR code
- Dark/light mode toggle
- Language switching
- AFK earning (earn coins while idle)
- Daily login bonus
- Achievement badges
- Discord account linking
- Email verification

### Admin Features

- Admin dashboard with stats and quick actions
- User management (CRUD, roles, ban/unban)
- Server management (all servers, suspend, restore)
- 5-category settings (General, Pterodactyl, Email, Server, Security)
- SMTP configuration with test email
- Coin store management (packages, visibility)
- Service categories CRUD
- Email templates (8 prebuilt, test send)
- Role management with permissions
- Activity logs tracking
- Invoice management
- API key management
- Message of the Day (MOTD)

### System Features

- JWT authentication with 7-day expiry
- 2FA (TOTP) support
- Discord OAuth integration
- Rate limiting (100/60s global)
- Account lockout (5 attempts → 15min)
- Optimistic locking for coin operations
- IDOR protection on all endpoints
- Auto-sync Pterodactyl accounts
- Auto-invoice generation
- Security headers (CSP, X-Frame-Options, etc.)

---

## Coin Economy

### How Users Earn Coins

| Method | Amount | Cooldown |
|--------|--------|----------|
| Daily Login | 25 coins | 24 hours |
| AFK Earning | 1 coin/min | While active |
| Coin Shop | Buy with real money | Instant |
| Voucher Code | Variable | One-time |

### How Users Spend Coins

| Action | Cost |
|--------|------|
| Deploy Server | Based on plan |
| Upgrade Server | Based on specs |
| Renew Server | Based on plan |

---

## Security

- **30 security issues** identified and fixed
- **Rate limiting** on all endpoints
- **Account lockout** after 5 failed attempts
- **Optimistic locking** for coin operations
- **IDOR protection** on user-scoped endpoints
- **CSP headers** preventing XSS
- **CORS whitelist** preventing unauthorized access
- **Input validation** with class-validator
- **Password hashing** with bcrypt (10 rounds)

*Full security report: [SECURITY_AUDIT_FULL.md](SECURITY_AUDIT_FULL.md)*

---

## Deployment

### Production Commands

```bash
# Pull latest
git pull

# Build frontend
cd client && npm run build && cd ..
cp -r client/dist/* /var/www/html/

# Restart backend
pm2 restart zyphron-backend

# Reload nginx
nginx -t && systemctl reload nginx
```

### PM2 Commands

```bash
pm2 list                    # List all processes
pm2 logs zyphron-backend    # View logs
pm2 restart zyphron-backend # Restart backend
pm2 stop zyphron-backend    # Stop backend
pm2 monit                   # Monitor processes
```

---

## Project Statistics

| Metric | Value |
|--------|-------|
| Development Time | 7 days (June 15-21, 2026) |
| Total Commits | 72+ |
| Features Added | 64 |
| Bugs Fixed | 62+ |
| Security Fixes | 30 |
| Lines of Code | 51,500+ |
| Files Changed | 515+ |
| Backend Modules | 20+ |
| Frontend Pages | 30+ |
| API Endpoints | 130+ |
| Database Entities | 20+ |

---

## Author

**Sundram Yadav** — CEO, Zyphron Cloud

- GitHub: [@SirYadav1](https://github.com/SirYadav1)
- Website: [zyphron.cloud](https://zyphron.cloud)
- Email: sundramy807@gmail.com

---

## License

Proprietary — Zyphron Cloud. All rights reserved.
