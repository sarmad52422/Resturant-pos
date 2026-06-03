import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Archive, Loader2, PackagePlus, Plus, Power, ReceiptText, Trash2, TrendingDown } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Badge, Button, Card } from '@restaurantos/ui';
import { ActionModal } from '../../components/action-modal';
import { apiFetch } from '../../lib/api';
import type { FormSubmitEvent } from '../../lib/events';
import { useAuthStore } from '../../store/use-auth-store';
import type { InventoryItem, InventoryResponse, PaymentMethod, Purchase, PurchaseRow } from './interfaces';

const fieldClass =
  'h-11 w-full rounded-xl border border-field bg-white px-3 text-sm font-semibold text-espresso outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10';

const money = new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0, style: 'currency', currency: 'PKR' });
const today = new Date().toISOString().slice(0, 10);

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
  const [createOpen, setCreateOpen] = useState(false);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [paidAmount, setPaidAmount] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [purchaseDate, setPurchaseDate] = useState(today);
  const [purchaseSupplierId, setPurchaseSupplierId] = useState('');
  const [purchaseRows, setPurchaseRows] = useState<PurchaseRow[]>([]);

  const inventoryQuery = useQuery({
    queryKey: ['inventory'],
    queryFn: () => apiFetch<InventoryResponse>('/inventory'),
  });

  const purchasesQuery = useQuery({
    queryKey: ['inventory-purchases'],
    queryFn: () => apiFetch<Purchase[]>('/inventory/purchases'),
  });

  const units = inventoryQuery.data?.units ?? [];
  const suppliers = inventoryQuery.data?.suppliers ?? [];
  const inventoryItems = inventoryQuery.data?.items ?? [];
  const defaultUnitId = units.find((unit) => unit.symbol === 'pc')?.id ?? units[0]?.id ?? '';
  const selectedPurchaseUnitId = purchaseUnitId || defaultUnitId;
  const selectedUsageUnitId = usageUnitId || selectedPurchaseUnitId;
  const selectedPurchaseSupplierId = purchaseSupplierId || suppliers[0]?.id || '';
  const purchaseTotal = purchaseRows.reduce(
    (total, row) => total + Number(row.quantity || 0) * Number(row.unitCost || 0),
    0,
  );

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
      setCreateOpen(false);
      void queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });

  const createPurchase = useMutation({
    mutationFn: () =>
      apiFetch<Purchase>('/inventory/purchases', {
        method: 'POST',
        body: JSON.stringify({
          supplierId: selectedPurchaseSupplierId,
          invoiceNumber: invoiceNumber.trim() || undefined,
          purchaseDate,
          paidAmount: Number(paidAmount || 0),
          paymentMethod,
          items: purchaseRows.map((row) => ({
            inventoryItemId: row.inventoryItemId,
            quantity: Number(row.quantity || 0),
            unitId: row.unitId,
            unitCost: Number(row.unitCost || 0),
          })),
        }),
      }),
    onSuccess: () => {
      setInvoiceNumber('');
      setPaidAmount('0');
      setPaymentMethod('CASH');
      setPurchaseDate(today);
      setPurchaseSupplierId('');
      setPurchaseRows(defaultPurchaseRows(inventoryItems));
      setPurchaseOpen(false);
      void queryClient.invalidateQueries({ queryKey: ['inventory'] });
      void queryClient.invalidateQueries({ queryKey: ['inventory-purchases'] });
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

  function submitItem(event: FormSubmitEvent) {
    event.preventDefault();
    if (name.trim() && selectedPurchaseUnitId && selectedUsageUnitId) createItem.mutate();
  }

  function openPurchase() {
    setPurchaseRows((rows) => (rows.length ? rows : defaultPurchaseRows(inventoryItems)));
    setPurchaseOpen(true);
  }

  function appendPurchaseRow() {
    setPurchaseRows((rows) => [...rows, defaultPurchaseRow(inventoryItems)]);
  }

  function updatePurchaseRow(id: string, patch: Partial<PurchaseRow>) {
    setPurchaseRows((rows) =>
      rows.map((row) => {
        if (row.id !== id) return row;
        const next = { ...row, ...patch };
        if (patch.inventoryItemId) {
          const item = inventoryItems.find((entry) => entry.id === patch.inventoryItemId);
          next.unitId = item?.purchaseUnitId ?? row.unitId;
        }
        return next;
      }),
    );
  }

  function removePurchaseRow(id: string) {
    setPurchaseRows((rows) => rows.filter((row) => row.id !== id));
  }

  function submitPurchase(event: FormSubmitEvent) {
    event.preventDefault();
    const validRows = purchaseRows.filter(
      (row) => row.inventoryItemId && row.unitId && Number(row.quantity) > 0 && Number(row.unitCost) >= 0,
    );
    if (selectedPurchaseSupplierId && validRows.length && Number(paidAmount || 0) <= purchaseTotal) {
      createPurchase.mutate();
    }
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
        <div className="flex items-center gap-3">
          <Badge tone={canManageInventory ? 'green' : 'orange'}>
            {canManageInventory ? 'Editable' : 'View only'}
          </Badge>
          <Button
            disabled={!canManageInventory}
            icon={<Plus size={17} />}
            onClick={() => setCreateOpen(true)}
          >
            New stock item
          </Button>
          <Button
            disabled={!canManageInventory || inventoryItems.length === 0 || suppliers.length === 0}
            icon={<ReceiptText size={17} />}
            onClick={openPurchase}
          >
            Receive stock
          </Button>
        </div>
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

      <div className="mt-5">
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
      </div>

      <Card className="mt-5 overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <div>
            <h2 className="text-xl font-black text-espresso">Purchase history</h2>
            <p className="text-sm font-semibold text-muted">Recent receiving entries, paid amount, and supplier balance.</p>
          </div>
          {purchasesQuery.isLoading ? <Loader2 className="animate-spin text-primary" size={20} /> : null}
        </div>

        {purchasesQuery.isError ? (
          <div className="m-5 flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            <AlertCircle size={17} />
            Purchases could not load. Check the API session.
          </div>
        ) : null}

        <div className="max-h-[360px] overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-sage text-xs font-black uppercase text-muted">
              <tr>
                <th className="px-6 py-3">Invoice</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3 text-right">Items</th>
                <th className="px-4 py-3 text-right">Paid</th>
                <th className="px-6 py-3 text-right">Remaining</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {(purchasesQuery.data ?? []).map((purchase) => (
                <tr key={purchase.id}>
                  <td className="px-6 py-4">
                    <p className="font-black text-espresso">{purchase.invoiceNumber || 'No invoice'}</p>
                    <p className="mt-1 text-xs font-semibold text-muted">
                      {new Date(purchase.purchaseDate).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="px-4 py-4 font-bold text-label">{purchase.supplier.name}</td>
                  <td className="px-4 py-4 text-right font-bold text-label">{purchase.items.length}</td>
                  <td className="px-4 py-4 text-right font-black text-secondary">
                    {money.format(Number(purchase.paidAmount))}
                  </td>
                  <td className="px-6 py-4 text-right font-black text-espresso">
                    {money.format(Number(purchase.remainingAmount))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <ActionModal
        description="Create an inventory item with units, threshold, average cost, and optional supplier."
        open={createOpen}
        title="New stock item"
        onClose={() => setCreateOpen(false)}
      >
          <form className="space-y-3" onSubmit={submitItem}>
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
      </ActionModal>

      <ActionModal
        description="Receive purchased stock, update average cost, and create supplier payable for any unpaid amount."
        open={purchaseOpen}
        title="Receive stock"
        widthClass="max-w-4xl"
        onClose={() => setPurchaseOpen(false)}
      >
        <form className="space-y-4" onSubmit={submitPurchase}>
          <div className="grid grid-cols-4 gap-3">
            <select
              className={fieldClass}
              disabled={!canManageInventory}
              value={selectedPurchaseSupplierId}
              onChange={(event) => setPurchaseSupplierId(event.target.value)}
            >
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
            <input
              className={fieldClass}
              disabled={!canManageInventory}
              placeholder="Invoice"
              value={invoiceNumber}
              onChange={(event) => setInvoiceNumber(event.target.value)}
            />
            <input
              className={fieldClass}
              disabled={!canManageInventory}
              type="date"
              value={purchaseDate}
              onChange={(event) => setPurchaseDate(event.target.value)}
            />
            <select
              className={fieldClass}
              disabled={!canManageInventory}
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
            >
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="BANK_TRANSFER">Bank transfer</option>
              <option value="JAZZCASH_EASYPAISA">Wallet</option>
              <option value="ONLINE">Online</option>
            </select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-muted">Received items</p>
              <Button
                className="h-9 px-3"
                disabled={!canManageInventory || inventoryItems.length === 0}
                icon={<Plus size={15} />}
                type="button"
                variant="secondary"
                onClick={appendPurchaseRow}
              >
                Row
              </Button>
            </div>

            {purchaseRows.map((row) => (
              <div key={row.id} className="grid grid-cols-[1fr_100px_90px_110px_40px] gap-2">
                <select
                  className={fieldClass}
                  disabled={!canManageInventory}
                  value={row.inventoryItemId}
                  onChange={(event) => updatePurchaseRow(row.id, { inventoryItemId: event.target.value })}
                >
                  {inventoryItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <input
                  className={fieldClass}
                  disabled={!canManageInventory}
                  min="0.0001"
                  step="0.0001"
                  type="number"
                  value={row.quantity}
                  onChange={(event) => updatePurchaseRow(row.id, { quantity: event.target.value })}
                />
                <select
                  className={fieldClass}
                  disabled={!canManageInventory}
                  value={row.unitId}
                  onChange={(event) => updatePurchaseRow(row.id, { unitId: event.target.value })}
                >
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.symbol}
                    </option>
                  ))}
                </select>
                <input
                  className={fieldClass}
                  disabled={!canManageInventory}
                  min="0"
                  step="0.01"
                  type="number"
                  value={row.unitCost}
                  onChange={(event) => updatePurchaseRow(row.id, { unitCost: event.target.value })}
                />
                <Button
                  className="h-11 w-10 px-0"
                  disabled={!canManageInventory || purchaseRows.length === 1}
                  icon={<Trash2 size={15} />}
                  type="button"
                  variant="ghost"
                  onClick={() => removePurchaseRow(row.id)}
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-[1fr_180px_180px] gap-3 rounded-2xl bg-sage p-4">
            <div>
              <p className="text-xs font-black uppercase text-muted">Purchase total</p>
              <p className="mt-1 text-2xl font-black text-espresso">{money.format(purchaseTotal)}</p>
            </div>
            <input
              className={fieldClass}
              disabled={!canManageInventory}
              min="0"
              placeholder="Paid"
              type="number"
              value={paidAmount}
              onChange={(event) => setPaidAmount(event.target.value)}
            />
            <div>
              <p className="text-xs font-black uppercase text-muted">Remaining</p>
              <p className="mt-2 text-xl font-black text-secondary">
                {money.format(Math.max(0, purchaseTotal - Number(paidAmount || 0)))}
              </p>
            </div>
          </div>

          {createPurchase.isError ? (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              Purchase save failed. Check supplier, rows, and paid amount.
            </div>
          ) : null}

          <Button
            className="w-full"
            disabled={
              !canManageInventory ||
              !selectedPurchaseSupplierId ||
              purchaseRows.length === 0 ||
              purchaseTotal <= 0 ||
              Number(paidAmount || 0) > purchaseTotal ||
              createPurchase.isPending
            }
            icon={createPurchase.isPending ? <Loader2 className="animate-spin" size={17} /> : <ReceiptText size={17} />}
            type="submit"
          >
            Receive purchase
          </Button>
        </form>
      </ActionModal>
    </div>
  );
}

function defaultPurchaseRows(items: InventoryItem[]): PurchaseRow[] {
  return [defaultPurchaseRow(items)];
}

function defaultPurchaseRow(items: InventoryItem[]): PurchaseRow {
  const item = items[0];
  return {
    id: globalThis.crypto?.randomUUID?.() ?? String(Date.now()),
    inventoryItemId: item?.id ?? '',
    quantity: '1',
    unitCost: item?.averageCost ?? '0',
    unitId: item?.purchaseUnitId ?? '',
  };
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: number | string }) {
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
