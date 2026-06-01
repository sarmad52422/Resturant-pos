import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiFetch } from '../lib/api';

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  roleId: string;
  role: string;
  permissions: string[];
}

interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

interface AuthState {
  accessToken?: string;
  user?: AuthUser;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      loading: false,
      login: async (username, password) => {
        set({ loading: true });
        try {
          const result = await apiFetch<LoginResponse>(
            '/auth/login',
            {
              method: 'POST',
              body: JSON.stringify({ username, password }),
            },
            undefined,
          );
          set({ accessToken: result.accessToken, user: result.user, loading: false });
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },
      refreshProfile: async () => {
        const { accessToken } = get();
        if (!accessToken) return;
        set({ loading: true });
        try {
          const result = await apiFetch<{ user: AuthUser }>('/auth/me', undefined, accessToken);
          set({ user: result.user, loading: false });
        } catch (error) {
          set({ accessToken: undefined, user: undefined, loading: false });
          throw error;
        }
      },
      logout: async () => {
        const { accessToken } = get();
        try {
          if (accessToken) {
            await apiFetch('/auth/logout', { method: 'POST' }, accessToken);
          }
        } finally {
          set({ accessToken: undefined, user: undefined, loading: false });
        }
      },
      hasPermission: (permission) => get().user?.permissions.includes(permission) ?? false,
    }),
    {
      name: 'restaurantos-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
      }),
    },
  ),
);
