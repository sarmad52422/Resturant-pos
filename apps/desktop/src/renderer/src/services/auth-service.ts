import { apiRequest } from '@/lib/api-client';
import type { AuthUser } from '@/store/use-auth-store';

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export const authService = {
  login: (username: string, password: string) =>
    apiRequest<LoginResponse>({
      data: { password, username },
      method: 'POST',
      url: '/auth/login',
    }),
  logout: (accessToken?: string) =>
    apiRequest({
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      method: 'POST',
      url: '/auth/logout',
    }),
  me: (accessToken?: string) =>
    apiRequest<{ user: AuthUser }>({
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      method: 'GET',
      url: '/auth/me',
    }),
};
