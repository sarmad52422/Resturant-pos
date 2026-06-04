import { Badge, Button } from '@restaurantos/ui';
import { Loader2, Plus, Search, UserRound, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { FormField } from '@/components/form-field';
import type { FormSubmitEvent } from '@/lib/events';
import { money } from './formatting';
import type { PosCustomer } from './interfaces';

interface CustomerSelectorProps {
  customers: PosCustomer[];
  errorMessage?: string;
  loading: boolean;
  pending: boolean;
  selectedCustomer?: PosCustomer;
  onClear: () => void;
  onCreate: (input: { creditLimit: number; name: string; phone: string }) => void;
  onSelect: (customer: PosCustomer) => void;
}

const fieldClass =
  'h-10 w-full rounded-xl border border-field bg-white px-3 text-sm font-semibold text-espresso outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10';

export function CustomerSelector({
  customers,
  errorMessage,
  loading,
  pending,
  selectedCustomer,
  onClear,
  onCreate,
  onSelect,
}: CustomerSelectorProps) {
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [creditLimit, setCreditLimit] = useState('0');

  const matches = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return customers.slice(0, 5);
    return customers
      .filter((customer) => (
        customer.name.toLowerCase().includes(query) ||
        customer.phone.toLowerCase().includes(query)
      ))
      .slice(0, 5);
  }, [customers, search]);

  function submitCustomer(event: FormSubmitEvent) {
    event.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    onCreate({ creditLimit: Number(creditLimit || 0), name: name.trim(), phone: phone.trim() });
    setName('');
    setPhone('');
    setCreditLimit('0');
    setSearch('');
  }

  return (
    <div className="rounded-2xl border border-line bg-sage p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-muted">Customer</p>
          <p className="mt-1 text-sm font-bold text-label">Search by phone or name.</p>
        </div>
        {loading ? <Loader2 className="animate-spin text-primary" size={18} /> : null}
      </div>

      {selectedCustomer ? (
        <div className="rounded-2xl bg-white p-4 shadow-[inset_0_0_0_1px_rgb(var(--ro-secondary-rgb)/0.08)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-espresso">{selectedCustomer.name}</h3>
              <p className="mt-1 text-sm font-bold text-muted">{selectedCustomer.phone}</p>
            </div>
            <button className="rounded-xl p-2 text-muted hover:bg-mint hover:text-secondary" type="button" onClick={onClear}>
              <X size={16} />
            </button>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs font-black">
            <Info label="Owes" value={money.format(Number(selectedCustomer.currentBalance || 0))} />
            <Info label="Limit" value={money.format(Number(selectedCustomer.creditLimit || 0))} />
            <Info label="Orders" value={String(selectedCustomer.totalOrders || selectedCustomer._count?.orders || 0)} />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <label className="flex h-11 items-center gap-2 rounded-xl bg-white px-3 shadow-[inset_0_0_0_1px_rgb(var(--ro-secondary-rgb)/0.08)]">
            <Search size={16} className="text-primary" />
            <input
              className="h-full flex-1 bg-transparent text-sm font-semibold outline-none"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          {matches.length ? (
            <div className="grid gap-2">
              {matches.map((customer) => (
                <button
                  key={customer.id}
                  className="rounded-xl bg-white px-3 py-2 text-left shadow-[inset_0_0_0_1px_rgb(var(--ro-secondary-rgb)/0.08)] hover:bg-mint"
                  type="button"
                  onClick={() => onSelect(customer)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-black text-espresso">{customer.name}</span>
                    <Badge tone={Number(customer.currentBalance) > 0 ? 'orange' : 'green'}>
                      {money.format(Number(customer.currentBalance || 0))}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs font-bold text-muted">{customer.phone}</p>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      )}

      {!selectedCustomer ? (
        <form className="mt-4 grid grid-cols-[1fr_140px] gap-3" onSubmit={submitCustomer}>
          <FormField label="New customer name">
            <input className={fieldClass} value={name} onChange={(event) => setName(event.target.value)} />
          </FormField>
          <FormField label="Phone">
            <input className={fieldClass} value={phone} onChange={(event) => setPhone(event.target.value)} />
          </FormField>
          <FormField label="Credit limit">
            <input className={fieldClass} min="0" type="number" value={creditLimit} onChange={(event) => setCreditLimit(event.target.value)} />
          </FormField>
          <Button className="mt-6 h-10" disabled={pending || !name.trim() || !phone.trim()} icon={pending ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />} type="submit">
            Add
          </Button>
        </form>
      ) : null}

      {errorMessage ? <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{errorMessage}</p> : null}
      {!selectedCustomer ? (
        <p className="mt-3 flex items-center gap-2 text-xs font-bold text-muted">
          <UserRound size={14} />
          Phone is the customer business key; the system keeps an internal id for safe order links.
        </p>
      ) : null}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-sage px-3 py-2">
      <span className="block text-[10px] uppercase tracking-[0.14em] text-muted">{label}</span>
      <span className="text-label">{value}</span>
    </div>
  );
}
