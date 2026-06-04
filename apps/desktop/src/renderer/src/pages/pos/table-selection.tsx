import { Badge } from '@restaurantos/ui';
import { Armchair, Loader2 } from 'lucide-react';
import { ActionModal } from '@/components/action-modal';
import type { RestaurantTable } from '@/components/table-card';

interface TableSelectionModalProps {
  loading: boolean;
  open: boolean;
  selectedTableId?: string;
  tables: RestaurantTable[];
  onClose: () => void;
  onSelect: (table: RestaurantTable) => void;
}

export function TableSelectionModal({
  loading,
  open,
  selectedTableId,
  tables,
  onClose,
  onSelect,
}: TableSelectionModalProps) {
  const groupedTables = groupTables(tables);

  return (
    <ActionModal
      description="Choose a free table before sending, paying, or printing this dine-in order."
      open={open}
      title="Select table"
      widthClass="max-w-3xl"
      onClose={onClose}
    >
      {loading ? (
        <div className="flex h-40 items-center justify-center gap-3 rounded-2xl bg-sage text-sm font-black text-muted">
          <Loader2 className="animate-spin text-primary" size={18} />
          Loading free tables
        </div>
      ) : null}

      {!loading && tables.length === 0 ? (
        <div className="rounded-2xl bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          No free tables are available. Free or clean a table from the Tables screen first.
        </div>
      ) : null}

      <div className="space-y-5">
        {groupedTables.map(([area, areaTables]) => (
          <section key={area}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-[0.16em] text-muted">{area}</h3>
              <Badge tone="green">{areaTables.length} free</Badge>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {areaTables.map((table) => {
                const selected = table.id === selectedTableId;
                return (
                  <button
                    key={table.id}
                    className={[
                      'rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgb(var(--ro-secondary-rgb)/0.12)]',
                      selected ? 'border-primary bg-mint' : 'border-line bg-white',
                    ].join(' ')}
                    type="button"
                    onClick={() => onSelect(table)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-muted">Table</p>
                        <h4 className="mt-1 text-2xl font-black text-espresso">{table.name}</h4>
                      </div>
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
                        <Armchair size={18} />
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-black text-label">
                      <span className="rounded-xl bg-sage px-3 py-2">Seats {table.capacity}</span>
                      <span className="rounded-xl bg-sage px-3 py-2">Free</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </ActionModal>
  );
}

function groupTables(tables: RestaurantTable[]) {
  const groups = new Map<string, RestaurantTable[]>();
  for (const table of tables) {
    const area = table.area || 'Main Floor';
    groups.set(area, [...(groups.get(area) ?? []), table]);
  }
  return [...groups.entries()];
}
