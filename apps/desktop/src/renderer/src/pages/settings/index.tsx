import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Printer,
  ReceiptText,
  Save,
  SlidersHorizontal,
  Store,
} from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Badge, Button, Card } from '@restaurantos/ui';
import { settingsService } from '@/services/settings-service';
import { useAuthStore } from '@/store/use-auth-store';
import type { FieldProps, SettingRecord, ToggleProps } from './interfaces';

const settingsSchema = z.object({
  businessName: z.string().min(2, 'Business name is required'),
  branchName: z.string().min(2, 'Branch name is required'),
  phone: z.string().min(6, 'Phone number is required'),
  address: z.string().min(3, 'Address is required'),
  currency: z.string().min(2, 'Currency is required').max(6, 'Use a short currency code'),
  defaultTaxPercent: z.coerce.number().min(0).max(100),
  serviceChargePercent: z.coerce.number().min(0).max(100),
  receiptFooter: z.string().min(3, 'Receipt footer is required'),
  printCustomerCopy: z.boolean(),
  lowStockThreshold: z.coerce.number().int().min(0).max(9999),
  kitchenDelayMinutes: z.coerce.number().int().min(1).max(180),
  shiftFloatRequired: z.boolean(),
  terminalName: z.string().min(2, 'Terminal name is required'),
  receiptPrinterMode: z.enum(['os', 'network', 'device']),
  receiptPrinterName: z.string().max(120),
  receiptPrinterHost: z.string().max(120),
  receiptPrinterPort: z.coerce.number().int().min(1).max(65535),
  receiptPrinterDevicePath: z.string().max(250),
  openDrawerAfterPrint: z.boolean(),
});

type SettingsForm = z.infer<typeof settingsSchema>;
type ReceiptPrinterMode = SettingsForm['receiptPrinterMode'];

const fieldClass =
  'mt-2 h-12 w-full rounded-xl border border-field bg-white px-4 text-sm font-semibold text-espresso outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10';

const textareaClass =
  'mt-2 min-h-24 w-full resize-none rounded-xl border border-field bg-white px-4 py-3 text-sm font-semibold text-espresso outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10';

const defaultValues: SettingsForm = {
  businessName: 'RestaurantOS Demo Cafe',
  branchName: 'Main Branch',
  phone: '+92 300 0000000',
  address: 'Main food street',
  currency: 'PKR',
  defaultTaxPercent: 5,
  serviceChargePercent: 0,
  receiptFooter: 'Thank you for dining with us.',
  printCustomerCopy: true,
  lowStockThreshold: 10,
  kitchenDelayMinutes: 12,
  shiftFloatRequired: true,
  terminalName: 'Main cashier',
  receiptPrinterMode: 'os',
  receiptPrinterName: '',
  receiptPrinterHost: '',
  receiptPrinterPort: 9100,
  receiptPrinterDevicePath: '',
  openDrawerAfterPrint: false,
};

function getValue<T>(settings: SettingRecord[] | undefined, key: string, fallback: T): T {
  const setting = settings?.find((item) => item.key === key);
  return setting?.value === undefined ? fallback : (setting.value as T);
}

function toFormValues(settings: SettingRecord[] | undefined): SettingsForm {
  return {
    businessName: getValue(settings, 'business.name', defaultValues.businessName),
    branchName: getValue(settings, 'business.branch', defaultValues.branchName),
    phone: getValue(settings, 'business.phone', defaultValues.phone),
    address: getValue(settings, 'business.address', defaultValues.address),
    currency: getValue(settings, 'business.currency', defaultValues.currency),
    defaultTaxPercent: Number(getValue(settings, 'tax.defaultPercent', defaultValues.defaultTaxPercent)),
    serviceChargePercent: Number(getValue(settings, 'tax.serviceChargePercent', defaultValues.serviceChargePercent)),
    receiptFooter: getValue(settings, 'receipt.footer', defaultValues.receiptFooter),
    printCustomerCopy: Boolean(getValue(settings, 'receipt.printCustomerCopy', defaultValues.printCustomerCopy)),
    lowStockThreshold: Number(getValue(settings, 'operations.lowStockThreshold', defaultValues.lowStockThreshold)),
    kitchenDelayMinutes: Number(getValue(settings, 'operations.kitchenDelayMinutes', defaultValues.kitchenDelayMinutes)),
    shiftFloatRequired: Boolean(getValue(settings, 'operations.shiftFloatRequired', defaultValues.shiftFloatRequired)),
    terminalName: getValue(settings, 'terminal.name', defaultValues.terminalName),
    receiptPrinterMode: readReceiptPrinterMode(settings, 'terminal.receiptPrinterMode', defaultValues.receiptPrinterMode),
    receiptPrinterName: getValue(settings, 'terminal.receiptPrinterName', defaultValues.receiptPrinterName),
    receiptPrinterHost: getValue(settings, 'terminal.receiptPrinterHost', defaultValues.receiptPrinterHost),
    receiptPrinterPort: Number(getValue(settings, 'terminal.receiptPrinterPort', defaultValues.receiptPrinterPort)),
    receiptPrinterDevicePath: getValue(settings, 'terminal.receiptPrinterDevicePath', defaultValues.receiptPrinterDevicePath),
    openDrawerAfterPrint: Boolean(getValue(settings, 'terminal.openDrawerAfterPrint', defaultValues.openDrawerAfterPrint)),
  };
}

