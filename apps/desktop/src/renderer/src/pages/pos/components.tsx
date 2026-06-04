import { Badge, Button, Card } from '@restaurantos/ui';
import { Check, Loader2, Minus, Plus, Printer, Send, Trash2, WalletCards, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { ActionModal } from '@/components/action-modal';
import { FormField } from '@/components/form-field';
import type { FormSubmitEvent } from '@/lib/events';
import { money } from './formatting';
import type { PaymentMethod, PosMenuItem, PosOrder, PrinterInfo, PrintMode } from './interfaces';

const fieldClass =
  'h-11 w-full rounded-xl border border-field bg-white px-3 text-sm font-semibold text-espresso outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10';

interface PaymentModalProps {
  amount: string;
  canSubmit?: boolean;
  customerSection?: ReactNode;
  error: boolean;
  errorMessage?: string;
  method: PaymentMethod;
  onAmountChange: (value: string) => void;
  onClose: () => void;
  onMethodChange: (value: PaymentMethod) => void;
  onReferenceChange: (value: string) => void;
  onSubmit: (event: FormSubmitEvent) => void;
  open: boolean;
  pending: boolean;
  reference: string;
  total: number;
}

interface TicketLine {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface PosTicketPanelProps {
  cart: TicketLine[];
  kitchenPending: boolean;
  lastOrder?: PosOrder;
  paymentPending: boolean;
  selectedTableName?: string;
  total: number;
  onChangeQuantity: (id: string, delta: number) => void;
  onCorrectItem: (line: TicketLine) => void;
  onOpenPayment: () => void;
  onOpenPrint: () => void;
  onSendToKitchen: () => void;
  onVoidOrder: () => void;
}

interface QuickAddConfirmModalProps {
  item?: PosMenuItem;
  number?: number;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function QuickAddConfirmModal({
  item,
  number,
  open,
  onClose,
  onConfirm,
}: QuickAddConfirmModalProps) {
  return (
    <ActionModal description="Confirm the menu item before adding it to the ticket." open={open} title="Add item" widthClass="max-w-md" onClose={onClose}>
      {item ? (
        <div className="space-y-4">
          <div className="rounded-2xl bg-sage p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Badge tone="blue">{item.kitchenStation?.name ?? item.category.name}</Badge>
                <h3 className="mt-4 text-2xl font-black text-espresso">{item.shortName || item.name}</h3>
                <p className="mt-2 text-sm font-bold text-muted">{item.category.name}</p>
              </div>
              {number ? (
                <span className="flex h-11 min-w-11 items-center justify-center rounded-xl bg-secondary px-3 text-lg font-black text-white">
                  {number}
                </span>
              ) : null}
            </div>
            <p className="mt-5 text-3xl font-black text-secondary">{money.format(Number(item.basePrice))}</p>
          </div>
          <Button className="w-full" icon={<Check size={17} />} type="button" onClick={onConfirm}>
            Add item
          </Button>
        </div>
      ) : null}
    </ActionModal>
  );
}

export function PosTicketPanel({
  cart,
  kitchenPending,
  lastOrder,
  paymentPending,
  selectedTableName,
  total,
  onChangeQuantity,
  onCorrectItem,
  onOpenPayment,
  onOpenPrint,
  onSendToKitchen,
  onVoidOrder,
}: PosTicketPanelProps) {
  const correctionDisabled = lastOrder?.status === 'COMPLETED' || lastOrder?.status === 'CANCELLED' || lastOrder?.status === 'VOIDED';

  return (
    <aside className="flex min-h-0 flex-col rounded-[28px] bg-white px-5 py-5 shadow-[0_28px_70px_rgb(var(--ro-secondary-rgb)/0.11)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.24em] text-subtle">Ticket</p>
          <h2 className="mt-1 text-2xl font-black">{lastOrder ? `Order #${lastOrder.orderNumber}` : 'Order #Draft'}</h2>
          {selectedTableName ? (
            <p className="mt-2 inline-flex rounded-xl bg-mint px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-secondary">
              Table {selectedTableName}
            </p>
          ) : null}
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
                  onClick={() => onCorrectItem(line)}
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center rounded-xl bg-sage">
                  <button className="flex h-9 w-9 items-center justify-center text-label" onClick={() => onChangeQuantity(line.id, -1)}>
                    <Minus size={16} />
                  </button>
                  <span className="w-10 text-center font-black">{line.quantity}</span>
                  <button className="flex h-9 w-9 items-center justify-center text-primary" onClick={() => onChangeQuantity(line.id, 1)}>
                    <Plus size={16} />
                  </button>
                </div>
                <strong className="text-lg">{money.format(line.price * line.quantity)}</strong>
              </div>
            </Card>
          ))
        )}
      </div>

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

      {lastOrder && !correctionDisabled ? (
        <Button className="mt-3 w-full" icon={<XCircle size={17} />} type="button" variant="secondary" onClick={onVoidOrder}>
          Void order
        </Button>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Button disabled={cart.length === 0 && !lastOrder} icon={<Printer size={18} />} variant="secondary" onClick={onOpenPrint}>
          Print
        </Button>
        <Button disabled={cart.length === 0 || kitchenPending} icon={kitchenPending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />} variant="secondary" onClick={onSendToKitchen}>
          Kitchen
        </Button>
        <Button className="col-span-2 h-14 text-base" disabled={cart.length === 0 || paymentPending} icon={<WalletCards size={20} />} onClick={onOpenPayment}>
          Payment F7
        </Button>
      </div>
    </aside>
  );
}

interface CorrectionModalProps {
  error: boolean;
  open: boolean;
  pending: boolean;
  reason: string;
  targetLabel: string;
  title: string;
  onClose: () => void;
  onReasonChange: (value: string) => void;
  onSubmit: (event: FormSubmitEvent) => void;
}

export function CorrectionModal({
  error,
  open,
  pending,
  reason,
  targetLabel,
  title,
  onClose,
  onReasonChange,
  onSubmit,
}: CorrectionModalProps) {
  return (
    <ActionModal description="A reason is saved in the audit log." open={open} title={title} widthClass="max-w-md" onClose={onClose}>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="rounded-2xl bg-sage p-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-muted">Correction target</p>
          <p className="mt-2 text-lg font-black text-espresso">{targetLabel}</p>
        </div>
        <FormField label="Reason">
          <textarea
            className="min-h-24 w-full resize-none rounded-xl border border-field bg-white px-3 py-3 text-sm font-semibold text-espresso outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
          />
        </FormField>
        {error ? <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">Correction failed. Check permission and order status.</div> : null}
        <Button className="w-full" disabled={reason.trim().length < 3 || pending} icon={pending ? <Loader2 className="animate-spin" size={17} /> : <XCircle size={17} />} type="submit">
          Save correction
        </Button>
      </form>
    </ActionModal>
  );
}

export function PaymentModal({
  amount,
  canSubmit = true,
  customerSection,
  error,
  errorMessage,
  method,
  onAmountChange,
  onClose,
  onMethodChange,
  onReferenceChange,
  onSubmit,
  open,
  pending,
  reference,
  total,
}: PaymentModalProps) {
  return (
    <ActionModal description="Take payment for this order." open={open} title="Payment" onClose={onClose}>
      <form className="space-y-3" onSubmit={onSubmit}>
        <div className="rounded-2xl bg-sage p-4">
          <p className="text-xs font-black uppercase text-muted">Total to pay</p>
          <p className="mt-1 text-2xl font-black text-espresso">
            {money.format(total)}
          </p>
        </div>
        {customerSection}
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Amount paid">
            <input
              className={fieldClass}
              max={total}
              min="0.01"
              step="0.01"
              type="number"
              value={amount}
              onChange={(event) => onAmountChange(event.target.value)}
            />
          </FormField>
          <FormField label="How paid">
            <select className={fieldClass} value={method} onChange={(event) => onMethodChange(event.target.value as PaymentMethod)}>
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
          <input className={fieldClass} value={reference} onChange={(event) => onReferenceChange(event.target.value)} />
        </FormField>
        {error ? (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {errorMessage || 'Payment failed. Check amount and API connection.'}
          </div>
        ) : null}
        <Button
          className="w-full"
          disabled={Number(amount || 0) <= 0 || Number(amount || 0) > total || pending || !canSubmit}
          icon={pending ? <Loader2 className="animate-spin" size={17} /> : <WalletCards size={17} />}
          type="submit"
        >
          Save payment
        </Button>
      </form>
    </ActionModal>
  );
}

interface PrintReceiptModalProps {
  canPrint: boolean;
  devicePath: string;
  drawerError: boolean;
  drawerPending: boolean;
  host: string;
  mode: PrintMode;
  onClose: () => void;
  onDevicePathChange: (value: string) => void;
  onDrawerChange: (value: boolean) => void;
  onHostChange: (value: string) => void;
  onKickDrawer: () => void;
  onModeChange: (value: PrintMode) => void;
  onPortChange: (value: string) => void;
  onPrinterNameChange: (value: string) => void;
  onSubmit: (event: FormSubmitEvent) => void;
  open: boolean;
  openDrawerAfterPrint: boolean;
  port: string;
  previewText: string;
  printerError: boolean;
  printerName: string;
  printerPending: boolean;
  printers: PrinterInfo[];
}

export function PrintReceiptModal({
  canPrint,
  devicePath,
  drawerError,
  drawerPending,
  host,
  mode,
  onClose,
  onDevicePathChange,
  onDrawerChange,
  onHostChange,
  onKickDrawer,
  onModeChange,
  onPortChange,
  onPrinterNameChange,
  onSubmit,
  open,
  openDrawerAfterPrint,
  port,
  previewText,
  printerError,
  printerName,
  printerPending,
  printers,
}: PrintReceiptModalProps) {
  const missingNetworkPrinter = mode === 'network' && !host.trim();
  const missingDevicePrinter = mode === 'device' && !devicePath.trim();
  const hardwareMissing = missingNetworkPrinter || missingDevicePrinter;

  return (
    <ActionModal description="Choose how this receipt printer is connected." open={open} title="Print receipt" onClose={onClose}>
      <form className="space-y-3" onSubmit={onSubmit}>
        <div className="rounded-2xl border border-line bg-sage p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-muted">Receipt preview</p>
              <p className="mt-1 text-sm font-bold text-label">Check before printing.</p>
            </div>
            <Badge tone="orange">P Print</Badge>
          </div>
          <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-xl bg-white p-4 font-mono text-xs font-semibold leading-5 text-espresso shadow-[inset_0_0_0_1px_rgb(var(--ro-secondary-rgb)/0.08)]">
            {previewText}
          </pre>
        </div>

        <FormField label="Printer type">
          <select className={fieldClass} value={mode} onChange={(event) => onModeChange(event.target.value as PrintMode)}>
            <option value="os">Installed printer</option>
            <option value="network">Network ESC/POS</option>
            <option value="device">USB/Bluetooth device path</option>
          </select>
        </FormField>

        {mode === 'os' ? (
          <FormField label="Installed printer">
            <select className={fieldClass} value={printerName} onChange={(event) => onPrinterNameChange(event.target.value)}>
              <option value="">Default printer</option>
              {printers.map((printer) => (
                <option key={printer.name} value={printer.name}>
                  {printer.displayName || printer.name}
                  {printer.isDefault ? ' (Default)' : ''}
                </option>
              ))}
            </select>
          </FormField>
        ) : null}

        {mode === 'network' ? (
          <div className="grid grid-cols-[1fr_120px] gap-3">
            <FormField label="Printer IP address">
              <input className={fieldClass} value={host} onChange={(event) => onHostChange(event.target.value)} />
            </FormField>
            <FormField label="Port">
              <input className={fieldClass} min="1" type="number" value={port} onChange={(event) => onPortChange(event.target.value)} />
            </FormField>
          </div>
        ) : null}

        {mode === 'device' ? (
          <FormField label="Device path" hint="Examples: /dev/usb/lp0, /dev/rfcomm0, COM5, or a shared printer path.">
            <input className={fieldClass} value={devicePath} onChange={(event) => onDevicePathChange(event.target.value)} />
          </FormField>
        ) : null}

        {mode !== 'os' ? (
          <label className="flex items-center gap-3 rounded-2xl bg-sage px-4 py-3 text-sm font-bold text-label">
            <input
              checked={openDrawerAfterPrint}
              className="h-4 w-4 accent-primary"
              type="checkbox"
              onChange={(event) => onDrawerChange(event.target.checked)}
            />
            Open cash drawer after print
          </label>
        ) : null}

        {printerError ? <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">Print failed. Check printer setup.</div> : null}
        {drawerError ? <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">Drawer did not open. Check printer connection.</div> : null}

        {mode !== 'os' ? (
          <Button
            className="w-full"
            disabled={drawerPending || hardwareMissing}
            icon={drawerPending ? <Loader2 className="animate-spin" size={17} /> : <WalletCards size={17} />}
            type="button"
            variant="secondary"
            onClick={onKickDrawer}
          >
            Open cash drawer
          </Button>
        ) : null}
        <Button
          className="w-full"
          disabled={printerPending || !canPrint || hardwareMissing}
          icon={printerPending ? <Loader2 className="animate-spin" size={17} /> : <Printer size={17} />}
          type="submit"
        >
          Print receipt
        </Button>
      </form>
    </ActionModal>
  );
}
