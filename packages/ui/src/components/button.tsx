import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: ReactNode;
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-[#1ba09c] text-white shadow-[0_10px_24px_rgba(27,160,156,0.26)] hover:bg-[#168f8b] focus-visible:ring-[#1ba09c]',
  secondary:
    'bg-white text-[#085655] shadow-[inset_0_0_0_1px_rgba(8,86,85,0.1)] hover:bg-[#f4fbfa]',
  ghost: 'text-[#4d5d5c] hover:bg-[#f4fbfa]',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
};

export function Button({ className, variant = 'primary', icon, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
