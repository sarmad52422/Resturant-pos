export interface Permission {
  id: string;
  code: string;
  description?: string;
}

export interface RolePermission {
  permission: Permission;
  permissionId: string;
  roleId: string;
}

export interface Role {
  id: string;
  description?: string;
  name: string;
  permissions: RolePermission[];
  _count?: {
    users: number;
  };
}

export interface StaffProfile {
  id: string;
  active: boolean;
  name: string;
  phone?: string;
}

export interface StaffUser {
  id: string;
  active: boolean;
  createdAt: string;
  name: string;
  role: Role;
  roleId: string;
  staff?: StaffProfile;
  username: string;
}

export interface UsersResponse {
  metrics: {
    activeUsers: number;
    inactiveUsers: number;
    permissions: number;
    roles: number;
  };
  permissions: Permission[];
  roles: Role[];
  users: StaffUser[];
}
