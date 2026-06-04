import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClipboardList } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Badge, Card } from '@restaurantos/ui';
import { CorrectionModal } from '@/pages/pos/components';
import { buildReceiptHtml } from '@/pages/pos/receipt';
import type { FormSubmitEvent } from '@/lib/events';
import { ordersService } from '@/services/orders-service';
import { useAuthStore } from '@/store/use-auth-store';
import { OrderDetail, OrdersList, OrdersToolbar } from './components';
import type { OrderStatus, OrderView } from './interfaces';

type CorrectionTarget =
  | { type: 'order'; label: string }
  | { type: 'item'; itemId: string; label: string };

export function OrdersPage() {
  const queryClient = useQueryClient();
  const canVoidOrders = useAuthStore((state) => state.hasPermission('order.void'));
  const [dateScope, setDateScope] = useState<'today' | 'all'>('today');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<OrderStatus | 'ALL'>('ALL');
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [correctionTarget, setCorrectionTarget] = useState<CorrectionTarget | undefined>();
  const [correctionReason, setCorrectionReason] = useState('');

  const ordersQuery = useQuery({
    queryKey: ['orders-history', dateScope, search, status],
    queryFn: () => ordersService.list({ dateScope, search, status }),
  });

  const selectedOrderQuery = useQuery({
    enabled: Boolean(selectedId),
    queryKey: ['orders-detail', selectedId],
    queryFn: () => ordersService.detail(selectedId ?? ''),
  });

  const selectedOrder = selectedOrderQuery.data;
  const orders = ordersQuery.data?.orders ?? [];

  useEffect(() => {
    if (!selectedId && orders[0]) setSelectedId(orders[0].id);
  }, [orders, selectedId]);

  const reprintReceipt = useMutation({
    mutationFn: async () => {
      if (!selectedOrder) return undefined;
      const lines = selectedOrder.items
        .filter((item) => item.status !== 'CANCELLED')
        .map((item) => ({
          id: item.menuItemId,
          name: item.menuItem.name,
          price: Number(item.unitPrice),
          quantity: Number(item.quantity),
        }));
      return window.restaurantos.printers.printReceipt({
        html: buildReceiptHtml(selectedOrder, lines, Number(selectedOrder.grandTotal)),
      });
    },
  });

  const voidOrder = useMutation({
    mutationFn: () => ordersService.voidOrder(selectedOrder?.id ?? '', correctionReason.trim()),
    onSuccess: (order) => afterCorrection(order),
  });

  const voidItem = useMutation({
    mutationFn: (itemId: string) => ordersService.voidItem(selectedOrder?.id ?? '', itemId, correctionReason.trim()),
    onSuccess: (order) => afterCorrection(order),
  });

  const metrics = ordersQuery.data?.metrics;

  function afterCorrection(order: OrderView) {
    queryClient.setQueryData(['orders-detail', order.id], order);
    void queryClient.invalidateQueries({ queryKey: ['orders-history'] });
    setCorrectionTarget(undefined);
    setCorrectionReason('');
  }

  function submitCorrection(event: FormSubmitEvent) {
    event.preventDefault();
    if (!correctionTarget || correctionReason.trim().length < 3) return;
    if (correctionTarget.type === 'order') voidOrder.mutate();
    if (correctionTarget.type === 'item') voidItem.mutate(correctionTarget.itemId);
  }

  const correctionPending = voidOrder.isPending || voidItem.isPending;
  const correctionError = voidOrder.isError || voidItem.isError;

  return (
    <div className="h-full overflow-y-auto bg-white p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-primary">Order lookup</p>
          <h1 className="mt-2 text-4xl font-black text-espresso">Orders history</h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold text-muted">
            Find created orders, reprint receipts, and correct unpaid orders with an audit reason.
          </p>
        </div>
        <Badge tone={canVoidOrders ? 'green' : 'orange'}>{canVoidOrders ? 'Corrections enabled' : 'View only'}</Badge>
      </div>

      <div className="mt-6 grid grid-cols-4 gap-4">
        <Metric label="Orders" value={metrics?.total ?? 0} />
        <Metric label="Open" value={metrics?.open ?? 0} />
        <Metric label="Completed" value={metrics?.completed ?? 0} />
        <Metric label="Cancelled" value={metrics?.cancelled ?? 0} />
      </div>

      <OrdersToolbar
        dateScope={dateScope}
        search={search}
        status={status}
        onDateScopeChange={setDateScope}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
      />

      <div className="mt-5 grid min-h-0 grid-cols-[420px_1fr] gap-5">
        <OrdersList
          loading={ordersQuery.isLoading}
          orders={orders}
          selectedId={selectedId}
          onSelect={(order) => setSelectedId(order.id)}
        />
        <OrderDetail
          canVoid={canVoidOrders}
          order={selectedOrder}
          printing={reprintReceipt.isPending}
          onPrint={() => reprintReceipt.mutate()}
          onVoidItem={(itemId, label) => {
            setCorrectionReason('');
            setCorrectionTarget({ type: 'item', itemId, label });
          }}
          onVoidOrder={() => {
            if (!selectedOrder) return;
            setCorrectionReason('');
            setCorrectionTarget({ type: 'order', label: `Order #${selectedOrder.orderNumber}` });
          }}
        />
      </div>

      <CorrectionModal
        error={correctionError}
        open={Boolean(correctionTarget)}
        pending={correctionPending}
        reason={correctionReason}
        targetLabel={correctionTarget?.label ?? ''}
        title={correctionTarget?.type === 'order' ? 'Void order' : 'Void item'}
        onClose={() => setCorrectionTarget(undefined)}
        onReasonChange={setCorrectionReason}
        onSubmit={submitCorrection}
      />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <Card className="flex items-center justify-between p-5">
      <div>
        <p className="text-sm font-black text-muted">{label}</p>
        <p className="mt-3 text-3xl font-black text-espresso">{value}</p>
      </div>
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-mint text-secondary">
        <ClipboardList size={19} />
      </span>
    </Card>
  );
}
