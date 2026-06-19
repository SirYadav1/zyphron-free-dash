# Zyphron Free Dash - Bug Report

**Generated:** 2026-06-16
**Total Bugs Found:** 83 (11 Critical, 21 High, 26 Medium, 25 Low)
**Bugs Fixed:** 16 (7 High, 5 Medium, 4 Low)

---

## Fixes Applied

### Critical Fixes
| # | File | Fix |
|---|------|-----|
| 1 | `src/auth/auth.module.ts:21` | Removed hardcoded JWT fallback `'fallback-secret-change-me'` - now throws error if `JWT_SECRET` not set |
| 2 | `src/tickets/tickets.controller.ts:55-58` | Fixed IDOR vulnerability - `getTicket` now requires `userId` and verifies ticket ownership |
| 3 | `src/app.module.ts:46` | Removed hardcoded MySQL password `'4601'` - now uses `config.getOrThrow('DB_PASSWORD')` |
| 4 | `src/app.module.ts:49,56` | Changed `synchronize: true` to `synchronize: config.get('NODE_ENV') !== 'production'` |
| 5 | `client/views/VerifyEmailView.vue:70-77` | Email verification now actually calls API with token instead of always claiming success |

### High Fixes
| # | File | Fix |
|---|------|-----|
| 6 | `src/admin/admin.service.ts:134-165` | Added ban/unban email notifications via `mailService.sendBanNotification()` / `sendUnbanNotification()` |
| 7 | `src/main.ts:34` | Fixed static file path from `join(__dirname, '..', '..', 'dist', 'client')` to `join(__dirname, '..', 'client')` |
| 8 | `ecosystem.config.js:4` | PM2 path `dist/src/main.js` is correct (verified `ls dist/src/`) - no change needed |
| 9 | `client/views/admin/AdminServersView.vue:144` | Changed from `client.delete('/servers/...')` to `client.post('/admin/servers/.../delete')` |
| 10 | `src/coupons/coupons.controller.ts` | Fixed DTO: `discount` -> `type` + `value` to match `Coupon` entity |
| 11 | `src/partners/partners.controller.ts` | Fixed DTO: `name`/`code`/`discount` -> `user_id`/`partner_discount`/`registered_user_discount` |
| 12 | `src/useful-links/admin-useful-links.controller.ts` | Fixed DTO: `name`/`url` -> `title`/`link` + added `description`/`position` |
| 13 | `src/api-keys/api-keys.controller.ts` | Fixed DTO: `name`/`description` -> `memo` to match `ApplicationApi` entity |
| 14 | `src/roles/roles.controller.ts` | Fixed DTO: `description` -> `guard_name` to match `Role` entity |

### Medium Fixes
| # | File | Fix |
|---|------|-----|
| 15 | `client/views/AfkView.vue:240-242` | Fixed `beforeunload` memory leak - handler now properly stored and removed in `onUnmounted` |
| 16 | `client/views/admin/AdminUsersView.vue:239` | Fixed typo `bunning` -> `banning` |
| 17 | `client/components/ZyphronLogo.vue:2` | `compact` prop now actually hides text and reduces gap |
| 18 | `.gitignore` | Added `*.log`, `register-error.log`, `nest-output.log`, `nest-output.log.err` |
| 19 | `client/router/index.js:104-108` | Removed dead `parseErrorMessage` function and unused export |
| 20 | `client/layouts/AdminLayout.vue` | Deleted duplicate file (router imports from `views/admin/AdminLayout.vue`) |

---

## CRITICAL (11)

| # | File | Line(s) | Description |
|---|------|---------|-------------|
| 1 | `.env` | 1,6,15,17,20 | Production secrets (JWT, Pterodactyl API key, Discord secret, Discord bot token, admin key) committed to repo |
| 2 | `configure-ptero-key.sql` | 12 | Hardcoded Pterodactyl API key in SQL file |
| 3 | `update-api-key.sql` | 3 | Hardcoded Pterodactyl API key in SQL file |
| 4 | `debug-ptero.js` | 5 | Hardcoded Pterodactyl API key in debug script |
| 5 | `check_pass.js` | 2 | Hardcoded bcrypt hash and test credential exposed |
| 6 | `src/auth/auth.module.ts` | 21 | Hardcoded JWT fallback secret `'fallback-secret-change-me'` - anyone can forge tokens |
| 7 | `src/app.module.ts` | 49, 56 | TypeORM `synchronize: true` in production - auto schema changes cause data loss |
| 8 | `client/views/VerifyEmailView.vue` | 70-77 | Email verification completely bypassed - always claims success without API call |
| 9 | `client/layouts/AdminLayout.vue` + `views/admin/AdminLayout.vue` | 22 | XSS vulnerability via `v-html` with icon strings - dangerous if icons sourced from DB |
| 10 | `supabase_schema.sql` | 27-34 | Trigger fails when username is NULL + lacks error handling (no EXCEPTION block) |
| 11 | `src/tickets/tickets.controller.ts` | 55-58 | IDOR vulnerability - any user can view any ticket by iterating IDs |

