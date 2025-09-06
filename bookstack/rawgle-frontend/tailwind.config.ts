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
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
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
          DEFAULT: "hsl(var(--accent))",
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
        // RAWGLE brand colors - primary palette (exact documentation values)
        charcoal: {
          DEFAULT: '#233d4d',
          50: '#f8f9fa',
          100: '#eef1f3',
          200: '#dae0e4',
          300: '#b8c2ca',
          400: '#8d9ba7',
          500: '#6b7c88',
          600: '#233d4d',
          700: '#1e3340',
          800: '#182933',
          900: '#131f26',
        },
        pumpkin: {
          DEFAULT: '#fe7f2d',
          50: '#fff7f2',
          100: '#ffede0',
          200: '#ffd6b8',
          300: '#ffb885',
          400: '#fe7f2d',
          500: '#ff6b1a',
          600: '#e55a12',
          700: '#cc4d0f',
          800: '#b3420d',
          900: '#993809',
        },
        sunglow: {
          DEFAULT: '#fcca46',
          50: '#fffcf0',
          100: '#fff8db',
          200: '#fff0b3',
          300: '#ffe685',
          400: '#fcca46',
          500: '#f2b91c',
          600: '#d9a211',
          700: '#bf8a0f',
          800: '#a6730d',
          900: '#8c5e0b',
        },
        olivine: {
          DEFAULT: '#a1c181',
          50: '#f5f9f2',
          100: '#e8f2e0',
          200: '#d4e3c2',
          300: '#b9d09a',
          400: '#a1c181',
          500: '#8aab68',
          600: '#749351',
          700: '#5f7b42',
          800: '#4e6436',
          900: '#42532e',
        },
        zomp: {
          DEFAULT: '#619b8a',
          50: '#f2f8f6',
          100: '#e0f1ec',
          200: '#c2e3d8',
          300: '#9dcfc0',
          400: '#619b8a',
          500: '#4d8473',
          600: '#3e6c5e',
          700: '#345a4e',
          800: '#2d4a41',
          900: '#273e37',
        },
        // RAWGLE legacy colors
        raw: {
          brown: {
            50: '#fdf8f6',
            100: '#f2e8e5',
            200: '#eaddd7',
            300: '#e0cec7',
            400: '#d2bab0',
            500: '#bfa094',
            600: '#a18072',
            700: '#8b6f47',
            800: '#6b5d3f',
            900: '#5a4e35',
          },
          green: {
            50: '#f3faf7',
            100: '#def7ec',
            200: '#bcf0da',
            300: '#84e1bc',
            400: '#31c48d',
            500: '#0e9f6e',
            600: '#057a55',
            700: '#046c4e',
            800: '#03543f',
            900: '#014737',
          },
          gold: {
            50: '#fffbeb',
            100: '#fef3c7',
            200: '#fde68a',
            300: '#fcd34d',
            400: '#fbbf24',
            500: '#f59e0b',
            600: '#d97706',
            700: '#b45309',
            800: '#92400e',
            900: '#78350f',
          }
        }
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
        "slide-in": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "bounce-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "70%": { transform: "scale(1.05)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        "fade-in": "fade-in 0.4s ease-out",
        "bounce-in": "bounce-in 0.5s ease-out",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
}