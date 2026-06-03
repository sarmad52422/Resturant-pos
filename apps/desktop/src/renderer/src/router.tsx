import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from './components/app-shell';
import { ProtectedRoute } from './components/protected-route';
import { CustomersPage } from './pages/customers';
import { DashboardPage } from './pages/dashboard';
import { InventoryPage } from './pages/inventory';
import { LoginPage } from './pages/login';
import { MenuPage } from './pages/menu';
import { PosPage } from './pages/pos';
import { ReportsPage } from './pages/reports';
import { SettingsPage } from './pages/settings';
import { TablesPage } from './pages/tables';

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
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'menu', element: <MenuPage /> },
          { path: 'inventory', element: <InventoryPage /> },
          { path: 'customers', element: <CustomersPage /> },
          { path: 'tables', element: <TablesPage /> },
          { path: 'reports', element: <ReportsPage /> },
          { path: 'settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
]);
