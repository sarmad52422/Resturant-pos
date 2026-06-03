import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, KeyRound, Loader2, Plus, Power, ShieldCheck, UserCog, UserPlus, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Badge, Button, Card } from '@restaurantos/ui';
import { ActionModal } from '../../components/action-modal';
import { apiFetch } from '../../lib/api';
import type { FormSubmitEvent } from '../../lib/events';
import { useAuthStore } from '../../store/use-auth-store';
import type { Role, StaffUser, UsersResponse } from './interfaces';

const fieldClass =
  'h-11 w-full rounded-xl border border-field bg-white px-3 text-sm font-semibold text-espresso outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10';

export function UsersPage() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const canManageUsers = useAuthStore((state) => state.hasPermission('user.manage'));
  const [userOpen, setUserOpen] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState('');
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordUserId, setPasswordUserId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [roleOpen, setRoleOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState('');
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [rolePermissionIds, setRolePermissionIds] = useState<string[]>([]);

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: () => apiFetch<UsersResponse>('/users'),
  });

  const users = usersQuery.data?.users ?? [];
  const roles = usersQuery.data?.roles ?? [];
  const permissions = usersQuery.data?.permissions ?? [];
  const selectedRoleId = roleId || roles[0]?.id || '';
  const selectedPasswordUser = users.find((user) => user.id === passwordUserId);

  const groupedPermissions = useMemo(() => {
    return permissions.reduce<Record<string, typeof permissions>>((groups, permission) => {
      const group = permission.code.split('.')[0] ?? 'general';
      groups[group] = [...(groups[group] ?? []), permission];
      return groups;
    }, {});
  }, [permissions]);

  const createUser = useMutation({
    mutationFn: () =>
      apiFetch<StaffUser>('/users', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          username: username.trim(),
          phone: phone.trim() || undefined,
          password,
          roleId: selectedRoleId,
          active: true,
        }),
      }),
    onSuccess: () => {
      setName('');
      setUsername('');
      setPhone('');
      setPassword('');
      setRoleId('');
      setUserOpen(false);
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const updateUser = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Pick<StaffUser, 'active' | 'name' | 'roleId' | 'username'>> & { phone?: string } }) =>
      apiFetch<StaffUser>(`/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const updatePassword = useMutation({
    mutationFn: () =>
      apiFetch<StaffUser>(`/users/${passwordUserId}/password`, {
        method: 'PATCH',
        body: JSON.stringify({ password: newPassword }),
      }),
    onSuccess: () => {
      setPasswordUserId('');
      setNewPassword('');
      setPasswordOpen(false);
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const saveRole = useMutation({
    mutationFn: () =>
      apiFetch<Role>(editingRoleId ? `/users/roles/${editingRoleId}` : '/users/roles', {
        method: editingRoleId ? 'PATCH' : 'POST',
        body: JSON.stringify({
          name: roleName.trim(),
          description: roleDescription.trim() || undefined,
          permissionIds: rolePermissionIds,
        }),
      }),
    onSuccess: () => {
      resetRoleForm();
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  function submitUser(event: FormSubmitEvent) {
    event.preventDefault();
    if (name.trim() && username.trim() && password.length >= 8 && selectedRoleId) createUser.mutate();
  }

  function openPassword(user: StaffUser) {
    setPasswordUserId(user.id);
    setNewPassword('');
    setPasswordOpen(true);
  }

  function submitPassword(event: FormSubmitEvent) {
    event.preventDefault();
    if (passwordUserId && newPassword.length >= 8) updatePassword.mutate();
  }

  function openRole(role?: Role) {
    setEditingRoleId(role?.id ?? '');
    setRoleName(role?.name ?? '');
    setRoleDescription(role?.description ?? '');
    setRolePermissionIds(role?.permissions.map((entry) => entry.permission.id) ?? []);
    setRoleOpen(true);
  }

  function resetRoleForm() {
    setEditingRoleId('');
    setRoleName('');
    setRoleDescription('');
    setRolePermissionIds([]);
    setRoleOpen(false);
  }

  function togglePermission(permissionId: string) {
    setRolePermissionIds((ids) =>
      ids.includes(permissionId) ? ids.filter((id) => id !== permissionId) : [...ids, permissionId],
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-white p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-primary">Access control</p>
          <h1 className="mt-2 text-4xl font-black text-espresso">Staff & roles</h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold text-muted">
            Create staff logins, assign roles, and keep permissions controlled from the desktop app.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone={canManageUsers ? 'green' : 'orange'}>{canManageUsers ? 'Editable' : 'View only'}</Badge>
          <Button disabled={!canManageUsers} icon={<ShieldCheck size={17} />} variant="secondary" onClick={() => openRole()}>
            New role
          </Button>
          <Button disabled={!canManageUsers || roles.length === 0} icon={<UserPlus size={17} />} onClick={() => setUserOpen(true)}>
            New staff
          </Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-4 gap-4">
        <Metric icon={<Users size={19} />} label="Active users" value={usersQuery.data?.metrics.activeUsers ?? 0} />
        <Metric icon={<Power size={19} />} label="Inactive users" value={usersQuery.data?.metrics.inactiveUsers ?? 0} />
        <Metric icon={<ShieldCheck size={19} />} label="Roles" value={usersQuery.data?.metrics.roles ?? 0} />
        <Metric icon={<UserCog size={19} />} label="Permissions" value={usersQuery.data?.metrics.permissions ?? 0} />
      </div>

      <Card className="mt-5 overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <div>
            <h2 className="text-xl font-black text-espresso">Staff logins</h2>
            <p className="text-sm font-semibold text-muted">Desktop access, role assignment, and active state.</p>
          </div>
          {usersQuery.isLoading ? <Loader2 className="animate-spin text-primary" size={20} /> : null}
        </div>

        {usersQuery.isError ? (
          <div className="m-5 flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            <AlertCircle size={17} />
            Users could not load. Check the API session.
          </div>
        ) : null}

        <div className="max-h-[520px] overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-sage text-xs font-black uppercase text-muted">
              <tr>
                <th className="px-6 py-3">Staff</th>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Permissions</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.map((user) => {
                const isCurrentUser = user.id === currentUser?.id;
                return (
                  <tr key={user.id}>
                    <td className="px-6 py-4">
                      <p className="font-black text-espresso">{user.name}</p>
                      <p className="mt-1 text-xs font-semibold text-muted">{user.staff?.phone || 'No phone'}</p>
                    </td>
                    <td className="px-4 py-4 font-bold text-label">{user.username}</td>
                    <td className="px-4 py-4">
                      <select
                        className={fieldClass}
                        disabled={!canManageUsers || updateUser.isPending}
                        value={user.roleId}
                        onChange={(event) => updateUser.mutate({ id: user.id, patch: { roleId: event.target.value } })}
                      >
                        {roles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      <Badge tone={user.active ? 'green' : 'gray'}>
                        {user.role.permissions.length} permissions
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          className="h-9 px-3"
                          disabled={!canManageUsers}
                          icon={<KeyRound size={15} />}
                          variant="secondary"
                          onClick={() => openPassword(user)}
                        >
                          Password
                        </Button>
                        <Button
                          className="h-9 px-3"
                          disabled={!canManageUsers || isCurrentUser || updateUser.isPending}
                          icon={<Power size={15} />}
                          variant={user.active ? 'secondary' : 'ghost'}
                          onClick={() => updateUser.mutate({ id: user.id, patch: { active: !user.active } })}
                        >
                          {user.active ? 'Active' : 'Inactive'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-5 grid grid-cols-2 gap-4">
        {roles.map((role) => (
          <Card key={role.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-black text-espresso">{role.name}</p>
                <p className="mt-1 text-sm font-semibold text-muted">{role.description || 'Operational role'}</p>
              </div>
              <Button
                className="h-9 px-3"
                disabled={!canManageUsers}
                icon={<ShieldCheck size={15} />}
                variant="secondary"
                onClick={() => openRole(role)}
              >
                Edit
              </Button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {role.permissions.slice(0, 8).map((entry) => (
                <Badge key={entry.permission.id} tone="gray">
                  {entry.permission.code}
                </Badge>
              ))}
              {role.permissions.length > 8 ? <Badge tone="orange">+{role.permissions.length - 8}</Badge> : null}
            </div>
            <p className="mt-4 text-xs font-black uppercase tracking-[0.14em] text-muted">
              {role._count?.users ?? 0} assigned users
            </p>
          </Card>
        ))}
      </div>

      <ActionModal
        description="Create a staff login and attach it to the matching staff profile."
        open={userOpen}
        title="New staff"
        onClose={() => setUserOpen(false)}
      >
        <form className="space-y-3" onSubmit={submitUser}>
          <input className={fieldClass} disabled={!canManageUsers} placeholder="Full name" value={name} onChange={(event) => setName(event.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <input
              className={fieldClass}
              disabled={!canManageUsers}
              placeholder="Username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
            <input className={fieldClass} disabled={!canManageUsers} placeholder="Phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </div>
          <input
            className={fieldClass}
            disabled={!canManageUsers}
            minLength={8}
            placeholder="Temporary password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <select className={fieldClass} disabled={!canManageUsers} value={selectedRoleId} onChange={(event) => setRoleId(event.target.value)}>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
          {createUser.isError ? (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              Staff save failed. Check username, password, and role.
            </div>
          ) : null}
          <Button
            className="w-full"
            disabled={!canManageUsers || !name.trim() || !username.trim() || password.length < 8 || !selectedRoleId || createUser.isPending}
            icon={createUser.isPending ? <Loader2 className="animate-spin" size={17} /> : <UserPlus size={17} />}
            type="submit"
          >
            Add staff
          </Button>
        </form>
      </ActionModal>

      <ActionModal
        description={`Set a new password for ${selectedPasswordUser?.name ?? 'staff user'}.`}
        open={passwordOpen}
        title="Update password"
        onClose={() => setPasswordOpen(false)}
      >
        <form className="space-y-3" onSubmit={submitPassword}>
          <input
            className={fieldClass}
            disabled={!canManageUsers}
            minLength={8}
            placeholder="New password"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
          {updatePassword.isError ? (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              Password update failed. Use at least 8 characters.
            </div>
          ) : null}
          <Button
            className="w-full"
            disabled={!canManageUsers || newPassword.length < 8 || updatePassword.isPending}
            icon={updatePassword.isPending ? <Loader2 className="animate-spin" size={17} /> : <KeyRound size={17} />}
            type="submit"
          >
            Update password
          </Button>
        </form>
      </ActionModal>

      <ActionModal
        description="Choose the permissions this role should grant to assigned staff users."
        open={roleOpen}
        title={editingRoleId ? 'Edit role' : 'New role'}
        widthClass="max-w-4xl"
        onClose={resetRoleForm}
      >
        <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); if (roleName.trim() && rolePermissionIds.length) saveRole.mutate(); }}>
          <div className="grid grid-cols-[220px_1fr] gap-3">
            <input className={fieldClass} disabled={!canManageUsers} placeholder="Role name" value={roleName} onChange={(event) => setRoleName(event.target.value)} />
            <input
              className={fieldClass}
              disabled={!canManageUsers}
              placeholder="Description"
              value={roleDescription}
              onChange={(event) => setRoleDescription(event.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(groupedPermissions).map(([group, groupPermissions]) => (
              <div key={group} className="rounded-2xl border border-line bg-sage p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-muted">{group}</p>
                <div className="mt-3 grid gap-2">
                  {groupPermissions.map((permission) => (
                    <label key={permission.id} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-bold text-label">
                      <input
                        checked={rolePermissionIds.includes(permission.id)}
                        className="h-4 w-4 accent-primary"
                        disabled={!canManageUsers}
                        type="checkbox"
                        onChange={() => togglePermission(permission.id)}
                      />
                      {permission.code}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {saveRole.isError ? (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              Role save failed. Keep at least one permission and avoid removing your own user access.
            </div>
          ) : null}
          <Button
            className="w-full"
            disabled={!canManageUsers || !roleName.trim() || rolePermissionIds.length === 0 || saveRole.isPending}
            icon={saveRole.isPending ? <Loader2 className="animate-spin" size={17} /> : <ShieldCheck size={17} />}
            type="submit"
          >
            Save role
          </Button>
        </form>
      </ActionModal>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: number | string }) {
  return (
    <Card className="flex items-center justify-between p-5">
      <div>
        <p className="text-sm font-black text-muted">{label}</p>
        <p className="mt-3 text-3xl font-black text-espresso">{value}</p>
      </div>
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-mint text-secondary">{icon}</span>
    </Card>
  );
}
