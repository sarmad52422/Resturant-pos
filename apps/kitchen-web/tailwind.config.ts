import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'rgb(var(--ro-canvas-rgb) / <alpha-value>)',
        cream: 'rgb(var(--ro-canvas-rgb) / <alpha-value>)',
        surface: 'rgb(var(--ro-surface-rgb) / <alpha-value>)',
        primary: 'rgb(var(--ro-primary-rgb) / <alpha-value>)',
        'primary-hover': 'rgb(var(--ro-primary-hover-rgb) / <alpha-value>)',
        secondary: 'rgb(var(--ro-secondary-rgb) / <alpha-value>)',
        forest: 'rgb(var(--ro-secondary-rgb) / <alpha-value>)',
        espresso: 'rgb(var(--ro-espresso-rgb) / <alpha-value>)',
        mint: 'rgb(var(--ro-mint-rgb) / <alpha-value>)',
        sage: 'rgb(var(--ro-sage-rgb) / <alpha-value>)',
        muted: 'rgb(var(--ro-muted-rgb) / <alpha-value>)',
        subtle: 'rgb(var(--ro-subtle-rgb) / <alpha-value>)',
        label: 'rgb(var(--ro-label-rgb) / <alpha-value>)',
        field: 'rgb(var(--ro-field-rgb) / <alpha-value>)',
        successSoft: 'rgb(var(--ro-success-soft-rgb) / <alpha-value>)',
        successRing: 'rgb(var(--ro-success-ring-rgb) / <alpha-value>)',
        accentSoft: 'rgb(var(--ro-accent-soft-rgb) / <alpha-value>)',
        deepSoft: 'rgb(var(--ro-deep-soft-rgb) / <alpha-value>)',
        deepFaint: 'rgb(var(--ro-deep-faint-rgb) / <alpha-value>)',
        deepBright: 'rgb(var(--ro-deep-bright-rgb) / <alpha-value>)',
        divider: 'rgb(var(--ro-divider-rgb) / <alpha-value>)',
      },
    },
  },
  plugins: [],
} satisfies Config;
