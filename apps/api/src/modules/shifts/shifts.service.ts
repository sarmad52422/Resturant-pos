import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PaymentMethod, Prisma, ShiftStatus } from '@prisma/client';
import type { RequestUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';

interface OpenShiftInput {
  notes?: string;
  openingCash: number;
  terminalDevice?: string;
}

interface CloseShiftInput {
  countedCash: number;
  expenses?: number;
  notes?: string;
}

@Injectable()
export class ShiftsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(currentUser: RequestUser) {
    const staff = await this.ensureStaff(currentUser);
    const [activeShift, shifts, openShifts] = await Promise.all([
      this.prisma.shift.findFirst({
        where: { staffId: staff.id, status: ShiftStatus.OPEN },
        include: { staff: true },
        orderBy: { openedAt: 'desc' },
      }),
      this.prisma.shift.findMany({
        include: { staff: true },
        orderBy: { openedAt: 'desc' },
        take: 80,
      }),
      this.prisma.shift.count({ where: { status: ShiftStatus.OPEN } }),
    ]);

    const enrichedShifts = await Promise.all(shifts.map((shift) => this.attachLiveTotals(shift)));
    const enrichedActiveShift = activeShift ? await this.attachLiveTotals(activeShift) : undefined;

    return {
      activeShift: enrichedActiveShift,
      shifts: enrichedShifts,
      metrics: {
        openShifts,
        closedToday: shifts.filter(
          (shift) =>
            shift.status === ShiftStatus.CLOSED &&
            shift.closedAt &&
            shift.closedAt.toDateString() === new Date().toDateString(),
        ).length,
        myShiftOpen: Boolean(activeShift),
        totalDifferences: shifts.reduce(
          (total, shift) => total.add(shift.difference ?? new Prisma.Decimal(0)),
          new Prisma.Decimal(0),
        ),
      },
    };
  }

  async openShift(input: OpenShiftInput, currentUser: RequestUser) {
    const staff = await this.ensureStaff(currentUser);
    const existingOpenShift = await this.prisma.shift.findFirst({
      where: { staffId: staff.id, status: ShiftStatus.OPEN },
    });
    if (existingOpenShift) throw new BadRequestException('This staff member already has an open shift');

    const openingCash = new Prisma.Decimal(input.openingCash);
    const shift = await this.prisma.shift.create({
      data: {
        staffId: staff.id,
        openingCash,
        expectedCash: openingCash,
        notes: input.notes?.trim() || undefined,
        terminalDevice: input.terminalDevice?.trim() || undefined,
      },
      include: { staff: true },
    });

    await this.writeShiftAudit('shift.open', shift.id, currentUser.id);
    return this.attachLiveTotals(shift);
  }

  async closeShift(id: string, input: CloseShiftInput, currentUser: RequestUser) {
    const shift = await this.prisma.shift.findUnique({ where: { id }, include: { staff: true } });
    if (!shift) throw new BadRequestException('Shift not found');
    if (shift.status === ShiftStatus.CLOSED) throw new BadRequestException('Shift is already closed');
    this.ensureCanManageShift(shift.staff.userId, currentUser);

    const totals = await this.calculateTotals(shift.openedAt, new Date());
    const countedCash = new Prisma.Decimal(input.countedCash);
    const expenses = new Prisma.Decimal(input.expenses ?? 0);
    const expectedCash = shift.openingCash.add(totals.cashSales).sub(totals.refunds).sub(expenses);
    const difference = countedCash.sub(expectedCash);

    const updatedShift = await this.prisma.shift.update({
      where: { id },
      data: {
        cashSales: totals.cashSales,
        cardSales: totals.cardSales,
        creditSales: totals.creditSales,
        refunds: totals.refunds,
        expenses,
        expectedCash,
        countedCash,
        difference,
        notes: input.notes?.trim() || shift.notes,
        closedAt: new Date(),
        status: ShiftStatus.CLOSED,
      },
      include: { staff: true },
    });

    await this.writeShiftAudit('shift.close', id, currentUser.id);
    return this.attachLiveTotals(updatedShift);
  }

  async recalculateShift(id: string, currentUser: RequestUser) {
    const shift = await this.prisma.shift.findUnique({ where: { id }, include: { staff: true } });
    if (!shift) throw new BadRequestException('Shift not found');
    this.ensureCanManageShift(shift.staff.userId, currentUser);

    const totals = await this.calculateTotals(shift.openedAt, shift.closedAt ?? new Date());
    const expenses = shift.expenses ?? new Prisma.Decimal(0);
    const expectedCash = shift.openingCash.add(totals.cashSales).sub(totals.refunds).sub(expenses);
    const countedCash = shift.countedCash;

    const updatedShift = await this.prisma.shift.update({
      where: { id },
      data: {
        cashSales: totals.cashSales,
        cardSales: totals.cardSales,
        creditSales: totals.creditSales,
        refunds: totals.refunds,
        expectedCash,
        difference: countedCash ? countedCash.sub(expectedCash) : undefined,
      },
      include: { staff: true },
    });

    await this.writeShiftAudit('shift.recalculate', id, currentUser.id);
    return this.attachLiveTotals(updatedShift);
  }

  private async attachLiveTotals<T extends { openedAt: Date; closedAt: Date | null }>(shift: T) {
    const liveTotals = await this.calculateTotals(shift.openedAt, shift.closedAt ?? new Date());
    return { ...shift, liveTotals };
  }

  private async calculateTotals(openedAt: Date, closedAt: Date) {
    const payments = await this.prisma.orderPayment.groupBy({
      by: ['method'],
      where: { paidAt: { gte: openedAt, lte: closedAt } },
      _sum: { amount: true },
    });

    return payments.reduce(
      (totals, payment) => {
        const amount = payment._sum.amount ?? new Prisma.Decimal(0);
        if (payment.method === PaymentMethod.CASH) totals.cashSales = totals.cashSales.add(amount);
        const cardLikeMethods: PaymentMethod[] = [
          PaymentMethod.CARD,
          PaymentMethod.BANK_TRANSFER,
          PaymentMethod.JAZZCASH_EASYPAISA,
          PaymentMethod.ONLINE,
        ];
        if (cardLikeMethods.includes(payment.method)) {
          totals.cardSales = totals.cardSales.add(amount);
        }
        if (payment.method === PaymentMethod.CUSTOMER_CREDIT) totals.creditSales = totals.creditSales.add(amount);
        return totals;
      },
      {
        cashSales: new Prisma.Decimal(0),
        cardSales: new Prisma.Decimal(0),
        creditSales: new Prisma.Decimal(0),
        refunds: new Prisma.Decimal(0),
      },
    );
  }

  private async ensureStaff(currentUser: RequestUser) {
    const existingStaff = await this.prisma.staff.findUnique({ where: { userId: currentUser.id } });
    if (existingStaff) return existingStaff;

    return this.prisma.staff.create({
      data: {
        active: true,
        name: currentUser.name,
        userId: currentUser.id,
      },
    });
  }

  private ensureCanManageShift(shiftUserId: string | null, currentUser: RequestUser) {
    if (shiftUserId === currentUser.id) return;
    if (currentUser.permissions.includes('shift.close.other')) return;
    throw new ForbiddenException('You can only manage your own shift');
  }

  private writeShiftAudit(action: string, entityId: string, userId: string) {
    return this.prisma.auditLog.create({
      data: {
        action,
        entityType: 'Shift',
        entityId,
        userId,
      },
    });
  }
}
