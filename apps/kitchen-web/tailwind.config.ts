import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#ffffff',
        cream: '#ffffff',
        primary: '#1ba09c',
        forest: '#085655',
        espresso: '#0d1717',
      },
    },
  },
  plugins: [],
} satisfies Config;
