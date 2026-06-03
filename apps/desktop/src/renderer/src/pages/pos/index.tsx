import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
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
import { ActionModal } from '../../components/action-modal';
import { FormField } from '../../components/form-field';
import { apiFetch } from '../../lib/api';
import type { FormSubmitEvent } from '../../lib/events';
import { usePosStore } from '../../store/use-pos-store';
import type { PaymentMethod, PosCatalogResponse, PosMenuItem, PosOrder, PrinterInfo } from './interfaces';

const money = new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0, style: 'currency', currency: 'PKR' });

export function PosPage() {
  const { cart, addLine, changeQuantity, removeLine, clear, orderType, setOrderType } = usePosStore();
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [selectedPrinterName, setSelectedPrinterName] = useState('');
  const [lastOrder, setLastOrder] = useState<PosOrder | undefined>();
  const [lastReceiptLines, setLastReceiptLines] = useState<Array<{ name: string; price: number; quantity: number }>>([]);

  const catalogQuery = useQuery({
    queryKey: ['pos-catalog'],
    queryFn: () => apiFetch<PosCatalogResponse>('/menu/pos'),
  });

  const printersQuery = useQuery({
    queryKey: ['desktop-printers'],
    queryFn: () => window.restaurantos.printers.list() as Promise<PrinterInfo[]>,
  });

  const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
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
      const html = buildReceiptHtml(order, receiptLines, receiptTotal || total);
      return window.restaurantos.printers.printReceipt({
        html,
        printerName: selectedPrinterName || undefined,
        silent: Boolean(selectedPrinterName),
      });
    },
    onSuccess: () => setPrintOpen(false),
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
            <span>F7 Payment</span>
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

      <ActionModal description="Take payment for this order." open={paymentOpen} title="Payment" onClose={() => setPaymentOpen(false)}>
        <form className="space-y-3" onSubmit={submitPayment}>
          <div className="rounded-2xl bg-sage p-4">
            <p className="text-xs font-black uppercase text-muted">Total to pay</p>
            <p className="mt-1 text-2xl font-black text-espresso">{money.format(total)}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Amount paid">
              <input
                className="h-11 w-full rounded-xl border border-field bg-white px-3 text-sm font-semibold text-espresso outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                max={total}
                min="0.01"
                step="0.01"
                type="number"
                value={paymentAmount}
                onChange={(event) => setPaymentAmount(event.target.value)}
              />
            </FormField>
            <FormField label="How paid">
              <select
                className="h-11 w-full rounded-xl border border-field bg-white px-3 text-sm font-semibold text-espresso outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
              >
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="BANK_TRANSFER">Bank transfer</option>
                <option value="JAZZCASH_EASYPAISA">Wallet</option>
                <option value="ONLINE">Online</option>
                <option value="CUSTOMER_CREDIT">Customer credit</option>
              </select>
            </FormField>
          </div>
          <FormField label="Receipt or note number">
            <input
              className="h-11 w-full rounded-xl border border-field bg-white px-3 text-sm font-semibold text-espresso outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              value={paymentReference}
              onChange={(event) => setPaymentReference(event.target.value)}
            />
          </FormField>
          {payOrder.isError ? (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              Payment failed. Check amount and API connection.
            </div>
          ) : null}
          <Button
            className="w-full"
            disabled={Number(paymentAmount || 0) <= 0 || Number(paymentAmount || 0) > total || payOrder.isPending}
            icon={payOrder.isPending ? <Loader2 className="animate-spin" size={17} /> : <WalletCards size={17} />}
            type="submit"
          >
            Save payment
          </Button>
        </form>
      </ActionModal>

      <ActionModal description="Choose a printer installed on this computer." open={printOpen} title="Print receipt" onClose={() => setPrintOpen(false)}>
        <form className="space-y-3" onSubmit={submitPrint}>
          <FormField label="Printer">
            <select
              className="h-11 w-full rounded-xl border border-field bg-white px-3 text-sm font-semibold text-espresso outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              value={selectedPrinterName}
              onChange={(event) => setSelectedPrinterName(event.target.value)}
            >
              <option value="">Default printer</option>
              {(printersQuery.data ?? []).map((printer) => (
                <option key={printer.name} value={printer.name}>
                  {printer.displayName || printer.name}
                  {printer.isDefault ? ' (Default)' : ''}
                </option>
              ))}
            </select>
          </FormField>
          {printReceipt.isError ? (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              Print failed. Check printer setup.
            </div>
          ) : null}
          <Button
            className="w-full"
            disabled={printReceipt.isPending || (cart.length === 0 && !lastOrder)}
            icon={printReceipt.isPending ? <Loader2 className="animate-spin" size={17} /> : <Printer size={17} />}
            type="submit"
          >
            Print receipt
          </Button>
        </form>
      </ActionModal>
    </div>
  );
}

function buildReceiptHtml(order: PosOrder, cart: Array<{ name: string; price: number; quantity: number }>, total: number) {
  const rows = cart
    .map(
      (line) => `
        <tr>
          <td>${escapeHtml(line.name)} x ${line.quantity}</td>
          <td style="text-align:right">${money.format(line.price * line.quantity)}</td>
        </tr>
      `,
    )
    .join('');

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          @page { margin: 0; size: 80mm auto; }
          body { margin: 0; padding: 10px; width: 72mm; font-family: Arial, sans-serif; font-size: 12px; color: #000; }
          h1 { font-size: 18px; margin: 0 0 8px; text-align: center; }
          table { width: 100%; border-collapse: collapse; }
          td { padding: 3px 0; vertical-align: top; }
          .line { border-top: 1px dashed #000; margin: 8px 0; }
          .total { font-size: 16px; font-weight: 700; }
          .center { text-align: center; }
        </style>
      </head>
      <body>
        <h1>RestaurantOS</h1>
        <p class="center">Order ${escapeHtml(order.orderNumber)}</p>
        <div class="line"></div>
        <table>${rows}</table>
        <div class="line"></div>
        <table>
          <tr class="total"><td>Total</td><td style="text-align:right">${money.format(total || Number(order.grandTotal))}</td></tr>
        </table>
        <p class="center">Thank you</p>
      </body>
    </html>
  `;
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
