import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Button, Card } from '@restaurantos/ui';
import {
  AlertCircle,
  Keyboard,
  Loader2,
  Minus,
  Plus,
  Printer,
  Search,
  Send,
  Sparkles,
  Table2,
  Trash2,
  WalletCards,
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import type { FormSubmitEvent } from '../../lib/events';
import { usePosStore } from '../../store/use-pos-store';
import { PaymentModal, PrintReceiptModal } from './components';
import { money } from './formatting';
import type { PaymentMethod, PosCatalogResponse, PosMenuItem, PosOrder, PrinterInfo, PrintMode, ReceiptLine, SettingRecord } from './interfaces';
import { buildReceiptHtml, buildReceiptText } from './receipt';
import { readPrintMode, readSetting } from './settings';

export function PosPage() {
  const { cart, addLine, changeQuantity, removeLine, clear, orderType, setOrderType } = usePosStore();
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

  const catalogQuery = useQuery({
    queryKey: ['pos-catalog'],
    queryFn: () => apiFetch<PosCatalogResponse>('/menu/pos'),
  });

  const printersQuery = useQuery({
    queryKey: ['desktop-printers'],
    queryFn: () => window.restaurantos.printers.list() as Promise<PrinterInfo[]>,
  });

  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: () => apiFetch<SettingRecord[]>('/settings'),
  });

  const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const receiptPreviewLines = cart.length ? cart : lastReceiptLines;
  const receiptPreviewTotal = receiptPreviewLines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const receiptPreviewText = buildReceiptText(
    { grandTotal: String(receiptPreviewTotal || total), orderNumber: lastOrder?.orderNumber ?? 'Draft' },
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

  useEffect(() => {
    if (!settingsQuery.data || printerDefaultsApplied) return;
    setPrintMode(readPrintMode(settingsQuery.data, 'terminal.receiptPrinterMode', 'os'));
    setSelectedPrinterName(readSetting(settingsQuery.data, 'terminal.receiptPrinterName', ''));
    setPrinterHost(readSetting(settingsQuery.data, 'terminal.receiptPrinterHost', ''));
    setPrinterPort(String(readSetting(settingsQuery.data, 'terminal.receiptPrinterPort', 9100)));
    setPrinterDevicePath(readSetting(settingsQuery.data, 'terminal.receiptPrinterDevicePath', ''));
    setOpenDrawerAfterPrint(Boolean(readSetting(settingsQuery.data, 'terminal.openDrawerAfterPrint', false)));
    setPrinterDefaultsApplied(true);
  }, [printerDefaultsApplied, settingsQuery.data]);

  const createOrder = useMutation({
    mutationFn: () =>
      apiFetch<PosOrder>('/orders', {
        method: 'POST',
        body: JSON.stringify({
          type: orderType,
          items: cart.map((line) => ({
            menuItemId: line.id,
            quantity: line.quantity,
          })),
        }),
      }),
    onSuccess: (order) => {
      setLastOrder(order);
      setLastReceiptLines(cart);
    },
  });

  const sendToKitchen = useMutation({
    mutationFn: async () => {
      const order = lastOrder ?? (await createOrder.mutateAsync());
      return apiFetch<PosOrder>(`/orders/${order.id}/send-to-kitchen`, { method: 'PATCH' });
    },
    onSuccess: (order) => setLastOrder(order),
  });

  const payOrder = useMutation({
    mutationFn: async () => {
      const order = lastOrder ?? (await createOrder.mutateAsync());
      return apiFetch<PosOrder>(`/orders/${order.id}/payments`, {
        method: 'POST',
        body: JSON.stringify({
          amount: Number(paymentAmount || total),
          method: paymentMethod,
          reference: paymentReference.trim() || undefined,
        }),
      });
    },
    onSuccess: (order) => {
      setLastOrder(order);
      setLastReceiptLines(cart);
      setPaymentOpen(false);
      setPaymentAmount('');
      setPaymentReference('');
      clear();
    },
  });

  const printReceipt = useMutation({
    mutationFn: async () => {
      const order = lastOrder ?? (await createOrder.mutateAsync());
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

  function addMenuItem(item: PosMenuItem) {
    addLine({
      id: item.id,
      name: item.name,
      price: Number(item.basePrice),
      quantity: 1,
    });
  }

  function openPayment() {
    setPaymentAmount(String(total));
    setPaymentOpen(true);
  }

  function submitPayment(event: FormSubmitEvent) {
    event.preventDefault();
    if (cart.length > 0 && Number(paymentAmount || 0) > 0 && Number(paymentAmount || 0) <= total) {
      payOrder.mutate();
    }
  }

  function submitPrint(event: FormSubmitEvent) {
    event.preventDefault();
    if (cart.length > 0 || lastOrder) printReceipt.mutate();
  }

  return (
    <div className="grid h-full grid-cols-[1fr_430px] gap-5 overflow-hidden bg-white p-5">
      <section className="flex min-w-0 flex-col overflow-hidden rounded-[28px] bg-white px-6 py-5 shadow-[0_28px_70px_rgb(var(--ro-secondary-rgb)/0.08)]">
        <header className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.28em] text-subtle">Cashier terminal</p>
            <h1 className="mt-1 text-4xl font-black text-espresso">Build order</h1>
          </div>
          <div className="flex rounded-2xl bg-sage p-1 shadow-sm">
            {(['DINE_IN', 'TAKEAWAY', 'DELIVERY'] as const).map((type) => (
              <button
                key={type}
                className={[
                  'h-10 rounded-xl px-4 text-sm font-bold transition',
                  orderType === type ? 'bg-secondary text-white shadow-sm' : 'text-muted hover:bg-white',
                ].join(' ')}
                onClick={() => setOrderType(type)}
              >
                {type === 'DINE_IN' ? 'Dine in' : type === 'TAKEAWAY' ? 'Takeaway' : 'Delivery'}
              </button>
            ))}
          </div>
        </header>

        <div className="mb-5 grid grid-cols-[1fr_220px] gap-4">
          <label className="rounded-2xl bg-white px-4 py-2 shadow-[0_16px_42px_rgb(var(--ro-secondary-rgb)/0.06)]">
            <span className="block text-xs font-black uppercase tracking-[0.12em] text-muted">Find item</span>
            <div className="mt-1 flex h-8 items-center gap-3">
              <Search size={22} className="text-primary" />
              <input
                className="h-full flex-1 bg-transparent text-lg font-semibold outline-none"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
              />
              <Badge tone="orange">F2</Badge>
            </div>
          </label>
          <div className="flex h-14 items-center gap-3 rounded-2xl bg-secondary px-4 text-white shadow-[0_18px_44px_rgb(var(--ro-secondary-rgb)/0.2)]">
            <Sparkles size={20} className="text-white" />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-deepSoft">Rush mode</p>
              <p className="text-sm font-black">Keyboard ready</p>
            </div>
          </div>
        </div>

        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          <button
            className={[
              'h-11 shrink-0 rounded-xl px-4 text-sm font-bold transition',
              selectedCategoryId === 'all'
                ? 'bg-primary text-white shadow-[0_10px_22px_rgb(var(--ro-primary-rgb)/0.24)]'
                : 'bg-white text-muted shadow-[inset_0_0_0_1px_rgb(var(--ro-secondary-rgb)/0.08)] hover:bg-sage hover:text-secondary',
            ].join(' ')}
            onClick={() => setSelectedCategoryId('all')}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              className={[
                'h-11 shrink-0 rounded-xl px-4 text-sm font-bold transition',
                selectedCategoryId === category.id
                  ? 'bg-primary text-white shadow-[0_10px_22px_rgb(var(--ro-primary-rgb)/0.24)]'
                  : 'bg-white text-muted shadow-[inset_0_0_0_1px_rgb(var(--ro-secondary-rgb)/0.08)] hover:bg-sage hover:text-secondary',
              ].join(' ')}
              onClick={() => setSelectedCategoryId(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>

        {catalogQuery.isError ? (
          <div className="flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            <AlertCircle size={17} />
            Menu could not load. Check the API connection.
          </div>
        ) : null}

        <div className="grid flex-1 auto-rows-[168px] grid-cols-3 gap-4 overflow-y-auto pb-2">
          {catalogQuery.isLoading ? (
            <Card className="col-span-3 flex items-center justify-center gap-3 p-6 text-sm font-bold text-muted">
              <Loader2 className="animate-spin text-primary" size={18} />
              Loading menu
            </Card>
          ) : null}
          {filteredItems.map((item) => (
            <button
              key={item.id}
              className="group rounded-2xl bg-white p-4 text-left shadow-[0_14px_38px_rgb(var(--ro-secondary-rgb)/0.07)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_48px_rgb(var(--ro-secondary-rgb)/0.12)]"
              onClick={() => addMenuItem(item)}
            >
              <div className="flex h-full flex-col justify-between">
                <Badge tone="blue">{item.kitchenStation?.name ?? item.category.name}</Badge>
                <div>
                  <h3 className="text-lg font-black text-espresso">{item.shortName || item.name}</h3>
                  <div className="mt-3 flex items-end justify-between">
                    <p className="text-2xl font-black text-secondary">{money.format(Number(item.basePrice))}</p>
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white transition group-hover:scale-105">
                      <Plus size={18} />
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <aside className="flex min-h-0 flex-col rounded-[28px] bg-white px-5 py-5 shadow-[0_28px_70px_rgb(var(--ro-secondary-rgb)/0.11)]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-subtle">Ticket</p>
            <h2 className="mt-1 text-2xl font-black">{lastOrder ? `Order #${lastOrder.orderNumber}` : 'Order #Draft'}</h2>
          </div>
          <Badge tone={lastOrder?.status === 'COMPLETED' ? 'green' : 'orange'}>
            {lastOrder?.status === 'COMPLETED' ? 'Paid' : 'Open'}
          </Badge>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {cart.length === 0 ? (
            <Card className="flex h-44 items-center justify-center bg-white p-6 text-center text-sm font-semibold text-muted shadow-[inset_0_0_0_1px_rgb(var(--ro-secondary-rgb)/0.08)]">
              Add menu items to start an order.
            </Card>
          ) : (
            cart.map((line) => (
              <Card key={line.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black">{line.name}</h3>
                    <p className="text-sm font-semibold text-muted">{money.format(line.price)} each</p>
                  </div>
                  <button
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-subtle hover:bg-red-50 hover:text-red-600"
                    onClick={() => removeLine(line.id)}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center rounded-xl bg-sage">
                    <button className="flex h-9 w-9 items-center justify-center text-label" onClick={() => changeQuantity(line.id, -1)}>
                      <Minus size={16} />
                    </button>
                    <span className="w-10 text-center font-black">{line.quantity}</span>
                    <button className="flex h-9 w-9 items-center justify-center text-primary" onClick={() => changeQuantity(line.id, 1)}>
                      <Plus size={16} />
                    </button>
                  </div>
                  <strong className="text-lg">{money.format(line.price * line.quantity)}</strong>
                </div>
              </Card>
            ))
          )}
        </div>

        <Card className="mt-4 bg-sage p-4 shadow-none">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-black text-secondary">
              <Keyboard size={17} />
              Shortcut card
            </div>
            <Link
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-white px-3 text-xs font-black text-secondary shadow-[inset_0_0_0_1px_rgb(var(--ro-secondary-rgb)/0.08)] hover:bg-mint"
              to="/tables"
            >
              <Table2 size={15} />
              F10
            </Link>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold text-muted">
            <span>F2 Search</span>
            <span>F5 Kitchen</span>
            <span>F6 Print preview</span>
            <span>F7 Payment</span>
            <span>P Print preview</span>
            <span>F10 Tables</span>
            <span>Ctrl+Shift+F Max</span>
            <span>Ctrl+Shift+M Min</span>
            <span>Ctrl+Shift+Q Close</span>
          </div>
        </Card>

        <div className="mt-4 rounded-2xl bg-secondary p-4 text-white">
          <div className="flex justify-between text-sm font-bold text-deepSoft">
            <span>Subtotal</span>
            <span>{money.format(total)}</span>
          </div>
          <div className="mt-2 flex justify-between text-sm font-bold text-deepSoft">
            <span>Tax / service</span>
            <span>{money.format(0)}</span>
          </div>
          <div className="mt-4 flex justify-between border-t border-divider pt-4 text-2xl font-black">
            <span>Total</span>
            <span className="text-white">{money.format(total)}</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button disabled={cart.length === 0 && !lastOrder} icon={<Printer size={18} />} variant="secondary" onClick={() => setPrintOpen(true)}>
            Print
          </Button>
          <Button disabled={cart.length === 0 || sendToKitchen.isPending} icon={sendToKitchen.isPending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />} variant="secondary" onClick={() => sendToKitchen.mutate()}>
            Kitchen
          </Button>
          <Button className="col-span-2 h-14 text-base" disabled={cart.length === 0 || payOrder.isPending} icon={<WalletCards size={20} />} onClick={openPayment}>
            Payment F7
          </Button>
        </div>
      </aside>

      <PaymentModal
        amount={paymentAmount}
        error={payOrder.isError}
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
