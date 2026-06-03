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

## Phase 5 - Table System UI

Status: Completed

Completed:
- Added authenticated table/floor API endpoints for table list, table create/update, status update, and dine-in order start.
- Added `table.manage` permission and synced it into shared permissions.
- Seeded demo dining areas and tables for Main Hall, Family Room, and Patio.
- Added desktop Tables route and sidebar navigation item.
- Built premium table/floor UI with area filters, floor metrics, table status cards, quick clean/free/reserve actions, and a create-table form.
- Refined the table UI into clearer top-down floor cards with table shapes, capacity-based chairs, stronger status bars, and order-age visibility.
- Split the visual table card into a reusable desktop component and replaced generic chair blocks with an offline inline SVG chair shape.
- Adjusted table-card chair spacing and aligned chair fill/stroke colors with each table status outline for better contrast.
- Re-tuned round-table chair positions and returned chair colors to the original softer palette with slightly darker fills.
- Added POS shortcut path to the table screen and documented `F10`.
- Dine-in table start now creates or returns an open draft order and marks the table as waiting for order.

Files changed:
- `apps/api/src/app.module.ts`
- `apps/api/src/modules/tables/**`
- `apps/api/prisma/seed.ts`
- `apps/desktop/src/renderer/src/pages/tables-page.tsx`
- `apps/desktop/src/renderer/src/components/table-card.tsx`
- `apps/desktop/src/renderer/src/router.tsx`
- `apps/desktop/src/renderer/src/components/app-shell.tsx`
- `apps/desktop/src/renderer/src/pages/pos-page.tsx`
- `packages/shared/src/index.ts`
- `packages/shared/src/index.js`
- `README.md`
- `progress.md`

Database changes:
- No schema migration required.
- Seed now upserts table/floor permission and demo tables.

Tests:
- `npm run typecheck --workspaces` passed.
- `npm run build --workspaces` passed.
- `npm run typecheck --workspace @restaurantos/desktop` passed after table card extraction.
- `npm run build --workspace @restaurantos/desktop` passed after table card extraction.
- `npm run db:seed` passed against local Docker PostgreSQL.
- API smoke test passed: admin login returned `201`, authenticated `GET /tables` returned `200`, `POST /tables` returned `201`, `PATCH /tables/:id/status` returned `200`, and `POST /tables/:id/start-order` returned `201`.
- `npm audit --audit-level=high` passed with 0 vulnerabilities.

Notes:
- Future table phases should add order transfer, table merge, reservations, waiter assignment, and visual floor designer.
- POS workflow shortcuts should be implemented in a later keyboard workflow phase after order, payment, hold/recall, table, and print flows are real.

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
- This is the first CRUD admin slice. Purchases, ledger payments, category/item editing forms, and richer validation workflows remain future specialized phases.
- Phase 24 and Phase 25 were side-track UI/admin checkpoints. The main product sequence continues from Phase 5 into Phase 6.

## Phase 6 - Recipe Builder and Stock Deduction Rules

Status: Completed

Completed:
- Corrected the roadmap naming so this work is Phase 6, not Phase 26.
- Added `recipe.manage` to shared permissions and API seed permissions.
- Added recipe builder API support with `GET /menu/recipes`, `POST /menu/recipes`, and `PATCH /menu/recipes/:id`.
- Added conversion-aware estimated recipe cost using inventory average cost and usage-unit conversion rate.
- Seeded demo recipes for Smash Beef Burger and Margherita Pizza.
- Added idempotent stock deduction for recipe-linked order items when orders are sent to kitchen, including usage-unit to stock-unit conversion.
- Expanded the desktop Menu page with recipe metrics, recipe cards, and a React Hook Form + Zod recipe creation form.

Files changed:
- `apps/api/prisma/seed.ts`
- `apps/api/src/modules/menu/**`
- `apps/api/src/modules/inventory/inventory.service.ts`
- `apps/api/src/modules/orders/**`
- `apps/desktop/src/renderer/src/pages/menu-page.tsx`
- `packages/shared/src/index.ts`
- `packages/shared/src/index.js`
- `README.md`
- `progress.md`

