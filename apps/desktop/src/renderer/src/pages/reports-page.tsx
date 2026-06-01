import { Card } from '@restaurantos/ui';

export function ReportsPage() {
  return (
    <div className="h-full overflow-y-auto p-7">
      <p className="text-sm font-black uppercase tracking-[0.28em] text-subtle">Insights</p>
      <h1 className="mt-2 text-4xl font-black">Reports</h1>
      <Card className="mt-7 p-6">
        <p className="font-semibold text-subtle">
          Sales, stock, purchase, credit, supplier payable, shift, and profit estimate reports.
        </p>
      </Card>
    </div>
  );
}
