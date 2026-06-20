# Zyphron Free Dash - Development Roadmap

**Date:** 2026-06-25
**Base:** CtrlPanel.gg Demo Analysis + Current Codebase Audit
**Goal:** Production-ready hosting panel with all CtrlPanel features + bug fixes

---

## 📊 Current Status

| Metric | Count |
|--------|-------|
| Total Files | 216 |
| Backend Modules | 25 |
| Entities | 29 |
| Frontend Views | 57 |
| Known Bugs | 83 (16 fixed, 67 remaining) |
| Critical Bugs | 6 (5 fixed, 1 remaining) |
| High Bugs | 14 (7 fixed, 7 remaining) |

---

## 🎯 Phase 1: Critical Bug Fixes (IMMEDIATE)

### 1.1 Security Fixes
- [ ] Remove hardcoded secrets from SQL files (`configure-ptero-key.sql`, `update-api-key.sql`)
- [ ] Remove debug scripts with exposed keys (`debug-ptero.js`, `check_pass.js`)
- [ ] Rotate all exposed secrets (JWT, Pterodactyl API, Discord tokens)
- [ ] Remove `.env` from git history if committed

### 1.2 Core Functionality Fixes
- [ ] Fix ticket IDOR vulnerability (verify ticket ownership)
- [ ] Fix email verification to actually call API
- [ ] Set `synchronize: false` in production
- [ ] Fix static file path in `main.ts` for production

---

## 🎯 Phase 2: High Priority Bug Fixes

