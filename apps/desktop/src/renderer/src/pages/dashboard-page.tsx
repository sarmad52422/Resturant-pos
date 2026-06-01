import { Badge, Card } from '@restaurantos/ui';

const metrics = [
  ['Today sales', 'Rs 0', 'green'],
  ['Orders', '0', 'blue'],
  ['Pending credit', 'Rs 0', 'orange'],
  ['Low stock', '0 items', 'red'],
] as const;

export function DashboardPage() {
  return (
    <div className="p-7">
      <h1 className="text-3xl font-black">Dashboard</h1>
      <div className="mt-6 grid grid-cols-4 gap-4">
        {metrics.map(([label, value, tone]) => (
          <Card key={label} className="p-5">
            <Badge tone={tone}>{label}</Badge>
            <p className="mt-6 text-3xl font-black">{value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
