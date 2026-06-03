import { z } from 'zod';
import type { InventoryItem, MenuItem } from './types';

export const recipeSchema = z.object({
  active: z.boolean(),
  ingredients: z
    .array(
      z.object({
        inventoryItemId: z.string().min(1, 'Choose stock'),
        quantity: z.coerce.number().min(0.0001, 'Qty required').max(999999),
        unitId: z.string().min(1, 'Choose unit'),
      }),
    )
    .min(1, 'Add at least one ingredient'),
  menuItemId: z.string().min(1, 'Choose menu item'),
  name: z.string().min(2, 'Recipe name is required').max(120),
});

export type RecipeForm = z.infer<typeof recipeSchema>;

export const fieldClass =
  'h-11 w-full rounded-xl border border-field bg-white px-3 text-sm font-semibold text-espresso outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10';

export const compactFieldClass =
  'h-10 w-full rounded-xl border border-field bg-white px-3 text-xs font-bold text-espresso outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10';

export function defaultRecipeForm(menuItem?: MenuItem, inventoryItem?: InventoryItem): RecipeForm {
  return {
    active: true,
    ingredients: [
      {
        inventoryItemId: inventoryItem?.id ?? '',
        quantity: 1,
        unitId: inventoryItem?.usageUnit.id ?? '',
      },
    ],
    menuItemId: menuItem?.id ?? '',
    name: menuItem ? `${menuItem.name} Recipe` : '',
  };
}