Tests:
- `npm run typecheck --workspaces` passed.
- `npm run build --workspaces` passed.
- `npm run db:seed` passed against local Docker PostgreSQL.
- Runtime smoke test passed: admin login returned `201`, `GET /menu/recipes` returned seeded recipes, `POST /menu/recipes` created a temporary recipe, and sending a burger order to kitchen twice deducted stock only once.
- Smoke test stock deltas were converted correctly: Beef Patty `0.18`, Burger Bun `1`, Mozzarella Cheese `0.035`.
- Smoke test cleaned up the temporary recipe, order, kitchen ticket records, stock movements, and restored touched stock balances.
- `npm audit --audit-level=high` passed with 0 vulnerabilities.

## Desktop Page Structure Cleanup

Status: Completed

Completed:
- Moved desktop renderer pages into page-owned folders with `index.tsx` entry files.
- Updated router imports to use folder entries such as `./pages/menu` and `./pages/tables`.
- Split the large Menu page into local `interfaces.ts`, `recipe-form-model.ts`, and `components.tsx` support files.
- Kept small pages simple with one `index.tsx` to avoid unnecessary file noise.
- Moved page data contracts into page-local `interfaces.ts` files for Menu, Inventory, Customers, Tables, and Settings.
- Replaced deprecated React `FormEvent` usage with a shared `FormSubmitEvent` alias based on `SyntheticEvent<HTMLFormElement, SubmitEvent>`.

Tests:
- `npm run typecheck --workspace @restaurantos/desktop` passed.
- `npm run build --workspace @restaurantos/desktop` passed.

## Desktop Admin Create Popup UX

Status: Completed

Completed:
- Added a reusable `ActionModal` component for desktop admin create flows.
- Added a quick jiggle-in popup animation in the desktop renderer stylesheet.
- Moved Menu create category, create item, and create recipe forms from side panels into popups.
- Moved Inventory create stock item form from the side panel into a popup.
- Added Inventory supplier and supplier payment popup actions for account workflows.
- Moved Customer Credit create customer form from the side panel into a popup.
- Moved Tables create table form from the side panel into a popup.
- Expanded Menu, Inventory, Customer Credit, and Tables primary tables/lists to use full page width.
- Kept modal state named by action so future keyboard shortcuts can open the correct popup cleanly.

Tests:
- `npm run typecheck --workspace @restaurantos/desktop` passed.
- `npm run build --workspace @restaurantos/desktop` passed.

## Phase 7 - Purchases and Stock Receiving

Status: Completed

Completed:
- Added purchase receiving API support with `GET /inventory/purchases` and `POST /inventory/purchases`.
- Added purchase DTO validation for supplier, invoice, purchase date, payment method, paid amount, and purchase item rows.
- Added transactional purchase creation with purchase items, `PURCHASE` stock movements, stock increments, last purchase cost updates, weighted average cost recalculation, and supplier payable updates.
- Added supplier ledger entry creation for unpaid purchase balances.
- Added desktop Inventory purchase history table.
- Added desktop Receive Stock popup with supplier, invoice, date, payment method, paid amount, multi-row stock item entry, and running totals.

Files changed:
- `apps/api/src/modules/inventory/inventory.controller.ts`
- `apps/api/src/modules/inventory/inventory.service.ts`
- `apps/desktop/src/renderer/src/pages/inventory/index.tsx`
- `README.md`
- `progress.md`

Tests:
- `npm run typecheck --workspaces` passed.
- `npm run build --workspaces` passed.
- Runtime smoke test passed: admin login returned `201`, `POST /inventory/purchases` created a temporary purchase, stock increased by `1`, supplier payable increased by `1500`, and one `PURCHASE` stock movement was created.
- Smoke test cleaned up the temporary purchase, stock movement, supplier ledger entry, and restored touched stock/supplier balances.
- `npm audit --audit-level=high` passed with 0 vulnerabilities.

