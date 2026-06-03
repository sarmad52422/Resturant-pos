export interface KitchenStation {
  id: string;
  name: string;
}

export interface Unit {
  id: string;
  name: string;
  symbol: string;
}

export interface MenuCategory {
  id: string;
  active: boolean;
  description?: string;
  displayOrder: number;
  kitchenStation?: KitchenStation;
  name: string;
  _count: { items: number };
}

export interface MenuItem {
  id: string;
  active: boolean;
  basePrice: string;
  category: { id: string; name: string };
  costEstimate: string;
  kitchenStation?: KitchenStation;
  name: string;
  preparationMinutes: number;
  recipeRequired: boolean;
  sku?: string;
  _count: { recipes: number; variations: number };
}

export interface InventoryItem {
  id: string;
  averageCost: string;
  category?: string;
  currentStock: string;
  name: string;
  usageUnit: Unit;
}

export interface RecipeIngredient {
  id: string;
  inventoryItem: InventoryItem;
  quantity: string;
  unit: Unit;
}

export interface Recipe {
  id: string;
  active: boolean;
  estimatedCost: string;
  ingredients: RecipeIngredient[];
  menuItem: { id: string; name: string; sku?: string };
  name: string;
  variation?: { id: string; name: string };
}

export interface MenuSummary {
  categories: MenuCategory[];
  items: MenuItem[];
  stations: KitchenStation[];
  metrics: {
    activeCategories: number;
    activeItems: number;
    recipeLinkedItems: number;
  };
}

export interface RecipeBuilderSummary {
  recipes: Recipe[];
  items: MenuItem[];
  inventoryItems: InventoryItem[];
  units: Unit[];
  metrics: {
    activeRecipes: number;
    missingRecipeItems: number;
    recipeLinkedItems: number;
  };
}
