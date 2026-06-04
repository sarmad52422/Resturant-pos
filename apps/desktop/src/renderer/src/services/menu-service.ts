import { apiRequest } from '../lib/api-client';
import type { MenuCategory, MenuItem, MenuSummary, Recipe, RecipeBuilderSummary } from '../pages/menu/interfaces';
import type { RecipeForm } from '../pages/menu/recipe-form-model';

interface CategoryInput {
  displayOrder: number;
  kitchenStationId?: string;
  name: string;
}

interface MenuItemInput {
  basePrice: number;
  categoryId: string;
  kitchenStationId?: string;
  name: string;
  preparationMinutes: number;
  recipeRequired: boolean;
  taxable: boolean;
}

export const menuService = {
  createCategory: (input: CategoryInput) =>
    apiRequest<MenuCategory>({ data: input, method: 'POST', url: '/menu/categories' }),
  createItem: (input: MenuItemInput) =>
    apiRequest<MenuItem>({ data: input, method: 'POST', url: '/menu/items' }),
  createRecipe: (input: RecipeForm) =>
    apiRequest<Recipe>({ data: input, method: 'POST', url: '/menu/recipes' }),
  recipeBuilder: () => apiRequest<RecipeBuilderSummary>({ method: 'GET', url: '/menu/recipes' }),
  summary: () => apiRequest<MenuSummary>({ method: 'GET', url: '/menu' }),
  updateItem: (itemId: string, patch: Partial<Pick<MenuItem, 'active'>>) =>
    apiRequest<MenuItem>({ data: patch, method: 'PATCH', url: `/menu/items/${itemId}` }),
};
