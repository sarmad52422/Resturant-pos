import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, OrderStatus } from '@prisma/client';
import { KitchenGateway } from '../kitchen/kitchen.gateway';
import { PrismaService } from '../../prisma/prisma.service';

interface CreateDraftOrderInput {
  type: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  tableId?: string;
  items: Array<{
    menuItemId: string;
    variationId?: string;
    quantity: number;
  }>;
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly kitchenGateway: KitchenGateway,
  ) {}

  listOpenOrders() {
    return this.prisma.order.findMany({
      where: { status: { notIn: [OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.VOIDED] } },
      include: { items: true, table: true, customer: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createDraft(input: CreateDraftOrderInput) {
    if (!input.items.length) throw new BadRequestException('Order must include at least one item');

    return this.prisma.$transaction(async (tx) => {
      const count = await tx.order.count();
      const orderNumber = `A-${String(count + 1).padStart(4, '0')}`;

      return tx.order.create({
        data: {
          orderNumber,
          type: input.type,
          status: OrderStatus.DRAFT,
          tableId: input.tableId,
          subtotal: new Prisma.Decimal(0),
          discountTotal: new Prisma.Decimal(0),
          taxTotal: new Prisma.Decimal(0),
          serviceChargeTotal: new Prisma.Decimal(0),
          grandTotal: new Prisma.Decimal(0),
          items: {
            create: input.items.map((item) => ({
              menuItemId: item.menuItemId,
              variationId: item.variationId,
              quantity: new Prisma.Decimal(item.quantity),
              unitPrice: new Prisma.Decimal(0),
              totalPrice: new Prisma.Decimal(0),
              status: 'NEW',
            })),
          },
        },
        include: { items: true },
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
}
