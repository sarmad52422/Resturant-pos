import { Badge, Button, Card } from '@restaurantos/ui';
import { Loader2, Printer, Search, XCircle } from 'lucide-react';
import { money } from '../pos/formatting';
import type { OrderStatus, OrderView } from './interfaces';

interface OrdersToolbarProps {
  dateScope: 'today' | 'all';
  search: string;
  status: OrderStatus | 'ALL';
  onDateScopeChange: (value: 'today' | 'all') => void;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: OrderStatus | 'ALL') => void;
}

const fieldClass =
  'h-11 rounded-xl border border-field bg-white px-3 text-sm font-semibold text-espresso outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10';

export const statusOptions: Array<OrderStatus | 'ALL'> = [
  'ALL',
  'DRAFT',
  'SENT_TO_KITCHEN',
  'PAYMENT_PENDING',
  'COMPLETED',
  'CANCELLED',
  'VOIDED',
];

export function OrdersToolbar({
  dateScope,
  search,
  status,
  onDateScopeChange,
  onSearchChange,
  onStatusChange,
}: OrdersToolbarProps) {
  return (
    <Card className="mt-6 grid grid-cols-[1fr_180px_220px] gap-3 p-4">
      <label className="flex h-11 items-center gap-3 rounded-xl border border-field bg-white px-3">
        <Search size={18} className="text-primary" />
        <input
          className="h-full flex-1 bg-transparent text-sm font-semibold text-espresso outline-none"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </label>
      <select className={fieldClass} value={dateScope} onChange={(event) => onDateScopeChange(event.target.value as 'today' | 'all')}>
        <option value="today">Today</option>
        <option value="all">All orders</option>
      </select>
      <select className={fieldClass} value={status} onChange={(event) => onStatusChange(event.target.value as OrderStatus | 'ALL')}>
        {statusOptions.map((option) => (
          <option key={option} value={option}>
            {option === 'ALL' ? 'All statuses' : option.replaceAll('_', ' ')}
          </option>
        ))}
      </select>
    </Card>
  );
}

export function OrdersList({
  loading,
  orders,
  selectedId,
  onSelect,
}: {
  loading: boolean;
  orders: OrderView[];
  selectedId?: string;
  onSelect: (order: OrderView) => void;
}) {
  return (
    <Card className="min-h-0 overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 className="text-lg font-black text-espresso">Order list</h2>
        {loading ? <Loader2 className="animate-spin text-primary" size={18} /> : null}
      </div>
      <div className="max-h-[calc(100vh-310px)] overflow-y-auto">
        {orders.map((order) => (
          <button
            key={order.id}
            className={[
              'block w-full border-b border-line px-5 py-4 text-left transition hover:bg-sage',
              selectedId === order.id ? 'bg-mint' : 'bg-white',
            ].join(' ')}
            onClick={() => onSelect(order)}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-black text-espresso">{order.orderNumber}</p>
                <p className="mt-1 text-xs font-bold text-muted">{new Date(order.createdAt).toLocaleString()}</p>
              </div>
              <Badge tone={statusTone(order.status)}>{order.status.replaceAll('_', ' ')}</Badge>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm font-bold text-label">
              <span>{order.type.replace('_', ' ')} {order.table ? `- ${order.table.name}` : ''}</span>
              <span>{money.format(Number(order.grandTotal))}</span>
            </div>
          </button>
        ))}
        {orders.length === 0 ? <div className="p-6 text-sm font-bold text-muted">No orders found.</div> : null}
      </div>
    </Card>
  );
}

export function OrderDetail({
  canVoid,
  order,
  printing,
  onPrint,
  onVoidItem,
  onVoidOrder,
}: {
  canVoid: boolean;
  order?: OrderView;
  printing: boolean;
  onPrint: () => void;
  onVoidItem: (itemId: string, label: string) => void;
  onVoidOrder: () => void;
}) {
  if (!order) {
    return <Card className="flex min-h-80 items-center justify-center p-6 text-sm font-bold text-muted">Select an order.</Card>;
  }

  const correctionAllowed = canVoid && !['COMPLETED', 'PAID', 'CANCELLED', 'VOIDED', 'REFUNDED'].includes(order.status);

  return (
    <Card className="min-h-0 overflow-hidden">
      <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-primary">Order detail</p>
          <h2 className="mt-2 text-3xl font-black text-espresso">{order.orderNumber}</h2>
          <p className="mt-1 text-sm font-bold text-muted">
            {order.type.replace('_', ' ')} {order.table ? `- ${order.table.name}` : ''} {order.customer ? `- ${order.customer.name}` : ''}
          </p>
        </div>
        <Badge tone={statusTone(order.status)}>{order.status.replaceAll('_', ' ')}</Badge>
      </div>

      <div className="max-h-[calc(100vh-260px)] overflow-y-auto p-6">
        <div className="grid grid-cols-3 gap-3">
          <Metric label="Items" value={order.items.length} />
          <Metric label="Paid" value={money.format(order.payments.reduce((sum, payment) => sum + Number(payment.amount), 0))} />
          <Metric label="Total" value={money.format(Number(order.grandTotal))} />
        </div>

        <div className="mt-5 divide-y divide-line rounded-2xl border border-line">
          {order.items.map((item) => (
            <div key={item.id} className="grid grid-cols-[1fr_90px_120px_44px] items-center gap-3 px-4 py-3">
              <div>
                <p className="font-black text-espresso">{item.menuItem.name}</p>
                <p className="text-xs font-bold text-muted">{item.status}</p>
              </div>
              <p className="text-right text-sm font-black text-label">x {Number(item.quantity)}</p>
              <p className="text-right text-sm font-black text-espresso">{money.format(Number(item.totalPrice))}</p>
              {correctionAllowed && item.status !== 'CANCELLED' ? (
                <button className="flex h-9 w-9 items-center justify-center rounded-xl text-red-600 hover:bg-red-50" onClick={() => onVoidItem(item.id, item.menuItem.name)}>
                  <XCircle size={17} />
                </button>
              ) : null}
            </div>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button disabled={printing} icon={printing ? <Loader2 className="animate-spin" size={17} /> : <Printer size={17} />} variant="secondary" onClick={onPrint}>
            Reprint receipt
          </Button>
          <Button disabled={!correctionAllowed} icon={<XCircle size={17} />} variant="secondary" onClick={onVoidOrder}>
            Void order
          </Button>
        </div>
      </div>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl bg-sage p-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-2 text-xl font-black text-espresso">{value}</p>
    </div>
  );
}

export function statusTone(status: OrderStatus): 'green' | 'orange' | 'blue' | 'red' | 'gray' {
  if (status === 'COMPLETED' || status === 'PAID') return 'green';
  if (status === 'CANCELLED' || status === 'VOIDED' || status === 'REFUNDED') return 'red';
  if (status === 'SENT_TO_KITCHEN' || status === 'PREPARING' || status === 'READY') return 'blue';
  if (status === 'PAYMENT_PENDING') return 'orange';
  return 'gray';
}
