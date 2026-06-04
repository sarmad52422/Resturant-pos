import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Archive,
  HandCoins,
  Loader2,
  PackagePlus,
  Plus,
  Power,
  ReceiptText,
  Trash2,
  TrendingDown,
  Truck,
  WalletCards,
} from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Badge, Button, Card } from '@restaurantos/ui';
import { ActionModal } from '@/components/action-modal';
import { FormField } from '@/components/form-field';
import type { FormSubmitEvent } from '@/lib/events';
import { inventoryService } from '@/services/inventory-service';
import { useAuthStore } from '@/store/use-auth-store';
import type {
  InventoryItem,
  PaymentMethod,
  PurchaseRow,
  Supplier,
} from './interfaces';

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
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierContactPerson, setSupplierContactPerson] = useState('');
  const [supplierAddress, setSupplierAddress] = useState('');
  const [supplierOpeningBalance, setSupplierOpeningBalance] = useState('0');
  const [supplierNotes, setSupplierNotes] = useState('');
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentSupplierId, setPaymentSupplierId] = useState('');
  const [supplierPaymentAmount, setSupplierPaymentAmount] = useState('');
  const [supplierPaymentMethod, setSupplierPaymentMethod] = useState<PaymentMethod>('CASH');
  const [supplierPaymentReference, setSupplierPaymentReference] = useState('');
  const [supplierPaymentNotes, setSupplierPaymentNotes] = useState('');

  const inventoryQuery = useQuery({
    queryKey: ['inventory'],
    queryFn: inventoryService.list,
  });

  const purchasesQuery = useQuery({
    queryKey: ['inventory-purchases'],
    queryFn: inventoryService.purchases,
  });

  const suppliersQuery = useQuery({
    queryKey: ['inventory-suppliers'],
    queryFn: inventoryService.suppliers,
  });

  const units = inventoryQuery.data?.units ?? [];
  const suppliers = suppliersQuery.data ?? inventoryQuery.data?.suppliers ?? [];
  const inventoryItems = inventoryQuery.data?.items ?? [];
  const defaultUnitId = units.find((unit) => unit.symbol === 'pc')?.id ?? units[0]?.id ?? '';
  const selectedPurchaseUnitId = purchaseUnitId || defaultUnitId;
  const selectedUsageUnitId = usageUnitId || selectedPurchaseUnitId;
  const selectedPurchaseSupplierId = purchaseSupplierId || suppliers[0]?.id || '';
  const selectedPaymentSupplierId = paymentSupplierId || suppliers.find((supplier) => Number(supplier.currentPayable) > 0)?.id || suppliers[0]?.id || '';
  const selectedPaymentSupplier = suppliers.find((supplier) => supplier.id === selectedPaymentSupplierId);
  const purchaseTotal = purchaseRows.reduce(
    (total, row) => total + Number(row.quantity || 0) * Number(row.unitCost || 0),
    0,
  );
  const supplierPayableTotal = suppliers.reduce((total, supplier) => total + Number(supplier.currentPayable || 0), 0);

  const createItem = useMutation({
    mutationFn: () =>
      inventoryService.createItem({
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
      void queryClient.invalidateQueries({ queryKey: ['inventory-suppliers'] });
    },
  });

  const createPurchase = useMutation({
    mutationFn: () =>
      inventoryService.createPurchase({
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
      void queryClient.invalidateQueries({ queryKey: ['inventory-suppliers'] });
    },
  });

  const createSupplier = useMutation({
    mutationFn: () =>
      inventoryService.createSupplier({
        name: supplierName.trim(),
        phone: supplierPhone.trim() || undefined,
        contactPerson: supplierContactPerson.trim() || undefined,
        address: supplierAddress.trim() || undefined,
        openingBalance: Number(supplierOpeningBalance || 0),
        notes: supplierNotes.trim() || undefined,
      }),
    onSuccess: () => {
      setSupplierName('');
      setSupplierPhone('');
      setSupplierContactPerson('');
      setSupplierAddress('');
      setSupplierOpeningBalance('0');
      setSupplierNotes('');
      setSupplierOpen(false);
      void queryClient.invalidateQueries({ queryKey: ['inventory'] });
      void queryClient.invalidateQueries({ queryKey: ['inventory-suppliers'] });
    },
  });

  const recordSupplierPayment = useMutation({
    mutationFn: () =>
      inventoryService.recordSupplierPayment(selectedPaymentSupplierId, {
        amount: Number(supplierPaymentAmount || 0),
        paymentMethod: supplierPaymentMethod,
        reference: supplierPaymentReference.trim() || undefined,
        notes: supplierPaymentNotes.trim() || undefined,
      }),
    onSuccess: () => {
      setPaymentSupplierId('');
      setSupplierPaymentAmount('');
      setSupplierPaymentMethod('CASH');
      setSupplierPaymentReference('');
      setSupplierPaymentNotes('');
      setPaymentOpen(false);
      void queryClient.invalidateQueries({ queryKey: ['inventory'] });
      void queryClient.invalidateQueries({ queryKey: ['inventory-purchases'] });
      void queryClient.invalidateQueries({ queryKey: ['inventory-suppliers'] });
    },
  });

  const toggleItem = useMutation({
    mutationFn: (item: InventoryItem) => inventoryService.updateItem(item.id, { active: !item.active }),
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

  function submitSupplier(event: FormSubmitEvent) {
    event.preventDefault();
    if (supplierName.trim()) createSupplier.mutate();
  }

  function openSupplierPayment(supplier?: Supplier) {
    setPaymentSupplierId(supplier?.id ?? selectedPaymentSupplierId);
    setSupplierPaymentAmount(supplier?.currentPayable ?? '');
    setPaymentOpen(true);
  }

  function submitSupplierPayment(event: FormSubmitEvent) {
    event.preventDefault();
    const paymentAmount = Number(supplierPaymentAmount || 0);
    const payable = Number(selectedPaymentSupplier?.currentPayable || 0);
    if (selectedPaymentSupplierId && paymentAmount > 0 && paymentAmount <= payable) {
      recordSupplierPayment.mutate();
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
            icon={<Truck size={17} />}
            variant="secondary"
            onClick={() => setSupplierOpen(true)}
          >
            New supplier
          </Button>
          <Button
            disabled={!canManageInventory || suppliers.length === 0 || supplierPayableTotal <= 0}
            icon={<HandCoins size={17} />}
            variant="secondary"
            onClick={() => openSupplierPayment()}
          >
            Pay supplier
          </Button>
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

      <div className="mt-6 grid grid-cols-4 gap-4">
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
        <Metric icon={<WalletCards size={19} />} label="Supplier payable" value={money.format(supplierPayableTotal)} />
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
            <h2 className="text-xl font-black text-espresso">Supplier accounts</h2>
            <p className="text-sm font-semibold text-muted">Payable balance, purchase count, and last account movement.</p>
          </div>
          {suppliersQuery.isLoading ? <Loader2 className="animate-spin text-primary" size={20} /> : null}
        </div>

        {suppliersQuery.isError ? (
          <div className="m-5 flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            <AlertCircle size={17} />
            Supplier accounts could not load. Check the API session.
          </div>
        ) : null}

        <div className="max-h-[360px] overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-sage text-xs font-black uppercase text-muted">
              <tr>
                <th className="px-6 py-3">Supplier</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3 text-right">Purchases</th>
                <th className="px-4 py-3">Last movement</th>
                <th className="px-4 py-3 text-right">Payable</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {suppliers.map((supplier) => {
                const latestLedger = supplier.ledgers?.[0];
                const payable = Number(supplier.currentPayable || 0);
                return (
                  <tr key={supplier.id}>
                    <td className="px-6 py-4">
                      <p className="font-black text-espresso">{supplier.name}</p>
                      <p className="mt-1 text-xs font-semibold text-muted">{supplier.notes || 'Supplier account'}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-bold text-label">{supplier.contactPerson || 'No contact'}</p>
                      <p className="mt-1 text-xs font-semibold text-muted">{supplier.phone || 'No phone'}</p>
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-label">
                      {supplier._count?.purchases ?? supplier.purchases?.length ?? 0}
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-bold text-label">
                        {latestLedger
                          ? `${Number(latestLedger.debit) > 0 ? 'Paid' : 'Credit'} ${money.format(
                              Number(latestLedger.debit) || Number(latestLedger.credit),
                            )}`
                          : 'No ledger yet'}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-muted">
                        {latestLedger ? new Date(latestLedger.createdAt).toLocaleDateString() : 'Ready for purchases'}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-right font-black text-espresso">{money.format(payable)}</td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        className="h-9 px-3"
                        disabled={!canManageInventory || payable <= 0}
                        icon={<HandCoins size={15} />}
                        variant="secondary"
                        onClick={() => openSupplierPayment(supplier)}
                      >
                        Pay
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {suppliers.length === 0 ? (
                <tr>
                  <td className="px-6 py-6 text-sm font-bold text-muted" colSpan={6}>
                    No suppliers yet. Add a supplier before receiving stock purchases.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

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
        description="Add an item you keep in stock."
        open={createOpen}
        title="New stock item"
        onClose={() => setCreateOpen(false)}
      >
        <form className="space-y-3" onSubmit={submitItem}>
          <FormField label="Stock item name">
          <input
            className={fieldClass}
            disabled={!canManageInventory}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          </FormField>
          <FormField label="Group">
          <input
            className={fieldClass}
            disabled={!canManageInventory}
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Current stock">
            <input
              className={fieldClass}
              disabled={!canManageInventory}
              min="0"
              type="number"
              value={currentStock}
              onChange={(event) => setCurrentStock(event.target.value)}
            />
            </FormField>
            <FormField label="Low stock warning">
            <input
              className={fieldClass}
              disabled={!canManageInventory}
              min="0"
              type="number"
              value={minimumStockLevel}
              onChange={(event) => setMinimumStockLevel(event.target.value)}
            />
            </FormField>
          </div>
          <FormField label="Average buy price">
          <input
            className={fieldClass}
            disabled={!canManageInventory}
            min="0"
            type="number"
            value={averageCost}
            onChange={(event) => setAverageCost(event.target.value)}
          />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Buy unit">
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
            </FormField>
            <FormField label="Use unit">
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
            </FormField>
          </div>
          <FormField label="Supplier">
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
          </FormField>
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
        description="Add a person or company you buy stock from."
        open={supplierOpen}
        title="New supplier"
        onClose={() => setSupplierOpen(false)}
      >
        <form className="space-y-3" onSubmit={submitSupplier}>
          <FormField label="Supplier name">
          <input
            className={fieldClass}
            disabled={!canManageInventory}
            value={supplierName}
            onChange={(event) => setSupplierName(event.target.value)}
          />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Contact person">
            <input
              className={fieldClass}
              disabled={!canManageInventory}
              value={supplierContactPerson}
              onChange={(event) => setSupplierContactPerson(event.target.value)}
            />
            </FormField>
            <FormField label="Phone number">
            <input
              className={fieldClass}
              disabled={!canManageInventory}
              value={supplierPhone}
              onChange={(event) => setSupplierPhone(event.target.value)}
            />
            </FormField>
          </div>
          <FormField label="Address">
          <input
            className={fieldClass}
            disabled={!canManageInventory}
            value={supplierAddress}
            onChange={(event) => setSupplierAddress(event.target.value)}
          />
          </FormField>
          <FormField label="Money owed now" hint="Put 0 if you do not owe this supplier yet.">
          <input
            className={fieldClass}
            disabled={!canManageInventory}
            min="0"
            type="number"
            value={supplierOpeningBalance}
            onChange={(event) => setSupplierOpeningBalance(event.target.value)}
          />
          </FormField>
          <FormField label="Notes">
          <textarea
            className={`${fieldClass} min-h-24 py-3`}
            disabled={!canManageInventory}
            value={supplierNotes}
            onChange={(event) => setSupplierNotes(event.target.value)}
          />
          </FormField>
          {createSupplier.isError ? (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              Supplier save failed. Check the name and opening balance.
            </div>
          ) : null}
          <Button
            className="w-full"
            disabled={!canManageInventory || !supplierName.trim() || createSupplier.isPending}
            icon={createSupplier.isPending ? <Loader2 className="animate-spin" size={17} /> : <Truck size={17} />}
            type="submit"
          >
            Add supplier
          </Button>
        </form>
      </ActionModal>

      <ActionModal
        description="Enter money paid to a supplier."
        open={paymentOpen}
        title="Pay supplier"
        onClose={() => setPaymentOpen(false)}
      >
        <form className="space-y-3" onSubmit={submitSupplierPayment}>
          <FormField label="Supplier">
          <select
            className={fieldClass}
            disabled={!canManageInventory}
            value={selectedPaymentSupplierId}
            onChange={(event) => setPaymentSupplierId(event.target.value)}
          >
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name} - {money.format(Number(supplier.currentPayable || 0))}
              </option>
            ))}
          </select>
          </FormField>
          <div className="rounded-2xl bg-sage p-4">
            <p className="text-xs font-black uppercase text-muted">Money owed now</p>
            <p className="mt-1 text-2xl font-black text-espresso">
              {money.format(Number(selectedPaymentSupplier?.currentPayable || 0))}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Amount paid">
            <input
              className={fieldClass}
              disabled={!canManageInventory}
              max={selectedPaymentSupplier?.currentPayable ?? undefined}
              min="0.01"
              step="0.01"
              type="number"
              value={supplierPaymentAmount}
              onChange={(event) => setSupplierPaymentAmount(event.target.value)}
            />
            </FormField>
            <FormField label="How paid">
            <select
              className={fieldClass}
              disabled={!canManageInventory}
              value={supplierPaymentMethod}
              onChange={(event) => setSupplierPaymentMethod(event.target.value as PaymentMethod)}
            >
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="BANK_TRANSFER">Bank transfer</option>
              <option value="JAZZCASH_EASYPAISA">Wallet</option>
              <option value="ONLINE">Online</option>
            </select>
            </FormField>
          </div>
          <FormField label="Receipt or note number">
          <input
            className={fieldClass}
            disabled={!canManageInventory}
            value={supplierPaymentReference}
            onChange={(event) => setSupplierPaymentReference(event.target.value)}
          />
          </FormField>
          <FormField label="Notes">
          <textarea
            className={`${fieldClass} min-h-24 py-3`}
            disabled={!canManageInventory}
            value={supplierPaymentNotes}
            onChange={(event) => setSupplierPaymentNotes(event.target.value)}
          />
          </FormField>
          {recordSupplierPayment.isError ? (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              Payment failed. Amount cannot exceed the supplier payable.
            </div>
          ) : null}
          <Button
            className="w-full"
            disabled={
              !canManageInventory ||
              !selectedPaymentSupplierId ||
              Number(supplierPaymentAmount || 0) <= 0 ||
              Number(supplierPaymentAmount || 0) > Number(selectedPaymentSupplier?.currentPayable || 0) ||
              recordSupplierPayment.isPending
            }
            icon={
              recordSupplierPayment.isPending ? <Loader2 className="animate-spin" size={17} /> : <HandCoins size={17} />
            }
            type="submit"
          >
            Record payment
          </Button>
        </form>
      </ActionModal>

      <ActionModal
        description="Add stock that arrived from a supplier."
        open={purchaseOpen}
        title="Receive stock"
        widthClass="max-w-4xl"
        onClose={() => setPurchaseOpen(false)}
      >
        <form className="space-y-4" onSubmit={submitPurchase}>
          <div className="grid grid-cols-4 gap-3">
            <FormField label="Supplier">
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
            </FormField>
            <FormField label="Bill number">
            <input
              className={fieldClass}
              disabled={!canManageInventory}
              value={invoiceNumber}
              onChange={(event) => setInvoiceNumber(event.target.value)}
            />
            </FormField>
            <FormField label="Date">
            <input
              className={fieldClass}
              disabled={!canManageInventory}
              type="date"
              value={purchaseDate}
              onChange={(event) => setPurchaseDate(event.target.value)}
            />
            </FormField>
            <FormField label="How paid">
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
            </FormField>
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
              <div key={row.id} className="grid grid-cols-[1fr_120px_100px_120px_40px] gap-2">
                <FormField label="Stock item">
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
                </FormField>
                <FormField label="Amount">
                <input
                  className={fieldClass}
                  disabled={!canManageInventory}
                  min="0.0001"
                  step="0.0001"
                  type="number"
                  value={row.quantity}
                  onChange={(event) => updatePurchaseRow(row.id, { quantity: event.target.value })}
                />
                </FormField>
                <FormField label="Unit">
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
                </FormField>
                <FormField label="Buy price">
                <input
                  className={fieldClass}
                  disabled={!canManageInventory}
                  min="0"
                  step="0.01"
                  type="number"
                  value={row.unitCost}
                  onChange={(event) => updatePurchaseRow(row.id, { unitCost: event.target.value })}
                />
                </FormField>
                <Button
                  className="mt-[25px] h-11 w-10 px-0"
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
            <FormField label="Paid now">
            <input
              className={fieldClass}
              disabled={!canManageInventory}
              min="0"
              type="number"
              value={paidAmount}
              onChange={(event) => setPaidAmount(event.target.value)}
            />
            </FormField>
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
