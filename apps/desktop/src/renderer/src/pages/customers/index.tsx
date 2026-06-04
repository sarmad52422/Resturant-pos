import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CreditCard, Loader2, Plus, UserRound } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Badge, Button, Card } from '@restaurantos/ui';
import { ActionModal } from '../../components/action-modal';
import { FormField } from '../../components/form-field';
import type { FormSubmitEvent } from '../../lib/events';
import { customersService } from '../../services/customers-service';
import { useAuthStore } from '../../store/use-auth-store';

const fieldClass =
  'h-11 w-full rounded-xl border border-field bg-white px-3 text-sm font-semibold text-espresso outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10';

const money = new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0, style: 'currency', currency: 'PKR' });

export function CustomersPage() {
  const queryClient = useQueryClient();
  const canManageCustomers = useAuthStore((state) => state.hasPermission('customer.manage'));
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [creditLimit, setCreditLimit] = useState('0');
  const [createOpen, setCreateOpen] = useState(false);

  const customersQuery = useQuery({
    queryKey: ['customers'],
    queryFn: customersService.list,
  });

  const createCustomer = useMutation({
    mutationFn: () =>
      customersService.create({
        name: name.trim(),
        phone: phone.trim(),
        creditLimit: Number(creditLimit || 0),
        customerType: Number(creditLimit || 0) > 0 ? 'CREDIT' : 'REGULAR',
      }),
    onSuccess: () => {
      setName('');
      setPhone('');
      setCreditLimit('0');
      setCreateOpen(false);
      void queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  function submitCustomer(event: FormSubmitEvent) {
    event.preventDefault();
    if (name.trim() && phone.trim()) createCustomer.mutate();
  }

  return (
    <div className="h-full overflow-y-auto bg-white p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-primary">Ledger care</p>
          <h1 className="mt-2 text-4xl font-black text-espresso">Customer credit</h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold text-muted">
            Track customer profiles, order counts, credit limits, and outstanding receivables from one cashier-friendly
            workspace.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone={canManageCustomers ? 'green' : 'orange'}>
            {canManageCustomers ? 'Editable' : 'View only'}
          </Badge>
          <Button disabled={!canManageCustomers} icon={<Plus size={17} />} onClick={() => setCreateOpen(true)}>
            New customer
          </Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <Metric icon={<UserRound size={19} />} label="Customers" value={customersQuery.data?.metrics.totalCustomers ?? 0} />
        <Metric
          icon={<CreditCard size={19} />}
          label="Credit accounts"
          value={customersQuery.data?.metrics.creditCustomers ?? 0}
        />
        <Metric
          icon={<CreditCard size={19} />}
          label="Receivable"
          value={money.format(Number(customersQuery.data?.metrics.receivableBalance ?? 0))}
        />
      </div>

      <div className="mt-5">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-6 py-5">
            <div>
              <h2 className="text-xl font-black text-espresso">Customer ledger list</h2>
              <p className="text-sm font-semibold text-muted">Current credit exposure and POS order history.</p>
            </div>
            {customersQuery.isLoading ? <Loader2 className="animate-spin text-primary" size={20} /> : null}
          </div>

          {customersQuery.isError ? (
            <div className="m-5 flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              <AlertCircle size={17} />
              Customers could not load. Check the API session.
            </div>
          ) : null}

          <div className="max-h-[560px] overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-sage text-xs font-black uppercase text-muted">
                <tr>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right">Limit</th>
                  <th className="px-4 py-3 text-right">Balance</th>
                  <th className="px-6 py-3 text-right">Orders</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {(customersQuery.data?.customers ?? []).map((customer) => (
                  <tr key={customer.id}>
                    <td className="px-6 py-4">
                      <p className="font-black text-espresso">{customer.name}</p>
                      <p className="mt-1 text-xs font-semibold text-muted">{customer.phone}</p>
                    </td>
                    <td className="px-4 py-4">
                      <Badge tone={customer.customerType === 'CORPORATE' ? 'blue' : 'gray'}>
                        {customer.customerType}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-label">
                      {money.format(Number(customer.creditLimit))}
                    </td>
                    <td className="px-4 py-4 text-right font-black text-espresso">
                      {money.format(Number(customer.currentBalance))}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-label">
                      {customer.totalOrders || customer._count.orders}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <ActionModal
        description="Add a regular or credit customer profile for POS billing and account tracking."
        open={createOpen}
        title="New customer"
        onClose={() => setCreateOpen(false)}
      >
        <form className="mt-4 space-y-3" onSubmit={submitCustomer}>
          <FormField label="Customer name">
            <input
              className={fieldClass}
              disabled={!canManageCustomers}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </FormField>
          <FormField label="Phone number">
            <input
              className={fieldClass}
              disabled={!canManageCustomers}
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </FormField>
          <FormField label="Money limit" hint="Maximum amount this customer can owe.">
            <input
              className={fieldClass}
              disabled={!canManageCustomers}
              min="0"
              type="number"
              value={creditLimit}
              onChange={(event) => setCreditLimit(event.target.value)}
            />
          </FormField>
          <Button
            className="w-full"
            disabled={!canManageCustomers || !name.trim() || !phone.trim() || createCustomer.isPending}
            icon={createCustomer.isPending ? <Loader2 className="animate-spin" size={17} /> : <Plus size={17} />}
            type="submit"
          >
            Add customer
          </Button>
        </form>
      </ActionModal>
    </div>
  );
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