function readReceiptPrinterMode(
  settings: SettingRecord[] | undefined,
  key: string,
  fallback: ReceiptPrinterMode,
): ReceiptPrinterMode {
  const value = getValue(settings, key, fallback);
  return value === 'network' || value === 'device' || value === 'os' ? value : fallback;
}

function toPayload(values: SettingsForm) {
  return {
    settings: [
      { key: 'business.name', group: 'business', value: values.businessName },
      { key: 'business.branch', group: 'business', value: values.branchName },
      { key: 'business.phone', group: 'business', value: values.phone },
      { key: 'business.address', group: 'business', value: values.address },
      { key: 'business.currency', group: 'business', value: values.currency.toUpperCase() },
      { key: 'tax.defaultPercent', group: 'tax', value: values.defaultTaxPercent },
      { key: 'tax.serviceChargePercent', group: 'tax', value: values.serviceChargePercent },
      { key: 'receipt.footer', group: 'receipt', value: values.receiptFooter },
      { key: 'receipt.printCustomerCopy', group: 'receipt', value: values.printCustomerCopy },
      { key: 'operations.lowStockThreshold', group: 'operations', value: values.lowStockThreshold },
      { key: 'operations.kitchenDelayMinutes', group: 'operations', value: values.kitchenDelayMinutes },
      { key: 'operations.shiftFloatRequired', group: 'operations', value: values.shiftFloatRequired },
      { key: 'terminal.name', group: 'terminal', value: values.terminalName },
      { key: 'terminal.receiptPrinterMode', group: 'terminal', value: values.receiptPrinterMode },
      { key: 'terminal.receiptPrinterName', group: 'terminal', value: values.receiptPrinterName },
      { key: 'terminal.receiptPrinterHost', group: 'terminal', value: values.receiptPrinterHost },
      { key: 'terminal.receiptPrinterPort', group: 'terminal', value: values.receiptPrinterPort },
      { key: 'terminal.receiptPrinterDevicePath', group: 'terminal', value: values.receiptPrinterDevicePath },
      { key: 'terminal.openDrawerAfterPrint', group: 'terminal', value: values.openDrawerAfterPrint },
    ],
  };
}

