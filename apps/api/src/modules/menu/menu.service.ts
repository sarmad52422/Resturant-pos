import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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

interface RecipeIngredientInput {
  inventoryItemId: string;
  quantity: number;
  unitId: string;
}

interface RecipeInput {
  active?: boolean;
  ingredients: RecipeIngredientInput[];
  menuItemId: string;
  name: string;
  variationId?: string;
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

  async posCatalog() {
    const [categories, items] = await Promise.all([
      this.prisma.menuCategory.findMany({
        where: { active: true },
        include: { kitchenStation: true },
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.menuItem.findMany({
        where: { active: true },
        include: {
          category: true,
          kitchenStation: true,
          variations: { where: { active: true }, orderBy: { name: 'asc' } },
          _count: { select: { recipes: true } },
        },
        orderBy: [{ category: { displayOrder: 'asc' } }, { name: 'asc' }],
      }),
    ]);

    return {
      categories,
      items,
    };
  }

  async recipeBuilder() {
    const [recipes, items, inventoryItems, units] = await Promise.all([
      this.prisma.recipe.findMany({
        include: {
          menuItem: { select: { id: true, name: true, sku: true } },
          variation: { select: { id: true, name: true } },
          ingredients: {
            include: {
              inventoryItem: {
                select: {
                  id: true,
                  name: true,
                  averageCost: true,
                  conversionRate: true,
                  usageUnitId: true,
                },
              },
              unit: true,
            },
            orderBy: { inventoryItem: { name: 'asc' } },
          },
        },
        orderBy: [{ active: 'desc' }, { name: 'asc' }],
      }),
      this.prisma.menuItem.findMany({
        where: { active: true },
        include: {
          category: true,
          _count: { select: { recipes: true } },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.inventoryItem.findMany({
        where: { active: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.unit.findMany({ orderBy: { name: 'asc' } }),
    ]);

    return {
      recipes: recipes.map((recipe) => ({
        ...recipe,
        estimatedCost: recipe.ingredients.reduce(
          (total, ingredient) => total.add(this.estimateIngredientCost(ingredient)),
          new Prisma.Decimal(0),
        ),
      })),
      items,
      inventoryItems: inventoryItems.map((item) => ({
        ...item,
        usageUnit: units.find((unit) => unit.id === item.usageUnitId),
      })),
      units,
      metrics: {
        activeRecipes: recipes.filter((recipe) => recipe.active).length,
        recipeLinkedItems: items.filter((item) => item._count.recipes > 0).length,
        missingRecipeItems: items.filter((item) => item.recipeRequired && item._count.recipes === 0).length,
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

  createRecipe(input: RecipeInput) {
    this.validateRecipeInput(input);

    return this.prisma.$transaction(async (tx) => {
      const recipe = await tx.recipe.create({
        data: {
          active: input.active ?? true,
          menuItemId: input.menuItemId,
          variationId: input.variationId || undefined,
          name: input.name,
          ingredients: {
            create: input.ingredients.map((ingredient) => ({
              inventoryItemId: ingredient.inventoryItemId,
              quantity: new Prisma.Decimal(ingredient.quantity),
              unitId: ingredient.unitId,
            })),
          },
        },
      });

      await tx.menuItem.update({
        where: { id: input.menuItemId },
        data: { recipeRequired: true },
      });

      return tx.recipe.findUniqueOrThrow({
        where: { id: recipe.id },
        include: {
          menuItem: true,
          variation: true,
          ingredients: { include: { inventoryItem: true, unit: true } },
        },
      });
    });
  }

  async updateRecipe(id: string, input: RecipeInput) {
    await this.ensureRecipe(id);
    this.validateRecipeInput(input);

    return this.prisma.$transaction(async (tx) => {
      await tx.recipeIngredient.deleteMany({ where: { recipeId: id } });
      await tx.recipe.update({
        where: { id },
        data: {
          active: input.active ?? true,
          menuItemId: input.menuItemId,
          variationId: input.variationId || null,
          name: input.name,
          ingredients: {
            create: input.ingredients.map((ingredient) => ({
              inventoryItemId: ingredient.inventoryItemId,
              quantity: new Prisma.Decimal(ingredient.quantity),
              unitId: ingredient.unitId,
            })),
          },
        },
      });

      await tx.menuItem.update({
        where: { id: input.menuItemId },
        data: { recipeRequired: true },
      });

      return tx.recipe.findUniqueOrThrow({
        where: { id },
        include: {
          menuItem: true,
          variation: true,
          ingredients: { include: { inventoryItem: true, unit: true } },
        },
      });
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

  private async ensureRecipe(id: string) {
    const recipe = await this.prisma.recipe.findUnique({ where: { id }, select: { id: true } });
    if (!recipe) throw new NotFoundException('Recipe not found');
  }

  private validateRecipeInput(input: RecipeInput) {
    if (!input.ingredients.length) throw new BadRequestException('Recipe must include at least one ingredient');
  }

  private estimateIngredientCost(ingredient: {
    quantity: Prisma.Decimal;
    unitId: string;
    inventoryItem: {
      averageCost: Prisma.Decimal;
      conversionRate: Prisma.Decimal;
      usageUnitId: string;
    };
  }) {
    const costPerSelectedUnit =
      ingredient.unitId === ingredient.inventoryItem.usageUnitId && !ingredient.inventoryItem.conversionRate.equals(0)
        ? ingredient.inventoryItem.averageCost.div(ingredient.inventoryItem.conversionRate)
        : ingredient.inventoryItem.averageCost;

    return ingredient.quantity.mul(costPerSelectedUnit);
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
