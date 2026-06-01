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

Status: In Progress

Completed:
- Added auth module, login endpoint, password hashing with `bcryptjs`, JWT issuing, seeded admin user, default roles, permissions, and audit log entry on login.
- Added permission decorator and permission guard foundation.

Files changed:
- `apps/api/src/modules/auth/**`
- `apps/api/src/common/decorators/permissions.decorator.ts`
- `apps/api/src/common/guards/permission.guard.ts`
- `apps/api/prisma/seed.ts`

Database changes:
- Seeded default roles and permissions.
- Seeded `admin` user with password `Admin@12345`.

Tests:
- `npm run typecheck --workspaces` passed.
- `npm run build --workspaces` passed.
- `POST /auth/login` smoke test returned a JWT for the seeded admin user.

Notes:
- JWT passport strategy, route protection, refresh/session policy, and desktop login screen are still required before Phase 3 can be marked completed.
- API dev server started at `http://localhost:4300`.
