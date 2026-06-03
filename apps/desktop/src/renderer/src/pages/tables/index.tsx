import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Armchair,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Plus,
  Sparkles,
  UsersRound,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { Badge, Button, Card } from '@restaurantos/ui';
import { ActionModal } from '../../components/action-modal';
import { FormField } from '../../components/form-field';
import { TableCard, type CurrentOrder, type RestaurantTable, type TableStatus } from '../../components/table-card';
import { apiFetch } from '../../lib/api';
import type { FormSubmitEvent } from '../../lib/events';
import { useAuthStore } from '../../store/use-auth-store';
import type { TablesResponse } from './interfaces';

const fieldClass =
  'h-11 w-full rounded-xl border border-field bg-white px-3 text-sm font-semibold text-espresso outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10';

export function TablesPage() {
  const queryClient = useQueryClient();
  const canManageTables = useAuthStore((state) => state.hasPermission('table.manage'));
  const canCreateOrder = useAuthStore((state) => state.hasPermission('order.create'));
  const [selectedArea, setSelectedArea] = useState('All');
  const [tableName, setTableName] = useState('');
  const [tableArea, setTableArea] = useState('Main Hall');
  const [capacity, setCapacity] = useState('4');
  const [createOpen, setCreateOpen] = useState(false);

  const tablesQuery = useQuery({
    queryKey: ['tables-floor'],
    queryFn: () => apiFetch<TablesResponse>('/tables'),
  });

  const areas = tablesQuery.data?.areas ?? [];
  const tables = tablesQuery.data?.tables ?? [];
  const visibleTables = useMemo(
    () => tables.filter((table) => selectedArea === 'All' || (table.area ?? 'Main Floor') === selectedArea),
    [selectedArea, tables],
  );

  const refreshTables = () => queryClient.invalidateQueries({ queryKey: ['tables-floor'] });

  const createTable = useMutation({
    mutationFn: () =>
      apiFetch<RestaurantTable>('/tables', {
        method: 'POST',
        body: JSON.stringify({
          name: tableName.trim(),
          area: tableArea.trim() || 'Main Floor',
          capacity: Number(capacity || 1),
          displayOrder: tables.length * 10 + 10,
        }),
      }),
    onSuccess: () => {
      setTableName('');
      setCapacity('4');
      setCreateOpen(false);
      void refreshTables();
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ table, status }: { table: RestaurantTable; status: TableStatus }) =>
      apiFetch<RestaurantTable>(`/tables/${table.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: refreshTables,
  });

  const startOrder = useMutation({
    mutationFn: (table: RestaurantTable) =>
      apiFetch<CurrentOrder>(`/tables/${table.id}/start-order`, {
        method: 'POST',
      }),
    onSuccess: refreshTables,
  });

  function submitTable(event: FormSubmitEvent) {
    event.preventDefault();
    if (tableName.trim() && Number(capacity) > 0) createTable.mutate();
  }

  return (
    <div className="h-full overflow-y-auto bg-white p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-primary">Floor control</p>
          <h1 className="mt-2 text-4xl font-black text-espresso">Table system</h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold text-muted">
            Open dine-in orders, scan table state, manage capacity, and prepare the foundation for merge and transfer.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone={canManageTables ? 'green' : 'orange'}>{canManageTables ? 'Editable' : 'View only'}</Badge>
          <Button disabled={!canManageTables} icon={<Plus size={17} />} onClick={() => setCreateOpen(true)}>
            New table
          </Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-4 gap-4">
        <Metric icon={<Armchair size={19} />} label="Tables" value={tablesQuery.data?.metrics.activeTables ?? 0} />
        <Metric icon={<CheckCircle2 size={19} />} label="Free" value={tablesQuery.data?.metrics.freeTables ?? 0} />
        <Metric icon={<ClipboardList size={19} />} label="Occupied" value={tablesQuery.data?.metrics.occupiedTables ?? 0} />
        <Metric icon={<UsersRound size={19} />} label="Covers" value={tablesQuery.data?.metrics.totalCovers ?? 0} />
      </div>

      <div className="mt-5">
        <Card className="min-h-[620px] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-5">
            <div>
              <h2 className="text-xl font-black text-espresso">Floor map</h2>
              <p className="text-sm font-semibold text-muted">Tap a table card to start or manage dine-in service.</p>
            </div>
            {tablesQuery.isLoading ? <Loader2 className="animate-spin text-primary" size={20} /> : null}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {['All', ...areas].map((area) => (
              <button
                key={area}
                className={[
                  'h-10 rounded-xl px-4 text-sm font-bold transition',
                  selectedArea === area
                    ? 'bg-primary text-white shadow-[0_10px_22px_rgb(var(--ro-primary-rgb)/0.24)]'
                    : 'bg-white text-muted shadow-[inset_0_0_0_1px_rgb(var(--ro-secondary-rgb)/0.08)] hover:bg-sage hover:text-secondary',
                ].join(' ')}
                onClick={() => setSelectedArea(area)}
              >
                {area}
              </button>
            ))}
          </div>

          {tablesQuery.isError ? (
            <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              Tables could not load. Check the API session.
            </div>
          ) : null}

          <div className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-5">
            {visibleTables.map((table) => (
              <TableCard
                key={table.id}
                canCreateOrder={canCreateOrder}
                canManageTables={canManageTables}
                loading={startOrder.isPending || updateStatus.isPending}
                table={table}
                onStartOrder={() => startOrder.mutate(table)}
                onStatus={(status) => updateStatus.mutate({ table, status })}
              />
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-5 grid grid-cols-[1fr_1fr] gap-5">
        <Card className="bg-secondary p-5 text-white">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-deepBright">Rush workflow</p>
          <h2 className="mt-4 text-3xl font-black">F10 table screen</h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-deepFaint">
            Cashiers can jump from POS to this floor view, open a dine-in order, and return to item entry.
          </p>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-black text-espresso">Next table tools</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm font-bold text-muted">
            <Planned icon={<Sparkles size={16} />} text="Merge tables" />
            <Planned icon={<Sparkles size={16} />} text="Transfer order" />
            <Planned icon={<Sparkles size={16} />} text="Reservations" />
            <Planned icon={<Sparkles size={16} />} text="Floor designer" />
          </div>
        </Card>
      </div>

      <ActionModal
        description="Add a floor table with area, seating capacity, and ordering position."
        open={createOpen}
        title="New table"
        onClose={() => setCreateOpen(false)}
      >
        <form className="space-y-3" onSubmit={submitTable}>
          <FormField label="Table name">
          <input
            className={fieldClass}
            disabled={!canManageTables}
            value={tableName}
            onChange={(event) => setTableName(event.target.value)}
          />
          </FormField>
          <FormField label="Room or area" hint="Example: Main Hall or Family Room.">
          <input
            className={fieldClass}
            disabled={!canManageTables}
            value={tableArea}
            onChange={(event) => setTableArea(event.target.value)}
          />
          </FormField>
          <FormField label="Seats">
          <input
            className={fieldClass}
            disabled={!canManageTables}
            min="1"
            type="number"
            value={capacity}
            onChange={(event) => setCapacity(event.target.value)}
          />
          </FormField>
          <Button
            className="w-full"
            disabled={!canManageTables || !tableName.trim() || createTable.isPending}
            icon={createTable.isPending ? <Loader2 className="animate-spin" size={17} /> : <Plus size={17} />}
            type="submit"
          >
            Add table
          </Button>
        </form>
      </ActionModal>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <Card className="flex items-center justify-between p-5">
      <div>
        <p className="text-sm font-black text-muted">{label}</p>
        <p className="mt-3 text-3xl font-black text-espresso">{value}</p>
      </div>
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-mint text-secondary">{icon}</span>
    </Card>
  );
}

function Planned({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-sage p-3">
      <span className="text-primary">{icon}</span>
      {text}
    </div>
  );
}
