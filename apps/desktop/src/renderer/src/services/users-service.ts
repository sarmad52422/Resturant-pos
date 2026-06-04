import { apiRequest } from '@/lib/api-client';
import type { Role, StaffUser, UsersResponse } from '@/pages/users/interfaces';

interface CreateUserInput {
  active: boolean;
  name: string;
  password: string;
  phone?: string;
  roleId: string;
  username: string;
}

interface RoleInput {
  description?: string;
  name: string;
  permissionIds: string[];
}

export type UpdateUserInput = Partial<Pick<StaffUser, 'active' | 'name' | 'roleId' | 'username'>> & {
  phone?: string;
};

export const usersService = {
  create: (input: CreateUserInput) => apiRequest<StaffUser>({ data: input, method: 'POST', url: '/users' }),
  list: () => apiRequest<UsersResponse>({ method: 'GET', url: '/users' }),
  saveRole: (input: RoleInput, roleId?: string) =>
    apiRequest<Role>({
      data: input,
      method: roleId ? 'PATCH' : 'POST',
      url: roleId ? `/users/roles/${roleId}` : '/users/roles',
    }),
  update: (userId: string, patch: UpdateUserInput) =>
    apiRequest<StaffUser>({ data: patch, method: 'PATCH', url: `/users/${userId}` }),
  updatePassword: (userId: string, password: string) =>
    apiRequest<StaffUser>({ data: { password }, method: 'PATCH', url: `/users/${userId}/password` }),
};