---

## HIGH (21)

| # | File | Line(s) | Description |
|---|------|---------|-------------|
| 1 | `src/app.module.ts` | 46 | Hardcoded MySQL password default `'4601'` |
| 2 | `SETUP_GUIDE.md` | 8-9, 97 | Admin credentials and Pterodactyl API key exposed in documentation |
| 3 | `src/auth/auth.service.ts` | 69-101 | Stale coin balance in login response - user object fetched before daily bonus |
| 4 | `src/servers/servers.service.ts` | 233 | Coin rollback race condition - uses stale value, loses concurrent AFK earnings |
| 5 | `src/store/store.service.ts` | 129-154 | No coin refund on Pterodactyl API failure during server upgrade |
| 6 | `src/discord/discord.controller.ts` | 24-38 | JWT token passed in URL query string - exposed in browser history/logs |
| 7 | `src/tickets/tickets.service.ts` | 21-39 | Blacklist not enforced when creating tickets - dead code |
| 8 | `src/admin/admin.service.ts` | 134-165 | No email notifications sent for ban/unban events |
| 9 | `src/coupons/coupons.controller.ts` | 22 | DTO field `discount` doesn't match entity (entity has `type` + `value`) |
| 10 | `src/partners/partners.controller.ts` | 17-28 | DTO fields don't match `PartnerDiscount` entity |
| 11 | `src/useful-links/admin-useful-links.controller.ts` | 17-27 | DTO fields don't match `UsefulLink` entity |
| 12 | `src/api-keys/api-keys.controller.ts` | 17-24 | DTO fields don't match `ApplicationApi` entity |
| 13 | `src/roles/roles.controller.ts` | 17-24 | DTO has `description` field not in `Role` entity |
| 14 | `client/views/DashboardView.vue` | 133 | `store.stats.panelUrl` always undefined - panel link broken |
| 15 | `client/views/admin/AdminServersView.vue` | 144 | Admin server delete uses wrong endpoint (user endpoint instead of admin) |
| 16 | `client/views/AfkView.vue` | 240-242 | `beforeunload` listener never removed - memory leak |
| 17 | `client/stores/admin.js` | 17-168 | Shared `loading` flag race condition across all admin actions |
| 18 | `client/stores/store.js` | 39 | Potential TypeError on undefined property in upgrade action |
| 19 | `src/app.module.ts` | 49, 56 | `synchronize: true` will attempt schema changes on Supabase RLS-protected tables |
| 20 | `ecosystem.config.js` | 4 | PM2 points to `dist/src/main.js` - may not exist after nest build |
| 21 | `vite.config.mjs` + `src/main.ts` | 17, 34 | Static file path mismatch - NestJS `__dirname` resolves wrong in compiled output |

---

## MEDIUM (26)

| # | File | Line(s) | Description |
|---|------|---------|-------------|
| 1 | `src/auth/auth.service.ts` | 181-233 | Daily login bonus race condition (partially mitigated by CAS) |
| 2 | `src/entities/user.entity.ts` | 11-12, 53-54 | Schema mismatch - entity has `email`, `password_hash`, `email_verified` not in SQL |
| 3 | `src/entities/server.entity.ts` | 46 | `last_active_at` column in entity but not in SQL schema |
| 4 | `src/servers/servers.service.ts` + `server-lifecycle.service.ts` | Various | Duplicate expired server cron jobs (one suspends, one deletes) |
| 5 | `src/pterodactyl/pterodactyl.service.ts` | 99-119 | Triple config DB load per Pterodactyl API request (up to 9 queries) |
| 6 | `src/afk/afk.service.ts` | 140-167 | Session stats updated before CAS coin update - shows earnings user didn't get |
| 7 | `src/discord/discord.service.ts` | 60-76 | Silent failure on Pterodactyl user creation during Discord linking |
| 8 | `src/supabase/supabase.service.ts` | 12 | Redundant `dotenv.config()` call conflicts with NestJS ConfigModule |
| 9 | `src/app.controller.spec.ts` | 8-15 | Test missing `Setting` repository mock - will fail |
| 10 | `src/admin/admin.controller.ts` | 135-141 | No `@Min(0)` validation on coins in admin update |
| 11 | `src/admin/admin.service.ts` | 134-151 | Admin can ban themselves - loses admin access |
| 12 | `src/main.ts` | 16-19 | CORS origin mismatch between `.env` and default |
| 13 | `src/tickets/tickets.controller.ts` | 21 | No `@IsIn` validation on priority field |
| 14 | `seed-admin.ts` | 19 | Default admin password hardcoded in script |
| 15 | `supabase_schema.sql` | 36-38 | No `DROP TRIGGER IF EXISTS` before recreation |
| 16 | `SETUP_GUIDE.md` | 67-70 | Invalid `CREATE POLICY IF NOT EXISTS` SQL syntax |
| 17 | `eslint.config.mjs` | 9 | Insufficient ignore patterns (missing dist, client, scripts) |
| 18 | `client/views/admin/AdminUsersView.vue` | 239 | Typo: `bunning` should be `banning` |
| 19 | `client/components/ZyphronLogo.vue` | 2 | `compact` prop accepted but has no effect |
| 20 | `client/views/TicketCreateView.vue` | 44 | `<option selected>` conflicts with `v-model` |
| 21 | `client/views/RegisterView.vue` | 121-125 | Improper store mutation after registration - sets `{ id: undefined }` |
| 22 | `client/views/SettingsView.vue` | 120 | Pterodactyl password exposed in UI |
| 23 | `client/views/SettingsView.vue` | 51 | JWT token in Discord link URL |
| 24 | `client/router/index.js` | 104-108 | Dead export `parseErrorMessage` |
| 25 | `client/views/admin/AdminSettingsView.vue` | 539, 639 | Raw `fetch()` instead of configured axios client |
| 26 | `.env` | -- | Missing Supabase env variables - migration scripts will crash |

