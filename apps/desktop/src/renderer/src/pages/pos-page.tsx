import { useMemo } from 'react';
import { Badge, Button, Card } from '@restaurantos/ui';
import { Minus, Plus, Printer, Search, Send, Trash2, WalletCards } from 'lucide-react';
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
    <div className="grid h-full grid-cols-[1fr_420px] gap-0 overflow-hidden">
      <section className="flex min-w-0 flex-col px-7 py-6">
        <header className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-orange-700">
              Cashier terminal
            </p>
            <h1 className="text-3xl font-black text-espresso">New order</h1>
          </div>
          <div className="flex rounded-lg border border-orange-100 bg-white p-1 shadow-sm">
            {(['DINE_IN', 'TAKEAWAY', 'DELIVERY'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setOrderType(type)}
                className={[
                  'h-10 rounded-md px-4 text-sm font-bold transition',
                  orderType === type ? 'bg-orange-600 text-white' : 'text-stone-600 hover:bg-orange-50',
                ].join(' ')}
              >
                {type.replace('_', ' ')}
              </button>
            ))}
          </div>
        </header>

        <div className="mb-5 flex h-14 items-center gap-3 rounded-lg border border-orange-100 bg-white px-4 shadow-sm">
          <Search size={22} className="text-orange-600" />
          <input
            className="h-full flex-1 bg-transparent text-lg font-semibold outline-none placeholder:text-stone-400"
            placeholder="Search item, SKU, category, shortcut..."
          />
          <Badge tone="orange">F2</Badge>
        </div>

        <div className="mb-5 flex gap-2">
          {categories.map((category, index) => (
            <button
              key={category}
              className={[
                'h-11 rounded-md px-4 text-sm font-bold transition',
                index === 0 ? 'bg-espresso text-white' : 'bg-white text-stone-600 hover:bg-orange-50',
              ].join(' ')}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="grid flex-1 auto-rows-[150px] grid-cols-3 gap-4 overflow-y-auto pb-6">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => addLine({ id: item.id, name: item.name, price: item.price, quantity: 1 })}
              className="group rounded-lg border border-orange-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md"
            >
              <div className="flex h-full flex-col justify-between">
                <Badge tone="blue">{item.station}</Badge>
                <div>
                  <h3 className="text-lg font-black text-espresso">{item.name}</h3>
                  <p className="mt-1 text-2xl font-black text-orange-600">Rs {item.price}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <aside className="flex min-h-0 flex-col border-l border-orange-100 bg-white px-5 py-6 shadow-[-12px_0_36px_rgba(120,72,24,0.08)]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-stone-500">Ticket</p>
            <h2 className="text-2xl font-black">Order #Draft</h2>
          </div>
          <Badge tone="orange">Shift open</Badge>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {cart.length === 0 ? (
            <Card className="flex h-56 items-center justify-center p-6 text-center text-sm font-semibold text-stone-500">
              Add menu items to start a keyboard-friendly order.
            </Card>
          ) : (
            cart.map((line) => (
              <Card key={line.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black">{line.name}</h3>
                    <p className="text-sm font-semibold text-stone-500">Rs {line.price} each</p>
                  </div>
                  <button
                    className="flex h-9 w-9 items-center justify-center rounded-md text-stone-400 hover:bg-red-50 hover:text-red-600"
                    onClick={() => removeLine(line.id)}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center rounded-md border border-orange-100">
                    <button className="flex h-9 w-9 items-center justify-center text-stone-500">
                      <Minus size={16} />
                    </button>
                    <span className="w-10 text-center font-black">{line.quantity}</span>
                    <button className="flex h-9 w-9 items-center justify-center text-orange-600">
                      <Plus size={16} />
                    </button>
                  </div>
                  <strong className="text-lg">Rs {line.price * line.quantity}</strong>
                </div>
              </Card>
            ))
          )}
        </div>

        <div className="mt-5 rounded-lg bg-cream p-4">
          <div className="flex justify-between text-sm font-bold text-stone-600">
            <span>Subtotal</span>
            <span>Rs {total}</span>
          </div>
          <div className="mt-2 flex justify-between text-sm font-bold text-stone-600">
            <span>Tax / service</span>
            <span>Configured</span>
          </div>
          <div className="mt-4 flex justify-between border-t border-orange-200 pt-4 text-2xl font-black">
            <span>Total</span>
            <span>Rs {total}</span>
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
