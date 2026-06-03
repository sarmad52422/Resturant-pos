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

interface PurchaseItemInput {
  inventoryItemId: string;
  quantity: number;
  unitCost: number;
  unitId: string;
}

interface PurchaseInput {
  invoiceNumber?: string;
  items: PurchaseItemInput[];
  paidAmount: number;
  paymentMethod: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'JAZZCASH_EASYPAISA' | 'ONLINE' | 'CUSTOMER_CREDIT';
  purchaseDate: string;
  supplierId: string;
}

interface SupplierInput {
  address?: string;
  contactPerson?: string;
  name: string;
  notes?: string;
  openingBalance?: number;
  phone?: string;
}

interface SupplierPaymentInput {
  amount: number;
  notes?: string;
  paymentMethod: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'JAZZCASH_EASYPAISA' | 'ONLINE' | 'CUSTOMER_CREDIT';
  reference?: string;
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

  listPurchases() {
    return this.prisma.purchase.findMany({
      include: {
        supplier: true,
        items: {
          include: {
            inventoryItem: true,
            unit: true,
          },
          orderBy: { inventoryItem: { name: 'asc' } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 80,
    });
  }

  listSuppliers() {
    return this.prisma.supplier.findMany({
      include: {
        ledgers: { orderBy: { createdAt: 'desc' }, take: 20 },
        purchases: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            invoiceNumber: true,
            purchaseDate: true,
            remainingAmount: true,
            totalCost: true,
          },
          take: 10,
        },
        _count: { select: { ledgers: true, purchases: true } },
      },
      orderBy: { name: 'asc' },
    });
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

  async createPurchase(input: PurchaseInput) {
    if (!input.items.length) throw new BadRequestException('Purchase must include at least one item');

    return this.prisma.$transaction(async (tx) => {
      const items = input.items.map((item) => ({
        inventoryItemId: item.inventoryItemId,
        quantity: new Prisma.Decimal(item.quantity),
        unitCost: new Prisma.Decimal(item.unitCost),
        unitId: item.unitId,
      }));
      const totalCost = items.reduce((total, item) => total.add(item.quantity.mul(item.unitCost)), new Prisma.Decimal(0));
      const paidAmount = new Prisma.Decimal(input.paidAmount);
      if (paidAmount.gt(totalCost)) throw new BadRequestException('Paid amount cannot exceed total purchase cost');

      const remainingAmount = totalCost.sub(paidAmount);
      const purchase = await tx.purchase.create({
        data: {
          supplierId: input.supplierId,
          invoiceNumber: input.invoiceNumber || undefined,
          purchaseDate: new Date(input.purchaseDate),
          totalCost,
          paidAmount,
          remainingAmount,
          paymentMethod: input.paymentMethod,
          items: {
            create: items.map((item) => ({
              inventoryItemId: item.inventoryItemId,
              quantity: item.quantity,
              unitId: item.unitId,
              unitCost: item.unitCost,
              totalCost: item.quantity.mul(item.unitCost),
            })),
          },
        },
      });

      for (const item of items) {
        const inventoryItem = await tx.inventoryItem.findUnique({
          where: { id: item.inventoryItemId },
        });
        if (!inventoryItem) throw new BadRequestException('Inventory item not found');

        const stockQuantityIn = this.toStockQuantity(item.quantity, item.unitId, inventoryItem);
        const currentStockValue = inventoryItem.currentStock.mul(inventoryItem.averageCost);
        const receivedStockValue = item.quantity.mul(item.unitCost);
        const newStock = inventoryItem.currentStock.add(stockQuantityIn);
        const averageCost = newStock.equals(0)
          ? item.unitCost
          : currentStockValue.add(receivedStockValue).div(newStock);

        await tx.stockMovement.create({
          data: {
            inventoryItemId: item.inventoryItemId,
            quantityIn: item.quantity,
            quantityOut: new Prisma.Decimal(0),
            unitId: item.unitId,
            reason: 'PURCHASE',
            referenceType: 'Purchase',
            referenceId: purchase.id,
          },
        });

        await tx.inventoryItem.update({
          where: { id: item.inventoryItemId },
          data: {
            averageCost,
            currentStock: { increment: stockQuantityIn },
            lastPurchaseCost: item.unitCost,
            supplierId: input.supplierId,
          },
        });
      }

      const supplier = await tx.supplier.update({
        where: { id: input.supplierId },
        data: { currentPayable: { increment: remainingAmount } },
      });

      if (remainingAmount.gt(0)) {
        await tx.supplierLedger.create({
          data: {
            supplierId: input.supplierId,
            debit: new Prisma.Decimal(0),
            credit: remainingAmount,
            balance: supplier.currentPayable,
            paymentMethod: input.paymentMethod,
            reference: purchase.invoiceNumber ?? purchase.id,
            notes: 'Purchase payable created',
          },
        });
      }

      return tx.purchase.findUniqueOrThrow({
        where: { id: purchase.id },
        include: {
          supplier: true,
          items: { include: { inventoryItem: true, unit: true } },
        },
      });
    });
  }

  async createSupplier(input: SupplierInput) {
    const openingBalance = new Prisma.Decimal(input.openingBalance ?? 0);

    return this.prisma.$transaction(async (tx) => {
      const supplier = await tx.supplier.create({
        data: {
          address: input.address?.trim() || undefined,
          contactPerson: input.contactPerson?.trim() || undefined,
          currentPayable: openingBalance,
          name: input.name.trim(),
          notes: input.notes?.trim() || undefined,
          openingBalance,
          phone: input.phone?.trim() || undefined,
        },
      });

      if (openingBalance.gt(0)) {
        await tx.supplierLedger.create({
          data: {
            supplierId: supplier.id,
            debit: new Prisma.Decimal(0),
            credit: openingBalance,
            balance: openingBalance,
            reference: 'Opening balance',
            notes: 'Supplier opening payable',
          },
        });
      }

      return supplier;
    });
  }

  updateSupplier(id: string, input: Partial<SupplierInput>) {
    return this.prisma.supplier.update({
      where: { id },
      data: {
        address: input.address?.trim() || undefined,
        contactPerson: input.contactPerson?.trim() || undefined,
        name: input.name?.trim(),
        notes: input.notes?.trim() || undefined,
        phone: input.phone?.trim() || undefined,
      },
    });
  }

  async recordSupplierPayment(id: string, input: SupplierPaymentInput) {
    const amount = new Prisma.Decimal(input.amount);
    if (amount.lte(0)) throw new BadRequestException('Payment amount must be greater than zero');

    return this.prisma.$transaction(async (tx) => {
      const supplier = await tx.supplier.findUnique({ where: { id } });
      if (!supplier) throw new BadRequestException('Supplier not found');
      if (amount.gt(supplier.currentPayable)) throw new BadRequestException('Payment cannot exceed supplier payable');

      const updatedSupplier = await tx.supplier.update({
        where: { id },
        data: { currentPayable: { decrement: amount } },
      });

      const ledger = await tx.supplierLedger.create({
        data: {
          supplierId: id,
          debit: amount,
          credit: new Prisma.Decimal(0),
          balance: updatedSupplier.currentPayable,
          paymentMethod: input.paymentMethod,
          reference: input.reference?.trim() || undefined,
          notes: input.notes?.trim() || 'Supplier payment recorded',
        },
      });

      return { ledger, supplier: updatedSupplier };
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

  private toStockQuantity(
    quantity: Prisma.Decimal,
    unitId: string,
    inventoryItem: {
      conversionRate: Prisma.Decimal;
      purchaseUnitId: string;
      usageUnitId: string;
    },
  ) {
    if (unitId === inventoryItem.purchaseUnitId) return quantity;
    if (unitId === inventoryItem.usageUnitId && !inventoryItem.conversionRate.equals(0)) {
      return quantity.div(inventoryItem.conversionRate);
    }
    return quantity;
  }
}
