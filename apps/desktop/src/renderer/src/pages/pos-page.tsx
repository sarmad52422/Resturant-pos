import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Button, Card } from '@restaurantos/ui';
import {
  Keyboard,
  Minus,
  Plus,
  Printer,
  Search,
  Send,
  Sparkles,
  Table2,
  Trash2,
  WalletCards,
} from 'lucide-react';
import { usePosStore } from '../store/use-pos-store';

const categories = ['All', 'Burgers', 'Pizza', 'Juice', 'Coffee', 'Deals', 'Sides'];
const menuItems = [
  { id: 'zinger', name: 'Zinger Burger', station: 'Burger', price: 620 },
  { id: 'double-cheese', name: 'Double Cheese Layer', station: 'Burger', price: 860 },
  { id: 'mango-juice', name: 'Mango Juice 500ml', station: 'Juice', price: 280 },
  { id: 'pepperoni', name: 'Pepperoni Pizza', station: 'Pizza', price: 1450 },
  { id: 'fries', name: 'Loaded Fries', station: 'Packing', price: 490 },
  { id: 'latte', name: 'Spanish Latte', station: 'Coffee', price: 540 },
];

export function PosPage() {
  const { cart, addLine, removeLine, orderType, setOrderType } = usePosStore();
  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  );

  return (
    <div className="grid h-full grid-cols-[1fr_430px] gap-5 overflow-hidden bg-white p-5">
      <section className="flex min-w-0 flex-col overflow-hidden rounded-[28px] bg-white px-6 py-5 shadow-[0_28px_70px_rgb(var(--ro-secondary-rgb)/0.08)]">
        <header className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.28em] text-subtle">
              Cashier terminal
            </p>
            <h1 className="mt-1 text-4xl font-black text-espresso">Build order</h1>
          </div>
          <div className="flex rounded-2xl bg-sage p-1 shadow-sm">
            {(['DINE_IN', 'TAKEAWAY', 'DELIVERY'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setOrderType(type)}
                className={[
                  'h-10 rounded-xl px-4 text-sm font-bold transition',
                  orderType === type
                    ? 'bg-secondary text-white shadow-sm'
                    : 'text-muted hover:bg-white',
                ].join(' ')}
              >
                {type.replace('_', ' ')}
              </button>
            ))}
          </div>
        </header>

        <div className="mb-5 grid grid-cols-[1fr_220px] gap-4">
          <div className="flex h-14 items-center gap-3 rounded-2xl bg-white px-4 shadow-[0_16px_42px_rgb(var(--ro-secondary-rgb)/0.06)]">
            <Search size={22} className="text-primary" />
            <input
              className="h-full flex-1 bg-transparent text-lg font-semibold outline-none placeholder:text-subtle"
              placeholder="Search item, SKU, category..."
            />
            <Badge tone="orange">F2</Badge>
          </div>
          <div className="flex h-14 items-center gap-3 rounded-2xl bg-secondary px-4 text-white shadow-[0_18px_44px_rgb(var(--ro-secondary-rgb)/0.2)]">
            <Sparkles size={20} className="text-white" />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-deepSoft">Rush mode</p>
              <p className="text-sm font-black">Keyboard ready</p>
            </div>
          </div>
        </div>

        <div className="mb-5 flex gap-2">
          {categories.map((category, index) => (
            <button
              key={category}
              className={[
                'h-11 rounded-xl px-4 text-sm font-bold transition',
                index === 0
                  ? 'bg-primary text-white shadow-[0_10px_22px_rgb(var(--ro-primary-rgb)/0.24)]'
                  : 'bg-white text-muted shadow-[inset_0_0_0_1px_rgb(var(--ro-secondary-rgb)/0.08)] hover:bg-sage hover:text-secondary',
              ].join(' ')}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="grid flex-1 auto-rows-[168px] grid-cols-3 gap-4 overflow-y-auto pb-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => addLine({ id: item.id, name: item.name, price: item.price, quantity: 1 })}
              className="group rounded-2xl bg-white p-4 text-left shadow-[0_14px_38px_rgb(var(--ro-secondary-rgb)/0.07)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_48px_rgb(var(--ro-secondary-rgb)/0.12)]"
            >
              <div className="flex h-full flex-col justify-between">
                <Badge tone="blue">{item.station}</Badge>
                <div>
                  <h3 className="text-lg font-black text-espresso">{item.name}</h3>
                  <div className="mt-3 flex items-end justify-between">
                    <p className="text-2xl font-black text-secondary">Rs {item.price}</p>
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

      <aside className="flex min-h-0 flex-col rounded-[28px] bg-white px-5 py-5 shadow-[0_28px_70px_rgb(var(--ro-secondary-rgb)/0.11)]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-subtle">Ticket</p>
            <h2 className="mt-1 text-2xl font-black">Order #Draft</h2>
          </div>
          <Badge tone="orange">Shift open</Badge>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {cart.length === 0 ? (
            <Card className="flex h-44 items-center justify-center bg-white p-6 text-center text-sm font-semibold text-muted shadow-[inset_0_0_0_1px_rgb(var(--ro-secondary-rgb)/0.08)]">
              Add menu items to start a clean, fast cashier order.
            </Card>
          ) : (
            cart.map((line) => (
              <Card key={line.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black">{line.name}</h3>
                    <p className="text-sm font-semibold text-muted">Rs {line.price} each</p>
                  </div>
                  <button
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-subtle hover:bg-red-50 hover:text-red-600"
                    onClick={() => removeLine(line.id)}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center rounded-xl bg-sage">
                    <button className="flex h-9 w-9 items-center justify-center text-label">
                      <Minus size={16} />
                    </button>
                    <span className="w-10 text-center font-black">{line.quantity}</span>
                    <button className="flex h-9 w-9 items-center justify-center text-primary">
                      <Plus size={16} />
                    </button>
                  </div>
                  <strong className="text-lg">Rs {line.price * line.quantity}</strong>
                </div>
              </Card>
            ))
          )}
        </div>

        <Card className="mt-4 bg-sage p-4 shadow-none">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-black text-secondary">
              <Keyboard size={17} />
              Shortcut card
            </div>
            <Link
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-white px-3 text-xs font-black text-secondary shadow-[inset_0_0_0_1px_rgb(var(--ro-secondary-rgb)/0.08)] hover:bg-mint"
              to="/tables"
            >
              <Table2 size={15} />
              F10
            </Link>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold text-muted">
            <span>F2 Search</span>
            <span>F5 Kitchen</span>
            <span>F7 Payment</span>
            <span>F10 Tables</span>
            <span>Ctrl+Shift+F Max</span>
            <span>Ctrl+Shift+M Min</span>
            <span>Ctrl+Shift+Q Close</span>
          </div>
        </Card>

        <div className="mt-4 rounded-2xl bg-secondary p-4 text-white">
          <div className="flex justify-between text-sm font-bold text-deepSoft">
            <span>Subtotal</span>
            <span>Rs {total}</span>
          </div>
          <div className="mt-2 flex justify-between text-sm font-bold text-deepSoft">
            <span>Tax / service</span>
            <span>Configured</span>
          </div>
          <div className="mt-4 flex justify-between border-t border-divider pt-4 text-2xl font-black">
            <span>Total</span>
            <span className="text-white">Rs {total}</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button variant="secondary" icon={<Printer size={18} />}>
            Print
          </Button>
          <Button variant="secondary" icon={<Send size={18} />}>
            Kitchen
          </Button>
          <Button className="col-span-2 h-14 text-base" icon={<WalletCards size={20} />}>
            Payment F7
          </Button>
        </div>
      </aside>
    </div>
  );
}
