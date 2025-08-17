/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
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
        hunta: {
          green: {
            50: '#F0F9F1',
            100: '#DCF2DE',
            200: '#BBE5C1',
            300: '#8DD49B',
            400: '#5ABE6F',
            500: '#3A6B3E',
            600: '#2D5530',
            700: '#254428',
            800: '#203724',
            900: '#1C2D20',
          },
          orange: {
            50: '#FFF7ED',
            100: '#FFEDD5',
            200: '#FED7AA',
            300: '#FDBA74',
            400: '#FB923C',
            500: '#F97316',
            600: '#D97706',
            700: '#B45309',
            800: '#92400E',
            900: '#78350F',
          },
          brown: {
            50: '#FDF8F6',
            100: '#F2E8E2',
            200: '#EADDD7',
            300: '#E0C4B7',
            400: '#D69E89',
            500: '#CD7C5C',
            600: '#B8653A',
            700: '#975025',
            800: '#92400E',
            900: '#78350F',
          }
        },
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        '4xl': '2rem',
      },
      boxShadow: {
        'soft': '0 2px 8px 0 rgba(0, 0, 0, 0.08)',
        'medium': '0 4px 16px 0 rgba(0, 0, 0, 0.12)',
        'hard': '0 8px 32px 0 rgba(0, 0, 0, 0.16)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
        'pulse-soft': 'pulseSoft 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        // Custom hunting-specific breakpoints
        'mobile': '320px',
        'tablet': '768px',
        'desktop': '1024px',
        // Glove-friendly touch targets (larger screens)
        'touch-lg': '1200px',
      },
      spacing: {
        ...spacing,
        // Touch-friendly spacing for field use
        'touch-sm': '44px', // Minimum touch target
        'touch-md': '48px', // Comfortable touch target
        'touch-lg': '56px', // Large touch target
        'touch-xl': '64px', // Extra large for gloves
      },
      minHeight: {
        'touch': '44px',
        'touch-lg': '56px',
      },
      minWidth: {
        'touch': '44px',
        'touch-lg': '56px',
      },
      animation: {
        ...animation,
        'recording': 'recording 1s ease-in-out infinite alternate',
        'gps-pulse': 'gpsPulse 2s ease-in-out infinite',
        'offline-pulse': 'offlinePulse 3s ease-in-out infinite',
      },
      keyframes: {
        ...keyframes,
        recording: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(1.1)', opacity: '0.7' },
        },
        gpsPulse: {
          '0%, 100%': { 
            transform: 'scale(1)',
            boxShadow: '0 0 10px rgba(34, 197, 94, 0.5)',
          },
          '50%': { 
            transform: 'scale(1.05)',
            boxShadow: '0 0 20px rgba(34, 197, 94, 0.8)',
          },
        },
        offlinePulse: {
          '0%, 100%': { 
            backgroundColor: 'rgba(251, 146, 60, 0.1)',
            borderColor: 'rgba(251, 146, 60, 0.3)',
          },
          '50%': { 
            backgroundColor: 'rgba(251, 146, 60, 0.2)',
            borderColor: 'rgba(251, 146, 60, 0.5)',
          },
        },
      },
      // Field-friendly colors
      colors: {
        ...colors,
        // Status colors for hunting scenarios
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          600: '#d97706',
        },
        error: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
        },
        // Offline/online status
        offline: {
          50: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
        },
        online: {
          50: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
        },
      },
    },
  },
  plugins: [
    // Custom plugin for hunting-specific utilities
    function({ addUtilities, theme }) {
      const huntingUtilities = {
        // Touch-friendly button styles
        '.btn-touch': {
          minHeight: theme('spacing.touch-md'),
          minWidth: theme('spacing.touch-md'),
          padding: `${theme('spacing.3')} ${theme('spacing.6')}`,
          borderRadius: theme('borderRadius.lg'),
          fontSize: theme('fontSize.base[0]'),
          fontWeight: theme('fontWeight.medium'),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme('spacing.2'),
          transition: 'all 0.2s ease-in-out',
          userSelect: 'none',
          cursor: 'pointer',
          '&:active': {
            transform: 'scale(0.95)',
          },
          '&:disabled': {
            opacity: '0.6',
            cursor: 'not-allowed',
            '&:active': {
              transform: 'none',
            },
          },
        },
        '.btn-touch-lg': {
          minHeight: theme('spacing.touch-lg'),
          minWidth: theme('spacing.touch-lg'),
          padding: `${theme('spacing.4')} ${theme('spacing.8')}`,
          fontSize: theme('fontSize.lg[0]'),
        },
        '.btn-touch-xl': {
          minHeight: theme('spacing.touch-xl'),
          minWidth: theme('spacing.touch-xl'),
          padding: `${theme('spacing.6')} ${theme('spacing.10')}`,
          fontSize: theme('fontSize.xl[0]'),
        },
        
        // Field-friendly text sizes (larger for outdoor use)
        '.text-field': {
          fontSize: theme('fontSize.lg[0]'),
          lineHeight: theme('lineHeight.relaxed'),
          color: theme('colors.gray.900'),
        },
        '.text-field-lg': {
          fontSize: theme('fontSize.xl[0]'),
          lineHeight: theme('lineHeight.relaxed'),
          fontWeight: theme('fontWeight.medium'),
        },
        
        // Status indicators
        '.status-online': {
          backgroundColor: theme('colors.online.500'),
          color: theme('colors.white'),
          borderRadius: theme('borderRadius.full'),
          padding: `${theme('spacing.1')} ${theme('spacing.3')}`,
          fontSize: theme('fontSize.sm[0]'),
          fontWeight: theme('fontWeight.medium'),
        },
        '.status-offline': {
          backgroundColor: theme('colors.offline.500'),
          color: theme('colors.white'),
          borderRadius: theme('borderRadius.full'),
          padding: `${theme('spacing.1')} ${theme('spacing.3')}`,
          fontSize: theme('fontSize.sm[0]'),
          fontWeight: theme('fontWeight.medium'),
          animation: theme('animation.offline-pulse'),
        },
        '.status-gps-active': {
          backgroundColor: theme('colors.success.500'),
          color: theme('colors.white'),
          borderRadius: theme('borderRadius.full'),
          padding: `${theme('spacing.1')} ${theme('spacing.3')}`,
          fontSize: theme('fontSize.sm[0]'),
          fontWeight: theme('fontWeight.medium'),
          animation: theme('animation.gps-pulse'),
        },
        
        // Card styles optimized for mobile
        '.card-mobile': {
          borderRadius: theme('borderRadius.xl'),
          boxShadow: theme('boxShadow.medium'),
          padding: theme('spacing.4'),
          backgroundColor: theme('colors.white'),
          border: `1px solid ${theme('colors.gray.200')}`,
          transition: 'all 0.2s ease-in-out',
        },
        '.card-mobile-lg': {
          padding: theme('spacing.6'),
          borderRadius: theme('borderRadius.2xl'),
        },
        '.card-hover': {
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme('boxShadow.hard'),
          },
        },
        
        // Focus styles for accessibility
        '.focus-hunt': {
          '&:focus': {
            outline: 'none',
            boxShadow: `0 0 0 3px ${theme('colors.hunta.green.500')}40`,
            borderColor: theme('colors.hunta.green.500'),
          },
          '&:focus-visible': {
            outline: `2px solid ${theme('colors.hunta.green.500')}`,
            outlineOffset: '2px',
          },
        },
        
        // High contrast mode for bright outdoor conditions
        '.high-contrast': {
          filter: 'contrast(1.3) brightness(1.1)',
          '-webkit-filter': 'contrast(1.3) brightness(1.1)',
        },
        
        // Battery saving mode styles
        '.battery-save': {
          filter: 'brightness(0.8)',
          transition: 'filter 0.3s ease',
        },
        
        // Recording indicator
        '.recording-indicator': {
          animation: theme('animation.recording'),
          backgroundColor: theme('colors.error.500'),
          borderRadius: theme('borderRadius.full'),
        },
        
        // GPS tracking styles
        '.gps-tracking': {
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100%',
            height: '100%',
            borderRadius: 'inherit',
            animation: theme('animation.gps-pulse'),
          },
        },
        
        // Offline queue indicator
        '.offline-queue': {
          backgroundColor: theme('colors.offline.50'),
          borderColor: theme('colors.offline.500'),
          color: theme('colors.offline.600'),
          animation: theme('animation.offline-pulse'),
        },
        
        // Touch-friendly form controls
        '.input-touch': {
          minHeight: theme('spacing.touch-md'),
          padding: `${theme('spacing.3')} ${theme('spacing.4')}`,
          fontSize: theme('fontSize.base[0]'),
          borderRadius: theme('borderRadius.lg'),
          border: `2px solid ${theme('colors.gray.300')}`,
          transition: 'all 0.2s ease-in-out',
          '&:focus': {
            borderColor: theme('colors.hunta.green.500'),
            boxShadow: `0 0 0 3px ${theme('colors.hunta.green.500')}20`,
            outline: 'none',
          },
        },
        '.select-touch': {
          minHeight: theme('spacing.touch-md'),
          fontSize: theme('fontSize.base[0]'),
          borderRadius: theme('borderRadius.lg'),
          border: `2px solid ${theme('colors.gray.300')}`,
          padding: `${theme('spacing.3')} ${theme('spacing.4')}`,
          paddingRight: theme('spacing.10'),
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
          backgroundPosition: 'right 0.75rem center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '1.5em 1.5em',
          '&:focus': {
            borderColor: theme('colors.hunta.green.500'),
            boxShadow: `0 0 0 3px ${theme('colors.hunta.green.500')}20`,
            outline: 'none',
          },
        },
        
        // Responsive text scaling for different devices
        '.text-responsive': {
          fontSize: theme('fontSize.sm[0]'),
          '@media (min-width: 640px)': {
            fontSize: theme('fontSize.base[0]'),
          },
          '@media (min-width: 1024px)': {
            fontSize: theme('fontSize.lg[0]'),
          },
        },
        '.text-responsive-lg': {
          fontSize: theme('fontSize.base[0]'),
          '@media (min-width: 640px)': {
            fontSize: theme('fontSize.lg[0]'),
          },
          '@media (min-width: 1024px)': {
            fontSize: theme('fontSize.xl[0]'),
          },
        },
      };

      addUtilities(huntingUtilities);
    },
  ],
}