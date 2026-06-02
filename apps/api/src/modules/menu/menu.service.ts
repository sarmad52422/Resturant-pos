import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

interface CategoryInput {
  active?: boolean;
  description?: string;
  displayOrder?: number;
  kitchenStationId?: string;
  name: string;
}

interface MenuItemInput {
  active?: boolean;
  basePrice: number;
  categoryId: string;
  costEstimate?: number;
  description?: string;
  kitchenStationId?: string;
  name: string;
  preparationMinutes?: number;
  recipeRequired?: boolean;
  shortName?: string;
  sku?: string;
  taxable?: boolean;
}

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  async summary() {
    const [categories, items, stations] = await Promise.all([
      this.prisma.menuCategory.findMany({
        include: {
          kitchenStation: true,
          _count: { select: { items: true } },
        },
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.menuItem.findMany({
        include: {
          category: true,
          kitchenStation: true,
          _count: { select: { recipes: true, variations: true } },
        },
        orderBy: [{ active: 'desc' }, { name: 'asc' }],
      }),
      this.prisma.kitchenStation.findMany({ orderBy: { name: 'asc' } }),
    ]);

    return {
      categories,
      items,
      stations,
      metrics: {
        activeCategories: categories.filter((category) => category.active).length,
        activeItems: items.filter((item) => item.active).length,
        recipeLinkedItems: items.filter((item) => item._count.recipes > 0).length,
      },
    };
  }

  createCategory(input: CategoryInput) {
    return this.prisma.menuCategory.create({
      data: {
        active: input.active ?? true,
        description: input.description,
        displayOrder: input.displayOrder ?? 0,
        kitchenStationId: input.kitchenStationId || undefined,
        name: input.name,
      },
      include: { kitchenStation: true, _count: { select: { items: true } } },
    });
  }

  async updateCategory(id: string, input: Partial<CategoryInput>) {
    await this.ensureCategory(id);

    return this.prisma.menuCategory.update({
      where: { id },
      data: {
        active: input.active,
        description: input.description,
        displayOrder: input.displayOrder,
        kitchenStationId: input.kitchenStationId,
        name: input.name,
      },
      include: { kitchenStation: true, _count: { select: { items: true } } },
    });
  }

  createItem(input: MenuItemInput) {
    return this.prisma.menuItem.create({
      data: this.toItemData(input) as Prisma.MenuItemUncheckedCreateInput,
      include: {
        category: true,
        kitchenStation: true,
        _count: { select: { recipes: true, variations: true } },
      },
    });
  }

  async updateItem(id: string, input: Partial<MenuItemInput>) {
    await this.ensureItem(id);

    return this.prisma.menuItem.update({
      where: { id },
      data: this.toItemData(input) as Prisma.MenuItemUncheckedUpdateInput,
      include: {
        category: true,
        kitchenStation: true,
        _count: { select: { recipes: true, variations: true } },
      },
    });
  }

  private async ensureCategory(id: string) {
    const category = await this.prisma.menuCategory.findUnique({ where: { id }, select: { id: true } });
    if (!category) throw new NotFoundException('Menu category not found');
  }

  private async ensureItem(id: string) {
    const item = await this.prisma.menuItem.findUnique({ where: { id }, select: { id: true } });
    if (!item) throw new NotFoundException('Menu item not found');
  }

  private toItemData(input: Partial<MenuItemInput>): Prisma.MenuItemUncheckedCreateInput | Prisma.MenuItemUncheckedUpdateInput {
    return {
      active: input.active,
      basePrice: input.basePrice === undefined ? undefined : new Prisma.Decimal(input.basePrice),
      categoryId: input.categoryId,
      costEstimate: input.costEstimate === undefined ? undefined : new Prisma.Decimal(input.costEstimate),
      description: input.description,
      kitchenStationId: input.kitchenStationId,
      name: input.name,
      preparationMinutes: input.preparationMinutes,
      recipeRequired: input.recipeRequired,
      shortName: input.shortName,
      sku: input.sku || undefined,
      taxable: input.taxable,
    };
  }
}
