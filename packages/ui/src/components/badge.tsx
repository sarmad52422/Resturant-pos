import type { HTMLAttributes } from 'react';
import { cn } from '../utils';

type BadgeTone = 'green' | 'orange' | 'blue' | 'red' | 'gray';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const tones: Record<BadgeTone, string> = {
  green: 'bg-successSoft text-secondary ring-successRing',
  orange: 'bg-mint text-primary ring-accentSoft',
  blue: 'bg-sky-50 text-sky-700 ring-sky-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  gray: 'bg-slate-50 text-muted ring-slate-100',
};

export function Badge({ className, tone = 'gray', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex h-7 items-center rounded-lg px-3 text-xs font-semibold ring-1',
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