## Phase 8 - Supplier Accounts and Payments

Status: Completed

Completed:
- Added supplier account API support with `GET /inventory/suppliers`, `POST /inventory/suppliers`, `PATCH /inventory/suppliers/:id`, and `POST /inventory/suppliers/:id/payments`.
- Added DTO validation for supplier contact details, opening payable balance, payment amount, payment method, payment reference, and notes.
- Added transactional supplier creation with opening payable ledger entry when an opening balance is provided.
- Added transactional supplier payment recording that prevents overpayment, decrements `currentPayable`, and writes a supplier ledger debit row.
- Added desktop Inventory supplier payable metric.
- Added desktop Supplier Accounts table with contact details, purchase count, latest ledger movement, payable balance, and row-level payment action.
- Added desktop New Supplier popup and Pay Supplier popup using the shared modal UX.

Files changed:
- `apps/api/src/modules/inventory/inventory.controller.ts`
- `apps/api/src/modules/inventory/inventory.service.ts`
- `apps/desktop/src/renderer/src/pages/inventory/index.tsx`
- `apps/desktop/src/renderer/src/pages/inventory/interfaces.ts`
- `README.md`
- `progress.md`

Database changes:
- No schema migration required; the existing `Supplier` and `SupplierLedger` tables support the workflow.

Tests:
- `npm run typecheck --workspaces` passed.
- Runtime smoke test passed: admin login returned `201`, `POST /inventory/suppliers` created a temporary supplier with `5000` opening payable, `POST /inventory/suppliers/:id/payments` recorded a `1200` payment, `GET /inventory/suppliers` showed `3800` current payable and two ledger rows.
- Smoke test cleaned up the temporary supplier and supplier ledger rows.
- `npm run build --workspaces` passed.

## Phase 9 - Staff, Roles, and Permissions

Status: Completed

Completed:
- Added a `UsersModule` API module for staff access control.
- Added staff/user API support with `GET /users`, `POST /users`, `PATCH /users/:id`, and `PATCH /users/:id/password`.
- Added role API support with `POST /users/roles` and `PATCH /users/roles/:id`.
- Added validation for staff names, usernames, passwords, phone values, role assignment, and permission selections.
- Added staff profile creation/sync when staff logins are created or updated.
- Added audit logs for user create/update, password update, role create, and role update.
- Added safety checks to block self-deactivation and prevent removing `user.manage` from the signed-in user's active role.
- Added desktop Staff route and sidebar navigation item.
- Added Staff & Roles desktop page with metrics, staff login table, role assignment controls, password popup, new staff popup, role cards, and role permission editor popup.
- Made the desktop sidebar denser and scroll-safe for the expanded module list.

Files changed:
- `apps/api/src/app.module.ts`
- `apps/api/src/modules/users/**`
- `apps/desktop/src/renderer/src/components/app-shell.tsx`
- `apps/desktop/src/renderer/src/pages/users/**`
- `apps/desktop/src/renderer/src/router.tsx`
- `README.md`
- `progress.md`

Database changes:
- No schema migration required; the existing `User`, `Staff`, `Role`, `Permission`, `RolePermission`, and `AuditLog` tables support the workflow.

Tests:
- `npm run typecheck --workspace @restaurantos/api` passed.
- `npm run typecheck --workspaces` passed.
- Runtime smoke test passed: admin login returned `201`, `GET /users` returned seeded roles/permissions, `POST /users` created a temporary staff login, `PATCH /users/:id/password` reset its password, `PATCH /users/:id` deactivated it, `POST /users/roles` created a temporary role, and `PATCH /users/roles/:id` updated its permissions.
- Smoke test cleaned up the temporary staff login, staff profile, role, role permissions, and related audit logs.
- `npm run build --workspaces` passed.
- `npm audit --audit-level=high` passed with 0 vulnerabilities.

## Phase 10 - Shift Management

Status: Completed

