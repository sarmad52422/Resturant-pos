import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Archive, Loader2, PackagePlus, Plus, Power, TrendingDown } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Badge, Button, Card } from '@restaurantos/ui';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../store/use-auth-store';

interface Unit {
  id: string;
  name: string;
  symbol: string;
}

interface Supplier {
  id: string;
  name: string;
}

interface InventoryItem {
  id: string;
  active: boolean;
  averageCost: string;
  category?: string;
  currentStock: string;
  minimumStockLevel: string;
  name: string;
  purchaseUnitId: string;
  usageUnitId: string;
}

interface InventoryResponse {
  items: InventoryItem[];
  suppliers: Supplier[];
  units: Unit[];
  metrics: {
    activeItems: number;
    lowStockItems: number;
    totalStockValue: string;
  };
}

const fieldClass =
  'h-11 w-full rounded-xl border border-field bg-white px-3 text-sm font-semibold text-espresso outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10';

const money = new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0, style: 'currency', currency: 'PKR' });

export function InventoryPage() {
  const queryClient = useQueryClient();
  const canManageInventory = useAuthStore((state) => state.hasPermission('inventory.manage'));
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [currentStock, setCurrentStock] = useState('0');
  const [minimumStockLevel, setMinimumStockLevel] = useState('0');
  const [averageCost, setAverageCost] = useState('0');
  const [purchaseUnitId, setPurchaseUnitId] = useState('');
  const [usageUnitId, setUsageUnitId] = useState('');
  const [supplierId, setSupplierId] = useState('');

  const inventoryQuery = useQuery({
    queryKey: ['inventory'],
    queryFn: () => apiFetch<InventoryResponse>('/inventory'),
  });

  const units = inventoryQuery.data?.units ?? [];
  const suppliers = inventoryQuery.data?.suppliers ?? [];
  const defaultUnitId = units.find((unit) => unit.symbol === 'pc')?.id ?? units[0]?.id ?? '';
  const selectedPurchaseUnitId = purchaseUnitId || defaultUnitId;
  const selectedUsageUnitId = usageUnitId || selectedPurchaseUnitId;

  const createItem = useMutation({
    mutationFn: () =>
      apiFetch<InventoryItem>('/inventory/items', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          category: category.trim() || undefined,
          currentStock: Number(currentStock || 0),
          minimumStockLevel: Number(minimumStockLevel || 0),
          averageCost: Number(averageCost || 0),
          lastPurchaseCost: Number(averageCost || 0),
          conversionRate: selectedPurchaseUnitId === selectedUsageUnitId ? 1 : 1,
          purchaseUnitId: selectedPurchaseUnitId,
          usageUnitId: selectedUsageUnitId,
          supplierId: supplierId || undefined,
        }),
      }),
    onSuccess: () => {
      setName('');
      setCategory('');
      setCurrentStock('0');
      setMinimumStockLevel('0');
      setAverageCost('0');
      setPurchaseUnitId('');
      setUsageUnitId('');
      setSupplierId('');
      void queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });

  const toggleItem = useMutation({
    mutationFn: (item: InventoryItem) =>
      apiFetch<InventoryItem>(`/inventory/items/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !item.active }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inventory'] }),
  });

  function submitItem(event: FormEvent) {
    event.preventDefault();
    if (name.trim() && selectedPurchaseUnitId && selectedUsageUnitId) createItem.mutate();
  }

  function unitLabel(id: string) {
    return units.find((unit) => unit.id === id)?.symbol ?? '';
  }

  return (
    <div className="h-full overflow-y-auto bg-white p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-primary">Stock control</p>
          <h1 className="mt-2 text-4xl font-black text-espresso">Inventory</h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold text-muted">
            Monitor stock levels, low-stock thresholds, valuation, usage units, and active purchasing items.
          </p>
        </div>
        <Badge tone={canManageInventory ? 'green' : 'orange'}>
          {canManageInventory ? 'Editable' : 'View only'}
        </Badge>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <Metric icon={<Archive size={19} />} label="Active stock items" value={inventoryQuery.data?.metrics.activeItems ?? 0} />
        <Metric
          icon={<TrendingDown size={19} />}
          label="Low stock"
          value={inventoryQuery.data?.metrics.lowStockItems ?? 0}
        />
        <Metric
          icon={<PackagePlus size={19} />}
          label="Stock value"
          value={money.format(Number(inventoryQuery.data?.metrics.totalStockValue ?? 0))}
        />
      </div>

      <div className="mt-5 grid grid-cols-[1fr_360px] gap-5">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-6 py-5">
            <div>
              <h2 className="text-xl font-black text-espresso">Stock item master</h2>
              <p className="text-sm font-semibold text-muted">Current quantity, threshold, cost, and sellability state.</p>
            </div>
            {inventoryQuery.isLoading ? <Loader2 className="animate-spin text-primary" size={20} /> : null}
          </div>

          {inventoryQuery.isError ? (
            <div className="m-5 flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              <AlertCircle size={17} />
              Inventory could not load. Check the API session.
            </div>
          ) : null}

          <div className="max-h-[560px] overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-sage text-xs font-black uppercase text-muted">
                <tr>
                  <th className="px-6 py-3">Item</th>
                  <th className="px-4 py-3 text-right">On hand</th>
                  <th className="px-4 py-3 text-right">Minimum</th>
                  <th className="px-4 py-3 text-right">Avg cost</th>
                  <th className="px-6 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {(inventoryQuery.data?.items ?? []).map((item) => {
                  const lowStock = Number(item.currentStock) <= Number(item.minimumStockLevel);
                  return (
                    <tr key={item.id}>
                      <td className="px-6 py-4">
                        <p className="font-black text-espresso">{item.name}</p>
                        <p className="mt-1 text-xs font-semibold text-muted">{item.category || 'Uncategorized'}</p>
                      </td>
                      <td className="px-4 py-4 text-right font-black text-espresso">
                        {Number(item.currentStock).toLocaleString()} {unitLabel(item.usageUnitId)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Badge tone={lowStock ? 'red' : 'gray'}>
                          {Number(item.minimumStockLevel).toLocaleString()} {unitLabel(item.usageUnitId)}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-right font-bold text-label">
                        {money.format(Number(item.averageCost))}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          className="h-9 px-3"
                          disabled={!canManageInventory || toggleItem.isPending}
                          icon={<Power size={15} />}
                          variant={item.active ? 'secondary' : 'ghost'}
                          onClick={() => toggleItem.mutate(item)}
                        >
                          {item.active ? 'Active' : 'Hidden'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-black text-espresso">New stock item</h2>
          <form className="mt-4 space-y-3" onSubmit={submitItem}>
            <input
              className={fieldClass}
              disabled={!canManageInventory}
              placeholder="Item name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <input
              className={fieldClass}
              disabled={!canManageInventory}
              placeholder="Category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                className={fieldClass}
                disabled={!canManageInventory}
                min="0"
                placeholder="On hand"
                type="number"
                value={currentStock}
                onChange={(event) => setCurrentStock(event.target.value)}
              />
              <input
                className={fieldClass}
                disabled={!canManageInventory}
                min="0"
                placeholder="Minimum"
                type="number"
                value={minimumStockLevel}
                onChange={(event) => setMinimumStockLevel(event.target.value)}
              />
            </div>
            <input
              className={fieldClass}
              disabled={!canManageInventory}
              min="0"
              placeholder="Average cost"
              type="number"
              value={averageCost}
              onChange={(event) => setAverageCost(event.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                className={fieldClass}
                disabled={!canManageInventory}
                value={selectedPurchaseUnitId}
                onChange={(event) => setPurchaseUnitId(event.target.value)}
              >
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    Buy: {unit.symbol}
                  </option>
                ))}
              </select>
              <select
                className={fieldClass}
                disabled={!canManageInventory}
                value={selectedUsageUnitId}
                onChange={(event) => setUsageUnitId(event.target.value)}
              >
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    Use: {unit.symbol}
                  </option>
                ))}
              </select>
            </div>
            <select
              className={fieldClass}
              disabled={!canManageInventory}
              value={supplierId}
              onChange={(event) => setSupplierId(event.target.value)}
            >
              <option value="">No supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
            <Button
              className="w-full"
              disabled={!canManageInventory || !name.trim() || !selectedPurchaseUnitId || createItem.isPending}
              icon={createItem.isPending ? <Loader2 className="animate-spin" size={17} /> : <Plus size={17} />}
              type="submit"
            >
              Add stock item
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
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
