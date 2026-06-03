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

## Authentication

The API uses JWT bearer authentication and database-backed role permissions.

Current auth endpoints:

- `POST /auth/login` - Sign in with username and password. Returns `accessToken` and user profile.
- `GET /auth/me` - Hydrate the current user from a bearer token.
- `POST /auth/logout` - Records logout in the audit log and returns success.

Use authenticated requests with:

```txt
Authorization: Bearer <accessToken>
```

Seeded roles:

- Admin
- Manager
- Cashier
- Waiter
- Chef
- Delivery Rider
- Accountant

Seeded sensitive permissions:

- `order.void`
- `order.refund`
- `order.discount.large`
- `order.edit.completed`
- `stock.adjust`
- `ledger.delete`
- `shift.close.other`
- `settings.update`
- `menu.manage`
- `recipe.manage`
- `customer.manage`
- `inventory.manage`
- `table.manage`
- `user.manage`
- `report.view.profit`

The desktop app now opens at the login screen when no saved session exists. Successful login stores the token locally for the desktop session and protected app routes. Logout clears the local session.

## Settings Module

Current settings endpoints:

- `GET /settings` - Returns all restaurant settings for the signed-in user.
- `PATCH /settings` - Bulk updates settings and writes an audit log. Requires `settings.update`.

Seeded setting groups:

- Business profile: name, branch, phone, address, currency.
- Tax defaults: default tax percent and service charge percent.
- Receipt defaults: footer text and customer copy printing.
- Operations policy: low stock threshold, kitchen delay timer, and opening cash float requirement.

The desktop Settings page uses TanStack Query for loading/saving, React Hook Form with Zod validation for edits, and the current permission model to prevent unauthorized saves.

## Admin Workspaces

Current admin endpoints:

- `GET /menu` - Lists menu categories, menu items, kitchen stations, and catalog metrics.
- `POST /menu/categories` - Creates a menu category. Requires `menu.manage`.
- `PATCH /menu/categories/:id` - Updates a menu category. Requires `menu.manage`.
- `POST /menu/items` - Creates a menu item. Requires `menu.manage`.
- `PATCH /menu/items/:id` - Updates a menu item. Requires `menu.manage`.
- `GET /menu/recipes` - Lists recipe formulas, active menu items, stock items, units, and recipe metrics.
- `POST /menu/recipes` - Creates a stock recipe for a menu item. Requires `recipe.manage`.
- `PATCH /menu/recipes/:id` - Replaces a recipe formula and ingredient rows. Requires `recipe.manage`.
- `GET /customers` - Lists customers with credit and order metrics.
- `POST /customers` - Creates a customer profile. Requires `customer.manage`.
- `PATCH /customers/:id` - Updates a customer profile. Requires `customer.manage`.
- `GET /inventory` - Lists stock items, units, suppliers, and stock metrics.
- `POST /inventory/items` - Creates a stock item. Requires `inventory.manage`.
- `PATCH /inventory/items/:id` - Updates a stock item. Requires `inventory.manage`.
- `GET /inventory/purchases` - Lists recent purchase receiving entries with suppliers and stock items.
- `POST /inventory/purchases` - Receives purchased stock, updates item cost/quantity, and supplier payable. Requires `inventory.manage`.
- `GET /inventory/suppliers` - Lists supplier accounts with recent ledger and purchase summaries.
- `POST /inventory/suppliers` - Creates a supplier account with optional opening payable. Requires `inventory.manage`.
- `PATCH /inventory/suppliers/:id` - Updates supplier contact details. Requires `inventory.manage`.
- `POST /inventory/suppliers/:id/payments` - Records a supplier payment and reduces payable. Requires `inventory.manage`.

The desktop Menu, Customers, and Inventory pages now use these endpoints for real operational tables, compact create forms, permission-aware editable states, and active/hidden toggles where applicable.

The Inventory page includes a purchase receiving popup. Receiving stock creates `PURCHASE` stock movements, updates current stock, updates last purchase cost, recalculates weighted average cost, and increases supplier payable for any unpaid balance.

The Inventory page also includes supplier account management. Admin users can add suppliers, view payable balances and recent ledger activity, and record supplier payments from a popup.

The Menu page includes a recipe builder powered by React Hook Form and Zod. Recipes link sellable menu items to stock ingredients and estimate ingredient cost from inventory average cost and conversion rate.

## Recipe Stock Deduction

