import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#fffaf3',
        espresso: '#2c1810',
      },
    },
  },
  plugins: [],
} satisfies Config;
