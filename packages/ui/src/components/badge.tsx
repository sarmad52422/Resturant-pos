import type { HTMLAttributes } from 'react';
import { cn } from '../utils';

type BadgeTone = 'green' | 'orange' | 'blue' | 'red' | 'gray';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const tones: Record<BadgeTone, string> = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  orange: 'bg-orange-50 text-orange-700 ring-orange-200',
  blue: 'bg-sky-50 text-sky-700 ring-sky-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  gray: 'bg-stone-100 text-stone-600 ring-stone-200',
};

export function Badge({ className, tone = 'gray', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex h-7 items-center rounded-full px-3 text-xs font-semibold ring-1',
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
