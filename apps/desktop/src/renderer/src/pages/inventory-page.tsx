import { Card } from '@restaurantos/ui';

export function InventoryPage() {
  return (
    <div className="h-full overflow-y-auto p-7">
      <p className="text-sm font-black uppercase tracking-[0.28em] text-[#7a7f73]">Stock control</p>
      <h1 className="mt-2 text-4xl font-black">Inventory</h1>
      <Card className="mt-7 p-6">
        <p className="font-semibold text-[#697064]">
          Units, stock batches, purchases, wastage, and transaction-safe stock movement screens.
        </p>
      </Card>
    </div>
  );
}
