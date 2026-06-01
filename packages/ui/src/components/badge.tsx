import type { HTMLAttributes } from 'react';
import { cn } from '../utils';

type BadgeTone = 'green' | 'orange' | 'blue' | 'red' | 'gray';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const tones: Record<BadgeTone, string> = {
  green: 'bg-[#e7f7f6] text-[#085655] ring-[#bde8e5]',
  orange: 'bg-[#e9fbfa] text-[#1ba09c] ring-[#c8efed]',
  blue: 'bg-sky-50 text-sky-700 ring-sky-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  gray: 'bg-[#f5f7f7] text-[#5e6a69] ring-[#e7eeee]',
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