---

## LOW (25)

| # | File | Line(s) | Description |
|---|------|---------|-------------|
| 1 | `src/products/products.module.ts` | 4 | Unused `User` entity import |
| 2 | `src/coupons/coupons.module.ts` | 4 | Unused `User` entity import |
| 3 | `src/api-keys/api-keys.module.ts` | 4 | Unused `User` entity import |
| 4 | `src/activity-logs/activity-logs.module.ts` | 4 | Unused `User` entity import |
| 5 | `src/useful-links/useful-links.module.ts` | 4 | Unused `User` entity import |
| 6 | `src/activity-logs/activity-logs.service.ts` | 12-16 | No pagination/limit on `findAll()` - unbounded results |
| 7 | `src/entities/voucher.entity.ts` | -- | `max_uses` in DTO but missing in entity |
| 8 | `src/achievements/achievements.service.ts` | 96-122 | Fragile date comparison with timezone mismatch |
| 9 | `package.json` | 27 | `@nestjs-modules/mailer` unused (nodemailer used directly) |
| 10 | `supabase_schema.sql` | 27-34 | Trigger missing COALESCE fallback for username |
| 11 | `src/entities/user.entity.ts` | 35-51 | Boolean/integer type mismatch (`is_banned`, `is_admin`) |
| 12 | `fix_trigger.sql` | 176 | Deprecated `EXECUTE PROCEDURE` syntax |
| 13 | `fix_trigger.sql` | 280-304 | Settings INSERT won't update on re-run (ON CONFLICT DO NOTHING) |
| 14 | `.env.example` | -- | Missing `DB_TYPE` variable |
| 15 | `.env.example` | 31 | Wrong default `FRONTEND_URL` |
| 16 | `tsconfig.json` | 19-23 | Partial strict mode (noImplicitAny disabled) |
| 17 | `tsconfig.build.json` | 3 | Root migration scripts not excluded from build |
| 18 | `nest-output.log`, `nest-output.log.err` | -- | Stale debug logs in project root |
| 19 | `register-error.log` | -- | Error logs with system paths in project root |
| 20 | `zyphron.db` | -- | SQLite database in working tree |
| 21 | `client/views/DashboardView.vue` | 244-252 | Dead `handleDelete` function - never called |
| 22 | `client/views/TicketShowView.vue` + `AdminTicketShowView.vue` | 54, 26 | Inconsistent `message` vs `description` field name |
| 23 | Multiple views | Various | `camelCase` vs `snake_case` date field inconsistency |
| 24 | `client/style.css` | 4-18 | Tailwind v4 `@theme` directive - depends on installed version |
| 25 | `client/views/StoreView.vue` | 149 | `\|\|` vs `??` pricing fallback (0 treated as falsy) |

---

## Key Recommendations

### Immediate Actions (Critical)
1. **Rotate ALL exposed secrets** - JWT, Pterodactyl API keys, Discord tokens
2. **Remove `.env` from git history** if it was ever committed
3. **Delete SQL files with hardcoded keys** (`configure-ptero-key.sql`, `update-api-key.sql`, `debug-ptero.js`, `check_pass.js`)
4. **Remove hardcoded JWT fallback** - throw error if `JWT_SECRET` not set
5. **Set `synchronize: false`** in production
6. **Fix email verification** to actually call the API
7. **Fix ticket IDOR** - verify ticket ownership

### High Priority
1. Fix all DTO-entity field mismatches across admin controllers
2. Add coin refund rollback on Pterodactyl failures
3. Remove JWT from URL in Discord OAuth flow
4. Enforce ticket blacklist
5. Send ban/unban email notifications
6. Fix static file path in `main.ts` for production
7. Fix PM2 entry point path

### Medium Priority
1. Add validation decorators (Min, IsIn) on DTOs
2. Prevent admin self-banning
3. Fix memory leak in AfkView
4. Remove redundant dotenv.config()
5. Fix test mocks
