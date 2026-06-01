import { Badge, Card } from '@restaurantos/ui';

const metrics = [
  ['Today sales', 'Rs 0', 'green'],
  ['Orders', '0', 'blue'],
  ['Pending credit', 'Rs 0', 'orange'],
  ['Low stock', '0 items', 'red'],
] as const;

export function DashboardPage() {
  return (
    <div className="h-full overflow-y-auto p-7">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.28em] text-subtle">Overview</p>
          <h1 className="mt-2 text-4xl font-black">Today at a glance</h1>
        </div>
        <div className="rounded-2xl bg-secondary px-5 py-3 text-sm font-semibold text-white">
          Live shift
        </div>
      </div>
      <div className="mt-7 grid grid-cols-4 gap-4">
        {metrics.map(([label, value, tone]) => (
          <Card key={label} className="p-5">
            <Badge tone={tone}>{label}</Badge>
            <p className="mt-7 text-3xl font-black">{value}</p>
          </Card>
        ))}
      </div>
      <div className="mt-5 grid grid-cols-[1.4fr_1fr] gap-5">
        <Card className="min-h-72 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black">Sales rhythm</h2>
            <Badge tone="green">Realtime</Badge>
          </div>
          <div className="mt-8 flex h-44 items-end gap-3">
            {[38, 62, 46, 78, 56, 92, 70, 84].map((height, index) => (
              <div key={index} className="flex flex-1 flex-col items-center gap-3">
                <div
                  className="w-full rounded-t-xl bg-primary"
                  style={{ height: `${height}%`, opacity: 0.42 + index * 0.06 }}
                />
                <span className="text-xs font-bold text-subtle">{index + 9}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="min-h-72 bg-secondary p-6 text-white">
          <Badge tone="orange">Kitchen</Badge>
          <h2 className="mt-6 text-3xl font-black">No delays</h2>
          <p className="mt-3 text-sm font-semibold text-deepSoft">
            Kitchen queue, table status, and delivery counters will stream here.
          </p>
        </Card>
      </div>
    </div>
  );
}
