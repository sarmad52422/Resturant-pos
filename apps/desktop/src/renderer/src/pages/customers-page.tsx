import { Card } from '@restaurantos/ui';

export function CustomersPage() {
  return (
    <div className="h-full overflow-y-auto p-7">
      <p className="text-sm font-black uppercase tracking-[0.28em] text-[#7a7f73]">Ledger care</p>
      <h1 className="mt-2 text-4xl font-black">Customer credit</h1>
      <Card className="mt-7 p-6">
        <p className="font-semibold text-[#697064]">
          Customer profiles, credit limits, balances, and ledger payments.
        </p>
      </Card>
    </div>
  );
}
