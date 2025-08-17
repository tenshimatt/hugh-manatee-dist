/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'superluxe': {
          50: '#faf7f0',
          100: '#f4ebe0',
          200: '#e8d5c1',
          300: '#dab897',
          400: '#ca9870',
          500: '#bc7f55',
          600: '#af6b49',
          700: '#92543e',
          800: '#764537',
          900: '#61392f',
        }
      }
    },
  },
  plugins: [],
}