export function SettingsPage() {
  const queryClient = useQueryClient();
  const canUpdateSettings = useAuthStore((state) => state.hasPermission('settings.update'));

  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: settingsService.list,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues,
  });

  useEffect(() => {
    if (settingsQuery.data) reset(toFormValues(settingsQuery.data));
  }, [reset, settingsQuery.data]);

  const updateSettings = useMutation({
    mutationFn: (values: SettingsForm) => settingsService.update(toPayload(values)),
    onSuccess: (records) => {
      queryClient.setQueryData(['settings'], records);
      reset(toFormValues(records));
    },
  });

  const onSubmit = handleSubmit((values) => updateSettings.mutate(values));

  return (
    <form className="h-full overflow-y-auto bg-white p-7" onSubmit={onSubmit}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-primary">Configuration</p>
          <h1 className="mt-2 text-4xl font-black text-espresso">Restaurant settings</h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold text-muted">
            Control the business profile, taxes, receipts, stock thresholds, kitchen delay alerts, and shift policy.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone={canUpdateSettings ? 'green' : 'orange'}>
            {canUpdateSettings ? 'Admin editable' : 'View only'}
          </Badge>
          <Button
            type="submit"
            icon={updateSettings.isPending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            disabled={!canUpdateSettings || !isDirty || updateSettings.isPending || settingsQuery.isLoading}
          >
            {updateSettings.isPending ? 'Saving...' : 'Save settings'}
          </Button>
        </div>
      </div>

      {settingsQuery.isLoading ? (
        <Card className="mt-6 flex h-36 items-center justify-center text-sm font-bold text-muted">
          <Loader2 className="mr-2 animate-spin text-primary" size={18} />
          Loading settings
        </Card>
      ) : null}

      {settingsQuery.isError ? (
        <Card className="mt-6 flex items-start gap-3 border border-red-100 bg-red-50 p-5 text-sm font-bold text-red-700">
          <AlertCircle size={19} />
          Settings could not load. Check the API server and your login session.
        </Card>
      ) : null}

      {updateSettings.isSuccess ? (
        <Card className="mt-6 flex items-start gap-3 border border-accentSoft bg-sage p-5 text-sm font-bold text-secondary">
          <CheckCircle2 size={19} />
          Settings saved and audit logged.
        </Card>
      ) : null}

      {updateSettings.isError ? (
        <Card className="mt-6 flex items-start gap-3 border border-red-100 bg-red-50 p-5 text-sm font-bold text-red-700">
          <AlertCircle size={19} />
          Save failed. Your account needs settings permission and the API must be online.
        </Card>
      ) : null}

      <div className="mt-6 grid grid-cols-[1.1fr_0.9fr] gap-5">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-mint text-secondary">
              <Store size={21} />
            </span>
            <div>
              <h2 className="text-xl font-black text-espresso">Business profile</h2>
              <p className="text-sm font-semibold text-muted">Shown on receipts, reports, and future branches.</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <Field label="Business name" error={errors.businessName?.message}>
              <input className={fieldClass} {...register('businessName')} />
            </Field>
            <Field label="Branch" error={errors.branchName?.message}>
              <input className={fieldClass} {...register('branchName')} />
            </Field>
            <Field label="Phone" error={errors.phone?.message}>
              <input className={fieldClass} {...register('phone')} />
            </Field>
            <Field label="Currency" error={errors.currency?.message}>
              <input className={fieldClass} {...register('currency')} />
            </Field>
          </div>

          <Field className="mt-4" label="Address" error={errors.address?.message}>
            <textarea className={textareaClass} {...register('address')} />
          </Field>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-mint text-secondary">
              <ReceiptText size={21} />
            </span>
            <div>
              <h2 className="text-xl font-black text-espresso">Tax and receipt</h2>
              <p className="text-sm font-semibold text-muted">Defaults used by POS checkout and printed bills.</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <Field label="Tax percent" error={errors.defaultTaxPercent?.message}>
              <input className={fieldClass} type="number" step="0.01" {...register('defaultTaxPercent')} />
            </Field>
            <Field label="Service charge" error={errors.serviceChargePercent?.message}>
              <input className={fieldClass} type="number" step="0.01" {...register('serviceChargePercent')} />
            </Field>
          </div>

          <Field className="mt-4" label="Receipt footer" error={errors.receiptFooter?.message}>
            <textarea className={textareaClass} {...register('receiptFooter')} />
          </Field>

          <Toggle label="Print customer copy by default" {...register('printCustomerCopy')} />
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-mint text-secondary">
              <SlidersHorizontal size={21} />
            </span>
            <div>
              <h2 className="text-xl font-black text-espresso">Operations policy</h2>
              <p className="text-sm font-semibold text-muted">Controls alerts and cashier shift behavior.</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <Field label="Low stock threshold" error={errors.lowStockThreshold?.message}>
              <input className={fieldClass} type="number" {...register('lowStockThreshold')} />
            </Field>
            <Field label="Kitchen delay minutes" error={errors.kitchenDelayMinutes?.message}>
              <input className={fieldClass} type="number" {...register('kitchenDelayMinutes')} />
            </Field>
          </div>

          <Toggle label="Require opening cash float for shifts" {...register('shiftFloatRequired')} />
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-mint text-secondary">
              <Printer size={21} />
            </span>
            <div>
              <h2 className="text-xl font-black text-espresso">Terminal hardware</h2>
              <p className="text-sm font-semibold text-muted">Default printer and drawer setup for the cashier screen.</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <Field label="Terminal name" error={errors.terminalName?.message}>
              <input className={fieldClass} {...register('terminalName')} />
            </Field>
            <Field label="Receipt printer type" error={errors.receiptPrinterMode?.message}>
              <select className={fieldClass} {...register('receiptPrinterMode')}>
                <option value="os">Installed printer</option>
                <option value="network">Network ESC/POS</option>
                <option value="device">USB/Bluetooth path</option>
              </select>
            </Field>
            <Field label="Installed printer name" error={errors.receiptPrinterName?.message}>
              <input className={fieldClass} {...register('receiptPrinterName')} />
            </Field>
            <Field label="Printer IP address" error={errors.receiptPrinterHost?.message}>
              <input className={fieldClass} {...register('receiptPrinterHost')} />
            </Field>
            <Field label="Port" error={errors.receiptPrinterPort?.message}>
              <input className={fieldClass} type="number" {...register('receiptPrinterPort')} />
            </Field>
            <Field label="Device path" error={errors.receiptPrinterDevicePath?.message}>
              <input className={fieldClass} {...register('receiptPrinterDevicePath')} />
            </Field>
          </div>

          <Toggle label="Open cash drawer after printing" {...register('openDrawerAfterPrint')} />
        </Card>

        <Card className="bg-secondary p-6 text-white">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-deepBright">Phase 4 foundation</p>
          <h2 className="mt-4 text-3xl font-black">Ready for cashier terminals</h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-deepFaint">
            These settings become the source for POS receipts, tax math, stock warnings, kitchen alert timers, and shift
            validation. Terminal hardware defaults now feed the POS print popup so staff do not re-enter printer details.
          </p>
        </Card>
      </div>
    </form>
  );
}

function Field({ children, className, error, label }: FieldProps) {
  return (
    <label className={className}>
      <span className="text-sm font-black text-label">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs font-bold text-red-600">{error}</span> : null}
    </label>
  );
}

function Toggle({ label, ...props }: ToggleProps) {
  return (
    <label className="mt-5 flex items-center justify-between gap-4 rounded-xl bg-sage px-4 py-3 text-sm font-black text-espresso">
      <span>{label}</span>
      <input
        className="h-5 w-5 accent-primary"
        type="checkbox"
        {...props}
      />
    </label>
  );
}
