import { Card } from '@restaurantos/ui';

export function MenuPage() {
  return (
    <div className="p-7">
      <h1 className="text-3xl font-black">Menu management</h1>
      <Card className="mt-6 p-6">
        <p className="font-semibold text-stone-600">
          Category, item, variation, modifier, add-on, and recipe builder workflows will live here.
        </p>
      </Card>
    </div>
  );
}
