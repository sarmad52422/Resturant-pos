import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

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
              include: { ingredients: true },
            },
          },
        },
        variation: {
          include: {
            recipes: {
              include: { ingredients: true },
            },
          },
        },
      },
    });

    if (!orderItem) throw new BadRequestException('Order item not found');

    const recipe = orderItem.variation?.recipes[0] ?? orderItem.menuItem.recipes[0];
    if (!recipe) return;

    for (const ingredient of recipe.ingredients) {
      const quantityOut = ingredient.quantity.mul(orderItem.quantity);
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
            decrement: quantityOut,
          },
        },
      });
    }
  }
}
