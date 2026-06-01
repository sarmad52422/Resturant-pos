# RestaurantOS POS

RestaurantOS POS is an in-house restaurant, cafe, juice bar, burger, pizza, and fast-food platform.

## Architecture

- `apps/desktop` - Electron + React + TypeScript + TailwindCSS desktop POS.
- `apps/api` - NestJS + Prisma + PostgreSQL backend with WebSocket gateway.
- `apps/kitchen-web` - Separate React kitchen screen for browser, tablet, kitchen PC, and TV.
- `packages/shared` - Shared TypeScript contracts, permissions, enums, and domain helpers.
- `packages/ui` - Shared React UI primitives styled for the RestaurantOS warm premium interface.

## Requirements

- Node.js 22+
- npm 10+
- Docker Desktop or Docker Engine
- PostgreSQL 16, provided by `docker-compose.yml`

## Setup

```bash
cd restaurantos-pos
cp .env.example .env
npm install
docker compose up -d
npm run prisma:generate
npm run db:migrate
npm run db:seed
```

Seeded development login:

- Username: `admin`
- Password: `Admin@12345`

## Development

```bash
npm run dev:api
npm run dev:desktop
npm run dev:kitchen
```

Default ports:

- API: `http://localhost:4300`
- Desktop renderer dev server: `http://localhost:5173`
- Kitchen web: `http://localhost:5174`
- PostgreSQL: `localhost:5433`

## Product Direction

The desktop app owns cashier workflows and the admin area in one Electron application. The kitchen screen is intentionally separate and only shows live production information needed by chefs and packing staff.

The first visual system uses warm white surfaces, restrained orange accents, dense operational layouts, keyboard-friendly sizing, and clear status colors.
