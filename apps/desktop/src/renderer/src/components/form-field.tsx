import type { ReactNode } from 'react';

interface FormFieldProps {
  children: ReactNode;
  className?: string;
  hint?: string;
  label: string;
}

export function FormField({ children, className = '', hint, label }: FormFieldProps) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.12em] text-muted">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs font-semibold text-muted">{hint}</span> : null}
    </label>
  );
}
