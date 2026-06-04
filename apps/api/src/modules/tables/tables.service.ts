import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderItemStatus, OrderStatus, Prisma, TableStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const openOrderStatuses = [
  OrderStatus.DRAFT,
  OrderStatus.SENT_TO_KITCHEN,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.SERVED,
  OrderStatus.PAYMENT_PENDING,
] as const;

interface TableInput {
  active?: boolean;
  area?: string;
  capacity?: number;
  displayOrder?: number;
  name?: string;
  status?: TableStatus;
}

@Injectable()
export class TablesService {
  constructor(private readonly prisma: PrismaService) {}

  async floor() {
    const tables = await this.prisma.table.findMany({
      include: {
        orders: {
          where: { status: { in: [...openOrderStatuses] } },
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { items: true },
        },
        reservations: {
          where: { cancelledAt: null, startsAt: { gte: new Date() } },
          orderBy: { startsAt: 'asc' },
          take: 1,
        },
      },
      orderBy: [{ active: 'desc' }, { area: 'asc' }, { displayOrder: 'asc' }, { name: 'asc' }],
    });

    const activeTables = tables.filter((table) => table.active);
    const areas = [...new Set(activeTables.map((table) => table.area ?? 'Main Floor'))].sort();
    const freeTables = activeTables.filter((table) => table.status === TableStatus.FREE && !table.orders[0]);

    return {
      areas,
      tables: tables.map((table) => {
        const currentOrder = table.orders[0] ?? null;
        return {
          ...table,
          status: visibleTableStatus(table.status, Boolean(currentOrder)),
          currentOrder,
          nextReservation: table.reservations[0] ?? null,
          orders: undefined,
          reservations: undefined,
        };
      }),
      metrics: {
        activeTables: activeTables.length,
        freeTables: freeTables.length,
        occupiedTables: activeTables.length - freeTables.length,
        totalCovers: activeTables.reduce((total, table) => total + table.capacity, 0),
      },
    };
  }

  create(input: Required<Pick<TableInput, 'name' | 'capacity'>> & TableInput) {
    return this.prisma.table.create({
      data: {
        active: input.active ?? true,
        area: input.area || 'Main Floor',
        capacity: input.capacity,
        displayOrder: input.displayOrder ?? 0,
        name: input.name,
        status: input.status ?? TableStatus.FREE,
      },
    });
  }

  async update(id: string, input: TableInput) {
    await this.ensureTable(id);

    return this.prisma.table.update({
      where: { id },
      data: {
        active: input.active,
        area: input.area,
        capacity: input.capacity,
        displayOrder: input.displayOrder,
        name: input.name,
        status: input.status,
      },
    });
  }

  async setStatus(id: string, status: TableStatus) {
    const table = await this.prisma.table.findUnique({
      where: { id },
      include: {
        orders: {
          where: { status: { in: [...openOrderStatuses] } },
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { payments: true },
        },
      },
    });
    if (!table) throw new NotFoundException('Table not found');

    const openOrder = table.orders[0];
    if (status === TableStatus.FREE && openOrder) {
      if (openOrder.status !== OrderStatus.DRAFT || openOrder.payments.length) {
        throw new BadRequestException('Table has an open order. Void or complete the order first.');
      }

      return this.prisma.$transaction(async (tx) => {
        await tx.orderItem.updateMany({
          where: { orderId: openOrder.id },
          data: { status: OrderItemStatus.CANCELLED },
        });
        await tx.order.update({
          where: { id: openOrder.id },
          data: { cancelledAt: new Date(), status: OrderStatus.CANCELLED },
        });
        return tx.table.update({
          where: { id },
          data: { status: TableStatus.FREE },
        });
      });
    }

    return this.prisma.table.update({
      where: { id },
      data: { status },
    });
  }

  async startDineInOrder(id: string) {
    const table = await this.prisma.table.findUnique({
      where: { id },
      include: {
        orders: {
          where: { status: { in: [...openOrderStatuses] } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!table || !table.active) throw new NotFoundException('Table not found');
    if (table.orders[0]) return table.orders[0];
    if (table.status === TableStatus.RESERVED) {
      throw new BadRequestException('Reserved table must be released before starting a dine-in order');
    }

    return this.prisma.$transaction(async (tx) => {
      const count = await tx.order.count();
      const orderNumber = `A-${String(count + 1).padStart(4, '0')}`;

      const order = await tx.order.create({
        data: {
          orderNumber,
          type: 'DINE_IN',
          status: OrderStatus.DRAFT,
          tableId: table.id,
          subtotal: new Prisma.Decimal(0),
          discountTotal: new Prisma.Decimal(0),
          taxTotal: new Prisma.Decimal(0),
          serviceChargeTotal: new Prisma.Decimal(0),
          grandTotal: new Prisma.Decimal(0),
        },
        include: { table: true, items: true },
      });

      await tx.table.update({
        where: { id: table.id },
        data: { status: TableStatus.WAITING_FOR_ORDER },
      });

      return order;
    });
  }

  private async ensureTable(id: string) {
    const table = await this.prisma.table.findUnique({ where: { id }, select: { id: true } });
    if (!table) throw new NotFoundException('Table not found');
  }
}

function visibleTableStatus(status: TableStatus, hasCurrentOrder: boolean) {
  if (hasCurrentOrder && status === TableStatus.FREE) return TableStatus.WAITING_FOR_ORDER;
  if (status === TableStatus.CLEANING_REQUIRED) return TableStatus.OCCUPIED;
  return status;
}
