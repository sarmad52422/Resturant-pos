import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Boxes, CheckCircle2, Loader2, Plus, Power, Utensils } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { Badge, Button, Card } from '@restaurantos/ui';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../store/use-auth-store';

interface KitchenStation {
  id: string;
  name: string;
}

interface MenuCategory {
  id: string;
  active: boolean;
  description?: string;
  displayOrder: number;
  kitchenStation?: KitchenStation;
  name: string;
  _count: { items: number };
}

interface MenuItem {
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

interface MenuSummary {
  categories: MenuCategory[];
  items: MenuItem[];
  stations: KitchenStation[];
  metrics: {
    activeCategories: number;
    activeItems: number;
    recipeLinkedItems: number;
  };
}

const fieldClass =
  'h-11 w-full rounded-xl border border-field bg-white px-3 text-sm font-semibold text-espresso outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10';

const money = new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0, style: 'currency', currency: 'PKR' });

export function MenuPage() {
  const queryClient = useQueryClient();
  const canManageMenu = useAuthStore((state) => state.hasPermission('menu.manage'));
  const [categoryName, setCategoryName] = useState('');
  const [categoryStationId, setCategoryStationId] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemCategoryId, setItemCategoryId] = useState('');
  const [itemStationId, setItemStationId] = useState('');

  const menuQuery = useQuery({
    queryKey: ['menu-summary'],
    queryFn: () => apiFetch<MenuSummary>('/menu'),
  });

  const categories = menuQuery.data?.categories ?? [];
  const stations = menuQuery.data?.stations ?? [];
  const selectedItemCategoryId = itemCategoryId || categories[0]?.id || '';

  const categoriesById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

  const refreshMenu = () => queryClient.invalidateQueries({ queryKey: ['menu-summary'] });

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
      void refreshMenu();
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
      void refreshMenu();
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

  return (
    <div className="h-full overflow-y-auto bg-white p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-primary">Admin workspace</p>
          <h1 className="mt-2 text-4xl font-black text-espresso">Menu studio</h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold text-muted">
            Manage POS categories and sellable items with kitchen routing, pricing, recipe flags, and active status.
          </p>
        </div>
        <Badge tone={canManageMenu ? 'green' : 'orange'}>{canManageMenu ? 'Editable' : 'View only'}</Badge>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <Metric icon={<Boxes size={19} />} label="Active categories" value={menuQuery.data?.metrics.activeCategories ?? 0} />
        <Metric icon={<Utensils size={19} />} label="Active items" value={menuQuery.data?.metrics.activeItems ?? 0} />
        <Metric
          icon={<CheckCircle2 size={19} />}
          label="Recipe linked"
          value={menuQuery.data?.metrics.recipeLinkedItems ?? 0}
        />
      </div>

      <div className="mt-5 grid grid-cols-[1fr_360px] gap-5">
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

        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="text-lg font-black text-espresso">New category</h2>
            <form className="mt-4 space-y-3" onSubmit={submitCategory}>
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
          </Card>

          <Card className="p-5">
            <h2 className="text-lg font-black text-espresso">New item</h2>
            <form className="mt-4 space-y-3" onSubmit={submitItem}>
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
          </Card>
        </div>
      </div>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card className="flex items-center justify-between p-5">
      <div>
        <p className="text-sm font-black text-muted">{label}</p>
        <p className="mt-3 text-3xl font-black text-espresso">{value}</p>
      </div>
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-mint text-secondary">{icon}</span>
    </Card>
  );
}

function InlineState({ text, tone }: { text: string; tone: 'red' | 'green' }) {
  return (
    <div
      className={`m-5 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold ${
        tone === 'red' ? 'bg-red-50 text-red-700' : 'bg-sage text-secondary'
      }`}
    >
      <AlertCircle size={17} />
      {text}
    </div>
  );
}
