import React, { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Define theme palettes
export const themes = {
  classic: {
    id: 'classic',
    name: '🌲 Hunta Classic',
    description: 'Original forest green theme',
    colors: {
      primary: '#2D5530',
      primaryLight: '#3A6B3E',
      secondary: '#D97706',
      background: '#F9FAFB',
      surface: '#FFFFFF',
      text: '#1F2937',
      textSecondary: '#6B7280',
      border: '#E5E7EB',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444'
    }
  },
  midnight: {
    id: 'midnight',
    name: '🌙 Midnight Hunter',
    description: 'Dark theme for night hunting',
    colors: {
      primary: '#1e40af',
      primaryLight: '#2563eb',
      secondary: '#f59e0b',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f1f5f9',
      textSecondary: '#cbd5e1',
      border: '#334155',
      success: '#22c55e',
      warning: '#eab308',
      error: '#ef4444'
    }
  },
  autumn: {
    id: 'autumn',
    name: '🍂 Autumn Woods',
    description: 'Warm autumn hunting colors',
    colors: {
      primary: '#92400e',
      primaryLight: '#b45309',
      secondary: '#ea580c',
      background: '#fef3c7',
      surface: '#fffbeb',
      text: '#451a03',
      textSecondary: '#78350f',
      border: '#fed7aa',
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626'
    }
  },
  winter: {
    id: 'winter',
    name: '❄️ Winter Field',
    description: 'Cool winter hunting theme',
    colors: {
      primary: '#1e40af',
      primaryLight: '#2563eb',
      secondary: '#7c3aed',
      background: '#f0f9ff',
      surface: '#ffffff',
      text: '#1e293b',
      textSecondary: '#475569',
      border: '#e2e8f0',
      success: '#0891b2',
      warning: '#0ea5e9',
      error: '#e11d48'
    }
  },
  desert: {
    id: 'desert',
    name: '🏜️ Desert Hunt',
    description: 'Warm desert sand tones',
    colors: {
      primary: '#a16207',
      primaryLight: '#ca8a04',
      secondary: '#dc2626',
      background: '#fef7ed',
      surface: '#ffffff',
      text: '#431407',
      textSecondary: '#92400e',
      border: '#fed7aa',
      success: '#16a34a',
      warning: '#ea580c',
      error: '#dc2626'
    }
  },
  forest: {
    id: 'forest',
    name: '🌿 Deep Forest',
    description: 'Rich forest greens',
    colors: {
      primary: '#166534',
      primaryLight: '#15803d',
      secondary: '#ca8a04',
      background: '#f0fdf4',
      surface: '#ffffff',
      text: '#14532d',
      textSecondary: '#166534',
      border: '#dcfce7',
      success: '#22c55e',
      warning: '#eab308',
      error: '#dc2626'
    }
  },
  ocean: {
    id: 'ocean',
    name: '🌊 Ocean Breeze',
    description: 'Cool ocean blues',
    colors: {
      primary: '#0c4a6e',
      primaryLight: '#0369a1',
      secondary: '#0891b2',
      background: '#f0f9ff',
      surface: '#ffffff',
      text: '#0c4a6e',
      textSecondary: '#0369a1',
      border: '#e0f2fe',
      success: '#0891b2',
      warning: '#0ea5e9',
      error: '#dc2626'
    }
  },
  sunset: {
    id: 'sunset',
    name: '🌅 Sunset Hunt',
    description: 'Warm sunset oranges and reds',
    colors: {
      primary: '#c2410c',
      primaryLight: '#ea580c',
      secondary: '#dc2626',
      background: '#fff7ed',
      surface: '#ffffff',
      text: '#7c2d12',
      textSecondary: '#9a3412',
      border: '#fed7aa',
      success: '#16a34a',
      warning: '#ea580c',
      error: '#dc2626'
    }
  },
  usa: {
    id: 'usa',
    name: '🇺🇸 USA Pride',
    description: 'Patriotic red, white, and blue',
    colors: {
      primary: '#1e3a8a',        // Deep blue - balanced, not too bright
      primaryLight: '#3b82f6',   // Lighter blue for hover states
      secondary: '#dc2626',      // Classic red - strong but not garish
      background: '#f8fafc',     // Off-white background - easier on eyes
      surface: '#ffffff',        // Pure white for cards/surfaces
      text: '#1e293b',          // Dark blue-gray for text
      textSecondary: '#64748b',  // Medium gray for secondary text
      border: '#e2e8f0',        // Light gray borders
      success: '#059669',       // Keep success green as is
      warning: '#d97706',       // Amber warning
      error: '#dc2626'          // Use the theme red for errors
    }
  }
}

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(() => {
    // Load theme from localStorage or default to classic
    const saved = localStorage.getItem('hunta-theme')
    return saved && themes[saved] ? saved : 'classic'
  })

  const changeTheme = (themeId) => {
    if (themes[themeId]) {
      setCurrentTheme(themeId)
      localStorage.setItem('hunta-theme', themeId)
    }
  }

  const applyThemeColors = (theme) => {
    const root = document.documentElement
    const colors = theme.colors

    // Apply CSS custom properties
    root.style.setProperty('--color-primary', colors.primary)
    root.style.setProperty('--color-primary-light', colors.primaryLight)
    root.style.setProperty('--color-secondary', colors.secondary)
    root.style.setProperty('--color-background', colors.background)
    root.style.setProperty('--color-surface', colors.surface)
    root.style.setProperty('--color-text', colors.text)
    root.style.setProperty('--color-text-secondary', colors.textSecondary)
    root.style.setProperty('--color-border', colors.border)
    root.style.setProperty('--color-success', colors.success)
    root.style.setProperty('--color-warning', colors.warning)
    root.style.setProperty('--color-error', colors.error)

    // Update Tailwind-style classes
    root.style.setProperty('--tw-color-hunta-green', colors.primary)
    root.style.setProperty('--tw-color-hunta-green-light', colors.primaryLight)
    root.style.setProperty('--tw-color-hunta-orange', colors.secondary)

    // Update body background
    document.body.style.backgroundColor = colors.background
  }

  useEffect(() => {
    const theme = themes[currentTheme]
    if (theme) {
      applyThemeColors(theme)
      
      // Add theme class to body for additional styling
      document.body.className = document.body.className.replace(/theme-\w+/g, '')
      document.body.classList.add(`theme-${currentTheme}`)
    }
  }, [currentTheme])

  const value = {
    currentTheme,
    theme: themes[currentTheme],
    themes,
    changeTheme,
    applyThemeColors
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}