# RestaurantOS POS

RestaurantOS POS is an in-house restaurant, cafe, juice bar, burger, pizza, and fast-food platform.

## Architecture

- `apps/desktop` - Electron + React + TypeScript + TailwindCSS desktop POS.
- `apps/api` - NestJS + Prisma + PostgreSQL backend with WebSocket gateway.
- `apps/kitchen-web` - Separate React kitchen screen for browser, tablet, kitchen PC, and TV.
- `packages/shared` - Shared TypeScript contracts, permissions, enums, and domain helpers.
- `packages/ui` - Shared React UI primitives styled for the RestaurantOS warm premium interface.

## Code Organization

- Keep screen files focused on page state, data loading, and layout.
- Move reusable builders, formatters, validation helpers, and setting readers into page-local helper files.
- Keep new and touched source files under 500 lines where practical. If a file must grow beyond that, split forms, modals, tables, and pure helpers before adding new features.
- Keep desktop server calls inside `apps/desktop/src/renderer/src/services`. Pages should use service methods with TanStack Query or the shared Axios hook instead of building URLs and request bodies inline.

## Desktop API Layer

Desktop API access is centralized around Axios:

- `apps/desktop/src/renderer/src/lib/api-client.ts` - Axios instance, API base URL, auth-token interceptor, and typed request helper.
- `apps/desktop/src/renderer/src/lib/api-error.ts` - Backend-aware error normalization for NestJS validation and `BadRequestException` responses.
- `apps/desktop/src/renderer/src/hooks/use-axios.ts` - Reusable `useAxios` hook for manual requests with `loading`, `error`, and `errorMessage`.
- `apps/desktop/src/renderer/src/services/*-service.ts` - Domain services for auth, POS, orders, tables, menu, inventory, customers, users, shifts, and settings.

Rule for new UI work: add or reuse a service method first, then call that service from the page/hook. Keep raw Axios details out of page components.

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
- Terminal hardware: cashier terminal name, receipt printer type, installed printer name, network printer IP/port, device path, and cash drawer after-print behavior.

The desktop Settings page uses TanStack Query for loading/saving, React Hook Form with Zod validation for edits, and the current permission model to prevent unauthorized saves.

## Admin Workspaces

Current admin endpoints:

- `GET /users` - Lists staff users, roles, permissions, and access metrics. Requires `user.manage`.
- `POST /users` - Creates a staff login and linked staff profile. Requires `user.manage`.
- `PATCH /users/:id` - Updates staff login active state, role, username, name, or phone. Requires `user.manage`.
- `PATCH /users/:id/password` - Sets a new staff password. Requires `user.manage`.
- `POST /users/roles` - Creates a role with selected permissions. Requires `user.manage`.
- `PATCH /users/roles/:id` - Updates role details and permission assignment. Requires `user.manage`.
- `GET /shifts` - Lists shift history, active shift, and shift metrics for the signed-in user.
- `POST /shifts/open` - Opens the signed-in staff member's cash drawer shift.
- `PATCH /shifts/:id/close` - Closes a shift with counted cash, expenses, and calculated difference. Closing another user's shift requires `shift.close.other`.
- `PATCH /shifts/:id/recalculate` - Recalculates payment totals for a shift. Managing another user's shift requires `shift.close.other`.
- `GET /menu/pos` - Lists active categories and active menu items for the cashier POS.
- `GET /orders` - Lists today's or all orders with optional status/search filters.
- `GET /orders/:id` - Returns order detail with items, payments, table, customer, and delivery context.
- `POST /orders` - Creates a priced draft order from active menu items. Dine-in orders require a free active table. Requires `order.create`.
- `PATCH /orders/:id/send-to-kitchen` - Sends order items to kitchen, deducts recipe stock, and marks the attached dine-in table as sent to kitchen. Requires `order.send_to_kitchen`.
- `POST /orders/:id/payments` - Records a payment and completes the order when fully paid. Requires `order.create`.
- `PATCH /orders/:id/void` - Cancels or voids an unpaid order with a required reason. Requires `order.void`.
- `PATCH /orders/:id/items/:itemId/void` - Voids one unpaid order item with a required reason. Requires `order.void`.
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

The desktop Staff, Menu, Customers, Inventory, and Orders pages now use these endpoints for real operational tables, compact popup forms, permission-aware editable states, lookup/detail workflows, and active/hidden toggles where applicable.

