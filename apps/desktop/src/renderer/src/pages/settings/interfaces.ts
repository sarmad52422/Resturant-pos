import type { InputHTMLAttributes, ReactNode } from 'react';

export interface SettingRecord {
  id: string;
  key: string;
  group: string;
  value: unknown;
  updatedAt: string;
}

export interface FieldProps {
  children: ReactNode;
  className?: string;
  error?: string;
  label: string;
}

export interface ToggleProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}
