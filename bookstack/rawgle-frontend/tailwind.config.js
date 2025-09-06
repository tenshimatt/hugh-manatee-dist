/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // RAWGLE Brand Colors
        'charcoal': {
          DEFAULT: '#233d4d',
          100: '#070c0f',
          200: '#0e181f',
          300: '#15252e',
          400: '#1c313d',
          500: '#233d4d',
          600: '#3c6883',
          700: '#5c92b4',
          800: '#92b6cd',
          900: '#c9dbe6'
        },
        'pumpkin': {
          DEFAULT: '#fe7f2d',
          100: '#3c1800',
          200: '#783001',
          300: '#b44801',
          400: '#f06101',
          500: '#fe7f2d',
          600: '#fe9b59',
          700: '#feb482',
          800: '#ffcdac',
          900: '#ffe6d5'
        },
        'sunglow': {
          DEFAULT: '#fcca46',
          100: '#3f2f01',
          200: '#7f5d02',
          300: '#be8c03',
          400: '#fbba06',
          500: '#fcca46',
          600: '#fdd66a',
          700: '#fde08f',
          800: '#feeab5',
          900: '#fef5da'
        },
        'olivine': {
          DEFAULT: '#a1c181',
          100: '#202b15',
          200: '#40562a',
          300: '#608140',
          400: '#81ac56',
          500: '#a1c181',
          600: '#b4cd9a',
          700: '#c6dab3',
          800: '#d9e6cc',
          900: '#ecf3e6'
        },
        'zomp': {
          DEFAULT: '#619b8a',
          100: '#131f1b',
          200: '#263d37',
          300: '#3a5c52',
          400: '#4d7b6d',
          500: '#619b8a',
          600: '#7fafa1',
          700: '#9fc3b8',
          800: '#bfd7d0',
          900: '#dfebe7'
        },
        // Semantic colors mapped to brand
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#233d4d", // charcoal
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "#a1c181", // olivine
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "#fcca46", // sunglow - for PAWS token
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        "slide-in": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-out": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-100%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-in",
        "fade-out": "fade-out 0.3s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        "slide-out": "slide-out 0.3s ease-out",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        heading: ["Poppins", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
