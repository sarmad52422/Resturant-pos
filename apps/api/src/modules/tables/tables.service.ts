import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, Prisma, TableStatus } from '@prisma/client';
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

    return {
      areas,
      tables: tables.map((table) => ({
        ...table,
        currentOrder: table.orders[0] ?? null,
        nextReservation: table.reservations[0] ?? null,
        orders: undefined,
        reservations: undefined,
      })),
      metrics: {
        activeTables: activeTables.length,
        freeTables: activeTables.filter((table) => table.status === TableStatus.FREE).length,
        occupiedTables: activeTables.filter((table) => table.status !== TableStatus.FREE).length,
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
    await this.ensureTable(id);

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
