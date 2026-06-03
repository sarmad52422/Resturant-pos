import { AlertCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card } from '@restaurantos/ui';

export function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
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

export function InlineState({ text, tone }: { text: string; tone: 'red' | 'green' }) {
  return (
    <div
      className={`m-0 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold ${
        tone === 'red' ? 'bg-red-50 text-red-700' : 'bg-sage text-secondary'
      }`}
    >
      <AlertCircle size={17} />
      {text}
    </div>
  );
}