Completed:
- Added a `ShiftsModule` API module for cashier drawer sessions.
- Added shift API support with `GET /shifts`, `POST /shifts/open`, `PATCH /shifts/:id/close`, and `PATCH /shifts/:id/recalculate`.
- Added validation for opening cash, terminal device, counted cash, expenses, and shift notes.
- Added automatic staff profile creation for signed-in users that do not yet have a `Staff` record, including the seeded admin user.
- Added duplicate-open-shift protection per staff member.
- Added permission-aware shift management: staff can manage their own shift, while closing or recalculating another user's shift requires `shift.close.other`.
- Added shift close calculations for cash sales, card/wallet sales, customer credit sales, expected cash, counted cash, expenses, and cash difference.
- Added shift audit logs for open, close, and recalculate actions.
- Added desktop Shift route and sidebar navigation item.
- Added Shift Management desktop page with live current-shift summary, cash tiles, shift metrics, open-shift popup, close-shift popup, shift history, close action, and recalculate action.

Files changed:
- `apps/api/src/app.module.ts`
- `apps/api/src/modules/shifts/**`
- `apps/desktop/src/renderer/src/components/app-shell.tsx`
- `apps/desktop/src/renderer/src/pages/shifts/**`
- `apps/desktop/src/renderer/src/router.tsx`
- `README.md`
- `progress.md`

Database changes:
- No schema migration required; the existing `Shift`, `Staff`, `OrderPayment`, and `AuditLog` tables support the workflow.

Tests:
- `npm run typecheck --workspace @restaurantos/api` passed.
- `npm run typecheck --workspace @restaurantos/desktop` passed.
- `npm run typecheck --workspaces` passed.
- Runtime smoke test passed: admin created a temporary staff login, temporary staff logged in, `POST /shifts/open` opened a shift with `2000` opening cash, `GET /shifts` returned it as the active shift, and `PATCH /shifts/:id/close` closed it with `1900` counted cash, `50` expenses, `1950` expected cash, and `-50` difference.
- Smoke test cleaned up the temporary staff login, staff profile, shift, and related audit logs.
- `npm run build --workspaces` passed.
- `npm audit --audit-level=high` passed with 0 vulnerabilities.

## Desktop Form Readability Pass

Status: Completed

Completed:
- Added a reusable desktop `FormField` component with always-visible labels and optional helper text.
- Removed placeholder-based labels from desktop pages and popups.
- Updated Customer, Table, Menu, Inventory, Staff, Shift, and POS search inputs to show labels outside the fields.
- Simplified user-facing form wording for non-technical restaurant staff, such as `Money owed now`, `Cash at start`, `Cash counted`, `Selling price`, `Stock item`, and `How paid`.
- Kept existing business logic, API contracts, and database names unchanged.

Files changed:
- `apps/desktop/src/renderer/src/components/form-field.tsx`
- `apps/desktop/src/renderer/src/pages/customers/index.tsx`
- `apps/desktop/src/renderer/src/pages/inventory/index.tsx`
- `apps/desktop/src/renderer/src/pages/menu/index.tsx`
- `apps/desktop/src/renderer/src/pages/pos/index.tsx`
- `apps/desktop/src/renderer/src/pages/shifts/index.tsx`
- `apps/desktop/src/renderer/src/pages/tables/index.tsx`
- `apps/desktop/src/renderer/src/pages/users/index.tsx`

Tests:
- `rg "placeholder=" apps/desktop/src/renderer/src/pages apps/desktop/src/renderer/src/components -n` returned no matches.
- `npm run typecheck --workspace @restaurantos/desktop` passed.
- `npm run build --workspaces` passed.
- `npm audit --audit-level=high` passed with 0 vulnerabilities.

## Phase 11 - POS Order Builder, Payment Flow, and OS Printer Bridge

Status: Completed

