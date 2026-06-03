import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import type { RequestUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';

interface CreateUserInput {
  active?: boolean;
  name: string;
  password: string;
  phone?: string;
  roleId: string;
  username: string;
}

interface UpdateUserInput {
  active?: boolean;
  name?: string;
  phone?: string;
  roleId?: string;
  username?: string;
}

interface RoleInput {
  description?: string;
  name: string;
  permissionIds: string[];
}

interface UpdateRoleInput {
  description?: string;
  name?: string;
  permissionIds?: string[];
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const [users, roles, permissions] = await Promise.all([
      this.prisma.user.findMany({
        include: {
          role: { include: { permissions: { include: { permission: true }, orderBy: { permission: { code: 'asc' } } } } },
          staff: true,
        },
        orderBy: [{ active: 'desc' }, { name: 'asc' }],
      }),
      this.prisma.role.findMany({
        include: {
          permissions: { include: { permission: true }, orderBy: { permission: { code: 'asc' } } },
          _count: { select: { users: true } },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.permission.findMany({ orderBy: { code: 'asc' } }),
    ]);

    return {
      users,
      roles,
      permissions,
      metrics: {
        activeUsers: users.filter((user) => user.active).length,
        inactiveUsers: users.filter((user) => !user.active).length,
        roles: roles.length,
        permissions: permissions.length,
      },
    };
  }

  async createUser(input: CreateUserInput, currentUser: RequestUser) {
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await this.prisma.user.create({
      data: {
        active: input.active ?? true,
        name: input.name.trim(),
        passwordHash,
        roleId: input.roleId,
        username: input.username.trim().toLowerCase(),
        staff: {
          create: {
            active: input.active ?? true,
            name: input.name.trim(),
            phone: input.phone?.trim() || undefined,
          },
        },
      },
      include: { role: true, staff: true },
    });

    await this.writeUserAudit('user.create', user.id, currentUser.id);
    return user;
  }

  async updateUser(id: string, input: UpdateUserInput, currentUser: RequestUser) {
    if (id === currentUser.id && input.active === false) {
      throw new BadRequestException('You cannot deactivate your own user account');
    }

    if (id === currentUser.id && input.roleId) {
      await this.ensureRoleHasUserManage(input.roleId);
    }

    const existingUser = await this.prisma.user.findUnique({ where: { id }, include: { staff: true } });
    if (!existingUser) throw new BadRequestException('User not found');

    const data: Prisma.UserUpdateInput = {
      active: input.active,
      name: input.name?.trim(),
      role: input.roleId ? { connect: { id: input.roleId } } : undefined,
      username: input.username?.trim().toLowerCase(),
    };

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...data,
        staff: {
          upsert: {
            create: {
              active: input.active ?? true,
              name: input.name?.trim() ?? existingUser.name,
              phone: input.phone?.trim() || undefined,
            },
            update: {
              active: input.active,
              name: input.name?.trim(),
              phone: input.phone?.trim() || undefined,
            },
          },
        },
      },
      include: { role: true, staff: true },
    });

    await this.writeUserAudit('user.update', user.id, currentUser.id);
    return user;
  }

  async updatePassword(id: string, password: string, currentUser: RequestUser) {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
      include: { role: true, staff: true },
    });

    await this.writeUserAudit('user.password_update', id, currentUser.id);

    return user;
  }

  async createRole(input: RoleInput, currentUser: RequestUser) {
    this.ensurePermissionIdsNotEmpty(input.permissionIds);

    const role = await this.prisma.role.create({
      data: {
        description: input.description?.trim() || undefined,
        name: input.name.trim(),
        permissions: {
          create: input.permissionIds.map((permissionId) => ({ permissionId })),
        },
      },
      include: { permissions: { include: { permission: true } }, _count: { select: { users: true } } },
    });

    await this.writeUserAudit('role.create', role.id, currentUser.id);
    return role;
  }

  async updateRole(id: string, input: UpdateRoleInput, currentUser: RequestUser) {
    if (input.permissionIds) {
      this.ensurePermissionIdsNotEmpty(input.permissionIds);
      await this.ensureRoleUpdateKeepsRequesterSafe(id, input.permissionIds, currentUser);
    }

    const role = await this.prisma.$transaction(async (tx) => {
      if (input.permissionIds) {
        await tx.rolePermission.deleteMany({ where: { roleId: id } });
      }

      return tx.role.update({
        where: { id },
        data: {
          description: input.description?.trim() || undefined,
          name: input.name?.trim(),
          permissions: input.permissionIds
            ? { create: input.permissionIds.map((permissionId) => ({ permissionId })) }
            : undefined,
        },
        include: { permissions: { include: { permission: true } }, _count: { select: { users: true } } },
      });
    });

    await this.writeUserAudit('role.update', role.id, currentUser.id);
    return role;
  }

  private ensurePermissionIdsNotEmpty(permissionIds: string[]) {
    if (!permissionIds.length) throw new BadRequestException('Role must include at least one permission');
  }

  private async ensureRoleHasUserManage(roleId: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: { permissions: { include: { permission: true } } },
    });
    const permissionCodes = role?.permissions.map((entry) => entry.permission.code) ?? [];
    if (!permissionCodes.includes('user.manage')) {
      throw new BadRequestException('Your active role must keep user.manage');
    }
  }

  private async ensureRoleUpdateKeepsRequesterSafe(roleId: string, permissionIds: string[], currentUser: RequestUser) {
    if (roleId !== currentUser.roleId) return;

    const userManagePermission = await this.prisma.permission.findUnique({ where: { code: 'user.manage' } });
    if (!userManagePermission || !permissionIds.includes(userManagePermission.id)) {
      throw new BadRequestException('You cannot remove user.manage from your active role');
    }
  }

  private writeUserAudit(action: string, entityId: string, userId: string) {
    return this.prisma.auditLog.create({
      data: {
        action,
        entityType: action.startsWith('role.') ? 'Role' : 'User',
        entityId,
        userId,
      },
    });
  }
}
