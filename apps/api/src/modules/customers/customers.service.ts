import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

interface CustomerInput {
  creditLimit?: number;
  customerType?: string;
  email?: string;
  name: string;
  notes?: string;
  phone: string;
}

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const customers = await this.prisma.customer.findMany({
      include: {
        addresses: true,
        _count: { select: { ledgers: true, orders: true } },
      },
      orderBy: [{ currentBalance: 'desc' }, { name: 'asc' }],
    });

    return {
      customers,
      metrics: {
        totalCustomers: customers.length,
        creditCustomers: customers.filter((customer) => customer.currentBalance.gt(0)).length,
        receivableBalance: customers.reduce(
          (total, customer) => total.add(customer.currentBalance),
          new Prisma.Decimal(0),
        ),
      },
    };
  }

  async create(input: CustomerInput) {
    try {
      return await this.prisma.customer.create({
        data: {
          creditLimit: new Prisma.Decimal(input.creditLimit ?? 0),
          customerType: input.customerType ?? 'REGULAR',
          email: input.email,
          name: input.name,
          notes: input.notes,
          phone: input.phone.trim(),
        },
        include: { addresses: true, _count: { select: { ledgers: true, orders: true } } },
      });
    } catch (error) {
      if (isUniqueError(error)) throw new BadRequestException('Customer phone already exists');
      throw error;
    }
  }

  async update(id: string, input: Partial<CustomerInput>) {
    await this.ensureCustomer(id);

    return this.prisma.customer.update({
      where: { id },
      data: {
        creditLimit: input.creditLimit === undefined ? undefined : new Prisma.Decimal(input.creditLimit),
        customerType: input.customerType,
        email: input.email,
        name: input.name,
        notes: input.notes,
        phone: input.phone,
      },
      include: { addresses: true, _count: { select: { ledgers: true, orders: true } } },
    });
  }

  private async ensureCustomer(id: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id }, select: { id: true } });
    if (!customer) throw new NotFoundException('Customer not found');
  }
}

function isUniqueError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}