Completed:
- Added `GET /menu/pos` for active cashier menu categories and items.
- Updated order creation to price draft orders from active menu item prices instead of zero-value demo lines.
- Added cashier user tracking on created orders.
- Added `POST /orders/:id/payments` for recording order payments.
- Added payment validation to block overpayment and invalid order states.
- Added order status updates to `PAYMENT_PENDING` or `COMPLETED` based on paid amount.
- Added table cleanup transition after a fully paid dine-in table order.
- Replaced the desktop POS demo item grid with real API-loaded menu categories and menu items.
- Added POS category filter, search, cart quantity changes, real totals, create order, send to kitchen, payment popup, and receipt print popup.
- Added Electron printer bridge for OS-installed printers with `restaurantos.printers.list()` and `restaurantos.printers.printReceipt(...)`.
- Added receipt HTML generation for 80mm thermal receipt printing through Electron.
- Documented thermal printer scope: OS-installed USB/network thermal printers are supported now; direct ESC/POS raw USB/LAN/Bluetooth support is planned as the next hardware layer.

Files changed:
- `apps/api/src/modules/menu/menu.controller.ts`
- `apps/api/src/modules/menu/menu.service.ts`
- `apps/api/src/modules/orders/orders.controller.ts`
- `apps/api/src/modules/orders/orders.service.ts`
- `apps/desktop/src/main/main.ts`
- `apps/desktop/src/preload/preload.ts`
- `apps/desktop/src/renderer/src/vite-env.d.ts`
- `apps/desktop/src/renderer/src/pages/pos/**`
- `apps/desktop/src/renderer/src/store/use-pos-store.ts`
- `README.md`
- `progress.md`

Database changes:
- No schema migration required; existing `Order`, `OrderItem`, `OrderPayment`, `MenuItem`, and `Table` tables support the workflow.

Tests:
- `npm run typecheck --workspace @restaurantos/api` passed.
- `npm run typecheck --workspace @restaurantos/desktop` passed.
- `npm run typecheck --workspaces` passed.
- Runtime smoke test passed: admin login returned `201`, `GET /menu/pos` returned active items, `POST /orders` created a priced order for two Smash Beef Burgers with `1900` total, and `POST /orders/:id/payments` recorded one cash payment and returned `COMPLETED`.
- Smoke test cleaned up the temporary order, order item, payment, and related kitchen records.
- `npm run build --workspaces` passed.
- `npm audit --audit-level=high` passed with 0 vulnerabilities.

## Phase 12 - Direct Thermal Printer and Cash Drawer Support

Status: Completed

Completed:
- Added raw ESC/POS printing in the Electron main process without adding older printer libraries.
- Added network ESC/POS support over TCP/IP with default thermal printer port `9100`.
- Added local device-path ESC/POS support for Linux USB device paths, Linux Bluetooth serial paths, Windows COM paths, and OS-exposed shared printer paths.
- Added ESC/POS receipt initialization, plain text receipt body, partial cut command, and optional cash drawer pulse after print.
- Added standalone cash drawer kick IPC for printer-connected cash drawers.
- Exposed `restaurantos.printers.printEscPos(...)` and `restaurantos.cashDrawer.kick(...)` through the preload bridge.
- Expanded the POS print popup with printer type selection: Installed printer, Network ESC/POS, and USB/Bluetooth device path.
- Added POS fields for printer IP address, port, device path, open drawer after print, and standalone open cash drawer action.
- Kept installed OS printer support from Phase 11 for printers that work best through Windows/Linux drivers.

Files changed:
- `apps/desktop/src/main/main.ts`
- `apps/desktop/src/preload/preload.ts`
- `apps/desktop/src/renderer/src/vite-env.d.ts`
- `apps/desktop/src/renderer/src/pages/pos/index.tsx`
- `README.md`
- `progress.md`

Database changes:
- None.

Tests:
- `npm run typecheck --workspace @restaurantos/desktop` passed.
- `npm run typecheck --workspaces` passed.
- `npm run build --workspaces` passed.
- `npm audit --audit-level=high` passed with 0 vulnerabilities.

