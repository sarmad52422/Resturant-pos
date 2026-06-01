import { NavLink, Outlet } from 'react-router-dom';
import {
  BarChart3,
  Boxes,
  ChefHat,
  CreditCard,
  LayoutDashboard,
  Settings,
  ShoppingBag,
  Users,
  Minus,
  Square,
  X,
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'POS', icon: ShoppingBag },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/menu', label: 'Menu', icon: ChefHat },
  { to: '/inventory', label: 'Inventory', icon: Boxes },
  { to: '/customers', label: 'Credit', icon: CreditCard },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function AppShell() {
  return (
    <div className="min-h-screen bg-canvas pt-9 text-espresso">
      <div className="fixed inset-x-0 top-0 z-50 flex h-9 items-center justify-between border-b border-orange-100 bg-white/95 px-3 shadow-sm [-webkit-app-region:drag]">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-orange-700">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-orange-600 text-[10px] text-white">
            RO
          </span>
          RestaurantOS POS
        </div>
        <div className="flex items-center gap-1 [-webkit-app-region:no-drag]">
          <button
            className="flex h-7 w-8 items-center justify-center rounded text-stone-500 hover:bg-orange-50 hover:text-orange-700"
            onClick={() => window.restaurantos.window.minimize()}
            aria-label="Minimize"
          >
            <Minus size={15} />
          </button>
          <button
            className="flex h-7 w-8 items-center justify-center rounded text-stone-500 hover:bg-orange-50 hover:text-orange-700"
            onClick={() => window.restaurantos.window.maximize()}
            aria-label="Maximize"
          >
            <Square size={13} />
          </button>
          <button
            className="flex h-7 w-8 items-center justify-center rounded text-stone-500 hover:bg-red-50 hover:text-red-600"
            onClick={() => window.restaurantos.window.close()}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>
      <div className="flex h-[calc(100vh-2.25rem)] bg-canvas">
        <aside className="flex w-24 shrink-0 flex-col items-center border-r border-orange-100 bg-white/90 px-3 py-5">
          <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-lg bg-orange-600 text-lg font-black text-white shadow-sm">
            RO
          </div>
          <nav className="flex w-full flex-1 flex-col gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  [
                    'group flex h-16 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-semibold transition',
                    isActive
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'text-stone-500 hover:bg-orange-50 hover:text-orange-700',
                  ].join(' ')
                }
              >
                <item.icon size={21} strokeWidth={2.2} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
          <Users className="text-stone-400" size={22} />
        </aside>
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
