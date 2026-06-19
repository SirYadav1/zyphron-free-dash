# Dev session summary

## Goal
Fix bugs and add features to Zyphron Free Dash: user role management, registration fields (first/last name, eye toggle), Pterodactyl auto-registration, API key custom token, ticket without server, dark mode fix, admin panel button, server specs display

## Constraints & Preferences
- User communicates in Hindi/Urdu + English mix
- User wants all features working before final `npm run dev` test on PC
- Admin login: `admin@zyphron.cloud` / `Admin123!`
- Panel URL changed to `console.zyphron.cloud`
- SQLite DB (`zyphron.db`) with auto-sync (dev mode)
- Global API prefix: `/api` (all routes under `/api/...`)
- AuthModule is `@Global()` — imported everywhere
- Frontend Vite proxies `/api` → `http://localhost:3000`
- DB: SQLite `zyphron.db`, entities auto-sync (synchronize=true in dev)
- `.env` contains exposed secrets (API keys, Discord tokens, JWT secret)

## Progress
### Done
- **All 9 feature requests implemented:**
  1. Registration fields: first_name, last_name, confirm password, eye toggle for both password fields
  2. Pterodactyl auto-registration: after dashboard registration, tries to create user on Pterodactyl panel (non-blocking, wrapped in try/catch)
  3. User role management: toggle buttons in user detail modal to assign/unassign roles
  4. API key custom token: optional token field in create form; uses custom token if provided, auto-generates if blank
  5. Ticket creation fix: removed category field from payload (caused "property category should not exist" error); server field already optional
  6. Dark mode fix: applyTheme() called immediately during module script load, not waiting for onMounted
  7. Admin panel access button: added to Admin Dashboard quick actions + sidebar footer in Admin Layout
  8. Panel URL updated: `panel.zyphron.cloud` → `console.zyphron.cloud`
  9. Server specs in admin user detail: added columns for Type (Free/Paid), RAM, CPU, Disk
- **All modules using AdminGuard now import User entity**: ApiKeysModule, UsefulLinksModule, ProductsModule, CouponsModule, ActivityLogsModule
- Backend `nest build` succeeds clean
- Frontend `vite build` succeeds clean
- **Server tested and all admin APIs work**: admin login → admin users list → stats → API key with custom token

### In Progress
- (none)

### Blocked
- Pterodactyl panel unreachable from test environment (`console.zyphron.cloud` — expected for local testing)

## Key Decisions
- AdminGuard reverted from ModuleRef to @InjectRepository(User) because ModuleRef.get('UserRepository') token didn't match TypeORM's actual provider token in NestJS v11
- All servers in dashboard DB marked as isFree: true (created from dashboard); servers only on Pterodactyl would be "Paid"
- Dark mode fix: applied at module script level (before Vue component mounts) instead of waiting for lifecycle hooks
- Pterodactyl auto-registration wrapped in try/catch — if panel is unreachable, user still created on dashboard (non-blocking)

## Next Steps
- User runs `npm run dev` on PC and tests: registration with new fields, ticket creation, role assignment, API key with custom token, dark mode in preferences
- Review remaining ~60 unfixed bugs from BUG_REPORT.md (mostly low/medium priority)

## Relevant Files
- `src/entities/user.entity.ts`: added first_name, last_name columns
- `src/auth/dto/register.dto.ts`: added first_name, last_name (optional)
- `src/auth/auth.service.ts`: handles first_name/last_name + Pterodactyl auto-registration; returns first_name/last_name in login + profile responses
- `src/auth/auth.module.ts`: imports PterodactylModule
- `src/common/guards/admin.guard.ts`: reverted to @InjectRepository(User) (ModuleRef approach broken)
- `src/api-keys/api-keys.controller.ts`: added optional token to CreateApiKeyDto
- `src/api-keys/api-keys.service.ts`: accepts custom token in create()
- `src/api-keys/api-keys.module.ts`: added User to TypeOrmModule.forFeature
- `src/roles/roles.controller.ts`: added GET /admin/roles/user/:userId endpoint
- `src/roles/roles.module.ts`: has User in TypeOrmModule.forFeature
- `src/admin/admin.controller.ts`: updated UpdateUserDto with first_name/last_name
- `src/admin/admin.service.ts`: handles first_name/last_name in updateUser()
- `src/useful-links/useful-links.module.ts`: added User import
- `src/products/products.module.ts`: added User import
- `src/coupons/coupons.module.ts`: added User import
- `src/activity-logs/activity-logs.module.ts`: added User import
- `client/views/RegisterView.vue`: first_name, last_name, eye toggle, confirm password
- `client/stores/auth.js`: sends first_name/last_name in register()
- `client/views/TicketCreateView.vue`: removed category from payload
- `client/views/PreferencesView.vue`: immediate applyTheme() call
- `client/views/admin/AdminDashboardView.vue`: added Panel quick-action button
- `client/views/admin/AdminLayout.vue`: added "Open Panel" sidebar link + panelUrl
- `client/views/admin/AdminUsersView.vue`: role toggle buttons + server specs columns (Type/RAM/CPU/Disk)
- `client/views/admin/AdminApiCreateView.vue`: added token input field
- `client/stores/admin.js`: added roles fetch/assign/unassign/getUserRoles actions
- `.env`: panel URL changed to console.zyphron.cloud
