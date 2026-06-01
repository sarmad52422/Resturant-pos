import { Card } from '@restaurantos/ui';

export function InventoryPage() {
  return (
    <div className="p-7">
      <h1 className="text-3xl font-black">Inventory</h1>
      <Card className="mt-6 p-6">
        <p className="font-semibold text-stone-600">
          Units, stock batches, purchases, wastage, and transaction-safe stock movement screens.
        </p>
      </Card>
    </div>
  );
}
