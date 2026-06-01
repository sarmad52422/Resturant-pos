import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from './components/app-shell';
import { CustomersPage } from './pages/customers-page';
import { DashboardPage } from './pages/dashboard-page';
import { InventoryPage } from './pages/inventory-page';
import { MenuPage } from './pages/menu-page';
import { PosPage } from './pages/pos-page';
import { ReportsPage } from './pages/reports-page';
import { SettingsPage } from './pages/settings-page';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <PosPage /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'menu', element: <MenuPage /> },
      { path: 'inventory', element: <InventoryPage /> },
      { path: 'customers', element: <CustomersPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
]);
