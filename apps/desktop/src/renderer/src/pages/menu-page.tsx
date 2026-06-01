import { Card } from '@restaurantos/ui';

export function MenuPage() {
  return (
    <div className="h-full overflow-y-auto p-7">
      <p className="text-sm font-black uppercase tracking-[0.28em] text-subtle">Admin workspace</p>
      <h1 className="mt-2 text-4xl font-black">Menu studio</h1>
      <div className="mt-7 grid grid-cols-[1fr_340px] gap-5">
        <Card className="min-h-80 p-6">
          <h2 className="text-xl font-black">Catalog builder</h2>
          <p className="mt-3 max-w-2xl font-semibold text-subtle">
            Category, item, variation, modifier, add-on, and recipe builder workflows will live here.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3">
            {['Categories', 'Items', 'Recipes'].map((item) => (
              <div key={item} className="rounded-2xl bg-sage p-4">
                <p className="text-sm font-black text-secondary">{item}</p>
                <p className="mt-5 text-2xl font-black">0</p>
              </div>
            ))}
          </div>
        </Card>
        <Card className="bg-primary p-6 text-white">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-deepFaint">Recipe cost</p>
          <h2 className="mt-5 text-3xl font-black">Exact BOM</h2>
          <p className="mt-3 font-semibold text-mint">
            Every item can map to stock by unit so inventory deduction stays precise.
          </p>
        </Card>
      </div>
    </div>
  );
}
