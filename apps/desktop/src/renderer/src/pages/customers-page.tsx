import { Card } from '@restaurantos/ui';

export function CustomersPage() {
  return (
    <div className="p-7">
      <h1 className="text-3xl font-black">Customer credit</h1>
      <Card className="mt-6 p-6">
        <p className="font-semibold text-stone-600">
          Customer profiles, credit limits, balances, and ledger payments.
        </p>
      </Card>
    </div>
  );
}
