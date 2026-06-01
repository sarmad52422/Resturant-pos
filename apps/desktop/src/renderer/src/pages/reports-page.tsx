import { Card } from '@restaurantos/ui';

export function ReportsPage() {
  return (
    <div className="p-7">
      <h1 className="text-3xl font-black">Reports</h1>
      <Card className="mt-6 p-6">
        <p className="font-semibold text-stone-600">
          Sales, stock, purchase, credit, supplier payable, shift, and profit estimate reports.
        </p>
      </Card>
    </div>
  );
}
