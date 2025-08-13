/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hunta: {
          green: '#2D5530',
          'green-light': '#3A6B3E',
          orange: '#D97706',
        }
      }
    },
  },
  plugins: [],
}