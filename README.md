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
  <img src="https://img.shields.io/badge/License-Proprietary-gray?style=flat-square" alt="License" />
</p>

<p align="center">
  <a href="https://zyphron.cloud" target="_blank">Website</a> •
  <a href="https://console.zyphron.cloud" target="_blank">Panel</a> •
  <a href="https://github.com/SirYadav1/zyphron-free-dash" target="_blank">GitHub</a>
</p>

---

## About

Zyphron Free Dashboard is a modern, self-hosted hosting management platform that allows users to deploy and manage game servers for free using a credits-based economy. Built with NestJS backend and Vue 3 frontend, it integrates seamlessly with Pterodactyl Panel for server management.

### Key Features

- **Coin Economy** — Earn credits through daily login, AFK sessions, and coin shop
- **Server Management** — Deploy, manage, and monitor game servers via Pterodactyl
- **Admin Panel** — Complete control with 15+ management pages
- **Discord OAuth** — Easy authentication with Discord
- **2FA Support** — Two-factor authentication with TOTP
- **Ticket System** — Customer support with priority and chat
- **Email Notifications** — Automated emails for server events
- **Activity Logging** — Track all user actions

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | NestJS, TypeORM, SQLite |
| **Frontend** | Vue 3, Vite, Tailwind CSS |
| **Auth** | JWT, 2FA (TOTP), Discord OAuth |
| **Server Management** | Pterodactyl API |
| **Infrastructure** | Nginx, PM2, Ubuntu VPS |

## Project Structure

```
zyphron-free-dash/
├── src/                    # NestJS Backend
│   ├── auth/               # Authentication (JWT, 2FA, OAuth)
│   ├── servers/            # Server management
│   ├── tickets/            # Support tickets
│   ├── credits/            # Coin economy
│   ├── store/              # Coin shop
│   ├── admin/              # Admin panel
│   ├── pterodactyl/        # Pterodactyl integration
│   ├── mail/               # Email service
│   └── entities/           # Database entities
├── client/                 # Vue 3 Frontend
│   ├── views/              # Page components
│   ├── layouts/            # Layout components
│   ├── stores/             # Pinia stores
│   ├── router/             # Vue Router
│   └── components/         # Shared components
├── docs/                   # Documentation & Reports
└── public/                 # Static assets
```

## Security

This project has undergone comprehensive security auditing:

- **30 security issues** identified and fixed
- **62+ bugs** found and resolved
- **External scan score:** 7/10 (GOOD)
- **Features:** Rate limiting, CORS protection, CSP headers, input validation

See [SECURITY_AUDIT_FULL.md](SECURITY_AUDIT_FULL.md) for details.

## Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Pterodactyl Panel (for server management)

### Setup

```bash
# Clone the repository
git clone https://github.com/SirYadav1/zyphron-free-dash.git
cd zyphron-free-dash

# Install backend dependencies
npm install

# Install frontend dependencies
cd client && npm install && cd ..

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Build frontend
cd client && npm run build && cd ..

# Start backend
npm run start:prod
```

## Documentation

- [Project Documentation (PDF)](docs/Zyphron_Cloud_Project_Documentation.pdf)
- [Master Report](docs/MASTER-REPORT-JUNE-15-21.md)
- [Security Audit](SECURITY_AUDIT_FULL.md)
- [Bug Report](BUG-MASTER-REPORT.md)
- [Changelog](CHANGELOG-MASTER.md)

## Stats

| Metric | Value |
|--------|-------|
| Development Time | 7 days |
| Total Commits | 72+ |
| Features Added | 64 |
| Bugs Fixed | 62+ |
| Security Fixes | 30 |
| Lines of Code | 51,500+ |
| Files Changed | 515+ |

## Author

**Sundram Yadav** — CEO, Zyphron Cloud

- GitHub: [@SirYadav1](https://github.com/SirYadav1)
- Website: [zyphron.cloud](https://zyphron.cloud)

## License

Proprietary — Zyphron Cloud. All rights reserved.
