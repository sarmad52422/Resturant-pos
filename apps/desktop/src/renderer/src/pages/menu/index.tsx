import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Boxes,
  CheckCircle2,
  ChefHat,
  Loader2,
  Plus,
  Power,
  Trash2,
  Utensils,
} from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { Badge, Button, Card } from '@restaurantos/ui';
import { ActionModal } from '../../components/action-modal';
import { apiFetch } from '../../lib/api';
import { useAuthStore } from '../../store/use-auth-store';
import { InlineState, Metric } from './components';
import { compactFieldClass, defaultRecipeForm, fieldClass, recipeSchema, type RecipeForm } from './recipe-form-model';
import type { MenuCategory, MenuItem, MenuSummary, Recipe, RecipeBuilderSummary } from './types';

const money = new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0, style: 'currency', currency: 'PKR' });
type MenuActionModal = 'category' | 'item' | 'recipe' | null;

export function MenuPage() {
  const queryClient = useQueryClient();
  const canManageMenu = useAuthStore((state) => state.hasPermission('menu.manage'));
  const canManageRecipes = useAuthStore((state) => state.hasPermission('recipe.manage'));
  const [categoryName, setCategoryName] = useState('');
  const [categoryStationId, setCategoryStationId] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemCategoryId, setItemCategoryId] = useState('');
  const [itemStationId, setItemStationId] = useState('');
  const [activeModal, setActiveModal] = useState<MenuActionModal>(null);

  const menuQuery = useQuery({
    queryKey: ['menu-summary'],
    queryFn: () => apiFetch<MenuSummary>('/menu'),
  });

  const recipeQuery = useQuery({
    queryKey: ['recipe-builder'],
    queryFn: () => apiFetch<RecipeBuilderSummary>('/menu/recipes'),
  });

  const categories = menuQuery.data?.categories ?? [];
  const stations = menuQuery.data?.stations ?? [];
  const recipeItems = recipeQuery.data?.items ?? [];
  const inventoryItems = recipeQuery.data?.inventoryItems ?? [];
  const units = recipeQuery.data?.units ?? [];
  const selectedItemCategoryId = itemCategoryId || categories[0]?.id || '';

  const categoriesById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

  const inventoryById = useMemo(
    () => new Map(inventoryItems.map((item) => [item.id, item])),
    [inventoryItems],
  );

  const recipeForm = useForm<RecipeForm>({
    resolver: zodResolver(recipeSchema),
    defaultValues: defaultRecipeForm(),
  });

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setValue,
    watch,
  } = recipeForm;

  const ingredientRows = useFieldArray({ control, name: 'ingredients' });
  const selectedRecipeMenuItemId = watch('menuItemId');
  const selectedRecipeMenuItem = recipeItems.find((item) => item.id === selectedRecipeMenuItemId);

  useEffect(() => {
    if (!recipeQuery.data || recipeForm.formState.isDirty) return;
    reset(defaultRecipeForm(recipeItems[0], inventoryItems[0]));
  }, [inventoryItems, recipeForm.formState.isDirty, recipeItems, recipeQuery.data, reset]);

  const refreshMenu = () => {
    void queryClient.invalidateQueries({ queryKey: ['menu-summary'] });
    void queryClient.invalidateQueries({ queryKey: ['recipe-builder'] });
  };

  const createCategory = useMutation({
    mutationFn: () =>
      apiFetch<MenuCategory>('/menu/categories', {
        method: 'POST',
        body: JSON.stringify({
          name: categoryName.trim(),
          kitchenStationId: categoryStationId || undefined,
          displayOrder: categories.length * 10 + 10,
        }),
      }),
    onSuccess: () => {
      setCategoryName('');
      setCategoryStationId('');
      setActiveModal(null);
      refreshMenu();
    },
  });

  const createItem = useMutation({
    mutationFn: () =>
      apiFetch<MenuItem>('/menu/items', {
        method: 'POST',
        body: JSON.stringify({
          name: itemName.trim(),
          basePrice: Number(itemPrice),
          categoryId: selectedItemCategoryId,
          kitchenStationId:
            itemStationId || categoriesById.get(selectedItemCategoryId)?.kitchenStation?.id || undefined,
          preparationMinutes: 10,
          recipeRequired: false,
          taxable: true,
        }),
      }),
    onSuccess: () => {
      setItemName('');
      setItemPrice('');
      setItemCategoryId('');
      setItemStationId('');
      setActiveModal(null);
      refreshMenu();
    },
  });

  const createRecipe = useMutation({
    mutationFn: (values: RecipeForm) =>
      apiFetch<Recipe>('/menu/recipes', {
        method: 'POST',
        body: JSON.stringify(values),
      }),
    onSuccess: () => {
      reset(defaultRecipeForm(recipeItems[0], inventoryItems[0]));
      setActiveModal(null);
      refreshMenu();
    },
  });

  const toggleItem = useMutation({
    mutationFn: (item: MenuItem) =>
      apiFetch<MenuItem>(`/menu/items/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !item.active }),
      }),
    onSuccess: refreshMenu,
  });

  function submitCategory(event: FormEvent) {
    event.preventDefault();
    if (categoryName.trim()) createCategory.mutate();
  }

  function submitItem(event: FormEvent) {
    event.preventDefault();
    if (itemName.trim() && Number(itemPrice) >= 0 && selectedItemCategoryId) createItem.mutate();
  }

  const submitRecipe = handleSubmit((values) => createRecipe.mutate(values));

  function appendIngredient() {
    ingredientRows.append({
      inventoryItemId: inventoryItems[0]?.id ?? '',
      quantity: 1,
      unitId: inventoryItems[0]?.usageUnit.id ?? units[0]?.id ?? '',
    });
  }

  return (
    <div className="h-full overflow-y-auto bg-white p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-primary">Admin workspace</p>
          <h1 className="mt-2 text-4xl font-black text-espresso">Menu studio</h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold text-muted">
            Manage POS categories, sellable items, kitchen routing, recipe formulas, stock usage, and active status.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone={canManageMenu ? 'green' : 'orange'}>{canManageMenu ? 'Menu editable' : 'Menu view only'}</Badge>
          <Badge tone={canManageRecipes ? 'green' : 'orange'}>
            {canManageRecipes ? 'Recipes editable' : 'Recipes view only'}
          </Badge>
          <Button
            disabled={!canManageMenu}
            icon={<Plus size={17} />}
            variant="secondary"
            onClick={() => setActiveModal('category')}
          >
            Category
          </Button>
          <Button disabled={!canManageMenu} icon={<Plus size={17} />} onClick={() => setActiveModal('item')}>
            Menu item
          </Button>
          <Button
            disabled={!canManageRecipes}
            icon={<ChefHat size={17} />}
            onClick={() => setActiveModal('recipe')}
          >
            Recipe
          </Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-5 gap-4">
        <Metric icon={<Boxes size={19} />} label="Active categories" value={menuQuery.data?.metrics.activeCategories ?? 0} />
        <Metric icon={<Utensils size={19} />} label="Active items" value={menuQuery.data?.metrics.activeItems ?? 0} />
        <Metric
          icon={<CheckCircle2 size={19} />}
          label="Recipe linked"
          value={recipeQuery.data?.metrics.recipeLinkedItems ?? menuQuery.data?.metrics.recipeLinkedItems ?? 0}
        />
        <Metric icon={<ChefHat size={19} />} label="Active recipes" value={recipeQuery.data?.metrics.activeRecipes ?? 0} />
        <Metric
          icon={<AlertCircle size={19} />}
          label="Missing recipes"
          value={recipeQuery.data?.metrics.missingRecipeItems ?? 0}
        />
      </div>

      <div className="mt-5">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-6 py-5">
            <div>
              <h2 className="text-xl font-black text-espresso">Catalog items</h2>
              <p className="text-sm font-semibold text-muted">Kitchen station, recipe readiness, and POS status.</p>
            </div>
            {menuQuery.isLoading ? <Loader2 className="animate-spin text-primary" size={20} /> : null}
          </div>

          {menuQuery.isError ? <InlineState tone="red" text="Menu data could not load. Check the API session." /> : null}

          <div className="max-h-[560px] overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-sage text-xs font-black uppercase text-muted">
                <tr>
                  <th className="px-6 py-3">Item</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Station</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-right">Prep</th>
                  <th className="px-6 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {(menuQuery.data?.items ?? []).map((item) => (
                  <tr key={item.id} className="align-middle">
                    <td className="px-6 py-4">
                      <p className="font-black text-espresso">{item.name}</p>
                      <p className="mt-1 text-xs font-semibold text-muted">
                        {item.sku || 'No SKU'} · {item.recipeRequired ? 'Recipe required' : 'Direct sale'}
                      </p>
                    </td>
                    <td className="px-4 py-4 font-bold text-label">{item.category.name}</td>
                    <td className="px-4 py-4 font-bold text-label">{item.kitchenStation?.name ?? 'Front counter'}</td>
                    <td className="px-4 py-4 text-right font-black text-espresso">
                      {money.format(Number(item.basePrice))}
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-label">{item.preparationMinutes}m</td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        className="h-9 px-3"
                        disabled={!canManageMenu || toggleItem.isPending}
                        icon={<Power size={15} />}
                        variant={item.active ? 'secondary' : 'ghost'}
                        onClick={() => toggleItem.mutate(item)}
                      >
                        {item.active ? 'Active' : 'Hidden'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="mt-5">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-6 py-5">
            <div>
              <h2 className="text-xl font-black text-espresso">Recipe formulas</h2>
              <p className="text-sm font-semibold text-muted">Ingredient quantities used for stock deduction.</p>
            </div>
            {recipeQuery.isLoading ? <Loader2 className="animate-spin text-primary" size={20} /> : null}
          </div>

          {recipeQuery.isError ? <InlineState tone="red" text="Recipe data could not load. Check API permissions." /> : null}

          <div className="grid max-h-[520px] grid-cols-2 gap-4 overflow-y-auto p-5">
            {(recipeQuery.data?.recipes ?? []).map((recipe) => (
              <div key={recipe.id} className="rounded-2xl border border-line bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-black text-espresso">{recipe.name}</p>
                    <p className="mt-1 text-xs font-bold text-muted">
                      {recipe.menuItem.name}
                      {recipe.variation ? ` · ${recipe.variation.name}` : ''}
                    </p>
                  </div>
                  <Badge tone={recipe.active ? 'green' : 'gray'}>{recipe.active ? 'Active' : 'Off'}</Badge>
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <p className="text-xs font-black uppercase text-muted">Estimated cost</p>
                    <p className="mt-1 text-2xl font-black text-secondary">
                      {money.format(Number(recipe.estimatedCost))}
                    </p>
                  </div>
                  <p className="text-sm font-black text-primary">{recipe.ingredients.length} ingredients</p>
                </div>
                <div className="mt-4 space-y-2">
                  {recipe.ingredients.slice(0, 4).map((ingredient) => (
                    <div key={ingredient.id} className="flex justify-between gap-3 text-xs font-bold text-label">
                      <span>{ingredient.inventoryItem.name}</span>
                      <span>
                        {Number(ingredient.quantity).toLocaleString()} {ingredient.unit.symbol}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

      </div>

      <ActionModal
        description="Create a POS grouping and optionally route it to a kitchen station."
        open={activeModal === 'category'}
        title="New category"
        onClose={() => setActiveModal(null)}
      >
        <form className="space-y-3" onSubmit={submitCategory}>
          <input
            className={fieldClass}
            disabled={!canManageMenu}
            placeholder="Category name"
            value={categoryName}
            onChange={(event) => setCategoryName(event.target.value)}
          />
          <select
            className={fieldClass}
            disabled={!canManageMenu}
            value={categoryStationId}
            onChange={(event) => setCategoryStationId(event.target.value)}
          >
            <option value="">No station</option>
            {stations.map((station) => (
              <option key={station.id} value={station.id}>
                {station.name}
              </option>
            ))}
          </select>
          <Button
            className="w-full"
            disabled={!canManageMenu || !categoryName.trim() || createCategory.isPending}
            icon={createCategory.isPending ? <Loader2 className="animate-spin" size={17} /> : <Plus size={17} />}
            type="submit"
          >
            Add category
          </Button>
        </form>
      </ActionModal>

      <ActionModal
        description="Add a sellable POS item with price, category, station, and recipe readiness."
        open={activeModal === 'item'}
        title="New menu item"
        onClose={() => setActiveModal(null)}
      >
        <form className="space-y-3" onSubmit={submitItem}>
          <input
            className={fieldClass}
            disabled={!canManageMenu}
            placeholder="Item name"
            value={itemName}
            onChange={(event) => setItemName(event.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              className={fieldClass}
              disabled={!canManageMenu}
              min="0"
              placeholder="Price"
              type="number"
              value={itemPrice}
              onChange={(event) => setItemPrice(event.target.value)}
            />
            <select
              className={fieldClass}
              disabled={!canManageMenu || categories.length === 0}
              value={selectedItemCategoryId}
              onChange={(event) => setItemCategoryId(event.target.value)}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <select
            className={fieldClass}
            disabled={!canManageMenu}
            value={itemStationId}
            onChange={(event) => setItemStationId(event.target.value)}
          >
            <option value="">Use category station</option>
            {stations.map((station) => (
              <option key={station.id} value={station.id}>
                {station.name}
              </option>
            ))}
          </select>
          <Button
            className="w-full"
            disabled={!canManageMenu || !itemName.trim() || !itemPrice || !selectedItemCategoryId || createItem.isPending}
            icon={createItem.isPending ? <Loader2 className="animate-spin" size={17} /> : <Plus size={17} />}
            type="submit"
          >
            Add item
          </Button>
        </form>
      </ActionModal>

      <ActionModal
        description="Build the stock formula that will be deducted when an item is sent to kitchen."
        open={activeModal === 'recipe'}
        title="New recipe"
        widthClass="max-w-2xl"
        onClose={() => setActiveModal(null)}
      >
        <div className="mb-4 flex justify-end">
          <Badge tone={selectedRecipeMenuItem?._count.recipes ? 'green' : 'orange'}>
            {selectedRecipeMenuItem?._count.recipes ? 'Linked' : 'Needs recipe'}
          </Badge>
        </div>
        <form className="space-y-4" onSubmit={submitRecipe}>
          <select
            className={fieldClass}
            disabled={!canManageRecipes || recipeItems.length === 0}
            {...register('menuItemId', {
              onChange: (event) => {
                const item = recipeItems.find((entry) => entry.id === event.target.value);
                if (item) setValue('name', `${item.name} Recipe`, { shouldDirty: true });
              },
            })}
          >
            {recipeItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          {errors.menuItemId ? <p className="text-xs font-bold text-red-600">{errors.menuItemId.message}</p> : null}

          <input
            className={fieldClass}
            disabled={!canManageRecipes}
            placeholder="Recipe name"
            {...register('name')}
          />
          {errors.name ? <p className="text-xs font-bold text-red-600">{errors.name.message}</p> : null}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-muted">Ingredients</p>
              <Button
                className="h-9 px-3"
                disabled={!canManageRecipes || inventoryItems.length === 0}
                icon={<Plus size={15} />}
                type="button"
                variant="secondary"
                onClick={appendIngredient}
              >
                Row
              </Button>
            </div>

            {ingredientRows.fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-[1fr_86px_78px_40px] gap-2">
                <select
                  className={compactFieldClass}
                  disabled={!canManageRecipes || inventoryItems.length === 0}
                  value={watch(`ingredients.${index}.inventoryItemId`)}
                  onChange={(event) => {
                    const inventory = inventoryById.get(event.target.value);
                    setValue(`ingredients.${index}.inventoryItemId`, event.target.value, { shouldDirty: true });
                    setValue(`ingredients.${index}.unitId`, inventory?.usageUnit.id ?? units[0]?.id ?? '', {
                      shouldDirty: true,
                    });
                  }}
                >
                  {inventoryItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <input
                  className={compactFieldClass}
                  disabled={!canManageRecipes}
                  min="0.0001"
                  step="0.0001"
                  type="number"
                  {...register(`ingredients.${index}.quantity`)}
                />
                <select
                  className={compactFieldClass}
                  disabled={!canManageRecipes}
                  {...register(`ingredients.${index}.unitId`)}
                >
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.symbol}
                    </option>
                  ))}
                </select>
                <Button
                  className="h-10 w-10 px-0"
                  disabled={!canManageRecipes || ingredientRows.fields.length === 1}
                  icon={<Trash2 size={15} />}
                  type="button"
                  variant="ghost"
                  onClick={() => ingredientRows.remove(index)}
                />
              </div>
            ))}
            {errors.ingredients ? <p className="text-xs font-bold text-red-600">{errors.ingredients.message}</p> : null}
          </div>

          {createRecipe.isError ? <InlineState tone="red" text="Recipe save failed. Check permission and required fields." /> : null}
          {createRecipe.isSuccess ? <InlineState tone="green" text="Recipe saved and menu item marked recipe-required." /> : null}

          <Button
            className="w-full"
            disabled={!canManageRecipes || recipeItems.length === 0 || inventoryItems.length === 0 || createRecipe.isPending}
            icon={createRecipe.isPending ? <Loader2 className="animate-spin" size={17} /> : <ChefHat size={17} />}
            type="submit"
          >
            Save recipe
          </Button>
        </form>
      </ActionModal>
    </div>
  );
}
