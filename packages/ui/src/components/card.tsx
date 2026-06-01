import type { HTMLAttributes } from 'react';
import { cn } from '../utils';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-lg border border-orange-100 bg-white shadow-[0_16px_40px_rgba(120,72,24,0.08)]',
        className,
      )}
      {...props}
    />
  );
}