The Staff page includes staff login creation, role assignment, active/inactive controls, password reset, and role permission editing. The API blocks self-deactivation and prevents removing `user.manage` from your own active role.

The POS correction flow lets cashiers remove local cart lines before an order is created. Once an order exists, voiding an item or the full order requires a reason, writes an audit log, restores recipe stock for already-sent kitchen items, and removes cancelled kitchen tickets from the kitchen screen.

The Orders page lets cashiers search created orders, filter by date/status, view order detail, reprint receipts, and use unpaid order/item correction actions from a dedicated lookup workspace.

The Shift page includes opening cash, live payment buckets, close drawer workflow, counted cash, expenses, expected cash, and difference tracking. Shift totals read `OrderPayment` records between shift open and close times so the later payment workflow can feed the same screen.

The POS page loads real active menu items, builds a cart, creates priced orders, sends orders to kitchen, records payments, and prints receipts through Electron. Dine-in orders open a free-table picker before kitchen, payment, or receipt creation if no table is attached yet.

Thermal printer support currently includes:

- Installed Windows/Linux printers through the operating system print driver.
- Network ESC/POS printers over TCP/IP, usually port `9100`.
- Local device-path ESC/POS printers, such as `/dev/usb/lp0`, `/dev/rfcomm0`, `COM5`, or a shared printer path when exposed by the OS.
- Cash drawer kick through the ESC/POS drawer pulse command.

Printer note: some thermal printers need the correct OS driver, code page, paper width, or ESC/POS mode enabled in the printer settings. The Settings page now saves terminal printer defaults so staff do not enter IP/device path every time; a later multi-terminal phase can split this into separate profiles per physical cashier machine.

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

Dine-in lifecycle:

- Selecting a free table from POS attaches it to the order and marks it as waiting for order.
- Sending the order to kitchen marks the attached table as sent to kitchen.
- Fully paid dine-in orders mark the table as cleaning required.
- Voiding an unpaid dine-in order frees the table again.

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

The Help section stores app shortcuts and practical cashier tips in one place. The POS screen keeps the ticket panel focused on the active order.

## Shortcuts

Current app window shortcuts:

- `Ctrl + Shift + M` - Minimize the desktop app.
- `Ctrl + Shift + F` - Maximize or restore the desktop app.
- `Ctrl + Shift + Q` - Close the desktop app.

On macOS builds these are also handled with `Cmd` in place of `Ctrl`.

Current POS keyboard shortcuts:

- `F2` - Focus and select the item search box.
- `Enter` - Preview the first visible item while the search box is focused.
- `Alt + 1..9` - Preview the matching numbered visible menu item.
- `Shift + 1..9` - Preview the matching numbered visible menu item while search is focused.
- `Ctrl + 1..9` - Preview the matching numbered visible menu item.
- `Enter` - Add the item when the item preview popup is open.
- `F5` - Send the current cart/order to kitchen. Dine-in opens table selection first when needed.
- `F6` - Open receipt preview before printing. Dine-in opens table selection first when needed.
- `F7` - Open payment popup. Dine-in opens table selection first when needed.
- `F10` - Open table screen.
- `Ctrl + P` - Open receipt preview before printing.
- `P` - Print from the receipt preview when the preview is open and the cashier is not typing in a field.
- `Esc` - Close open POS popups.
- `Ctrl + D` - Switch order type to delivery.
- `Ctrl + T` - Switch order type to takeaway.
- `Ctrl + I` - Switch order type to dine-in.

Planned POS workflow shortcuts:

- `F1` - New order.
- `F3` - Hold order.
- `F4` - Recall held order.
- `F8` - Customer credit.
- `F9` - Discount.
- `Ctrl + N` - New customer.
- `Ctrl + S` - Save order.
- `Delete` - Remove selected item.
- `+` - Increase quantity.
- `-` - Decrease quantity.
- Arrow keys - Navigate grids, tickets, tables, and lists.

Implementation note: risky shortcuts such as new order, hold/recall, discounts, selected-line quantity changes, and arrow-key navigation should be wired when those flows have explicit selected state and confirmation behavior. Printing always opens the receipt preview first; the cashier can then press `P` from the preview to print.

Future admin shortcuts will be documented here as modules are implemented.

Planned admin modal shortcuts:

- Open new staff popup.
- Open new role popup.
- Open staff password popup.
- Open shift popup.
- Close shift popup.
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
