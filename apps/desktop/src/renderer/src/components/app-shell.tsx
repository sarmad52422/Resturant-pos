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
  Table2,
  X,
  LogOut,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/use-auth-store';

const navItems = [
  { to: '/', label: 'POS', icon: ShoppingBag },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/menu', label: 'Menu', icon: ChefHat },
  { to: '/inventory', label: 'Inventory', icon: Boxes },
  { to: '/customers', label: 'Credit', icon: CreditCard },
  { to: '/tables', label: 'Tables', icon: Table2 },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function AppShell() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-white pt-9 text-espresso">
      <div className="fixed inset-x-0 top-0 z-50 flex h-9 items-center justify-between bg-white px-3 shadow-[0_8px_26px_rgb(var(--ro-secondary-rgb)/0.05)] [-webkit-app-region:drag]">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-secondary">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary text-[10px] text-white">
            RO
          </span>
          RestaurantOS POS
        </div>
        <div className="flex items-center gap-1 [-webkit-app-region:no-drag]">
          <button
            className="flex h-7 w-8 items-center justify-center rounded-lg text-muted hover:bg-mint hover:text-secondary"
            onClick={() => window.restaurantos.window.minimize()}
            aria-label="Minimize"
            title="Minimize (Ctrl+Shift+M)"
          >
            <Minus size={15} />
          </button>
          <button
            className="flex h-7 w-8 items-center justify-center rounded-lg text-muted hover:bg-mint hover:text-secondary"
            onClick={() => window.restaurantos.window.maximize()}
            aria-label="Maximize"
            title="Maximize (Ctrl+Shift+F)"
          >
            <Square size={13} />
          </button>
          <button
            className="flex h-7 w-8 items-center justify-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600"
            onClick={() => window.restaurantos.window.close()}
            aria-label="Close"
            title="Close (Ctrl+Shift+Q)"
          >
            <X size={16} />
          </button>
        </div>
      </div>
      <div className="flex h-[calc(100vh-2.25rem)] bg-white">
        <aside className="flex w-28 shrink-0 flex-col items-center bg-white px-4 py-5 shadow-[14px_0_40px_rgb(var(--ro-secondary-rgb)/0.05)]">
          <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-lg font-black text-white shadow-[0_18px_40px_rgb(var(--ro-secondary-rgb)/0.16)]">
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
                    'group flex h-16 w-full flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-semibold transition',
                    isActive
                      ? 'bg-primary text-white shadow-[0_14px_28px_rgb(var(--ro-primary-rgb)/0.26)]'
                      : 'text-muted hover:bg-mint hover:text-secondary',
                  ].join(' ')
                }
              >
                <item.icon size={21} strokeWidth={2.2} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="flex w-full flex-col items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sage text-sm font-black text-secondary">
              {user?.name
                .split(' ')
                .map((part) => part[0])
                .join('')
                .slice(0, 2) ?? <Users size={20} />}
            </div>
            <button
              className="flex h-11 w-11 items-center justify-center rounded-2xl text-muted hover:bg-red-50 hover:text-red-600"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </aside>
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
