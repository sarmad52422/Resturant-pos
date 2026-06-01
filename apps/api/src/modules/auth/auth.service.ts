import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import type { RequestUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(username: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    if (!user || !user.active) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const permissions = user.role.permissions.map((entry) => entry.permission.code);
    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      roleId: user.roleId,
      permissions,
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'auth.login',
        entityType: 'User',
        entityId: user.id,
        userId: user.id,
      },
    });

    return {
      accessToken,
      user: this.toAuthUser({
        id: user.id,
        username: user.username,
        name: user.name,
        roleId: user.roleId,
        role: user.role.name,
        permissions,
      }),
    };
  }

  async profile(user: RequestUser) {
    return { user };
  }

  async logout(user: RequestUser) {
    await this.prisma.auditLog.create({
      data: {
        action: 'auth.logout',
        entityType: 'User',
        entityId: user.id,
        userId: user.id,
      },
    });

    return { success: true };
  }

  private toAuthUser(user: RequestUser) {
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      roleId: user.roleId,
      role: user.role,
      permissions: user.permissions,
    };
  }
}