### 2.1 DTO-Entity Mismatches
- [ ] Fix Coupons controller DTO (`discount` → `type` + `value`)
- [ ] Fix Partners controller DTO (fields don't match entity)
- [ ] Fix Useful Links controller DTO (fields don't match entity)
- [ ] Fix API Keys controller DTO (fields don't match entity)
- [ ] Fix Roles controller DTO (`description` → `guard_name`)

### 2.2 Business Logic Fixes
- [ ] Add coin refund rollback on Pterodactyl API failure
- [ ] Remove JWT from URL in Discord OAuth flow
- [ ] Enforce ticket blacklist when creating tickets
- [ ] Send ban/unban email notifications
- [ ] Fix PM2 entry point path
- [ ] Fix admin server delete endpoint

### 2.3 Frontend Fixes
- [ ] Fix Dashboard panel URL (always undefined)
- [ ] Fix AfkView memory leak (beforeunload listener)
- [ ] Fix admin store loading flag race condition
- [ ] Fix store upgrade action TypeError

---

## 🎯 Phase 3: Medium Priority Bug Fixes

### 3.1 Validation
- [ ] Add `@Min(0)` validation on coins in admin update
- [ ] Add `@IsIn` validation on ticket priority field
- [ ] Prevent admin self-banning

### 3.2 Code Quality
- [ ] Remove redundant `dotenv.config()` call
- [ ] Fix test mocks for `Setting` repository
- [ ] Fix CORS origin mismatch
- [ ] Remove dead code and unused exports

### 3.3 Frontend Polish
- [ ] Fix typo `bunning` → `banning`
- [ ] Fix `ZyphronLogo` compact prop
- [ ] Fix `<option selected>` conflict with `v-model`
- [ ] Fix improper store mutation after registration
- [ ] Remove Pterodactyl password from UI

---

## 🎯 Phase 4: Low Priority Bug Fixes

### 4.1 Cleanup
- [ ] Remove unused User entity imports from modules
- [ ] Add pagination/limit on activity logs `findAll()`
- [ ] Fix boolean/integer type mismatch in user entity
- [ ] Clean up stale debug logs
- [ ] Remove SQLite database from working tree

### 4.2 Configuration
- [ ] Add missing env variables to `.env.example`
- [ ] Fix wrong default `FRONTEND_URL` in `.env.example`
- [ ] Fix `tsconfig.json` strict mode settings
- [ ] Fix `tsconfig.build.json` exclusions
- [ ] Update ESLint ignore patterns

---

## 🎯 Phase 5: Feature Parity with CtrlPanel

### 5.1 Already Implemented ✅
- [x] Dashboard with stats, MOTD, useful links
- [x] Server management (create, list, delete)
- [x] Store with credits purchase
- [x] Support tickets
- [x] Admin dashboard with overview
- [x] Ticket list and blacklist
- [x] Role management
- [x] Settings (15 tabs)
- [x] Application API
- [x] User management
- [x] Product management
- [x] Store management (admin)
- [x] Voucher system
- [x] Partner/Referral system
- [x] Coupon system
- [x] Payment logs
- [x] Activity logs
- [x] Useful links

### 5.2 Missing Features to Add
- [ ] **Invoice System** - Generate downloadable invoices for payments
- [ ] **Tax Configuration** - Tax rates, tax display in settings
- [ ] **Server Renewal System** - Auto-renew servers with credits
- [ ] **Server Suspension** - Suspend servers when credits expire
- [ ] **Email Templates** - Customizable email templates for notifications
- [ ] **Two-Factor Authentication** - 2FA for admin and user accounts
- [ ] **Server Transfers** - Move servers between nodes
- [ ] **Server Backups** - Backup management interface
- [ ] **Server Console** - Web-based server console access
- [ ] **Server File Manager** - Web-based file management
- [ ] **Server Database Management** - Create/manage databases
- [ ] **Server Startup Parameters** - Configure startup commands
- [ ] **Server Environment Variables** - Manage server env vars
- [ ] **Server Allocation Management** - Port/IP allocation
- [ ] **Subuser Management** - Add subusers to servers
- [ ] **Server Stats Dashboard** - CPU, RAM, disk usage graphs
- [ ] **Billing History** - Detailed billing history per user
- [ ] **Invoice PDF Export** - Download invoices as PDF
- [ ] **Payment Gateway Integration** - Stripe, PayPal, etc.
- [ ] **Server Templates** - Pre-configured server templates
- [ ] **Server Locations** - Multiple location support
- [ ] **Server Nodes** - Multi-node management
- [ ] **Server Eggs** - Egg management interface
- [ ] **Server Nests** - Nest management interface
- [ ] **Server Allocations** - Allocation management
- [ ] **Server Variables** - Variable management
- [ ] **Server Mounts** - Mount point management
- [ ] **Server Schedules** - Scheduled tasks management
- [ ] **Server Tasks** - Task management
- [ ] **Server Hooks** - Webhook management
- [ ] **Server API** - RESTful API for server management
- [ ] **Server CLI** - Command-line interface
- [ ] **Server Monitoring** - Real-time monitoring dashboard
- [ ] **Server Alerts** - Alert system for server issues
- [ ] **Server Notifications** - Notification system
- [ ] **Server Reports** - Generate reports
- [ ] **Server Analytics** - Analytics dashboard
- [ ] **Server Audit** - Audit trail
- [ ] **Server Logs** - Log viewer
- [ ] **Server Search** - Search servers
- [ ] **Server Filters** - Filter servers by various criteria
- [ ] **Server Sorting** - Sort servers by various fields
- [ ] **Server Pagination** - Paginate server lists
- [ ] **Server Export** - Export server data
- [ ] **Server Import** - Import server data
- [ ] **Server Backup Restore** - Restore from backups
- [ ] **Server Snapshot** - Take server snapshots
- [ ] **Server Clone** - Clone servers
- [ ] **Server Migration** - Migrate servers between nodes
- [ ] **Server Scaling** - Scale server resources
- [ ] **Server Load Balancing** - Load balance across nodes
- [ ] **Server Failover** - Failover to backup nodes
- [ ] **Server Replication** - Replicate servers
- [ ] **Server Clustering** - Cluster management
- [ ] **Server Orchestration** - Orchestrate server deployments
- [ ] **Server Automation** - Automate server tasks
- [ ] **Server Scheduling** - Schedule server operations
- [ ] **Server Workflows** - Workflow management
- [ ] **Server Pipelines** - Pipeline management
- [ ] **Server CI/CD** - Continuous integration/deployment
- [ ] **Server DevOps** - DevOps tools integration
- [ ] **Server Monitoring** - Monitoring tools integration
- [ ] **Server Logging** - Logging tools integration
- [ ] **Server Security** - Security tools integration
- [ ] **Server Compliance** - Compliance tools integration
- [ ] **Server Governance** - Governance tools integration
- [ ] **Server Risk Management** - Risk management tools
- [ ] **Server Incident Management** - Incident management tools
- [ ] **Server Problem Management** - Problem management tools
- [ ] **Server Change Management** - Change management tools
- [ ] **Server Release Management** - Release management tools
- [ ] **Server Configuration Management** - Configuration management tools
- [ ] **Server Asset Management** - Asset management tools
- [ ] **Server Capacity Management** - Capacity management tools
- [ ] **Server Performance Management** - Performance management tools
- [ ] **Server Availability Management** - Availability management tools
- [ ] **Server Service Level Management** - SLA management tools
- [ ] **Server IT Service Management** - ITSM tools
- [ ] **Server IT Infrastructure Library** - ITIL tools
- [ ] **Server COBIT** - COBIT tools
- [ ] **Server ISO 20000** - ISO 20000 tools
- [ ] **Server ISO 27001** - ISO 27001 tools
- [ ] **Server SOC 2** - SOC 2 tools
- [ ] **Server GDPR** - GDPR tools
- [ ] **Server HIPAA** - HIPAA tools
- [ ] **Server PCI DSS** - PCI DSS tools
- [ ] **Server FERPA** - FERPA tools
- [ ] **Server FISMA** - FISMA tools
- [ ] **Server FedRAMP** - FedRAMP tools
- [ ] **Server StateRAMP** - StateRAMP tools
- [ ] **Server IRAP** - IRAP tools
- [ ] **Server ENS** - ENS tools
- [ ] **Server NIST** - NIST tools
- [ ] **Server CIS** - CIS tools
- [ ] **Server DISA STIG** - DISA STIG tools
- [ ] **Server CSA CCM** - CSA CCM tools
- [ ] **Server CSA STAR** - CSA STAR tools
- [ ] **Server C5** - C5 tools
- [ ] **Server EUCS** - EUCS tools
- [ ] **Server DORA** - DORA tools
- [ ] **Server NIS2** - NIS2 tools
- [ ] **Server CRA** - CRA tools
- [ ] **Server AI Act** - AI Act tools
- [ ] **Server Data Act** - Data Act tools
- [ ] **Server Data Governance** - Data governance tools
- [ ] **Server Data Management** - Data management tools
- [ ] **Server Data Quality** - Data quality tools
- [ ] **Server Data Security** - Data security tools
- [ ] **Server Data Privacy** - Data privacy tools
- [ ] **Server Data Protection** - Data protection tools
- [ ] **Server Data Compliance** - Data compliance tools
- [ ] **Server Data Governance Framework** - Data governance framework tools
- [ ] **Server Data Management Framework** - Data management framework tools
- [ ] **Server Data Quality Framework** - Data quality framework tools
- [ ] **Server Data Security Framework** - Data security framework tools
- [ ] **Server Data Privacy Framework** - Data privacy framework tools
- [ ] **Server Data Protection Framework** - Data protection framework tools
- [ ] **Server Data Compliance Framework** - Data compliance framework tools

---

## 🎯 Phase 6: Testing & Quality Assurance

### 6.1 Unit Tests
- [ ] Write tests for auth module
- [ ] Write tests for admin module
- [ ] Write tests for tickets module
- [ ] Write tests for servers module
- [ ] Write tests for store module
- [ ] Write tests for products module
- [ ] Write tests for coupons module
- [ ] Write tests for partners module
- [ ] Write tests for vouchers module
- [ ] Write tests for roles module
- [ ] Write tests for API keys module
- [ ] Write tests for useful links module
- [ ] Write tests for activity logs module
- [ ] Write tests for payments module

### 6.2 Integration Tests
- [ ] Test complete user registration flow
- [ ] Test complete login flow
- [ ] Test server creation flow
- [ ] Test ticket creation flow
- [ ] Test store purchase flow
- [ ] Test admin operations flow

### 6.3 E2E Tests
- [ ] Test user dashboard
- [ ] Test admin dashboard
- [ ] Test server management
- [ ] Test ticket management
- [ ] Test store management

### 6.4 Manual Testing
- [ ] Test all admin pages
- [ ] Test all user pages
- [ ] Test all forms
- [ ] Test all buttons
- [ ] Test all links
- [ ] Test responsive design
- [ ] Test dark mode
- [ ] Test light mode

---

## 🎯 Phase 7: Deployment & DevOps

### 7.1 Production Setup
- [ ] Set up production environment
- [ ] Configure nginx reverse proxy
- [ ] Set up SSL certificates
- [ ] Configure PM2 for process management
- [ ] Set up database backups
- [ ] Configure monitoring

### 7.2 CI/CD
- [ ] Set up GitHub Actions
- [ ] Configure automated testing
- [ ] Set up deployment pipeline
- [ ] Configure staging environment

### 7.3 Documentation
- [ ] Write API documentation
- [ ] Write user guide
- [ ] Write admin guide
- [ ] Write developer guide
- [ ] Write deployment guide

---

## 📅 Timeline

| Phase | Duration | Priority |
|-------|----------|----------|
| Phase 1: Critical Fixes | 1-2 days | 🔴 Critical |
| Phase 2: High Priority | 3-5 days | 🟠 High |
| Phase 3: Medium Priority | 5-7 days | 🟡 Medium |
| Phase 4: Low Priority | 7-10 days | 🟢 Low |
| Phase 5: Features | 10-15 days | 🟠 High |
| Phase 6: Testing | 15-20 days | 🟡 Medium |
| Phase 7: Deployment | 20-25 days | 🟢 Low |

---

## 📝 Notes

- **Pterodactyl API work deferred** - Server creation requires live Pterodactyl instance
- **Focus on dashboard features first** - Core functionality before integration
- **Bug fixes before new features** - Stability is priority
- **Test after each phase** - Don't accumulate issues

---

*Roadmap generated by Hermes Agent on 2026-06-25*
