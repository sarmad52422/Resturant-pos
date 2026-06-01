import { createBrowserRouter, Navigate } from 'react-router-dom';
import { KitchenPage } from './pages/kitchen-page';

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/kitchen/all" replace /> },
  { path: '/kitchen/:station', element: <KitchenPage /> },
]);