Notes:
- Real printer/drawer firing was not tested because no specific printer hardware was provided in this session.
- Some printers require a driver, correct code page, paper width setting, or ESC/POS mode enabled on the printer itself.
- A future terminal hardware settings phase should save printer profiles per terminal so staff do not enter IP addresses or device paths every time.

## POS Receipt Preview and Shortcut Planning

Status: Completed

Completed:
- Added a receipt preview panel inside the POS print popup so the cashier checks the receipt before sending it to the printer.
- Added POS shortcut card hints for `F6` receipt preview, `F7` payment, and `P` print from preview.
- Updated `README.md` so future keyboard shortcut work reserves `F6` for preview, `P` for printing from the preview, and `F7` for payment.

Files changed:
- `apps/desktop/src/renderer/src/pages/pos/index.tsx`
- `README.md`
- `progress.md`

Tests:
- `npm run typecheck --workspace @restaurantos/desktop` passed.
- `npm run build --workspaces` passed.
- `npm audit --audit-level=high` passed with 0 vulnerabilities.

## Phase 13 - Terminal Hardware Settings

Status: Completed

Completed:
- Added terminal hardware settings to the desktop Settings page for terminal name, receipt printer type, installed printer name, network IP/port, device path, and opening the cash drawer after printing.
- Saved terminal hardware values through the existing authenticated settings API, without a database migration.
- Seeded default terminal hardware settings for fresh development installs.
- Updated the POS print popup to load saved printer defaults once on screen load.
- Documented terminal hardware settings in `README.md`.

Files changed:
- `apps/api/prisma/seed.ts`
- `apps/desktop/src/renderer/src/pages/settings/index.tsx`
- `apps/desktop/src/renderer/src/pages/pos/index.tsx`
- `README.md`
- `progress.md`

Database changes:
- No schema migration required; uses existing `Setting` key/value records.

Tests:
- `npm run typecheck --workspace @restaurantos/desktop` passed.
- `npm run typecheck --workspace @restaurantos/api` passed.
- `npm run build --workspaces` passed.
- `npm audit --audit-level=high` passed with 0 vulnerabilities.

Notes:
- This phase stores one default terminal hardware profile. Later, a multi-terminal/device phase can add separate profiles per physical cashier machine.

## POS Module Cleanup

Status: Completed

Completed:
- Split POS receipt HTML/text builders into `apps/desktop/src/renderer/src/pages/pos/receipt.ts`.
- Moved shared POS money formatting into `apps/desktop/src/renderer/src/pages/pos/formatting.ts`.
- Moved printer setting readers into `apps/desktop/src/renderer/src/pages/pos/settings.ts`.
- Moved POS payment and print receipt modals into `apps/desktop/src/renderer/src/pages/pos/components.tsx`.
- Reduced `apps/desktop/src/renderer/src/pages/pos/index.tsx` from 696 lines to under 500 lines.
- Added a code organization rule in `README.md` to keep new and touched files under 500 lines where practical.

Files changed:
- `apps/desktop/src/renderer/src/pages/pos/index.tsx`
- `apps/desktop/src/renderer/src/pages/pos/components.tsx`
- `apps/desktop/src/renderer/src/pages/pos/formatting.ts`
- `apps/desktop/src/renderer/src/pages/pos/interfaces.ts`
- `apps/desktop/src/renderer/src/pages/pos/receipt.ts`
- `apps/desktop/src/renderer/src/pages/pos/settings.ts`
- `README.md`
- `progress.md`

Tests:
- `npm run typecheck --workspace @restaurantos/desktop` passed.
- `npm run build --workspaces` passed.
- `npm audit --audit-level=high` passed with 0 vulnerabilities.

Notes:
- Existing older desktop files still above 500 lines: `apps/desktop/src/renderer/src/pages/inventory/index.tsx` and `apps/desktop/src/renderer/src/pages/menu/index.tsx`. These should be split when we next touch those modules.

## Phase 14 - POS Keyboard Workflow

Status: Completed

