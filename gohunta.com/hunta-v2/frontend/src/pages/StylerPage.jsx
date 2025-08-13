import React, { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'

const StylerPage = ({ apiBase }) => {
  const { currentTheme, theme, themes: contextThemes, changeTheme, applyThemeColors } = useTheme()
  const [config, setConfig] = useState(null)
  const [presetThemes, setPresetThemes] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('colors')
  const [previewMode, setPreviewMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [changes, setChanges] = useState({})
  const [customCSS, setCustomCSS] = useState('')

  useEffect(() => {
    loadStyleData()
    
    // Cleanup function to remove any injected styles
    return () => {
      const previewStyles = document.getElementById('hunta-preview-styles')
      const customStyles = document.getElementById('hunta-custom-css')
      if (previewStyles) previewStyles.remove()
      if (customStyles) customStyles.remove()
    }
  }, [])

  const loadStyleData = async () => {
    try {
      const [configRes, themesRes] = await Promise.all([
        fetch(`${apiBase}/api/styler/config`),
        fetch(`${apiBase}/api/styler/themes`)
      ])

      if (!configRes.ok) {
        console.warn(`Config API failed: ${configRes.status}`)
        // Use default config from current theme
        const defaultConfig = theme ? loadThemeToEditorConfig(theme) : null
        if (defaultConfig) setConfig(defaultConfig)
      } else {
        const configData = await configRes.json()
        if (configData.success) setConfig(configData.data)
      }

      if (!themesRes.ok) {
        console.warn(`Themes API failed: ${themesRes.status}`)
      } else {
        const themesData = await themesRes.json()
        if (themesData.success) setPresetThemes(themesData.data)
      }

    } catch (error) {
      console.error('Failed to load style data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateConfig = (path, value) => {
    if (!config) return
    
    const newConfig = { ...config }
    const keys = path.split('.')
    let current = newConfig
    
    // Safely navigate to the target property
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        console.warn(`Path ${path} not found in config`)
        return
      }
      current = current[keys[i]]
    }
    
    const finalKey = keys[keys.length - 1]
    if (current && typeof current === 'object') {
      current[finalKey] = value
      setConfig(newConfig)
      setChanges({ ...changes, [path]: value })
    }
  }

  const saveConfig = async () => {
    setSaving(true)
    try {
      const response = await fetch(`${apiBase}/api/styler/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
      })

      const result = await response.json()
      if (result.success) {
        setChanges({})
        alert('Configuration saved successfully!')
      }
    } catch (error) {
      console.error('Failed to save config:', error)
      alert('Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  const exportConfig = async (format) => {
    try {
      const response = await fetch(`${apiBase}/api/styler/export?format=${format}`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `hunta-styles.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Failed to export:', error)
    }
  }

  const previewChanges = async () => {
    try {
      const response = await fetch(`${apiBase}/api/styler/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config })
      })

      const result = await response.json()
      if (result.success) {
        // Apply CSS to page for preview
        const style = document.createElement('style')
        style.id = 'hunta-preview-styles'
        style.textContent = result.data.css
        
        // Remove existing preview styles
        const existing = document.getElementById('hunta-preview-styles')
        if (existing) existing.remove()
        
        document.head.appendChild(style)
        setPreviewMode(true)
      }
    } catch (error) {
      console.error('Failed to preview:', error)
    }
  }

  const exitPreview = () => {
    const existing = document.getElementById('hunta-preview-styles')
    if (existing) existing.remove()
    setPreviewMode(false)
  }

  const loadThemeToEditorConfig = (themeItem) => {
    // Convert ThemeContext theme to config format
    return {
      theme: themeItem.id,
      colors: Object.entries(themeItem.colors).reduce((acc, [key, value]) => {
        acc[key] = {
          name: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
          value: value,
          rgb: hexToRgb(value),
          usage: getColorUsageDescription(key)
        }
        return acc
      }, {}),
      typography: {
        fontFamily: {
          primary: "'Inter', system-ui, -apple-system, sans-serif",
          secondary: "'Inter', sans-serif",
          mono: "'Fira Code', 'Consolas', monospace"
        },
        fontSize: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.5rem',
          '3xl': '1.875rem',
          '4xl': '2.25rem',
          '5xl': '3rem'
        },
        fontWeight: {
          light: 300,
          normal: 400,
          medium: 500,
          semibold: 600,
          bold: 700
        }
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem',
        '3xl': '4rem'
      },
      borderRadius: {
        none: '0',
        sm: '0.125rem',
        base: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        full: '9999px'
      },
      shadows: {
        none: 'none',
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      },
      components: {
        button: {
          padding: '0.5rem 1rem',
          borderRadius: '0.375rem',
          fontWeight: 500,
          transition: 'all 150ms ease-in-out'
        },
        card: {
          padding: '1.5rem',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          background: themeItem.colors.surface
        },
        input: {
          padding: '0.5rem 0.75rem',
          borderRadius: '0.375rem',
          borderWidth: '1px',
          fontSize: '1rem'
        },
        navbar: {
          height: '4rem',
          background: themeItem.colors.primary,
          color: '#FFFFFF'
        }
      }
    }
  }

  const loadThemeToEditor = (themeItem) => {
    const themeConfig = loadThemeToEditorConfig(themeItem)
    setConfig(themeConfig)
    setActiveTab('colors')
    setChanges({})
  }

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? 
      `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` :
      '0, 0, 0'
  }

  const getColorUsageDescription = (key) => {
    const descriptions = {
      primary: 'Primary brand color, buttons, headers',
      primaryLight: 'Hover states, secondary buttons',
      secondary: 'Accent color, alerts, CTAs',
      background: 'Main background color',
      surface: 'Cards, modals, elevated surfaces',
      text: 'Main text color',
      textSecondary: 'Secondary text, hints',
      border: 'Borders, dividers',
      success: 'Success messages, positive states',
      warning: 'Warning messages, caution states',
      error: 'Error messages, destructive actions'
    }
    return descriptions[key] || 'Custom color'
  }

  const generateCSS = (config) => {
    if (!config) return ''
    
    const { colors, typography, spacing, borderRadius, shadows } = config
    
    let css = ':root {\n'
    
    // Colors
    Object.entries(colors).forEach(([key, color]) => {
      css += `  --color-${camelToKebab(key)}: ${color.value};\n`
      css += `  --color-${camelToKebab(key)}-rgb: ${color.rgb};\n`
    })
    
    // Typography
    css += '\n  /* Typography */\n'
    Object.entries(typography.fontSize).forEach(([key, value]) => {
      css += `  --font-size-${key}: ${value};\n`
    })
    
    // Spacing
    css += '\n  /* Spacing */\n'
    Object.entries(spacing).forEach(([key, value]) => {
      css += `  --spacing-${key}: ${value};\n`
    })
    
    // Border Radius
    css += '\n  /* Border Radius */\n'
    Object.entries(borderRadius).forEach(([key, value]) => {
      css += `  --radius-${key}: ${value};\n`
    })
    
    css += '}\n\n'
    
    // Component styles
    css += generateComponentStyles(config)
    
    return css
  }

  const generateComponentStyles = (config) => {
    const { colors, components } = config
    
    return `
/* Button Styles */
.btn-primary {
  background-color: var(--color-primary);
  color: white;
  padding: ${components.button.padding};
  border-radius: ${components.button.borderRadius};
  font-weight: ${components.button.fontWeight};
  transition: ${components.button.transition};
}

.btn-primary:hover {
  background-color: var(--color-primary-light);
}

/* Card Styles */
.card {
  background: ${components.card.background};
  padding: ${components.card.padding};
  border-radius: ${components.card.borderRadius};
  box-shadow: ${components.card.boxShadow};
}

/* Input Styles */
.input {
  padding: ${components.input.padding};
  border-radius: ${components.input.borderRadius};
  border: ${components.input.borderWidth} solid var(--color-border);
  font-size: ${components.input.fontSize};
}

/* Navbar Styles */
.navbar {
  height: ${components.navbar.height};
  background: ${components.navbar.background};
  color: ${components.navbar.color};
}
`
  }

  const camelToKebab = (str) => {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
  }

  const applyCustomCSS = () => {
    try {
      // Remove existing custom styles
      const existing = document.getElementById('hunta-custom-css')
      if (existing) existing.remove()
      
      // Apply new custom CSS
      const style = document.createElement('style')
      style.id = 'hunta-custom-css'
      style.textContent = customCSS
      document.head.appendChild(style)
      
      alert('Custom CSS applied successfully!')
    } catch (error) {
      console.error('Failed to apply custom CSS:', error)
      alert('Failed to apply custom CSS')
    }
  }

  const ColorPicker = ({ label, value, onChange, description }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <input
            type="color"
            value={value.value}
            onChange={(e) => onChange({ ...value, value: e.target.value })}
            className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
          />
          <input
            type="text"
            value={value.value}
            onChange={(e) => onChange({ ...value, value: e.target.value })}
            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded font-mono"
          />
        </div>
        <div className="text-sm text-gray-600 flex-1">{description}</div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg text-gray-600">Loading UI styler...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-hunta-green">🎨 UI Style Manager</h1>
          <p className="text-gray-600 mt-2">
            Customize the visual appearance of the Hunta platform.
          </p>
        </div>
        <div className="flex space-x-2">
          {!previewMode ? (
            <>
              <button
                onClick={previewChanges}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                👁️ Preview
              </button>
              <button
                onClick={saveConfig}
                disabled={saving || Object.keys(changes).length === 0}
                className="px-4 py-2 bg-hunta-green text-white rounded-md hover:bg-hunta-green-light disabled:opacity-50"
              >
                {saving ? '💾 Saving...' : '💾 Save Changes'}
              </button>
            </>
          ) : (
            <button
              onClick={exitPreview}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              ❌ Exit Preview
            </button>
          )}
        </div>
      </div>

      {previewMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <span className="text-blue-800">👁️</span>
            <span className="text-blue-800 font-medium">Preview Mode Active</span>
            <span className="text-blue-600">- Changes are temporarily applied to this page</span>
          </div>
        </div>
      )}

      {Object.keys(changes).length > 0 && !previewMode && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-yellow-800">⚠️</span>
              <span className="text-yellow-800 font-medium">Unsaved Changes</span>
              <span className="text-yellow-600">- {Object.keys(changes).length} modifications pending</span>
            </div>
            <button
              onClick={() => setChanges({})}
              className="text-yellow-800 hover:text-yellow-900 text-sm underline"
            >
              Discard Changes
            </button>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'colors', name: 'Colors', icon: '🎨' },
            { id: 'typography', name: 'Typography', icon: '📝' },
            { id: 'spacing', name: 'Spacing', icon: '📏' },
            { id: 'components', name: 'Components', icon: '🧩' },
            { id: 'themes', name: 'Themes', icon: '🎭' },
            { id: 'css', name: 'CSS Editor', icon: '💻' },
            { id: 'export', name: 'Export', icon: '📤' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-1 ${
                activeTab === tab.id
                  ? 'border-hunta-green text-hunta-green'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Colors Tab */}
      {activeTab === 'colors' && config && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-hunta-green">🎨 Color Palette</h2>
              
              <div className="space-y-4">
                <ColorPicker
                  label="Primary Color"
                  value={config.colors.primary}
                  onChange={(value) => updateConfig('colors.primary', value)}
                  description="Main brand color used for buttons and headers"
                />
                
                <ColorPicker
                  label="Primary Light"
                  value={config.colors.primaryLight}
                  onChange={(value) => updateConfig('colors.primaryLight', value)}
                  description="Lighter variant for hover states"
                />
                
                <ColorPicker
                  label="Secondary Color"
                  value={config.colors.secondary}
                  onChange={(value) => updateConfig('colors.secondary', value)}
                  description="Accent color for CTAs and alerts"
                />
                
                <ColorPicker
                  label="Background"
                  value={config.colors.background}
                  onChange={(value) => updateConfig('colors.background', value)}
                  description="Main page background"
                />
                
                <ColorPicker
                  label="Surface"
                  value={config.colors.surface}
                  onChange={(value) => updateConfig('colors.surface', value)}
                  description="Cards and elevated surfaces"
                />
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-xl font-bold text-hunta-green">🔤 Text Colors</h2>
              
              <div className="space-y-4">
                <ColorPicker
                  label="Primary Text"
                  value={config.colors.text}
                  onChange={(value) => updateConfig('colors.text', value)}
                  description="Main text color"
                />
                
                <ColorPicker
                  label="Secondary Text"
                  value={config.colors.textSecondary}
                  onChange={(value) => updateConfig('colors.textSecondary', value)}
                  description="Secondary text and hints"
                />
                
                <ColorPicker
                  label="Border"
                  value={config.colors.border}
                  onChange={(value) => updateConfig('colors.border', value)}
                  description="Borders and dividers"
                />
              </div>

              <h2 className="text-xl font-bold text-hunta-green">🚦 Status Colors</h2>
              
              <div className="space-y-4">
                <ColorPicker
                  label="Success"
                  value={config.colors.success}
                  onChange={(value) => updateConfig('colors.success', value)}
                  description="Success messages and positive states"
                />
                
                <ColorPicker
                  label="Warning"
                  value={config.colors.warning}
                  onChange={(value) => updateConfig('colors.warning', value)}
                  description="Warning messages"
                />
                
                <ColorPicker
                  label="Error"
                  value={config.colors.error}
                  onChange={(value) => updateConfig('colors.error', value)}
                  description="Error messages and destructive actions"
                />
              </div>
            </div>
          </div>

          {/* Color Preview */}
          <div className="card">
            <h3 className="text-lg font-bold mb-4">Color Preview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Object.entries(config.colors).map(([key, color]) => (
                <div key={key} className="text-center">
                  <div
                    className="w-full h-16 rounded-lg border border-gray-200 mb-2"
                    style={{ backgroundColor: color.value }}
                  />
                  <div className="text-sm font-medium">{color.name}</div>
                  <div className="text-xs text-gray-500 font-mono">{color.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Typography Tab */}
      {activeTab === 'typography' && config && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-hunta-green">📝 Typography Settings</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="card">
                <h3 className="text-lg font-bold mb-4">Font Families</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Primary Font</label>
                    <input
                      type="text"
                      value={config.typography.fontFamily.primary}
                      onChange={(e) => updateConfig('typography.fontFamily.primary', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Monospace Font</label>
                    <input
                      type="text"
                      value={config.typography.fontFamily.mono}
                      onChange={(e) => updateConfig('typography.fontFamily.mono', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-bold mb-4">Font Sizes</h3>
                <div className="space-y-3">
                  {Object.entries(config.typography.fontSize).map(([size, value]) => (
                    <div key={size} className="flex items-center space-x-3">
                      <label className="w-12 text-sm font-medium text-gray-700">{size}</label>
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => updateConfig(`typography.fontSize.${size}`, e.target.value)}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm font-mono"
                      />
                      <div className="text-gray-500 text-sm w-16">
                        {Math.round(parseFloat(value) * 16)}px
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="card">
                <h3 className="text-lg font-bold mb-4">Typography Preview</h3>
                <div className="space-y-4">
                  <div style={{ fontSize: config.typography.fontSize['5xl'], fontWeight: config.typography.fontWeight.bold }}>
                    Heading 1 (5xl)
                  </div>
                  <div style={{ fontSize: config.typography.fontSize['3xl'], fontWeight: config.typography.fontWeight.bold }}>
                    Heading 2 (3xl)
                  </div>
                  <div style={{ fontSize: config.typography.fontSize['xl'], fontWeight: config.typography.fontWeight.semibold }}>
                    Heading 3 (xl)
                  </div>
                  <div style={{ fontSize: config.typography.fontSize.base, fontWeight: config.typography.fontWeight.normal }}>
                    Body text (base) - This is regular paragraph text that would appear throughout the application.
                  </div>
                  <div style={{ fontSize: config.typography.fontSize.sm, fontWeight: config.typography.fontWeight.normal, color: config.colors.textSecondary.value }}>
                    Small text (sm) - Secondary information and captions.
                  </div>
                  <div style={{ fontFamily: config.typography.fontFamily.mono, fontSize: config.typography.fontSize.sm }}>
                    Monospace text - Code snippets and technical data.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Themes Tab */}
      {activeTab === 'themes' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-hunta-green">🎭 Theme Gallery</h2>
            <div className="text-sm text-gray-600">
              Current: <span className="font-medium text-hunta-green">{theme?.name}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.values(contextThemes).map((themeItem) => (
              <div key={themeItem.id} className={`card hover:shadow-lg transition-shadow ${currentTheme === themeItem.id ? 'ring-2 ring-hunta-green' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold">{themeItem.name}</h3>
                  <div className="flex space-x-1">
                    <div
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: themeItem.colors.primary }}
                    />
                    <div
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: themeItem.colors.secondary }}
                    />
                    <div
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: themeItem.colors.background }}
                    />
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-4">{themeItem.description}</p>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => changeTheme(themeItem.id)}
                    className={`flex-1 px-3 py-2 rounded-md transition-colors ${
                      currentTheme === themeItem.id 
                        ? 'bg-hunta-green text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {currentTheme === themeItem.id ? '✓ Active' : 'Apply Theme'}
                  </button>
                  <button 
                    onClick={() => loadThemeToEditor(themeItem)}
                    className="px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>

          {presetThemes.length > 0 && (
            <>
              <h3 className="text-lg font-bold text-hunta-green mt-8">🎨 Custom Themes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {presetThemes.map((themeItem) => (
                  <div key={themeItem.id} className="card hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold">{themeItem.name}</h3>
                      <div className="flex space-x-1">
                        <div
                          className="w-4 h-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: themeItem.preview.primary }}
                        />
                        <div
                          className="w-4 h-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: themeItem.preview.secondary }}
                        />
                        <div
                          className="w-4 h-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: themeItem.preview.background }}
                        />
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">{themeItem.description}</p>
                    <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
                      Apply Theme
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Spacing Tab */}
      {activeTab === 'spacing' && config && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-hunta-green">📏 Spacing Settings</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="card">
                <h3 className="text-lg font-bold mb-4">Spacing Scale</h3>
                <div className="space-y-3">
                  {Object.entries(config.spacing).map(([size, value]) => (
                    <div key={size} className="flex items-center space-x-3">
                      <label className="w-8 text-sm font-medium text-gray-700">{size}</label>
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => updateConfig(`spacing.${size}`, e.target.value)}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm font-mono"
                      />
                      <div className="text-gray-500 text-sm w-12">
                        {Math.round(parseFloat(value) * 16)}px
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-bold mb-4">Border Radius</h3>
                <div className="space-y-3">
                  {Object.entries(config.borderRadius).map(([size, value]) => (
                    <div key={size} className="flex items-center space-x-3">
                      <label className="w-8 text-sm font-medium text-gray-700">{size}</label>
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => updateConfig(`borderRadius.${size}`, e.target.value)}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm font-mono"
                      />
                      <div 
                        className="w-8 h-8 bg-hunta-green border-2 border-gray-300" 
                        style={{ borderRadius: value }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="card">
                <h3 className="text-lg font-bold mb-4">Spacing Preview</h3>
                <div className="space-y-4">
                  {Object.entries(config.spacing).map(([size, value]) => (
                    <div key={size} className="flex items-center space-x-4">
                      <span className="text-sm font-medium w-8">{size}</span>
                      <div 
                        className="bg-hunta-green h-4"
                        style={{ width: value }}
                      />
                      <span className="text-sm text-gray-500">{value} ({Math.round(parseFloat(value) * 16)}px)</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-bold mb-4">Shadow Effects</h3>
                <div className="space-y-4">
                  {Object.entries(config.shadows).map(([size, value]) => (
                    <div key={size} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{size}</span>
                      <div 
                        className="w-16 h-8 bg-white border border-gray-200 rounded"
                        style={{ boxShadow: value }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Components Tab */}
      {activeTab === 'components' && config && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-hunta-green">🧩 Component Styles</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="card">
                <h3 className="text-lg font-bold mb-4">Button Component</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Padding</label>
                    <input
                      type="text"
                      value={config.components.button.padding}
                      onChange={(e) => updateConfig('components.button.padding', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Border Radius</label>
                    <input
                      type="text"
                      value={config.components.button.borderRadius}
                      onChange={(e) => updateConfig('components.button.borderRadius', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Font Weight</label>
                    <select
                      value={config.components.button.fontWeight}
                      onChange={(e) => updateConfig('components.button.fontWeight', parseInt(e.target.value))}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="300">Light (300)</option>
                      <option value="400">Normal (400)</option>
                      <option value="500">Medium (500)</option>
                      <option value="600">Semibold (600)</option>
                      <option value="700">Bold (700)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-bold mb-4">Card Component</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Padding</label>
                    <input
                      type="text"
                      value={config.components.card.padding}
                      onChange={(e) => updateConfig('components.card.padding', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Border Radius</label>
                    <input
                      type="text"
                      value={config.components.card.borderRadius}
                      onChange={(e) => updateConfig('components.card.borderRadius', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Background</label>
                    <input
                      type="color"
                      value={config.components.card.background}
                      onChange={(e) => updateConfig('components.card.background', e.target.value)}
                      className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="card">
                <h3 className="text-lg font-bold mb-4">Component Preview</h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Button</h4>
                    <button 
                      className="bg-hunta-green text-white hover:bg-hunta-green-light transition-colors"
                      style={{
                        padding: config.components.button.padding,
                        borderRadius: config.components.button.borderRadius,
                        fontWeight: config.components.button.fontWeight
                      }}
                    >
                      Sample Button
                    </button>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Card</h4>
                    <div 
                      className="border border-gray-200"
                      style={{
                        padding: config.components.card.padding,
                        borderRadius: config.components.card.borderRadius,
                        background: config.components.card.background,
                        boxShadow: config.components.card.boxShadow
                      }}
                    >
                      <h5 className="font-bold mb-2">Card Title</h5>
                      <p className="text-gray-600">This is a sample card with your current styling.</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Input</h4>
                    <input 
                      type="text"
                      placeholder="Sample input field"
                      className="border-gray-300 focus:ring-hunta-green focus:border-hunta-green"
                      style={{
                        padding: config.components.input.padding,
                        borderRadius: config.components.input.borderRadius,
                        fontSize: config.components.input.fontSize
                      }}
                    />
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Navbar</h4>
                    <div 
                      className="text-white px-4 py-2 rounded"
                      style={{
                        height: config.components.navbar.height,
                        background: config.components.navbar.background,
                        color: config.components.navbar.color
                      }}
                    >
                      <div className="flex items-center h-full">
                        <span className="font-bold">🦌 Hunta</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS Editor Tab */}
      {activeTab === 'css' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-hunta-green">💻 Custom CSS Editor</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  const css = generateCSS(config)
                  setCustomCSS(css)
                }}
                className="px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm"
              >
                Load Current Config
              </button>
              <button
                onClick={applyCustomCSS}
                className="px-3 py-2 bg-hunta-green text-white rounded-md hover:bg-hunta-green-light text-sm"
              >
                Apply CSS
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-bold">CSS Code</h3>
              <div className="relative">
                <textarea
                  value={customCSS}
                  onChange={(e) => setCustomCSS(e.target.value)}
                  className="w-full h-96 p-4 font-mono text-sm border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-hunta-green focus:border-transparent"
                  placeholder="/* Enter your custom CSS here */
:root {
  --color-primary: #2D5530;
  --color-secondary: #D97706;
}

.custom-button {
  background: var(--color-primary);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
}

.custom-button:hover {
  background: var(--color-primary-light);
}"
                />
                <div className="absolute top-2 right-2 text-xs text-gray-500 bg-white px-2 py-1 rounded">
                  CSS
                </div>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Valid CSS</span>
                </div>
                <div>Lines: {customCSS.split('\n').length}</div>
                <div>Characters: {customCSS.length}</div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-bold">Live Preview</h3>
              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Buttons</h4>
                    <div className="flex space-x-2">
                      <button className="custom-button">Custom Button</button>
                      <button className="btn-primary">Primary Button</button>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Cards</h4>
                    <div className="card max-w-xs">
                      <h5 className="font-bold mb-2">Sample Card</h5>
                      <p className="text-gray-600">This card uses the current theme styling.</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Form Elements</h4>
                    <input type="text" placeholder="Sample input" className="input w-full max-w-xs" />
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Text Elements</h4>
                    <div className="space-y-2">
                      <h1 className="text-2xl font-bold text-hunta-green">Heading 1</h1>
                      <h2 className="text-xl font-semibold">Heading 2</h2>
                      <p className="text-gray-600">Regular paragraph text with secondary color.</p>
                      <p className="text-sm text-gray-500">Small text for captions and notes.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">💡 CSS Tips</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Use CSS custom properties: <code className="bg-yellow-100 px-1 rounded">var(--color-primary)</code></li>
                  <li>• Target theme classes: <code className="bg-yellow-100 px-1 rounded">.theme-midnight .card</code></li>
                  <li>• Override component styles: <code className="bg-yellow-100 px-1 rounded">.btn-primary</code></li>
                  <li>• Use existing utility classes for consistency</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Tab */}
      {activeTab === 'export' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-hunta-green">📤 Export Styles</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card text-center">
              <div className="text-4xl mb-3">📄</div>
              <h3 className="text-lg font-bold mb-2">CSS</h3>
              <p className="text-gray-600 text-sm mb-4">
                Export as CSS custom properties for direct use in web projects.
              </p>
              <button
                onClick={() => exportConfig('css')}
                className="w-full px-4 py-2 bg-hunta-green text-white rounded-md hover:bg-hunta-green-light"
              >
                Download CSS
              </button>
            </div>

            <div className="card text-center">
              <div className="text-4xl mb-3">📊</div>
              <h3 className="text-lg font-bold mb-2">JSON</h3>
              <p className="text-gray-600 text-sm mb-4">
                Export configuration as JSON for programmatic usage.
              </p>
              <button
                onClick={() => exportConfig('json')}
                className="w-full px-4 py-2 bg-hunta-green text-white rounded-md hover:bg-hunta-green-light"
              >
                Download JSON
              </button>
            </div>

            <div className="card text-center">
              <div className="text-4xl mb-3">🎨</div>
              <h3 className="text-lg font-bold mb-2">SCSS</h3>
              <p className="text-gray-600 text-sm mb-4">
                Export as SCSS variables for Sass-based projects.
              </p>
              <button
                onClick={() => exportConfig('scss')}
                className="w-full px-4 py-2 bg-hunta-green text-white rounded-md hover:bg-hunta-green-light"
              >
                Download SCSS
              </button>
            </div>

            <div className="card text-center">
              <div className="text-4xl mb-3">🌊</div>
              <h3 className="text-lg font-bold mb-2">Tailwind</h3>
              <p className="text-gray-600 text-sm mb-4">
                Export as Tailwind CSS configuration file.
              </p>
              <button
                onClick={() => exportConfig('tailwind')}
                className="w-full px-4 py-2 bg-hunta-green text-white rounded-md hover:bg-hunta-green-light"
              >
                Download Config
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StylerPage