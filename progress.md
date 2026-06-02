# RestaurantOS POS Progress

## Phase 1 - Monorepo Setup

Status: Completed

Completed:
- Created `restaurantos-pos` monorepo with npm workspaces.
- Added Electron desktop app, NestJS API app, kitchen web app, shared domain package, and shared UI package.
- Added TypeScript, ESLint, Prettier, TailwindCSS configs, environment example, Docker Compose PostgreSQL service, and base run scripts.
- Added warm white/orange premium UI direction to the desktop and kitchen starter screens.
- Fixed Electron desktop dev launch by pointing the package entry to `out/main/main.js`, packaging `out/**`, handling Electron ESM imports, and clearing inherited `ELECTRON_RUN_AS_NODE` in the dev script.
- Fixed Ubuntu/Wayland BrowserWindow crash by using a frameless Electron window with custom renderer window controls.
- Pinned Electron to patched `39.8.5`, which passes npm audit and avoids the local Electron 40/42 BrowserWindow crash.

Files changed:
- `package.json`
- `tsconfig.base.json`
- `eslint.config.js`
- `.prettierrc`
- `.gitignore`
- `.env.example`
- `docker-compose.yml`
- `README.md`
- `apps/desktop/**`
- `apps/api/**`
- `apps/kitchen-web/**`
- `packages/shared/**`
- `packages/ui/**`

Database changes:
- Added PostgreSQL service configuration in `docker-compose.yml`.

Tests:
- `npm install` completed.
- `npm run typecheck --workspaces` passed.
- `npm run build --workspaces` passed.
- `npm audit --audit-level=high` passed with 0 vulnerabilities.
- Kitchen web dev server started at `http://localhost:5174/`.
- `timeout 10 npm run dev --workspace @restaurantos/desktop` launched Electron successfully.
- `npm run dev:desktop` starts and stays alive; stopped cleanly with `Ctrl+C`.

Notes:
- The workspace is ready for dependency installation and local development.
- The main POS is Electron-based, while the chef screen is a separate web app.
- PostgreSQL is mapped to `localhost:5433` to avoid conflicts with existing local PostgreSQL services on `5432`.

## Phase 2 - Database Schema Design

Status: Completed

Completed:
- Added initial Prisma schema covering the required RestaurantOS business entities, enums, decimal-safe money and quantity fields, kitchen stations, role permissions, ledgers, audit logs, orders, recipes, stock movement, purchases, shifts, and settings.
- Generated Prisma Client.
- Created and applied initial PostgreSQL migration.
- Added seed data for admin role/user, required permissions, default roles, units, kitchen stations, and business name setting.

