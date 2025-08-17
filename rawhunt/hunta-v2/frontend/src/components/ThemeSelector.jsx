import React, { useState, useRef, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext.jsx'

const ThemeSelector = () => {
  const { currentTheme, theme, themes, changeTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleThemeSelect = (themeId) => {
    changeTheme(themeId)
    setIsOpen(false)
  }

  const ColorPreview = ({ colors, size = 'small' }) => {
    const sizeClasses = size === 'small' ? 'w-3 h-3' : 'w-4 h-4'
    
    return (
      <div className="flex space-x-1">
        <div 
          className={`${sizeClasses} rounded-full border border-white/50`}
          style={{ backgroundColor: colors.primary }}
        />
        <div 
          className={`${sizeClasses} rounded-full border border-white/50`}
          style={{ backgroundColor: colors.secondary }}
        />
        <div 
          className={`${sizeClasses} rounded-full border border-white/50`}
          style={{ backgroundColor: colors.text }}
        />
      </div>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Theme Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors"
        title="Change Theme"
      >
        <span className="text-sm">🎨</span>
        <ColorPreview colors={theme.colors} />
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-auto">
          <div className="p-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Choose Theme</h3>
            <p className="text-xs text-gray-600">Select a color palette for the entire site</p>
          </div>
          
          <div className="p-2">
            {Object.values(themes).map((themeOption) => (
              <button
                key={themeOption.id}
                onClick={() => handleThemeSelect(themeOption.id)}
                className={`w-full flex items-center space-x-3 px-3 py-3 rounded-md transition-colors ${
                  currentTheme === themeOption.id
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                {/* Theme Preview Colors */}
                <div className="flex flex-col items-center space-y-1">
                  <ColorPreview colors={themeOption.colors} size="large" />
                  {currentTheme === themeOption.id && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </div>

                {/* Theme Info */}
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      {themeOption.name}
                    </span>
                    {currentTheme === themeOption.id && (
                      <span className="text-xs text-blue-600 font-medium">ACTIVE</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {themeOption.description}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-100 bg-gray-50 rounded-b-lg">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Theme changes apply instantly</span>
              <span>{Object.keys(themes).length} themes available</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ThemeSelector