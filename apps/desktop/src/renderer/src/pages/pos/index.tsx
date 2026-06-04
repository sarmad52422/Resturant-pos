import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { RestaurantTable } from '../../components/table-card';
import type { FormSubmitEvent } from '../../lib/events';
import { apiErrorMessage } from '../../lib/api-error';
import { posService } from '../../services/pos-service';
import { usePosStore } from '../../store/use-pos-store';
import {
  CorrectionModal,
  PaymentModal,
  PosTicketPanel,
  PrintReceiptModal,
  QuickAddConfirmModal,
} from './components';
import type {
  PaymentMethod,
  PosMenuItem,
  PosOrder,
  PrinterInfo,
  PrintMode,
  ReceiptLine,
} from './interfaces';
import { MenuBoard } from './menu-board';
import { buildReceiptHtml, buildReceiptText } from './receipt';
import { readPrintMode, readSetting } from './settings';
import { usePosShortcuts } from './shortcuts';
import { TableSelectionModal } from './table-selection';

type CorrectionTarget =
  | { type: 'order'; label: string }
  | { type: 'item'; cartLineId: string; label: string };
type PendingTableAction = 'kitchen' | 'payment' | 'print';

export function PosPage() {
  const navigate = useNavigate();
  const { cart, addLine, changeQuantity, removeLine, clear, orderType, setOrderType } =
    usePosStore();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [printMode, setPrintMode] = useState<PrintMode>('os');
  const [selectedPrinterName, setSelectedPrinterName] = useState('');
  const [printerHost, setPrinterHost] = useState('');
  const [printerPort, setPrinterPort] = useState('9100');
  const [printerDevicePath, setPrinterDevicePath] = useState('');
  const [openDrawerAfterPrint, setOpenDrawerAfterPrint] = useState(false);
  const [printerDefaultsApplied, setPrinterDefaultsApplied] = useState(false);
  const [lastOrder, setLastOrder] = useState<PosOrder | undefined>();
  const [lastReceiptLines, setLastReceiptLines] = useState<ReceiptLine[]>([]);
  const [quickAddIndex, setQuickAddIndex] = useState<number | undefined>();
  const [correctionTarget, setCorrectionTarget] = useState<CorrectionTarget | undefined>();
  const [correctionReason, setCorrectionReason] = useState('');
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | undefined>();
  const [tablePickerOpen, setTablePickerOpen] = useState(false);
  const [pendingTableAction, setPendingTableAction] = useState<PendingTableAction | undefined>();

  const catalogQuery = useQuery({
    queryKey: ['pos-catalog'],
    queryFn: posService.catalog,
  });

  const printersQuery = useQuery({
    queryKey: ['desktop-printers'],
    queryFn: () => window.restaurantos.printers.list() as Promise<PrinterInfo[]>,
  });

  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: posService.settings,
  });

  const tablesQuery = useQuery({
    queryKey: ['tables-floor'],
    queryFn: posService.floor,
  });

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  );
  const selectedTableName = lastOrder?.table?.name ?? selectedTable?.name;
  const receiptPreviewLines = cart.length ? cart : lastReceiptLines;
  const receiptPreviewTotal = receiptPreviewLines.reduce(
    (sum, line) => sum + line.price * line.quantity,
    0,
  );
  const receiptPreviewText = buildReceiptText(
    {
      grandTotal: String(receiptPreviewTotal || total),
      orderNumber: lastOrder?.orderNumber ?? 'Draft',
      table: selectedTableName ? { name: selectedTableName } : undefined,
    },
    receiptPreviewLines,
    receiptPreviewTotal || total,
  );
  const categories = catalogQuery.data?.categories ?? [];
  const menuItems = catalogQuery.data?.items ?? [];
  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = selectedCategoryId === 'all' || item.categoryId === selectedCategoryId;
    const search = searchText.trim().toLowerCase();
    const matchesSearch =
      !search ||
      item.name.toLowerCase().includes(search) ||
      item.category.name.toLowerCase().includes(search) ||
      item.kitchenStation?.name.toLowerCase().includes(search);
    return matchesCategory && matchesSearch;
  });
  const quickAddItems = filteredItems.slice(0, 9);
  const quickAddItem = quickAddIndex === undefined ? undefined : quickAddItems[quickAddIndex];
  const freeTables = useMemo(
    () =>
      (tablesQuery.data?.tables ?? []).filter(
        (table) => table.active && table.status === 'FREE' && !table.currentOrder,
      ),
    [tablesQuery.data?.tables],
  );

  useEffect(() => {
    if (!settingsQuery.data || printerDefaultsApplied) return;
    setPrintMode(readPrintMode(settingsQuery.data, 'terminal.receiptPrinterMode', 'os'));
    setSelectedPrinterName(readSetting(settingsQuery.data, 'terminal.receiptPrinterName', ''));
    setPrinterHost(readSetting(settingsQuery.data, 'terminal.receiptPrinterHost', ''));
    setPrinterPort(String(readSetting(settingsQuery.data, 'terminal.receiptPrinterPort', 9100)));
    setPrinterDevicePath(readSetting(settingsQuery.data, 'terminal.receiptPrinterDevicePath', ''));
    setOpenDrawerAfterPrint(
      Boolean(readSetting(settingsQuery.data, 'terminal.openDrawerAfterPrint', false)),
    );
    setPrinterDefaultsApplied(true);
  }, [printerDefaultsApplied, settingsQuery.data]);

  useEffect(() => {
    if (orderType === 'DINE_IN') return;
    setSelectedTable(undefined);
    setTablePickerOpen(false);
    setPendingTableAction(undefined);
  }, [orderType]);

  const createOrder = useMutation({
    mutationFn: (tableId?: string) =>
      posService.createOrder({
        type: orderType,
        tableId: orderType === 'DINE_IN' ? tableId : undefined,
        items: cart.map((line) => ({
          menuItemId: line.id,
          quantity: line.quantity,
        })),
      }),
    onSuccess: (order) => {
      setLastOrder(order);
      setLastReceiptLines(cart);
    },
  });

  const sendToKitchen = useMutation({
    mutationFn: async (tableId?: string) => {
      const order = lastOrder ?? (await createOrder.mutateAsync(tableId));
      return posService.sendToKitchen(order.id);
    },
    onSuccess: (order) => setLastOrder(order),
  });

  const payOrder = useMutation({
    mutationFn: async (tableId?: string) => {
      const order = lastOrder ?? (await createOrder.mutateAsync(tableId));
      return posService.payOrder(order.id, {
        amount: Number(paymentAmount || total),
        method: paymentMethod,
        reference: paymentReference.trim() || undefined,
      });
    },
    onSuccess: (order) => {
      setLastOrder(order);
      setLastReceiptLines(cart);
      setPaymentOpen(false);
      setPaymentAmount('');
      setPaymentReference('');
      setSelectedTable(undefined);
      clear();
    },
  });

  const printReceipt = useMutation({
    mutationFn: async (tableId?: string) => {
      const order = lastOrder ?? (await createOrder.mutateAsync(tableId));
      const receiptLines = cart.length ? cart : lastReceiptLines;
      const receiptTotal = receiptLines.reduce((sum, line) => sum + line.price * line.quantity, 0);
      if (printMode === 'network') {
        return window.restaurantos.printers.printEscPos({
          host: printerHost.trim(),
          port: Number(printerPort || 9100),
          text: buildReceiptText(order, receiptLines, receiptTotal || total),
          openDrawer: openDrawerAfterPrint,
        });
      }
      if (printMode === 'device') {
        return window.restaurantos.printers.printEscPos({
          devicePath: printerDevicePath.trim(),
          text: buildReceiptText(order, receiptLines, receiptTotal || total),
          openDrawer: openDrawerAfterPrint,
        });
      }
      const html = buildReceiptHtml(order, receiptLines, receiptTotal || total);
      return window.restaurantos.printers.printReceipt({
        html,
        printerName: selectedPrinterName || undefined,
        silent: Boolean(selectedPrinterName),
      });
    },
    onSuccess: () => setPrintOpen(false),
  });

  const kickDrawer = useMutation({
    mutationFn: () =>
      window.restaurantos.cashDrawer.kick(
        printMode === 'network'
          ? { host: printerHost.trim(), port: Number(printerPort || 9100) }
          : { devicePath: printerDevicePath.trim() },
      ),
  });

  const voidOrder = useMutation({
    mutationFn: () => posService.voidOrder(lastOrder?.id ?? '', correctionReason.trim()),
    onSuccess: (order) => {
      setLastOrder(order);
      setLastReceiptLines([]);
      setCorrectionTarget(undefined);
      setCorrectionReason('');
      setSelectedTable(undefined);
      clear();
    },
  });

  const voidOrderItem = useMutation({
    mutationFn: ({ itemId }: { itemId: string }) =>
      posService.voidItem(lastOrder?.id ?? '', itemId, correctionReason.trim()),
    onSuccess: (order) => {
      const cartLineId =
        correctionTarget?.type === 'item' ? correctionTarget.cartLineId : undefined;
      setLastOrder(order);
      if (cartLineId) {
        removeLine(cartLineId);
        setLastReceiptLines((lines) => lines.filter((line) => line.id !== cartLineId));
      }
      setCorrectionTarget(undefined);
      setCorrectionReason('');
    },
  });

  const canOpenPrint = cart.length > 0 || Boolean(lastOrder);
  const hasPrinterTarget =
    printMode === 'os' ||
    (printMode === 'network' && Boolean(printerHost.trim())) ||
    (printMode === 'device' && Boolean(printerDevicePath.trim()));
  const canPrintReceipt = canOpenPrint && hasPrinterTarget && !printReceipt.isPending;
  const canOpenPayment = cart.length > 0 && !payOrder.isPending;
  const canSendToKitchen = cart.length > 0 && !sendToKitchen.isPending;

  function addMenuItem(item: PosMenuItem) {
    if (cart.length === 0 && lastOrder?.status === 'COMPLETED') {
      setLastOrder(undefined);
      setLastReceiptLines([]);
      setSelectedTable(undefined);
    }
    addLine({
      id: item.id,
      name: item.name,
      price: Number(item.basePrice),
      quantity: 1,
    });
  }

  const addQuickItem = useCallback(
    (index: number) => {
      if (quickAddItems[index]) setQuickAddIndex(index);
    },
    [quickAddItems],
  );

  const confirmQuickAdd = useCallback(() => {
    if (quickAddItem) addMenuItem(quickAddItem);
    setQuickAddIndex(undefined);
  }, [quickAddItem]);

  const requiresTable = useCallback(
    (action: PendingTableAction) => {
      if (orderType !== 'DINE_IN' || lastOrder?.table?.id || selectedTable?.id) return false;
      void tablesQuery.refetch();
      setPendingTableAction(action);
      setTablePickerOpen(true);
      return true;
    },
    [lastOrder?.table?.id, orderType, selectedTable?.id, tablesQuery],
  );

  function openPayment() {
    if (requiresTable('payment')) return;
    setPaymentAmount(String(total));
    setPaymentOpen(true);
  }

  function openPrintPreview() {
    if (requiresTable('print')) return;
    setPrintOpen(true);
  }

  function sendKitchenNow() {
    if (requiresTable('kitchen')) return;
    sendToKitchen.mutate(selectedTable?.id ?? lastOrder?.table?.id);
  }

  function selectTable(table: RestaurantTable) {
    setSelectedTable(table);
    setTablePickerOpen(false);
    const action = pendingTableAction;
    setPendingTableAction(undefined);
    if (action === 'payment') {
      setPaymentAmount(String(total));
      setPaymentOpen(true);
    }
    if (action === 'print') setPrintOpen(true);
    if (action === 'kitchen') sendToKitchen.mutate(table.id);
  }

  function openItemCorrection(line: ReceiptLine) {
    if (!lastOrder) {
      removeLine(line.id);
      return;
    }
    setCorrectionReason('');
    setCorrectionTarget({ type: 'item', cartLineId: line.id, label: line.name });
  }

  function submitCorrection(event: FormSubmitEvent) {
    event.preventDefault();
    if (!correctionTarget || correctionReason.trim().length < 3) return;
    if (correctionTarget.type === 'order') {
      voidOrder.mutate();
      return;
    }

    const orderItem = lastOrder?.items?.find(
      (item) => item.menuItemId === correctionTarget.cartLineId && item.status !== 'CANCELLED',
    );
    if (!orderItem) {
      removeLine(correctionTarget.cartLineId);
      setCorrectionTarget(undefined);
      return;
    }
    voidOrderItem.mutate({ itemId: orderItem.id });
  }

  const printReceiptNow = useCallback(() => {
    if (canPrintReceipt && !requiresTable('print'))
      printReceipt.mutate(selectedTable?.id ?? lastOrder?.table?.id);
  }, [canPrintReceipt, lastOrder?.table?.id, printReceipt, requiresTable, selectedTable?.id]);

  function submitPayment(event: FormSubmitEvent) {
    event.preventDefault();
    if (cart.length > 0 && Number(paymentAmount || 0) > 0 && Number(paymentAmount || 0) <= total) {
      if (!requiresTable('payment')) payOrder.mutate(selectedTable?.id ?? lastOrder?.table?.id);
    }
  }

  function submitPrint(event: FormSubmitEvent) {
    event.preventDefault();
    printReceiptNow();
  }

  usePosShortcuts({
    canOpenPayment,
    canOpenPrint,
    canPrintReceipt,
    canSendToKitchen,
    printOpen,
    quickAddConfirmOpen: Boolean(quickAddItem),
    quickAddCount: quickAddItems.length,
    quickAddEnabled: !paymentOpen && !printOpen && !quickAddItem,
    searchInputRef,
    sendToKitchen: sendKitchenNow,
    setOrderType,
    onClosePayment: () => setPaymentOpen(false),
    onClosePrint: () => {
      setPrintOpen(false);
      setQuickAddIndex(undefined);
    },
    onConfirmQuickAdd: confirmQuickAdd,
    onNavigateTables: () => navigate('/tables'),
    onOpenPayment: openPayment,
    onOpenPrint: openPrintPreview,
    onPrintReceipt: printReceiptNow,
    onQuickAddItem: addQuickItem,
  });

  return (
    <div className="grid h-full grid-cols-[1fr_430px] gap-5 overflow-hidden bg-white p-5">
      <MenuBoard
        catalogError={catalogQuery.isError}
        catalogLoading={catalogQuery.isLoading}
        categories={categories}
        filteredItems={filteredItems}
        orderType={orderType}
        searchInputRef={searchInputRef}
        searchText={searchText}
        selectedCategoryId={selectedCategoryId}
        onAddItem={addMenuItem}
        onCategoryChange={setSelectedCategoryId}
        onOrderTypeChange={setOrderType}
        onSearchChange={setSearchText}
      />

      <PosTicketPanel
        cart={cart}
        kitchenPending={sendToKitchen.isPending}
        lastOrder={lastOrder}
        paymentPending={payOrder.isPending}
        selectedTableName={selectedTableName}
        total={total}
        onChangeQuantity={changeQuantity}
        onCorrectItem={openItemCorrection}
        onOpenPayment={openPayment}
        onOpenPrint={openPrintPreview}
        onSendToKitchen={sendKitchenNow}
        onVoidOrder={() =>
          lastOrder &&
          (setCorrectionReason(''),
          setCorrectionTarget({ type: 'order', label: `Order #${lastOrder.orderNumber}` }))
        }
      />

      <PaymentModal
        amount={paymentAmount}
        error={payOrder.isError}
        errorMessage={apiErrorMessage(
          payOrder.error,
          'Payment failed. Check amount and API connection.',
        )}
        method={paymentMethod}
        open={paymentOpen}
        pending={payOrder.isPending}
        reference={paymentReference}
        total={total}
        onAmountChange={setPaymentAmount}
        onClose={() => setPaymentOpen(false)}
        onMethodChange={setPaymentMethod}
        onReferenceChange={setPaymentReference}
        onSubmit={submitPayment}
      />

      <QuickAddConfirmModal
        item={quickAddItem}
        number={quickAddIndex === undefined ? undefined : quickAddIndex + 1}
        open={Boolean(quickAddItem)}
        onClose={() => setQuickAddIndex(undefined)}
        onConfirm={confirmQuickAdd}
      />

      <CorrectionModal
        error={voidOrder.isError || voidOrderItem.isError}
        open={Boolean(correctionTarget)}
        pending={voidOrder.isPending || voidOrderItem.isPending}
        reason={correctionReason}
        targetLabel={correctionTarget?.label ?? ''}
        title={correctionTarget?.type === 'order' ? 'Void order' : 'Void item'}
        onClose={() => setCorrectionTarget(undefined)}
        onReasonChange={setCorrectionReason}
        onSubmit={submitCorrection}
      />

      <TableSelectionModal
        loading={tablesQuery.isLoading}
        open={tablePickerOpen}
        selectedTableId={selectedTable?.id}
        tables={freeTables}
        onClose={() => {
          setTablePickerOpen(false);
          setPendingTableAction(undefined);
        }}
        onSelect={selectTable}
      />

      <PrintReceiptModal
        canPrint={cart.length > 0 || Boolean(lastOrder)}
        devicePath={printerDevicePath}
        drawerError={kickDrawer.isError}
        drawerPending={kickDrawer.isPending}
        host={printerHost}
        mode={printMode}
        open={printOpen}
        openDrawerAfterPrint={openDrawerAfterPrint}
        port={printerPort}
        previewText={receiptPreviewText}
        printerError={printReceipt.isError}
        printerName={selectedPrinterName}
        printerPending={printReceipt.isPending}
        printers={printersQuery.data ?? []}
        onClose={() => setPrintOpen(false)}
        onDevicePathChange={setPrinterDevicePath}
        onDrawerChange={setOpenDrawerAfterPrint}
        onHostChange={setPrinterHost}
        onKickDrawer={() => kickDrawer.mutate()}
        onModeChange={setPrintMode}
        onPortChange={setPrinterPort}
        onPrinterNameChange={setSelectedPrinterName}
        onSubmit={submitPrint}
      />
    </div>
  );
}