Files changed:
- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/seed.ts`
- `apps/api/prisma/migrations/20260601140047_init/migration.sql`

Database changes:
- Prisma schema created for PostgreSQL.
- Migration `20260601140047_init` applied to local PostgreSQL.
- Seed executed against local PostgreSQL.

Tests:
- `npm run prisma:generate` passed.
- `npx prisma validate --schema apps/api/prisma/schema.prisma` passed.
- `DATABASE_URL=... npx prisma migrate dev --schema apps/api/prisma/schema.prisma --name init` passed.
- `DATABASE_URL=... npm run db:seed --workspace @restaurantos/api` passed.
- `npm run typecheck --workspaces` passed.
- `npm run build --workspaces` passed.
- `npm audit --audit-level=high` passed with 0 vulnerabilities.
- `GET /settings` smoke test returned the seeded business setting.

Notes:
- Next step is to continue Phase 3 with JWT strategy, request user hydration, protected routes, full permission guard coverage, and admin login UI.

## Phase 3 - Authentication, Users, Roles, Permissions

Status: Completed

Completed:
- Added auth module, login endpoint, password hashing with `bcryptjs`, JWT issuing, seeded admin user, default roles, permissions, and audit log entry on login.
- Added permission decorator and permission guard foundation.
- Added JWT strategy that validates bearer tokens against active database users and hydrates role permissions.
- Added JWT auth guard and current-user decorator.
- Added protected `/auth/me` endpoint for desktop session hydration.
- Added protected `/auth/logout` endpoint with audit logging.
- Protected `settings` routes with JWT auth.
- Protected order creation and send-to-kitchen routes with JWT auth plus permission checks.
- Added desktop login screen using React Hook Form and Zod validation.
- Added persisted desktop auth store, authenticated API helper, protected routes, logout control, and user initials in the app shell.

Files changed:
- `apps/api/src/modules/auth/**`
- `apps/api/src/common/decorators/current-user.decorator.ts`
- `apps/api/src/common/decorators/permissions.decorator.ts`
- `apps/api/src/common/guards/jwt-auth.guard.ts`
- `apps/api/src/common/guards/permission.guard.ts`
- `apps/api/src/modules/orders/orders.controller.ts`
- `apps/api/src/modules/settings/settings.controller.ts`
- `apps/api/prisma/seed.ts`
- `apps/desktop/src/renderer/src/lib/api.ts`
- `apps/desktop/src/renderer/src/router.tsx`
- `apps/desktop/src/renderer/src/components/app-shell.tsx`
- `apps/desktop/src/renderer/src/components/protected-route.tsx`
- `apps/desktop/src/renderer/src/pages/login-page.tsx`
- `apps/desktop/src/renderer/src/store/use-auth-store.ts`
- `README.md`
- `progress.md`

Database changes:
- Seeded default roles and permissions.
- Seeded `admin` user with password `Admin@12345`.
- Auth login/logout events write to `AuditLog`.

Tests:
- `npm run typecheck --workspace @restaurantos/api` passed.
- `npm run build --workspace @restaurantos/api` passed.
- `npm run typecheck --workspace @restaurantos/desktop` passed.
- `npm run build --workspace @restaurantos/desktop` passed.
- `npm audit --audit-level=high` passed with 0 vulnerabilities.
- `POST /auth/login` smoke test returned a JWT for the seeded admin user.
- Anonymous `GET /settings` smoke test returned `401`.
- Authenticated `GET /auth/me` smoke test returned `200`.
- Authenticated `POST /auth/logout` smoke test returned `201`.

Notes:
- Desktop auth currently uses local persisted bearer token storage for development. Production hardening should revisit token lifetime, refresh/session policy, and terminal/device binding.
- Next phase is Phase 4 - Settings Module.

## Phase 4 - Settings Module

Status: Completed

Completed:
- Added permission-protected bulk settings update endpoint with audit logging.
- Kept authenticated settings list available for signed-in desktop users.
- Seeded default business, tax, receipt, and operations settings.
- Replaced the placeholder Settings screen with a full desktop configuration workspace.
- Added React Hook Form and Zod validation for business profile, tax/service charge, receipt footer, stock threshold, kitchen delay, and shift float settings.
- Added TanStack Query loading, saving, cache update, and save/error feedback.
- Added permission-aware save behavior using the existing `settings.update` permission.

Files changed:
- `apps/api/src/modules/settings/settings.controller.ts`
- `apps/api/src/modules/settings/settings.service.ts`
- `apps/api/prisma/seed.ts`
- `apps/desktop/src/renderer/src/pages/settings-page.tsx`
- `README.md`
- `progress.md`

Database changes:
- No schema migration required.
- Seed now upserts expanded default settings for business, tax, receipt, and operations groups.

Tests:
- `npm run typecheck --workspaces` passed.
- `npm run build --workspaces` passed.
- Seed ran successfully against local Docker PostgreSQL with the expanded settings defaults.
- Settings API smoke test passed: anonymous `GET /settings` returned `401`, admin login returned `201`, authenticated `GET /settings` returned `200`, and authenticated `PATCH /settings` returned `200`.

Notes:
- The next phase is Phase 5 - Table System UI.
- Table/floor settings can build on the Phase 4 settings foundation without changing the settings API shape.

## Phase 24 - UI/UX Polish

Status: In Progress

Completed:
- Reworked the visual system toward a premium Dribbble-style operational UI with pure white surfaces, teal primary/secondary actions, Inter-like bold hierarchy, and softer modern card depth.
- Redesigned the Electron shell with frameless premium chrome, custom window controls, wider modern sidebar, and tighter navigation states.
- Redesigned the POS order screen with modern category chips, elevated menu cards, dark premium ticket total block, softer order panel, and clearer keyboard/rush affordances.
- Updated dashboard, admin placeholder pages, shared UI primitives, and kitchen web color treatment to align with the same design language.
- Replaced the yellow-led palette with the requested teal theme variables and pure white app surfaces.
- Made the app chrome visually borderless while preserving custom close, maximize/restore, and minimize controls.
- Added Electron keyboard shortcuts for window management: `Ctrl + Shift + M`, `Ctrl + Shift + F`, and `Ctrl + Shift + Q`.
- Added a POS shortcut card and documented current and planned shortcuts in `README.md`.
- Centralized brand colors into `packages/shared/src/brand-theme.css` and mapped desktop/kitchen Tailwind colors to shared CSS variables.
- Added `packages/shared/src/brand-theme.ts` for shell-level brand metadata and colors.
- Replaced active desktop, kitchen, and shared UI source palette literals with semantic classes such as `primary`, `secondary`, `sage`, `muted`, and `espresso`.

Files changed:
- `packages/shared/src/brand-theme.css`
- `packages/shared/src/brand-theme.ts`
- `packages/shared/src/index.ts`
- `packages/ui/src/components/button.tsx`
- `packages/ui/src/components/card.tsx`
- `packages/ui/src/components/badge.tsx`
- `apps/desktop/tailwind.config.cjs`
- `apps/desktop/src/renderer/src/styles.css`
- `apps/desktop/src/renderer/src/components/app-shell.tsx`
- `apps/desktop/src/renderer/src/pages/**`
- `apps/kitchen-web/tailwind.config.ts`
- `apps/kitchen-web/src/styles.css`
- `apps/kitchen-web/src/pages/kitchen-page.tsx`
- `README.md`
- `progress.md`

Database changes:
- None.

Tests:
- `npm run typecheck --workspaces` passed.
- `npm run build --workspaces` passed.
- `npm run typecheck --workspace @restaurantos/desktop` passed.
- `npm run build --workspace @restaurantos/desktop` passed.
- `npm run typecheck --workspace @restaurantos/ui` passed.
- `npm run typecheck --workspace @restaurantos/kitchen-web` passed.
- `npm run build --workspace @restaurantos/kitchen-web` passed.
- `npm audit --audit-level=high` passed with 0 vulnerabilities.
- `npm run dev:desktop` started and stayed alive; stopped cleanly with `Ctrl+C`.
- Source scan confirmed old yellow/warm-cream palette tokens were removed from active desktop, kitchen, shared UI, README, and progress files.

Notes:
- Dribbble and SaaS/POS dashboard references were used for broad visual direction only, not copied.
- Remaining next UI pass should replace placeholder admin content with real CRUD tables/forms using the new design system.
- Developer-only branding settings are planned for a later admin/dev phase. The current foundation makes that easier because desktop and kitchen UI already consume theme tokens.

## Phase 25 - Admin CRUD Workspaces

Status: Completed

Completed:
- Added authenticated menu admin endpoints for catalog summary, category create/update, and menu item create/update.
- Added authenticated customer endpoints for customer list metrics, customer create, and customer update.
- Added authenticated inventory endpoints for stock list metrics, units, suppliers, stock item create, and stock item update.
- Added `menu.manage`, `customer.manage`, and `inventory.manage` permissions and ensured the Admin role receives all permissions on every seed run.
- Seeded demo categories, menu items, customers, a supplier, and stock items for a useful first-run admin experience.
- Replaced the desktop Menu, Customers, and Inventory placeholders with real tables, metrics, compact create forms, loading/error states, and permission-aware controls.

Files changed:
- `apps/api/src/app.module.ts`
- `apps/api/src/modules/menu/**`
- `apps/api/src/modules/customers/**`
- `apps/api/src/modules/inventory/**`
- `apps/api/prisma/seed.ts`
- `apps/desktop/src/renderer/src/pages/menu-page.tsx`
- `apps/desktop/src/renderer/src/pages/customers-page.tsx`
- `apps/desktop/src/renderer/src/pages/inventory-page.tsx`
- `README.md`
- `progress.md`

Database changes:
- No schema migration required.
- Seed now upserts admin workspace permissions and demo operational data.

Tests:
- `npm run typecheck --workspaces` passed.
- `npm run build --workspaces` passed.
- Seed ran successfully against local Docker PostgreSQL with the new permissions and demo records.
- API smoke test passed: admin login returned `201`, authenticated `GET /menu` returned `200`, authenticated `GET /customers` returned `200`, and authenticated `GET /inventory` returned `200`.
- CRUD write smoke test passed: authenticated `POST /menu/categories`, `POST /menu/items`, `POST /customers`, and `POST /inventory/items` each returned `201`.
- `npm audit --audit-level=high` passed with 0 vulnerabilities.

Notes:
- This is the first CRUD admin slice. Recipes, purchases, ledger payments, category/item editing forms, and richer validation workflows remain future specialized phases.
- Return to Phase 5 - Table System UI after committing this checkpoint.