Completed:
- Added a modular `usePosShortcuts` hook for cashier POS keyboard handling.
- Wired `F2` to focus and select the item search box.
- Wired `F5` to send the current cart/order to kitchen when available.
- Wired `F6` and `Ctrl + P` to open receipt preview before printing.
- Wired `F7` to open the payment popup when a cart exists.
- Wired `F10` to navigate to the table screen.
- Wired `P` to print only when the receipt preview is open and the cashier is not typing in a field.
- Wired `Esc` to close POS popups.
- Wired `Ctrl + D`, `Ctrl + T`, and `Ctrl + I` for delivery, takeaway, and dine-in order modes.
- Moved the POS shortcut card into `apps/desktop/src/renderer/src/pages/pos/components.tsx` to keep the page file under 500 lines.
- Updated `README.md` with current implemented POS keyboard shortcuts and remaining planned shortcuts.

Files changed:
- `apps/desktop/src/renderer/src/pages/pos/index.tsx`
- `apps/desktop/src/renderer/src/pages/pos/components.tsx`
- `apps/desktop/src/renderer/src/pages/pos/shortcuts.ts`
- `apps/desktop/src/renderer/src/store/use-pos-store.ts`
- `README.md`
- `progress.md`

Tests:
- `npm run typecheck --workspace @restaurantos/desktop` passed.
- `npm run build --workspaces` passed.
- `npm audit --audit-level=high` passed with 0 vulnerabilities.

Notes:
- `F1`, hold/recall, discount, selected-line `+/-`, delete selected item, enter confirm, and arrow-key navigation remain planned until those workflows have explicit selected state and confirmation behavior.

## POS Search Quick Add

Status: Completed

Completed:
- Added numbered badges to the first nine visible POS menu items after category/search filtering.
- Added quick-add shortcut handling for numbered visible menu items.
- Wired `Alt + 1..9` as the primary item preview shortcut.
- Wired `Shift + 1..9` while search is focused for fast cashier item preview after pressing `F2`.
- Wired `Ctrl + 1..9` as an additional item preview path.
- Wired `Enter` from the search box to preview the first visible item.
- Updated the Help section and `README.md` with the quick-add behavior.

Files changed:
- `apps/desktop/src/renderer/src/pages/pos/index.tsx`
- `apps/desktop/src/renderer/src/pages/pos/components.tsx`
- `apps/desktop/src/renderer/src/pages/pos/shortcuts.ts`
- `README.md`
- `progress.md`

Tests:
- `npm run typecheck --workspace @restaurantos/desktop` passed.
- `npm run build --workspaces` passed.
- `npm audit --audit-level=high` passed with 0 vulnerabilities.

## POS Help Section and Quick-Add Confirmation

Status: Completed

Completed:
- Removed the POS shortcut card from the ticket panel.
- Added a dedicated Help sidebar section for app shortcuts and useful cashier tips.
- Added `apps/desktop/src/renderer/src/pages/help/index.tsx`.
- Changed numbered POS item shortcuts from instant add to visual confirmation popup.
- Pressing `Alt + 1..9`, `Shift + 1..9` while search is focused, or `Ctrl + 1..9` now previews the matching numbered item.
- Pressing `Enter` while the item preview popup is open adds the item to the ticket.
- Pressing `Enter` while search is focused previews the first visible item.
- Kept quick-add disabled while payment or print popups are open.

Files changed:
- `apps/desktop/src/renderer/src/components/app-shell.tsx`
- `apps/desktop/src/renderer/src/pages/help/index.tsx`
- `apps/desktop/src/renderer/src/pages/pos/components.tsx`
- `apps/desktop/src/renderer/src/pages/pos/index.tsx`
- `apps/desktop/src/renderer/src/pages/pos/shortcuts.ts`
- `apps/desktop/src/renderer/src/router.tsx`
- `README.md`
- `progress.md`

Tests:
- `npm run typecheck --workspace @restaurantos/desktop` passed.
- `npm run build --workspaces` passed.
- `npm audit --audit-level=high` passed with 0 vulnerabilities.

