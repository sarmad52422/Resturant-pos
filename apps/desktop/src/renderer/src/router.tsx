import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from './components/app-shell';
import { ProtectedRoute } from './components/protected-route';
import { CustomersPage } from './pages/customers';
import { DashboardPage } from './pages/dashboard';
import { HelpPage } from './pages/help';
import { InventoryPage } from './pages/inventory';
import { LoginPage } from './pages/login';
import { MenuPage } from './pages/menu';
import { OrdersPage } from './pages/orders';
import { PosPage } from './pages/pos';
import { ReportsPage } from './pages/reports';
import { SettingsPage } from './pages/settings';
import { ShiftsPage } from './pages/shifts';
import { TablesPage } from './pages/tables';
import { UsersPage } from './pages/users';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <PosPage /> },
          { path: 'orders', element: <OrdersPage /> },
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'menu', element: <MenuPage /> },
          { path: 'inventory', element: <InventoryPage /> },
          { path: 'customers', element: <CustomersPage /> },
          { path: 'tables', element: <TablesPage /> },
          { path: 'users', element: <UsersPage /> },
          { path: 'shifts', element: <ShiftsPage /> },
          { path: 'reports', element: <ReportsPage /> },
          { path: 'settings', element: <SettingsPage /> },
          { path: 'help', element: <HelpPage /> },
        ],
      },
    ],
  },
]);
