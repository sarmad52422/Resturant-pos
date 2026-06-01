import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const permissions = [
  'order.create',
  'order.send_to_kitchen',
  'order.void',
  'order.refund',
  'order.discount.large',
  'order.edit.completed',
  'stock.adjust',
  'ledger.delete',
  'shift.close.other',
  'settings.update',
  'user.manage',
  'report.view.profit',
] as const;

const defaultRoles = [
  'Admin',
  'Manager',
  'Cashier',
  'Waiter',
  'Chef',
  'Delivery Rider',
  'Accountant',
] as const;

async function main() {
  const permissionRecords = await Promise.all(
    permissions.map((code) =>
      prisma.permission.upsert({
        where: { code },
        update: {},
        create: { code, description: `Allows ${code}` },
      }),
    ),
  );

  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: {
      name: 'Admin',
      description: 'Full RestaurantOS access',
      permissions: {
        create: permissionRecords.map((permission) => ({
          permissionId: permission.id,
        })),
      },
    },
  });

  for (const role of defaultRoles.filter((role) => role !== 'Admin')) {
    await prisma.role.upsert({
      where: { name: role },
      update: {},
      create: { name: role, description: `${role} default role` },
    });
  }

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      name: 'System Admin',
      passwordHash: await bcrypt.hash('Admin@12345', 12),
      roleId: adminRole.id,
    },
  });

  const units = [
    ['Kilogram', 'kg', 'KG'],
    ['Gram', 'g', 'GRAM'],
    ['Liter', 'L', 'LITER'],
    ['Milliliter', 'ml', 'ML'],
    ['Piece', 'pc', 'PIECE'],
    ['Packet', 'pkt', 'PACKET'],
    ['Box', 'box', 'BOX'],
    ['Bottle', 'btl', 'BOTTLE'],
    ['Dozen', 'doz', 'DOZEN'],
  ] as const;

  for (const [name, symbol, kind] of units) {
    await prisma.unit.upsert({
      where: { symbol },
      update: {},
      create: { name, symbol, kind },
    });
  }

  for (const station of [
    ['Burger', 'burger'],
    ['Pizza', 'pizza'],
    ['Juice', 'juice'],
    ['Packing', 'packing'],
  ] as const) {
    await prisma.kitchenStation.upsert({
      where: { slug: station[1] },
      update: {},
      create: { name: station[0], slug: station[1] },
    });
  }

  const settings = [
    ['business.name', 'business', 'RestaurantOS Demo Cafe'],
    ['business.branch', 'business', 'Main Branch'],
    ['business.phone', 'business', '+92 300 0000000'],
    ['business.address', 'business', 'Main food street'],
    ['business.currency', 'business', 'PKR'],
    ['tax.defaultPercent', 'tax', 5],
    ['tax.serviceChargePercent', 'tax', 0],
    ['receipt.footer', 'receipt', 'Thank you for dining with us.'],
    ['receipt.printCustomerCopy', 'receipt', true],
    ['operations.lowStockThreshold', 'operations', 10],
    ['operations.kitchenDelayMinutes', 'operations', 12],
    ['operations.shiftFloatRequired', 'operations', true],
  ] as const;

  for (const [key, group, value] of settings) {
    await prisma.setting.upsert({
      where: { key },
      update: { group, value },
      create: { key, group, value },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
