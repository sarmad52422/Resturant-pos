import { BadRequestException, Injectable } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { InventoryService } from '../inventory/inventory.service';
import { KitchenGateway } from '../kitchen/kitchen.gateway';
import { PrismaService } from '../../prisma/prisma.service';

interface CreateDraftOrderInput {
  type: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  customerId?: string;
  tableId?: string;
  items: Array<{
    menuItemId: string;
    variationId?: string;
    quantity: number;
  }>;
}

interface PaymentInput {
  amount: number;
  method: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'JAZZCASH_EASYPAISA' | 'ONLINE' | 'CUSTOMER_CREDIT';
  reference?: string;
}

interface VoidInput {
  reason: string;
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
    private readonly kitchenGateway: KitchenGateway,
  ) {}

  listOpenOrders() {
    return this.prisma.order.findMany({
      where: { status: { notIn: [OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.VOIDED] } },
      include: { items: true, table: true, customer: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createDraft(input: CreateDraftOrderInput, cashierId?: string) {
    if (!input.items.length) throw new BadRequestException('Order must include at least one item');

    return this.prisma.$transaction(async (tx) => {
      const count = await tx.order.count();
      const orderNumber = `A-${String(count + 1).padStart(4, '0')}`;
      const menuItems = await tx.menuItem.findMany({
        where: { id: { in: input.items.map((item) => item.menuItemId) }, active: true },
      });
      const menuItemById = new Map(menuItems.map((item) => [item.id, item]));
      const lines = input.items.map((item) => {
        const menuItem = menuItemById.get(item.menuItemId);
        if (!menuItem) throw new BadRequestException('Menu item not found or inactive');
        const quantity = new Prisma.Decimal(item.quantity);
        const unitPrice = menuItem.basePrice;
        return {
          menuItemId: item.menuItemId,
          variationId: item.variationId,
          quantity,
          unitPrice,
          totalPrice: unitPrice.mul(quantity),
        };
      });
      const subtotal = lines.reduce((total, line) => total.add(line.totalPrice), new Prisma.Decimal(0));

      return tx.order.create({
        data: {
          orderNumber,
          type: input.type,
          status: OrderStatus.DRAFT,
          cashierId,
          customerId: input.customerId || undefined,
          tableId: input.tableId,
          subtotal,
          discountTotal: new Prisma.Decimal(0),
          taxTotal: new Prisma.Decimal(0),
          serviceChargeTotal: new Prisma.Decimal(0),
          grandTotal: subtotal,
          items: {
            create: lines.map((item) => ({
              menuItemId: item.menuItemId,
              variationId: item.variationId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              status: 'NEW',
            })),
          },
        },
        include: { items: { include: { menuItem: true } }, payments: true, table: true, customer: true },
      });
    });
  }

  async sendToKitchen(orderId: string) {
    const order = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.SENT_TO_KITCHEN, sentToKitchenAt: new Date() },
      include: {
        items: {
          include: {
            menuItem: { include: { kitchenStation: true } },
            variation: true,
          },
        },
        table: true,
      },
    });

    for (const item of order.items) {
      await this.prisma.$transaction((tx) => this.inventoryService.recordSaleDeduction(tx, item.id));

      await this.prisma.kitchenTicket.create({
        data: {
          orderId: order.id,
          stationId: item.menuItem.kitchenStationId,
          status: 'NEW',
          items: {
            create: {
              orderItemId: item.id,
              status: 'NEW',
            },
          },
        },
      });

      this.kitchenGateway.emitOrderSentToKitchen({
        id: item.id,
        orderNumber: order.orderNumber,
        stationSlug: item.menuItem.kitchenStation?.slug ?? 'packing',
        orderType: order.type,
        tableName: order.table?.name,
        quantity: Number(item.quantity),
        itemName: item.menuItem.name,
        variationName: item.variation?.name,
        modifiers: [],
        addOns: [],
        notes: item.notes ?? undefined,
        status: item.status,
        sentAt: order.sentToKitchenAt?.toISOString() ?? new Date().toISOString(),
      });
    }

    return order;
  }

  async recordPayment(orderId: string, input: PaymentInput) {
    const paymentAmount = new Prisma.Decimal(input.amount);
    if (paymentAmount.lte(0)) throw new BadRequestException('Payment amount must be greater than zero');

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { payments: true, table: true },
      });
      if (!order) throw new BadRequestException('Order not found');
      const blockedStatuses: OrderStatus[] = [OrderStatus.CANCELLED, OrderStatus.VOIDED, OrderStatus.REFUNDED];
      if (blockedStatuses.includes(order.status)) {
        throw new BadRequestException('This order cannot be paid');
      }

      const alreadyPaid = order.payments.reduce(
        (total, payment) => total.add(payment.amount),
        new Prisma.Decimal(0),
      );
      const remaining = order.grandTotal.sub(alreadyPaid);
      if (paymentAmount.gt(remaining)) throw new BadRequestException('Payment cannot exceed remaining amount');

      await tx.orderPayment.create({
        data: {
          orderId,
          amount: paymentAmount,
          method: input.method,
          reference: input.reference?.trim() || undefined,
        },
      });

      const paidTotal = alreadyPaid.add(paymentAmount);
      const fullyPaid = paidTotal.gte(order.grandTotal);
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: fullyPaid ? OrderStatus.COMPLETED : OrderStatus.PAYMENT_PENDING,
          paidAt: fullyPaid ? new Date() : undefined,
          completedAt: fullyPaid ? new Date() : undefined,
        },
        include: {
          items: { include: { menuItem: true } },
          payments: true,
          table: true,
          customer: true,
        },
      });

      if (order.tableId && fullyPaid) {
        await tx.table.update({
          where: { id: order.tableId },
          data: { status: 'CLEANING_REQUIRED' },
        });
      }

      return updatedOrder;
    });
  }

  async voidOrder(orderId: string, input: VoidInput, userId?: string) {
    const reason = input.reason.trim();
    if (reason.length < 3) throw new BadRequestException('Correction reason is required');

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
          payments: true,
          table: true,
        },
      });
      if (!order) throw new BadRequestException('Order not found');
      const paidStatuses: OrderStatus[] = [OrderStatus.COMPLETED, OrderStatus.PAID, OrderStatus.REFUNDED];
      if (paidStatuses.includes(order.status)) {
        throw new BadRequestException('Paid or completed orders need a refund flow');
      }
      const cancelledStatuses: OrderStatus[] = [OrderStatus.CANCELLED, OrderStatus.VOIDED];
      if (cancelledStatuses.includes(order.status)) {
        throw new BadRequestException('Order is already cancelled');
      }

      for (const item of order.items.filter((item) => item.status !== 'CANCELLED')) {
        if (order.sentToKitchenAt) await this.inventoryService.restoreSaleDeduction(tx, item.id, userId);
        await tx.orderItem.update({
          where: { id: item.id },
          data: { status: 'CANCELLED', notes: appendCorrectionNote(item.notes, reason) },
        });
        await tx.kitchenTicketItem.updateMany({
          where: { orderItemId: item.id },
          data: { status: 'CANCELLED' },
        });
      }

      await tx.kitchenTicket.updateMany({
        where: { orderId },
        data: { status: 'CANCELLED' },
      });

      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: order.sentToKitchenAt ? OrderStatus.VOIDED : OrderStatus.CANCELLED,
          cancelledAt: new Date(),
        },
        include: {
          items: { include: { menuItem: true } },
          payments: true,
          table: true,
          customer: true,
        },
      });

      if (order.tableId) {
        await tx.table.update({
          where: { id: order.tableId },
          data: { status: 'FREE' },
        });
      }

      await tx.auditLog.create({
        data: {
          action: order.sentToKitchenAt ? 'order.void' : 'order.cancel',
          entityType: 'Order',
          entityId: orderId,
          userId,
          oldValue: order as unknown as Prisma.InputJsonValue,
          newValue: updated as unknown as Prisma.InputJsonValue,
          reason,
        },
      });

      for (const item of order.items) {
        this.kitchenGateway.emitOrderItemCancelled({ id: item.id, orderNumber: order.orderNumber });
      }

      return updated;
    });
  }

  async voidOrderItem(orderId: string, itemId: string, input: VoidInput, userId?: string) {
    const reason = input.reason.trim();
    if (reason.length < 3) throw new BadRequestException('Correction reason is required');

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: { include: { menuItem: { include: { kitchenStation: true } } } },
          payments: true,
          table: true,
          customer: true,
        },
      });
      if (!order) throw new BadRequestException('Order not found');
      const paidStatuses: OrderStatus[] = [OrderStatus.COMPLETED, OrderStatus.PAID, OrderStatus.REFUNDED];
      if (paidStatuses.includes(order.status)) {
        throw new BadRequestException('Paid or completed orders need a refund flow');
      }
      const cancelledStatuses: OrderStatus[] = [OrderStatus.CANCELLED, OrderStatus.VOIDED];
      if (cancelledStatuses.includes(order.status)) {
        throw new BadRequestException('Order is already cancelled');
      }

      const item = order.items.find((line) => line.id === itemId);
      if (!item) throw new BadRequestException('Order item not found');
      if (item.status === 'CANCELLED') throw new BadRequestException('Order item is already cancelled');

      if (order.sentToKitchenAt) await this.inventoryService.restoreSaleDeduction(tx, item.id, userId);

      await tx.orderItem.update({
        where: { id: item.id },
        data: { status: 'CANCELLED', notes: appendCorrectionNote(item.notes, reason) },
      });
      await tx.kitchenTicketItem.updateMany({
        where: { orderItemId: item.id },
        data: { status: 'CANCELLED' },
      });

      const activeItems = order.items.filter((line) => line.id !== item.id && line.status !== 'CANCELLED');
      const subtotal = activeItems.reduce((total, line) => total.add(line.totalPrice), new Prisma.Decimal(0));
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          subtotal,
          grandTotal: subtotal.sub(order.discountTotal).add(order.taxTotal).add(order.serviceChargeTotal),
          status: activeItems.length ? order.status : order.sentToKitchenAt ? OrderStatus.VOIDED : OrderStatus.CANCELLED,
          cancelledAt: activeItems.length ? undefined : new Date(),
        },
        include: {
          items: { include: { menuItem: true } },
          payments: true,
          table: true,
          customer: true,
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'order.item_void',
          entityType: 'OrderItem',
          entityId: itemId,
          userId,
          oldValue: item as unknown as Prisma.InputJsonValue,
          newValue: updated as unknown as Prisma.InputJsonValue,
          reason,
        },
      });

      this.kitchenGateway.emitOrderItemCancelled({
        id: item.id,
        orderNumber: order.orderNumber,
        stationSlug: item.menuItem.kitchenStation?.slug,
      });

      return updated;
    });
  }
}

function appendCorrectionNote(notes: string | null, reason: string) {
  const correction = `Correction: ${reason}`;
  return notes ? `${notes}\n${correction}` : correction;
}
