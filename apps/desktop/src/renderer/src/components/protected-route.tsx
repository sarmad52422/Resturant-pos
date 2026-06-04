import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/use-auth-store';

export function ProtectedRoute() {
  const { accessToken, user, loading, refreshProfile } = useAuthStore();

  useEffect(() => {
    if (accessToken && !user && !loading) {
      void refreshProfile();
    }
  }, [accessToken, loading, refreshProfile, user]);

  if (!accessToken) return <Navigate to="/login" replace />;

  if (loading && !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-white text-sm font-black uppercase tracking-[0.24em] text-secondary">
        Loading session
      </div>
    );
  }

  return <Outlet />;
}
