/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/renderer/index.html',
    './src/renderer/src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#ffffff',
        cream: '#ffffff',
        primary: '#1ba09c',
        secondary: '#085655',
        mint: '#e9fbfa',
        sage: '#f4fbfa',
        forest: '#085655',
        espresso: '#0d1717',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
