import type { HTMLAttributes } from 'react';
import { cn } from '../utils';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-white shadow-[0_22px_60px_rgb(var(--ro-secondary-rgb)/0.08)]',
        className,
      )}
      {...props}
    />
  );
}
