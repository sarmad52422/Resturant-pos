import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

interface InventoryItemInput {
  active?: boolean;
  averageCost?: number;
  batchTrackingEnabled?: boolean;
  category?: string;
  conversionRate?: number;
  currentStock?: number;
  expiryTrackingEnabled?: boolean;
  lastPurchaseCost?: number;
  minimumStockLevel?: number;
  name: string;
  purchaseUnitId: string;
  supplierId?: string;
  usageUnitId: string;
}

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const [items, units, suppliers] = await Promise.all([
      this.prisma.inventoryItem.findMany({
        include: {
          purchaseItems: { select: { id: true } },
          recipeIngredients: { select: { id: true } },
        },
        orderBy: [{ active: 'desc' }, { name: 'asc' }],
      }),
      this.prisma.unit.findMany({ orderBy: { name: 'asc' } }),
      this.prisma.supplier.findMany({ orderBy: { name: 'asc' } }),
    ]);

    return {
      items,
      units,
      suppliers,
      metrics: {
        activeItems: items.filter((item) => item.active).length,
        lowStockItems: items.filter((item) => item.currentStock.lte(item.minimumStockLevel)).length,
        totalStockValue: items.reduce(
          (total, item) => total.add(item.currentStock.mul(item.averageCost)),
          new Prisma.Decimal(0),
        ),
      },
    };
  }

  createItem(input: InventoryItemInput) {
    return this.prisma.inventoryItem.create({
      data: this.toInventoryData(input) as Prisma.InventoryItemUncheckedCreateInput,
    });
  }

  updateItem(id: string, input: Partial<InventoryItemInput>) {
    return this.prisma.inventoryItem.update({
      where: { id },
      data: this.toInventoryData(input) as Prisma.InventoryItemUncheckedUpdateInput,
    });
  }

  async recordSaleDeduction(
    tx: Prisma.TransactionClient,
    orderItemId: string,
    createdByUserId?: string,
  ) {
    const orderItem = await tx.orderItem.findUnique({
      where: { id: orderItemId },
      include: {
        menuItem: {
          include: {
            recipes: {
              include: { ingredients: { include: { inventoryItem: true } } },
            },
          },
        },
        variation: {
          include: {
            recipes: {
              include: { ingredients: { include: { inventoryItem: true } } },
            },
          },
        },
      },
    });

    if (!orderItem) throw new BadRequestException('Order item not found');

    const recipe = orderItem.variation?.recipes[0] ?? orderItem.menuItem.recipes[0];
    if (!recipe) return;

    const existingDeduction = await tx.stockMovement.count({
      where: {
        reason: 'SALE_DEDUCTION',
        referenceType: 'OrderItem',
        referenceId: orderItem.id,
      },
    });
    if (existingDeduction > 0) return;

    for (const ingredient of recipe.ingredients) {
      const quantityOut = ingredient.quantity.mul(orderItem.quantity);
      const stockQuantityOut =
        ingredient.unitId === ingredient.inventoryItem.usageUnitId && !ingredient.inventoryItem.conversionRate.equals(0)
          ? quantityOut.div(ingredient.inventoryItem.conversionRate)
          : quantityOut;

      await tx.stockMovement.create({
        data: {
          inventoryItemId: ingredient.inventoryItemId,
          quantityIn: new Prisma.Decimal(0),
          quantityOut,
          unitId: ingredient.unitId,
          reason: 'SALE_DEDUCTION',
          referenceType: 'OrderItem',
          referenceId: orderItem.id,
          createdByUserId,
        },
      });

      await tx.inventoryItem.update({
        where: { id: ingredient.inventoryItemId },
        data: {
          currentStock: {
            decrement: stockQuantityOut,
          },
        },
      });
    }
  }

  private toInventoryData(
    input: Partial<InventoryItemInput>,
  ): Prisma.InventoryItemUncheckedCreateInput | Prisma.InventoryItemUncheckedUpdateInput {
    return {
      active: input.active,
      averageCost: input.averageCost === undefined ? undefined : new Prisma.Decimal(input.averageCost),
      batchTrackingEnabled: input.batchTrackingEnabled,
      category: input.category,
      conversionRate: input.conversionRate === undefined ? undefined : new Prisma.Decimal(input.conversionRate),
      currentStock: input.currentStock === undefined ? undefined : new Prisma.Decimal(input.currentStock),
      expiryTrackingEnabled: input.expiryTrackingEnabled,
      lastPurchaseCost: input.lastPurchaseCost === undefined ? undefined : new Prisma.Decimal(input.lastPurchaseCost),
      minimumStockLevel:
        input.minimumStockLevel === undefined ? undefined : new Prisma.Decimal(input.minimumStockLevel),
      name: input.name,
      purchaseUnitId: input.purchaseUnitId,
      supplierId: input.supplierId,
      usageUnitId: input.usageUnitId,
    };
  }
}