## Phase 15 - Order Correction and Void Flow

Status: Completed

Completed:
- Added `PATCH /orders/:id/void` for cancelling or voiding unpaid orders with a required reason.
- Added `PATCH /orders/:id/items/:itemId/void` for voiding one unpaid order item with a required reason.
- Added audit logs for order and item correction actions.
- Added recipe stock restore movements for voided sent-to-kitchen items using `ORDER_CANCELLATION_RESTORE`.
- Updated kitchen ticket/item rows to `CANCELLED` when an order or item is voided.
- Added a kitchen websocket cancellation event and removed cancelled items from the kitchen screen.
- Added POS correction popup for created orders/items with reason capture.
- Kept local cart mistakes simple: before an order exists, the trash button removes the cart line immediately.
- Added a Void order button for unpaid active orders.
- Documented correction endpoints and cashier tips.

Files changed:
- `apps/api/src/modules/inventory/inventory.service.ts`
- `apps/api/src/modules/kitchen/kitchen.gateway.ts`
- `apps/api/src/modules/orders/orders.controller.ts`
- `apps/api/src/modules/orders/orders.service.ts`
- `apps/desktop/src/renderer/src/pages/help/index.tsx`
- `apps/desktop/src/renderer/src/pages/pos/components.tsx`
- `apps/desktop/src/renderer/src/pages/pos/index.tsx`
- `apps/desktop/src/renderer/src/pages/pos/interfaces.ts`
- `apps/kitchen-web/src/pages/kitchen-page.tsx`
- `README.md`
- `progress.md`

Database changes:
- No schema migration required; existing order statuses, item statuses, stock movement reasons, and audit logs support this phase.

Tests:
- `npm run typecheck --workspace @restaurantos/api` passed.
- `npm run typecheck --workspace @restaurantos/desktop` passed.
- `npm run typecheck --workspace @restaurantos/kitchen-web` passed.
- `npm run build --workspaces` passed.
- `npm audit --audit-level=high` passed with 0 vulnerabilities.

Notes:
- Paid/completed orders are intentionally blocked from this flow. They need a separate refund flow.

## Planned Next Phases

Status: Planned

Recommended sequence:

### Phase 16 - Orders History and Order Lookup

Goal:
- Make created orders visible and searchable after they leave the active POS ticket.

Scope:
- Add a desktop Orders section in the sidebar.
- Show today's orders first.
- Filter by status: draft, sent to kitchen, payment pending, completed, cancelled, and voided.
- Search by order number.
- Open order detail with items, payment state, table/customer/delivery context, and correction status.
- Reprint bill or receipt from order detail.
- Use the Phase 15 correction endpoints from order detail for unpaid orders/items.
- Keep paid/completed order corrections blocked until refund flow exists.

Reason:
- Phase 15 added correction APIs and POS correction UI, but cashiers still need a proper place to find already-created orders later.

### Phase 17 - Dine-In Table Selection in POS

Goal:
- Make dine-in orders table-aware before send/payment.

Scope:
- When `DINE_IN` is selected, require table selection before kitchen send or payment.
- Show free tables in a fast picker from the POS.
- Link selected table to the order.
- Show selected table on the POS ticket, receipt, order detail, and kitchen ticket.
- Update table status through the order lifecycle.
- Allow manager override later if a dine-in order truly has no table.

Reason:
- Dine-in payment without a table makes floor operations and later corrections hard to track.

### Phase 18 - Delivery Assignment

Goal:
- Make delivery orders rider-aware without slowing takeaway or dine-in orders.

Scope:
- When `DELIVERY` is selected, show an optional delivery rider dropdown.
- Display the rider's saved phone number after selection.
- Allow cashier to override delivery phone/address for that order.
- Store delivery context on the order for future dispatch and settlement workflows.
- Keep `TAKEAWAY` simple: no table and no rider required.

Reason:
- Delivery needs separate rider/contact context, while takeaway should remain a quick bill-and-print flow.
