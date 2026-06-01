import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface SettingInput {
  key: string;
  group: string;
  value: Prisma.InputJsonValue;
}

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.setting.findMany({ orderBy: { key: 'asc' } });
  }

  async updateMany(settings: SettingInput[], userId: string) {
    const keys = settings.map((setting) => setting.key);
    const previous = await this.prisma.setting.findMany({
      where: { key: { in: keys } },
      orderBy: { key: 'asc' },
    });

    const updated = await this.prisma.$transaction(async (tx) => {
      const records = [];

      for (const setting of settings) {
        records.push(
          await tx.setting.upsert({
            where: { key: setting.key },
            update: {
              group: setting.group,
              value: setting.value,
            },
            create: {
              key: setting.key,
              group: setting.group,
              value: setting.value,
            },
          }),
        );
      }

      await tx.auditLog.create({
        data: {
          action: 'settings.update',
          entityType: 'Setting',
          entityId: 'bulk',
          userId,
          oldValue: previous as unknown as Prisma.InputJsonValue,
          newValue: records as unknown as Prisma.InputJsonValue,
        },
      });

      return records.sort((left, right) => left.key.localeCompare(right.key));
    });

    return updated;
  }
}
