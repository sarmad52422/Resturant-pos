import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Banknote, CalendarCheck, Clock3, Loader2, LockKeyhole, Plus, RefreshCcw, Wallet } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Badge, Button, Card } from '@restaurantos/ui';
import { ActionModal } from '@/components/action-modal';
import { FormField } from '@/components/form-field';
import type { FormSubmitEvent } from '@/lib/events';
import { shiftsService } from '@/services/shifts-service';
import { useAuthStore } from '@/store/use-auth-store';
import type { Shift } from './interfaces';

const fieldClass =
  'h-11 w-full rounded-xl border border-field bg-white px-3 text-sm font-semibold text-espresso outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10';

const money = new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0, style: 'currency', currency: 'PKR' });

export function ShiftsPage() {
  const queryClient = useQueryClient();
  const canCloseOther = useAuthStore((state) => state.hasPermission('shift.close.other'));
  const [openShiftOpen, setOpenShiftOpen] = useState(false);
  const [closeShiftOpen, setCloseShiftOpen] = useState(false);
  const [closingShiftId, setClosingShiftId] = useState('');
  const [openingCash, setOpeningCash] = useState('0');
  const [terminalDevice, setTerminalDevice] = useState('');
  const [openNotes, setOpenNotes] = useState('');
  const [countedCash, setCountedCash] = useState('');
  const [expenses, setExpenses] = useState('0');
  const [closeNotes, setCloseNotes] = useState('');

  const shiftsQuery = useQuery({
    queryKey: ['shifts'],
    queryFn: shiftsService.list,
  });

  const activeShift = shiftsQuery.data?.activeShift;
  const shifts = shiftsQuery.data?.shifts ?? [];
  const selectedClosingShift = shifts.find((shift) => shift.id === closingShiftId) ?? activeShift;
  const expectedCash = selectedClosingShift
    ? Number(selectedClosingShift.openingCash) +
      Number(selectedClosingShift.liveTotals.cashSales) -
      Number(selectedClosingShift.liveTotals.refunds) -
      Number(expenses || 0)
    : 0;
  const difference = Number(countedCash || 0) - expectedCash;

  const openShift = useMutation({
    mutationFn: () =>
      shiftsService.open({
        openingCash: Number(openingCash || 0),
        terminalDevice: terminalDevice.trim() || undefined,
        notes: openNotes.trim() || undefined,
      }),
    onSuccess: () => {
      setOpeningCash('0');
      setTerminalDevice('');
      setOpenNotes('');
      setOpenShiftOpen(false);
      void queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });

  const closeShift = useMutation({
    mutationFn: () =>
      shiftsService.close(selectedClosingShift?.id ?? '', {
        countedCash: Number(countedCash || 0),
        expenses: Number(expenses || 0),
        notes: closeNotes.trim() || undefined,
      }),
    onSuccess: () => {
      setClosingShiftId('');
      setCountedCash('');
      setExpenses('0');
      setCloseNotes('');
      setCloseShiftOpen(false);
      void queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });

  const recalculateShift = useMutation({
    mutationFn: shiftsService.recalculate,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shifts'] }),
  });

  function submitOpenShift(event: FormSubmitEvent) {
    event.preventDefault();
    if (Number(openingCash || 0) >= 0) openShift.mutate();
  }

  function openCloseShift(shift?: Shift) {
    const target = shift ?? activeShift;
    setClosingShiftId(target?.id ?? '');
    setCountedCash(target ? String(Number(target.openingCash) + Number(target.liveTotals.cashSales)) : '');
    setExpenses('0');
    setCloseNotes('');
    setCloseShiftOpen(true);
  }

  function submitCloseShift(event: FormSubmitEvent) {
    event.preventDefault();
    if (selectedClosingShift && Number(countedCash || 0) >= 0) closeShift.mutate();
  }

  return (
    <div className="h-full overflow-y-auto bg-white p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-primary">Cash control</p>
          <h1 className="mt-2 text-4xl font-black text-espresso">Shift management</h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold text-muted">
            Open cashier shifts, review live cash totals, close drawers, and track cash differences.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone={activeShift ? 'green' : 'orange'}>{activeShift ? 'Shift open' : 'No open shift'}</Badge>
          <Button disabled={Boolean(activeShift)} icon={<Plus size={17} />} onClick={() => setOpenShiftOpen(true)}>
            Open shift
          </Button>
          <Button disabled={!activeShift} icon={<LockKeyhole size={17} />} variant="secondary" onClick={() => openCloseShift()}>
            Close shift
          </Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-4 gap-4">
        <Metric icon={<Clock3 size={19} />} label="Open shifts" value={shiftsQuery.data?.metrics.openShifts ?? 0} />
        <Metric icon={<CalendarCheck size={19} />} label="Closed today" value={shiftsQuery.data?.metrics.closedToday ?? 0} />
        <Metric icon={<Wallet size={19} />} label="My expected cash" value={money.format(currentExpectedCash(activeShift))} />
        <Metric icon={<Banknote size={19} />} label="Total differences" value={money.format(Number(shiftsQuery.data?.metrics.totalDifferences ?? 0))} />
      </div>

      {activeShift ? (
        <Card className="mt-5 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-muted">Current shift</p>
              <h2 className="mt-2 text-2xl font-black text-espresso">{activeShift.staff.name}</h2>
              <p className="mt-1 text-sm font-semibold text-muted">
                Opened {new Date(activeShift.openedAt).toLocaleString()} {activeShift.terminalDevice ? `on ${activeShift.terminalDevice}` : ''}
              </p>
            </div>
            <Button icon={<LockKeyhole size={17} />} onClick={() => openCloseShift(activeShift)}>
              Close drawer
            </Button>
          </div>
          <div className="mt-5 grid grid-cols-5 gap-3">
            <CashTile label="Opening cash" value={activeShift.openingCash} />
            <CashTile label="Cash sales" value={activeShift.liveTotals.cashSales} />
            <CashTile label="Card/wallet" value={activeShift.liveTotals.cardSales} />
            <CashTile label="Credit sales" value={activeShift.liveTotals.creditSales} />
            <CashTile label="Expected cash" value={String(currentExpectedCash(activeShift))} strong />
          </div>
        </Card>
      ) : null}

      <Card className="mt-5 overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <div>
            <h2 className="text-xl font-black text-espresso">Shift history</h2>
            <p className="text-sm font-semibold text-muted">Recent drawer sessions, sales buckets, and close differences.</p>
          </div>
          {shiftsQuery.isLoading ? <Loader2 className="animate-spin text-primary" size={20} /> : null}
        </div>

        {shiftsQuery.isError ? (
          <div className="m-5 flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            <AlertCircle size={17} />
            Shifts could not load. Check the API session.
          </div>
        ) : null}

        <div className="max-h-[520px] overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-sage text-xs font-black uppercase text-muted">
              <tr>
                <th className="px-6 py-3">Staff</th>
                <th className="px-4 py-3">Opened</th>
                <th className="px-4 py-3 text-right">Cash</th>
                <th className="px-4 py-3 text-right">Card/wallet</th>
                <th className="px-4 py-3 text-right">Expected</th>
                <th className="px-4 py-3 text-right">Difference</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {shifts.map((shift) => (
                <tr key={shift.id}>
                  <td className="px-6 py-4">
                    <p className="font-black text-espresso">{shift.staff.name}</p>
                    <p className="mt-1 text-xs font-semibold text-muted">{shift.terminalDevice || 'POS terminal'}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-bold text-label">{new Date(shift.openedAt).toLocaleDateString()}</p>
                    <p className="mt-1 text-xs font-semibold text-muted">
                      {shift.closedAt ? `Closed ${new Date(shift.closedAt).toLocaleTimeString()}` : 'Open now'}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-right font-black text-espresso">{money.format(Number(shift.cashSales || shift.liveTotals.cashSales))}</td>
                  <td className="px-4 py-4 text-right font-bold text-label">{money.format(Number(shift.cardSales || shift.liveTotals.cardSales))}</td>
                  <td className="px-4 py-4 text-right font-black text-espresso">
                    {money.format(shift.status === 'OPEN' ? currentExpectedCash(shift) : Number(shift.expectedCash))}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Badge tone={Number(shift.difference ?? 0) === 0 ? 'gray' : Number(shift.difference ?? 0) > 0 ? 'green' : 'red'}>
                      {shift.difference === undefined || shift.difference === null ? 'Open' : money.format(Number(shift.difference))}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {shift.status === 'OPEN' ? (
                      <Button
                        className="h-9 px-3"
                        disabled={!canCloseOther && shift.id !== activeShift?.id}
                        icon={<LockKeyhole size={15} />}
                        variant="secondary"
                        onClick={() => openCloseShift(shift)}
                      >
                        Close
                      </Button>
                    ) : (
                      <Button
                        className="h-9 px-3"
                        disabled={recalculateShift.isPending}
                        icon={<RefreshCcw size={15} />}
                        variant="ghost"
                        onClick={() => recalculateShift.mutate(shift.id)}
                      >
                        Recalc
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <ActionModal
        description="Enter the cash already in the drawer before sales start."
        open={openShiftOpen}
        title="Open shift"
        onClose={() => setOpenShiftOpen(false)}
      >
        <form className="space-y-3" onSubmit={submitOpenShift}>
          <FormField label="Cash at start">
          <input
            className={fieldClass}
            min="0"
            type="number"
            value={openingCash}
            onChange={(event) => setOpeningCash(event.target.value)}
          />
          </FormField>
          <FormField label="Counter name" hint="Optional. Example: Front counter.">
          <input
            className={fieldClass}
            value={terminalDevice}
            onChange={(event) => setTerminalDevice(event.target.value)}
          />
          </FormField>
          <FormField label="Notes">
          <textarea
            className={`${fieldClass} min-h-24 py-3`}
            value={openNotes}
            onChange={(event) => setOpenNotes(event.target.value)}
          />
          </FormField>
          {openShift.isError ? (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              Shift open failed. This user may already have an open shift.
            </div>
          ) : null}
          <Button
            className="w-full"
            disabled={Number(openingCash || 0) < 0 || openShift.isPending}
            icon={openShift.isPending ? <Loader2 className="animate-spin" size={17} /> : <Plus size={17} />}
            type="submit"
          >
            Open shift
          </Button>
        </form>
      </ActionModal>

      <ActionModal
        description="Count the cash in the drawer and close this shift."
        open={closeShiftOpen}
        title="Close shift"
        onClose={() => setCloseShiftOpen(false)}
      >
        <form className="space-y-4" onSubmit={submitCloseShift}>
          <div className="rounded-2xl bg-sage p-4">
            <p className="text-xs font-black uppercase text-muted">Expected cash</p>
            <p className="mt-1 text-2xl font-black text-espresso">{money.format(expectedCash)}</p>
            <p className="mt-1 text-xs font-bold text-muted">
              Difference: <span className={difference === 0 ? 'text-muted' : difference > 0 ? 'text-secondary' : 'text-red-600'}>{money.format(difference)}</span>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Cash counted">
            <input
              className={fieldClass}
              min="0"
              type="number"
              value={countedCash}
              onChange={(event) => setCountedCash(event.target.value)}
            />
            </FormField>
            <FormField label="Money spent">
            <input
              className={fieldClass}
              min="0"
              type="number"
              value={expenses}
              onChange={(event) => setExpenses(event.target.value)}
            />
            </FormField>
          </div>
          <FormField label="Notes">
          <textarea
            className={`${fieldClass} min-h-24 py-3`}
            value={closeNotes}
            onChange={(event) => setCloseNotes(event.target.value)}
          />
          </FormField>
          {closeShift.isError ? (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              Shift close failed. Check drawer values and shift permissions.
            </div>
          ) : null}
          <Button
            className="w-full"
            disabled={!selectedClosingShift || Number(countedCash || 0) < 0 || closeShift.isPending}
            icon={closeShift.isPending ? <Loader2 className="animate-spin" size={17} /> : <LockKeyhole size={17} />}
            type="submit"
          >
            Close shift
          </Button>
        </form>
      </ActionModal>
    </div>
  );
}

function currentExpectedCash(shift?: Shift) {
  if (!shift) return 0;
  return Number(shift.openingCash) + Number(shift.liveTotals.cashSales) - Number(shift.liveTotals.refunds) - Number(shift.expenses);
}

function CashTile({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-2xl bg-sage p-4">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className={`mt-2 text-xl font-black ${strong ? 'text-secondary' : 'text-espresso'}`}>{money.format(Number(value || 0))}</p>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: number | string }) {
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