Recipe-linked order items deduct stock when an order is sent to kitchen through:

- `PATCH /orders/:id/send-to-kitchen`

The deduction writes `SALE_DEDUCTION` stock movements with `referenceType=OrderItem`. The operation is idempotent per order item, so sending the same order to kitchen again will not double-deduct stock. Ingredient movements keep the recipe unit, while stock balance decrements are converted through the inventory item conversion rate when the recipe uses the item's usage unit.

## Table System

Current table endpoints:

- `GET /tables` - Lists active dining areas, tables, current open order, reservation preview, and floor metrics.
- `POST /tables` - Creates a table. Requires `table.manage`.
- `PATCH /tables/:id` - Updates table metadata. Requires `table.manage`.
- `PATCH /tables/:id/status` - Updates table status. Requires `table.manage`.
- `POST /tables/:id/start-order` - Starts or returns an open dine-in draft order. Requires `order.create`.

Seeded table areas:

- Main Hall
- Family Room
- Patio

The desktop Tables page provides area filters, top-down visual table cards with chairs, covers/availability metrics, quick clean/free/reserve controls, dine-in order start, and a compact create-table form.

## Brand Theme

The shared theme foundation lives in:

- `packages/shared/src/brand-theme.css` - CSS variables used by desktop and kitchen UI.
- `packages/shared/src/brand-theme.ts` - TypeScript brand metadata and fixed shell colors.

Desktop and kitchen Tailwind configs map colors to the shared CSS variables, so components should use semantic classes like `bg-primary`, `bg-secondary`, `text-muted`, `bg-sage`, and `text-espresso` instead of hard-coded hex values.

Planned developer-only branding settings:

- App/client display name.
- App initials and icon assets.
- Primary/secondary color palette.
- Receipt/app logo.
- Theme preset export/import for future clients.

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

## Desktop Usage

The desktop POS runs as a frameless Electron app. Window controls are inside the custom top bar:

- Minimize button: top-right minus icon.
- Maximize/restore button: top-right square icon.
- Close button: top-right X icon.

The POS screen includes a shortcut card in the order panel. It is a compact reference for the cashier during rush hours and will grow as workflows are implemented.

## Shortcuts

Current app window shortcuts:

- `Ctrl + Shift + M` - Minimize the desktop app.
- `Ctrl + Shift + F` - Maximize or restore the desktop app.
- `Ctrl + Shift + Q` - Close the desktop app.

On macOS builds these are also handled with `Cmd` in place of `Ctrl`.

Current POS visual shortcut hints:

- `F2` - Focus/search item flow.
- `F5` - Send to kitchen flow.
- `F7` - Payment flow.
- `F10` - Open table screen.

Planned POS workflow shortcuts:

- `F1` - New order.
- `F2` - Search item.
- `F3` - Hold order.
- `F4` - Recall held order.
- `F5` - Send to kitchen.
- `F6` - Print bill.
- `F7` - Payment.
- `F8` - Customer credit.
- `F9` - Discount.
- `F10` - Table screen.
- `Ctrl + N` - New customer.
- `Ctrl + P` - Print receipt.
- `Ctrl + S` - Save order.
- `Ctrl + D` - Delivery mode.
- `Ctrl + T` - Takeaway mode.
- `Ctrl + I` - Dine-in mode.
- `Enter` - Select or confirm.
- `Esc` - Back or cancel.
- `Delete` - Remove selected item.
- `+` - Increase quantity.
- `-` - Decrease quantity.
- Arrow keys - Navigate grids, tickets, tables, and lists.

Implementation note: POS workflow shortcuts should be wired in a dedicated keyboard workflow phase after the real order, payment, hold/recall, table, and print flows are implemented. Current shortcut labels are UI hints unless listed under current app window shortcuts.

Future admin shortcuts will be documented here as modules are implemented.

Planned admin modal shortcuts:

- Open new menu item popup.
- Open new recipe popup.
- Open new stock item popup.
- Open new supplier popup.
- Open supplier payment popup.
- Open new customer popup.
- Open new table popup.

## Product Direction

The desktop app owns cashier workflows and the admin area in one Electron application. The kitchen screen is intentionally separate and only shows live production information needed by chefs and packing staff.

The current visual system uses pure white surfaces, primary/secondary teal theme variables, borderless app chrome, moderate rounded corners, dense operational layouts, keyboard-friendly sizing, and clear status colors.
