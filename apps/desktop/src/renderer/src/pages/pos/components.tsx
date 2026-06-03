import { Badge, Button } from '@restaurantos/ui';
import { Check, Loader2, Printer, WalletCards } from 'lucide-react';
import { ActionModal } from '../../components/action-modal';
import { FormField } from '../../components/form-field';
import type { FormSubmitEvent } from '../../lib/events';
import { money } from './formatting';
import type { PaymentMethod, PosMenuItem, PrinterInfo, PrintMode } from './interfaces';

const fieldClass =
  'h-11 w-full rounded-xl border border-field bg-white px-3 text-sm font-semibold text-espresso outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10';

interface PaymentModalProps {
  amount: string;
  error: boolean;
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

export function PaymentModal({
  amount,
  error,
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
            Payment failed. Check amount and API connection.
          </div>
        ) : null}
        <Button
          className="w-full"
          disabled={Number(amount || 0) <= 0 || Number(amount || 0) > total || pending}
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
