import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  ReceiptText,
  Save,
  SlidersHorizontal,
  Store,
} from 'lucide-react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Badge, Button, Card } from '@restaurantos/ui';
import { apiFetch } from '../lib/api';
import { useAuthStore } from '../store/use-auth-store';

interface SettingRecord {
  id: string;
  key: string;
  group: string;
  value: unknown;
  updatedAt: string;
}

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
});

type SettingsForm = z.infer<typeof settingsSchema>;

const fieldClass =
  'mt-2 h-12 w-full rounded-xl border border-[#dcebe9] bg-white px-4 text-sm font-semibold text-[#0d1717] outline-none transition focus:border-[#1ba09c] focus:ring-4 focus:ring-[#1ba09c]/10';

const textareaClass =
  'mt-2 min-h-24 w-full resize-none rounded-xl border border-[#dcebe9] bg-white px-4 py-3 text-sm font-semibold text-[#0d1717] outline-none transition focus:border-[#1ba09c] focus:ring-4 focus:ring-[#1ba09c]/10';

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
  };
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
    ],
  };
}

export function SettingsPage() {
  const queryClient = useQueryClient();
  const canUpdateSettings = useAuthStore((state) => state.hasPermission('settings.update'));

  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: () => apiFetch<SettingRecord[]>('/settings'),
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
    mutationFn: (values: SettingsForm) =>
      apiFetch<SettingRecord[]>('/settings', {
        method: 'PATCH',
        body: JSON.stringify(toPayload(values)),
      }),
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
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#1ba09c]">Configuration</p>
          <h1 className="mt-2 text-4xl font-black text-[#0d1717]">Restaurant settings</h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold text-[#647271]">
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
        <Card className="mt-6 flex h-36 items-center justify-center text-sm font-bold text-[#647271]">
          <Loader2 className="mr-2 animate-spin text-[#1ba09c]" size={18} />
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
        <Card className="mt-6 flex items-start gap-3 border border-[#c7efed] bg-[#f4fbfa] p-5 text-sm font-bold text-[#085655]">
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
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e9fbfa] text-[#085655]">
              <Store size={21} />
            </span>
            <div>
              <h2 className="text-xl font-black text-[#0d1717]">Business profile</h2>
              <p className="text-sm font-semibold text-[#647271]">Shown on receipts, reports, and future branches.</p>
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
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e9fbfa] text-[#085655]">
              <ReceiptText size={21} />
            </span>
            <div>
              <h2 className="text-xl font-black text-[#0d1717]">Tax and receipt</h2>
              <p className="text-sm font-semibold text-[#647271]">Defaults used by POS checkout and printed bills.</p>
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
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e9fbfa] text-[#085655]">
              <SlidersHorizontal size={21} />
            </span>
            <div>
              <h2 className="text-xl font-black text-[#0d1717]">Operations policy</h2>
              <p className="text-sm font-semibold text-[#647271]">Controls alerts and cashier shift behavior.</p>
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

        <Card className="bg-[#085655] p-6 text-white">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[#9ee2df]">Phase 4 foundation</p>
          <h2 className="mt-4 text-3xl font-black">Ready for table system</h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-[#d7f4f2]">
            These settings become the source for POS receipts, tax math, stock warnings, kitchen alert timers, and shift
            validation. Table and floor layout settings will attach here in the next phase.
          </p>
        </Card>
      </div>
    </form>
  );
}

interface FieldProps {
  children: ReactNode;
  className?: string;
  error?: string;
  label: string;
}

function Field({ children, className, error, label }: FieldProps) {
  return (
    <label className={className}>
      <span className="text-sm font-black text-[#4d5d5c]">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs font-bold text-red-600">{error}</span> : null}
    </label>
  );
}

interface ToggleProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

function Toggle({ label, ...props }: ToggleProps) {
  return (
    <label className="mt-5 flex items-center justify-between gap-4 rounded-xl bg-[#f4fbfa] px-4 py-3 text-sm font-black text-[#0d1717]">
      <span>{label}</span>
      <input
        className="h-5 w-5 accent-[#1ba09c]"
        type="checkbox"
        {...props}
      />
    </label>
  );
}
