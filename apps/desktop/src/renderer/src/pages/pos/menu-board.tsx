import { Badge, Card } from '@restaurantos/ui';
import { AlertCircle, Loader2, Plus, Search, Sparkles } from 'lucide-react';
import type { RefObject } from 'react';
import type { OrderType } from '@/store/use-pos-store';
import { money } from './formatting';
import type { PosCategory, PosMenuItem } from './interfaces';

interface MenuBoardProps {
  catalogError: boolean;
  catalogLoading: boolean;
  categories: PosCategory[];
  filteredItems: PosMenuItem[];
  orderType: OrderType;
  searchInputRef: RefObject<HTMLInputElement | null>;
  searchText: string;
  selectedCategoryId: string;
  onAddItem: (item: PosMenuItem) => void;
  onCategoryChange: (categoryId: string) => void;
  onOrderTypeChange: (type: OrderType) => void;
  onSearchChange: (value: string) => void;
}

export function MenuBoard({
  catalogError,
  catalogLoading,
  categories,
  filteredItems,
  orderType,
  searchInputRef,
  searchText,
  selectedCategoryId,
  onAddItem,
  onCategoryChange,
  onOrderTypeChange,
  onSearchChange,
}: MenuBoardProps) {
  return (
    <section className="flex min-w-0 flex-col overflow-hidden rounded-[28px] bg-white px-6 py-5 shadow-[0_28px_70px_rgb(var(--ro-secondary-rgb)/0.08)]">
      <header className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.28em] text-subtle">Cashier terminal</p>
          <h1 className="mt-1 text-4xl font-black text-espresso">Build order</h1>
        </div>
        <div className="flex rounded-2xl bg-sage p-1 shadow-sm">
          {(['DINE_IN', 'TAKEAWAY', 'DELIVERY'] as const).map((type) => (
            <button
              key={type}
              className={[
                'h-10 rounded-xl px-4 text-sm font-bold transition',
                orderType === type ? 'bg-secondary text-white shadow-sm' : 'text-muted hover:bg-white',
              ].join(' ')}
              onClick={() => onOrderTypeChange(type)}
            >
              {type === 'DINE_IN' ? 'Dine in' : type === 'TAKEAWAY' ? 'Takeaway' : 'Delivery'}
            </button>
          ))}
        </div>
      </header>

      <div className="mb-5 grid grid-cols-[1fr_220px] gap-4">
        <label className="rounded-2xl bg-white px-4 py-2 shadow-[0_16px_42px_rgb(var(--ro-secondary-rgb)/0.06)]">
          <span className="block text-xs font-black uppercase tracking-[0.12em] text-muted">Find item</span>
          <div className="mt-1 flex h-8 items-center gap-3">
            <Search size={22} className="text-primary" />
            <input
              ref={searchInputRef}
              className="h-full flex-1 bg-transparent text-lg font-semibold outline-none"
              value={searchText}
              onChange={(event) => onSearchChange(event.target.value)}
            />
            <Badge tone="orange">F2</Badge>
          </div>
        </label>
        <div className="flex h-14 items-center gap-3 rounded-2xl bg-secondary px-4 text-white shadow-[0_18px_44px_rgb(var(--ro-secondary-rgb)/0.2)]">
          <Sparkles size={20} className="text-white" />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-deepSoft">Rush mode</p>
            <p className="text-sm font-black">Keyboard ready</p>
          </div>
        </div>
      </div>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        <CategoryButton active={selectedCategoryId === 'all'} label="All" onClick={() => onCategoryChange('all')} />
        {categories.map((category) => (
          <CategoryButton
            key={category.id}
            active={selectedCategoryId === category.id}
            label={category.name}
            onClick={() => onCategoryChange(category.id)}
          />
        ))}
      </div>

      {catalogError ? (
        <div className="flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          <AlertCircle size={17} />
          Menu could not load. Check the API connection.
        </div>
      ) : null}

      <div className="grid flex-1 auto-rows-[168px] grid-cols-3 gap-4 overflow-y-auto pb-2">
        {catalogLoading ? (
          <Card className="col-span-3 flex items-center justify-center gap-3 p-6 text-sm font-bold text-muted">
            <Loader2 className="animate-spin text-primary" size={18} />
            Loading menu
          </Card>
        ) : null}
        {filteredItems.map((item, index) => (
          <button
            key={item.id}
            className="group relative rounded-2xl bg-white p-4 text-left shadow-[0_14px_38px_rgb(var(--ro-secondary-rgb)/0.07)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_48px_rgb(var(--ro-secondary-rgb)/0.12)]"
            onClick={() => onAddItem(item)}
          >
            {index < 9 ? (
              <span className="absolute right-3 top-3 flex h-7 min-w-7 items-center justify-center rounded-lg bg-secondary px-2 text-xs font-black text-white">
                {index + 1}
              </span>
            ) : null}
            <div className="flex h-full flex-col justify-between">
              <Badge tone="blue">{item.kitchenStation?.name ?? item.category.name}</Badge>
              <div>
                <h3 className="text-lg font-black text-espresso">{item.shortName || item.name}</h3>
                <div className="mt-3 flex items-end justify-between">
                  <p className="text-2xl font-black text-secondary">{money.format(Number(item.basePrice))}</p>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white transition group-hover:scale-105">
                    <Plus size={18} />
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

function CategoryButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      className={[
        'h-11 shrink-0 rounded-xl px-4 text-sm font-bold transition',
        active
          ? 'bg-primary text-white shadow-[0_10px_22px_rgb(var(--ro-primary-rgb)/0.24)]'
          : 'bg-white text-muted shadow-[inset_0_0_0_1px_rgb(var(--ro-secondary-rgb)/0.08)] hover:bg-sage hover:text-secondary',
      ].join(' ')}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
