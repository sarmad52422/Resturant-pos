import { Armchair, Clock3 } from 'lucide-react';
import { Badge, Button } from '@restaurantos/ui';

export type TableStatus =
  | 'FREE'
  | 'OCCUPIED'
  | 'RESERVED'
  | 'WAITING_FOR_ORDER'
  | 'SENT_TO_KITCHEN'
  | 'PREPARING'
  | 'READY'
  | 'SERVED'
  | 'BILL_REQUESTED'
  | 'PAYMENT_PENDING'
  | 'CLEANING_REQUIRED';

export interface CurrentOrder {
  id: string;
  orderNumber: string;
  status: string;
  grandTotal: string;
  createdAt: string;
  items: unknown[];
}

export interface RestaurantTable {
  id: string;
  active: boolean;
  area?: string;
  capacity: number;
  currentOrder?: CurrentOrder | null;
  displayOrder: number;
  name: string;
  status: TableStatus;
}

interface TableCardProps {
  canCreateOrder: boolean;
  canManageTables: boolean;
  loading: boolean;
  onStartOrder: () => void;
  onStatus: (status: TableStatus) => void;
  table: RestaurantTable;
}

const statusLabels: Record<TableStatus, string> = {
  FREE: 'Free',
  OCCUPIED: 'Occupied',
  RESERVED: 'Reserved',
  WAITING_FOR_ORDER: 'Waiting',
  SENT_TO_KITCHEN: 'Kitchen',
  PREPARING: 'Preparing',
  READY: 'Ready',
  SERVED: 'Served',
  BILL_REQUESTED: 'Bill',
  PAYMENT_PENDING: 'Payment',
  CLEANING_REQUIRED: 'Cleaning',
};

const busyStatuses = new Set<TableStatus>([
  'OCCUPIED',
  'WAITING_FOR_ORDER',
  'SENT_TO_KITCHEN',
  'PREPARING',
  'READY',
  'SERVED',
  'BILL_REQUESTED',
  'PAYMENT_PENDING',
]);

