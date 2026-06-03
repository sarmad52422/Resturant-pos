import { Prisma, PrismaClient } from '@prisma/client';
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
  'menu.manage',
  'recipe.manage',
  'customer.manage',
  'inventory.manage',
  'table.manage',
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
    update: { description: 'Full RestaurantOS access' },
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

  for (const permission of permissionRecords) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

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
    ['terminal.name', 'terminal', 'Main cashier'],
    ['terminal.receiptPrinterMode', 'terminal', 'os'],
    ['terminal.receiptPrinterName', 'terminal', ''],
    ['terminal.receiptPrinterHost', 'terminal', ''],
    ['terminal.receiptPrinterPort', 'terminal', 9100],
    ['terminal.receiptPrinterDevicePath', 'terminal', ''],
    ['terminal.openDrawerAfterPrint', 'terminal', false],
  ] as const;

  for (const [key, group, value] of settings) {
    await prisma.setting.upsert({
      where: { key },
      update: { group, value },
      create: { key, group, value },
    });
  }

  const tables = [
    ['T1', 'Main Hall', 2, 'FREE', 10],
    ['T2', 'Main Hall', 4, 'FREE', 20],
    ['T3', 'Main Hall', 4, 'OCCUPIED', 30],
    ['T4', 'Main Hall', 6, 'WAITING_FOR_ORDER', 40],
    ['F1', 'Family Room', 6, 'FREE', 50],
    ['F2', 'Family Room', 8, 'RESERVED', 60],
    ['P1', 'Patio', 4, 'FREE', 70],
    ['P2', 'Patio', 4, 'CLEANING_REQUIRED', 80],
  ] as const;

  for (const [name, area, capacity, status, displayOrder] of tables) {
    await prisma.table.upsert({
      where: { name },
      update: { area, capacity, status, displayOrder, active: true },
      create: { name, area, capacity, status, displayOrder, active: true },
    });
  }

  const [burgerStation, pizzaStation, juiceStation] = await Promise.all([
    prisma.kitchenStation.findUniqueOrThrow({ where: { slug: 'burger' } }),
    prisma.kitchenStation.findUniqueOrThrow({ where: { slug: 'pizza' } }),
    prisma.kitchenStation.findUniqueOrThrow({ where: { slug: 'juice' } }),
  ]);

  const demoCategories = [
    {
      name: 'Signature Burgers',
      description: 'Fast-moving beef and chicken burgers',
      displayOrder: 10,
      kitchenStationId: burgerStation.id,
    },
    {
      name: 'Stone Pizzas',
      description: 'House pizzas with kitchen routing',
      displayOrder: 20,
      kitchenStationId: pizzaStation.id,
    },
    {
      name: 'Fresh Juices',
      description: 'Made-to-order juices and smoothies',
      displayOrder: 30,
      kitchenStationId: juiceStation.id,
    },
  ];

  const categoryRecords = [];
  for (const category of demoCategories) {
    const existing = await prisma.menuCategory.findFirst({ where: { name: category.name } });
    categoryRecords.push(
      existing
        ? await prisma.menuCategory.update({ where: { id: existing.id }, data: category })
        : await prisma.menuCategory.create({ data: category }),
    );
  }

  const categoryByName = new Map(categoryRecords.map((category) => [category.name, category]));
  const menuItems = [
    {
      sku: 'BURG-SMASH',
      name: 'Smash Beef Burger',
      shortName: 'Smash Beef',
      description: 'Double smashed patty, cheese, pickles, and house sauce',
      categoryId: categoryByName.get('Signature Burgers')!.id,
      kitchenStationId: burgerStation.id,
      basePrice: new Prisma.Decimal(950),
      costEstimate: new Prisma.Decimal(410),
      preparationMinutes: 12,
      recipeRequired: true,
    },
    {
      sku: 'PIZ-MARG',
      name: 'Margherita Pizza',
      shortName: 'Margherita',
      description: 'Mozzarella, tomato base, basil, and olive oil',
      categoryId: categoryByName.get('Stone Pizzas')!.id,
      kitchenStationId: pizzaStation.id,
      basePrice: new Prisma.Decimal(1450),
      costEstimate: new Prisma.Decimal(640),
      preparationMinutes: 18,
      recipeRequired: true,
    },
    {
      sku: 'JUI-ORANGE',
      name: 'Fresh Orange Juice',
      shortName: 'Orange',
      description: 'Fresh pressed orange juice',
      categoryId: categoryByName.get('Fresh Juices')!.id,
      kitchenStationId: juiceStation.id,
      basePrice: new Prisma.Decimal(420),
      costEstimate: new Prisma.Decimal(180),
      preparationMinutes: 5,
      recipeRequired: false,
    },
  ];

  for (const item of menuItems) {
    await prisma.menuItem.upsert({
      where: { sku: item.sku },
      update: item,
      create: item,
    });
  }

  const demoCustomers = [
    {
      name: 'Ayesha Khan',
      phone: '+92 300 1112233',
      email: 'ayesha@example.com',
      customerType: 'REGULAR',
      creditLimit: new Prisma.Decimal(15000),
      notes: 'Prefers WhatsApp receipt',
    },
    {
      name: 'Office Catering Account',
      phone: '+92 300 4445566',
      email: 'catering@example.com',
      customerType: 'CORPORATE',
      creditLimit: new Prisma.Decimal(75000),
      currentBalance: new Prisma.Decimal(9200),
      notes: 'Monthly billing customer',
    },
  ];

  for (const customer of demoCustomers) {
    await prisma.customer.upsert({
      where: { phone: customer.phone },
      update: customer,
      create: customer,
    });
  }

  const supplier = await prisma.supplier.findFirst({ where: { name: 'Metro Demo Supplier' } });
  const demoSupplier =
    supplier ??
    (await prisma.supplier.create({
      data: {
        name: 'Metro Demo Supplier',
        phone: '+92 300 7778899',
        contactPerson: 'Purchase Desk',
        notes: 'Seed supplier for development stock',
      },
    }));

  const [kg, gram, liter, milliliter, piece] = await Promise.all([
    prisma.unit.findUniqueOrThrow({ where: { symbol: 'kg' } }),
    prisma.unit.findUniqueOrThrow({ where: { symbol: 'g' } }),
    prisma.unit.findUniqueOrThrow({ where: { symbol: 'L' } }),
    prisma.unit.findUniqueOrThrow({ where: { symbol: 'ml' } }),
    prisma.unit.findUniqueOrThrow({ where: { symbol: 'pc' } }),
  ]);

  const inventoryItems = [
    {
      name: 'Beef Patty',
      category: 'Proteins',
      purchaseUnitId: kg.id,
      usageUnitId: gram.id,
      conversionRate: new Prisma.Decimal(1000),
      currentStock: new Prisma.Decimal(18.5),
      minimumStockLevel: new Prisma.Decimal(8),
      averageCost: new Prisma.Decimal(2200),
      lastPurchaseCost: new Prisma.Decimal(2300),
      supplierId: demoSupplier.id,
      batchTrackingEnabled: true,
    },
    {
      name: 'Mozzarella Cheese',
      category: 'Dairy',
      purchaseUnitId: kg.id,
      usageUnitId: gram.id,
      conversionRate: new Prisma.Decimal(1000),
      currentStock: new Prisma.Decimal(6.2),
      minimumStockLevel: new Prisma.Decimal(7),
      averageCost: new Prisma.Decimal(1850),
      lastPurchaseCost: new Prisma.Decimal(1900),
      supplierId: demoSupplier.id,
      batchTrackingEnabled: true,
    },
    {
      name: 'Orange Juice Pulp',
      category: 'Beverage',
      purchaseUnitId: liter.id,
      usageUnitId: milliliter.id,
      conversionRate: new Prisma.Decimal(1000),
      currentStock: new Prisma.Decimal(24),
      minimumStockLevel: new Prisma.Decimal(10),
      averageCost: new Prisma.Decimal(420),
      lastPurchaseCost: new Prisma.Decimal(430),
      supplierId: demoSupplier.id,
      expiryTrackingEnabled: true,
    },
    {
      name: 'Burger Bun',
      category: 'Bakery',
      purchaseUnitId: piece.id,
      usageUnitId: piece.id,
      conversionRate: new Prisma.Decimal(1),
      currentStock: new Prisma.Decimal(46),
      minimumStockLevel: new Prisma.Decimal(25),
      averageCost: new Prisma.Decimal(45),
      lastPurchaseCost: new Prisma.Decimal(48),
      supplierId: demoSupplier.id,
    },
  ];

  for (const item of inventoryItems) {
    const existing = await prisma.inventoryItem.findFirst({ where: { name: item.name } });
    if (existing) {
      await prisma.inventoryItem.update({ where: { id: existing.id }, data: item });
    } else {
      await prisma.inventoryItem.create({ data: item });
    }
  }

  const [smashBurger, margheritaPizza, beefPatty, burgerBun, mozzarellaCheese] = await Promise.all([
    prisma.menuItem.findUniqueOrThrow({ where: { sku: 'BURG-SMASH' } }),
    prisma.menuItem.findUniqueOrThrow({ where: { sku: 'PIZ-MARG' } }),
    prisma.inventoryItem.findFirstOrThrow({ where: { name: 'Beef Patty' } }),
    prisma.inventoryItem.findFirstOrThrow({ where: { name: 'Burger Bun' } }),
    prisma.inventoryItem.findFirstOrThrow({ where: { name: 'Mozzarella Cheese' } }),
  ]);

  const demoRecipes = [
    {
      menuItemId: smashBurger.id,
      name: 'Smash Beef Burger Recipe',
      ingredients: [
        { inventoryItemId: beefPatty.id, quantity: new Prisma.Decimal(180), unitId: gram.id },
        { inventoryItemId: burgerBun.id, quantity: new Prisma.Decimal(1), unitId: piece.id },
        { inventoryItemId: mozzarellaCheese.id, quantity: new Prisma.Decimal(35), unitId: gram.id },
      ],
    },
    {
      menuItemId: margheritaPizza.id,
      name: 'Margherita Pizza Recipe',
      ingredients: [{ inventoryItemId: mozzarellaCheese.id, quantity: new Prisma.Decimal(160), unitId: gram.id }],
    },
  ];

  for (const recipe of demoRecipes) {
    const existing = await prisma.recipe.findFirst({
      where: { menuItemId: recipe.menuItemId, name: recipe.name },
    });

    const savedRecipe = existing
      ? await prisma.recipe.update({
          where: { id: existing.id },
          data: { active: true, menuItemId: recipe.menuItemId, name: recipe.name },
        })
      : await prisma.recipe.create({
          data: { active: true, menuItemId: recipe.menuItemId, name: recipe.name },
        });

    await prisma.recipeIngredient.deleteMany({ where: { recipeId: savedRecipe.id } });
    await prisma.recipeIngredient.createMany({
      data: recipe.ingredients.map((ingredient) => ({
        recipeId: savedRecipe.id,
        ...ingredient,
      })),
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
