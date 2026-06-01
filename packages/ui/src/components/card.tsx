import type { HTMLAttributes } from 'react';
import { cn } from '../utils';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-white shadow-[0_22px_60px_rgba(8,86,85,0.08)]',
        className,
      )}
      {...props}
    />
  );
}