export function TableCard({
  canCreateOrder,
  canManageTables,
  loading,
  onStartOrder,
  onStatus,
  table,
}: TableCardProps) {
  const busy = busyStatuses.has(table.status);
  const canStart = canCreateOrder && !busy && table.status !== 'RESERVED';
  const orderAge = table.currentOrder ? formatOrderAge(table.currentOrder.createdAt) : null;

  return (
    <div
      className={[
        'group relative min-h-[306px] overflow-hidden rounded-2xl border p-4 shadow-[0_18px_46px_rgb(var(--ro-secondary-rgb)/0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_56px_rgb(var(--ro-secondary-rgb)/0.12)]',
        statusSurface(table.status),
        statusBorder(table.status),
      ].join(' ')}
    >
      <div className={`absolute inset-x-0 top-0 h-1.5 ${statusBar(table.status)}`} />

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-muted">{table.area ?? 'Main Floor'}</p>
          <h3 className="mt-2 text-3xl font-black text-espresso">{table.name}</h3>
        </div>
        <Badge tone={statusTone(table.status)}>{statusLabels[table.status]}</Badge>
      </div>

      <TableVisual capacity={table.capacity} status={table.status} />

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-black">
        <div className="rounded-xl bg-white/80 px-3 py-2 text-label shadow-[inset_0_0_0_1px_rgb(var(--ro-secondary-rgb)/0.06)]">
          <span className="block text-[10px] uppercase tracking-[0.16em] text-muted">Covers</span>
          {table.capacity}
        </div>
        <div className="rounded-xl bg-white/80 px-3 py-2 text-label shadow-[inset_0_0_0_1px_rgb(var(--ro-secondary-rgb)/0.06)]">
          <span className="block text-[10px] uppercase tracking-[0.16em] text-muted">Order</span>
          {table.currentOrder?.orderNumber ?? 'None'}
        </div>
      </div>

      {orderAge ? (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2 text-xs font-black text-secondary shadow-[inset_0_0_0_1px_rgb(var(--ro-secondary-rgb)/0.06)]">
          <Clock3 size={14} />
          Open for {orderAge}
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button
          className="h-10 px-2"
          disabled={!canStart || loading}
          variant={canStart ? 'primary' : 'secondary'}
          onClick={onStartOrder}
        >
          Start
        </Button>
        <Button
          className="h-10 px-2"
          disabled={!canManageTables || loading}
          variant="secondary"
          onClick={() => onStatus(table.status === 'CLEANING_REQUIRED' ? 'FREE' : 'CLEANING_REQUIRED')}
        >
          Clean
        </Button>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          className="h-8 rounded-lg bg-white text-xs font-black text-secondary shadow-[inset_0_0_0_1px_rgb(var(--ro-secondary-rgb)/0.08)] transition hover:bg-mint disabled:opacity-50"
          disabled={!canManageTables || loading}
          onClick={() => onStatus('FREE')}
        >
          Free
        </button>
        <button
          className="h-8 rounded-lg bg-white text-xs font-black text-secondary shadow-[inset_0_0_0_1px_rgb(var(--ro-secondary-rgb)/0.08)] transition hover:bg-mint disabled:opacity-50"
          disabled={!canManageTables || loading}
          onClick={() => onStatus('RESERVED')}
        >
          Reserve
        </button>
      </div>
    </div>
  );
}

function TableVisual({ capacity, status }: { capacity: number; status: TableStatus }) {
  const chairCount = Math.min(Math.max(capacity, 2), 8);
  const chairs = Array.from({ length: chairCount });
  const rectangular = capacity >= 5;

  return (
    <div className="relative mx-auto mt-5 h-32 w-44">
      {chairs.map((_, index) => (
        <ChairSvg
          key={index}
          className={[
            'absolute h-9 w-9 drop-shadow-sm',
            chairTone(status),
            chairPosition(index, chairCount),
          ].join(' ')}
          strokeClassName={chairStroke(status)}
        />
      ))}
      <div
        className={[
          'absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center border-2 text-lg font-black shadow-[0_18px_42px_rgb(var(--ro-secondary-rgb)/0.14)]',
          rectangular ? 'h-[72px] w-28 rounded-2xl' : 'h-24 w-24 rounded-full',
          tableTopColor(status),
        ].join(' ')}
      >
        <Armchair size={26} />
      </div>
    </div>
  );
}

function ChairSvg({ className, strokeClassName }: { className: string; strokeClassName: string }) {
  return (
    <svg className={className} viewBox="0 0 36 36" aria-hidden="true" fill="none">
      <path
        d="M10 8.5C10 5.46 12.46 3 15.5 3h5C23.54 3 26 5.46 26 8.5V17H10V8.5Z"
        fill="currentColor"
        opacity="0.95"
      />
      <path
        d="M7 18.5C7 16.57 8.57 15 10.5 15h15c1.93 0 3.5 1.57 3.5 3.5V23H7v-4.5Z"
        fill="currentColor"
      />
      <path d="M9 23h3v8H9v-8ZM24 23h3v8h-3v-8Z" fill="currentColor" opacity="0.72" />
      <path
        d="M10 8.5C10 5.46 12.46 3 15.5 3h5C23.54 3 26 5.46 26 8.5V17H10V8.5ZM7 23h22"
        className={strokeClassName}
        strokeWidth="1.5"
      />
    </svg>
  );
}

function statusTone(status: TableStatus): 'green' | 'orange' | 'blue' | 'red' | 'gray' {
  if (status === 'FREE') return 'green';
  if (status === 'RESERVED') return 'blue';
  if (status === 'CLEANING_REQUIRED') return 'red';
  if (status === 'PAYMENT_PENDING' || status === 'BILL_REQUESTED') return 'orange';
  return 'gray';
}

function statusSurface(status: TableStatus) {
  if (status === 'FREE') return 'bg-white';
  if (status === 'RESERVED') return 'bg-sky-50';
  if (status === 'CLEANING_REQUIRED') return 'bg-red-50';
  if (status === 'PAYMENT_PENDING' || status === 'BILL_REQUESTED') return 'bg-mint';
  return 'bg-sage';
}

function statusBorder(status: TableStatus) {
  if (status === 'FREE') return 'border-successRing';
  if (status === 'RESERVED') return 'border-sky-200';
  if (status === 'CLEANING_REQUIRED') return 'border-red-200';
  if (status === 'PAYMENT_PENDING' || status === 'BILL_REQUESTED') return 'border-accentSoft';
  return 'border-line';
}

function statusBar(status: TableStatus) {
  if (status === 'FREE') return 'bg-primary';
  if (status === 'RESERVED') return 'bg-sky-500';
  if (status === 'CLEANING_REQUIRED') return 'bg-red-500';
  if (status === 'PAYMENT_PENDING' || status === 'BILL_REQUESTED') return 'bg-amber-500';
  return 'bg-secondary';
}

function tableTopColor(status: TableStatus) {
  if (status === 'FREE') return 'border-primary bg-white text-secondary';
  if (status === 'RESERVED') return 'border-sky-500 bg-white text-sky-700';
  if (status === 'CLEANING_REQUIRED') return 'border-red-500 bg-white text-red-700';
  if (status === 'PAYMENT_PENDING' || status === 'BILL_REQUESTED') {
    return 'border-amber-500 bg-white text-amber-700';
  }
  return 'border-secondary bg-secondary text-white';
}

function chairTone(status: TableStatus) {
  if (status === 'FREE') return 'text-successRing';
  if (status === 'RESERVED') return 'text-sky-200';
  if (status === 'CLEANING_REQUIRED') return 'text-red-200';
  if (status === 'PAYMENT_PENDING' || status === 'BILL_REQUESTED') return 'text-amber-200';
  return 'text-deepSoft';
}

function chairStroke(_status: TableStatus) {
  return 'stroke-secondary/30';
}

function chairPosition(index: number, count: number) {
  if (count <= 2) return ['left-1/2 -top-4 -translate-x-1/2', '-bottom-4 left-1/2 -translate-x-1/2 rotate-180'][index];

  const positions = [
    'left-1/2 -top-4 -translate-x-1/2',
    '-bottom-4 left-1/2 -translate-x-1/2 rotate-180',
    'left-1 top-1/2 -translate-y-1/2 -rotate-90',
    'right-1 top-1/2 -translate-y-1/2 rotate-90',
    'left-7 -top-4',
    'right-7 -top-4',
    '-bottom-4 left-7 rotate-180',
    '-bottom-4 right-7 rotate-180',
  ];

  if (count <= 4) return positions[index];
  return positions[index] ?? positions[0];
}

function formatOrderAge(createdAt: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - Date.parse(createdAt)) / 60_000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}
