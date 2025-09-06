'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'

export function MobileMenuDebug() {
  const [isOpen, setIsOpen] = useState(false)
  const [clickCount, setClickCount] = useState(0)

  const handleToggle = () => {
    console.log('🔥 DEBUG: Mobile menu toggle clicked!', new Date().toISOString())
    setClickCount(prev => prev + 1)
    setIsOpen(prev => {
      const newState = !prev
      console.log('🔥 DEBUG: Menu state changed from', prev, 'to', newState)
      return newState
    })
  }

  const handleMenuItemClick = (item: string) => {
    console.log('🔥 DEBUG: Menu item clicked:', item)
    setIsOpen(false)
  }

  return (
    <div className="fixed top-16 right-4 z-[50] bg-white border-2 border-red-500 rounded-lg p-4 shadow-xl" style={{ pointerEvents: 'auto' }}>
      <div className="text-xs text-red-600 mb-2">
        DEBUG COMPONENT - Clicks: {clickCount}
      </div>
      
      {/* Debug Mobile Menu Button */}
      <button
        onClick={handleToggle}
        className="bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
        style={{ 
          pointerEvents: 'auto',
          touchAction: 'manipulation',
          zIndex: 300
        }}
        type="button"
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Debug Mobile Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-[250]">
          <div className="p-4 space-y-2">
            <div className="text-xs text-gray-500 mb-2">DEBUG MENU - Should be clickable:</div>
            <button
              onClick={() => handleMenuItemClick('Home')}
              className="w-full text-left p-2 hover:bg-gray-100 rounded min-h-[44px] flex items-center"
              style={{ pointerEvents: 'auto', touchAction: 'manipulation' }}
            >
              🏠 Home
            </button>
            <button
              onClick={() => handleMenuItemClick('About')}
              className="w-full text-left p-2 hover:bg-gray-100 rounded min-h-[44px] flex items-center"
              style={{ pointerEvents: 'auto', touchAction: 'manipulation' }}
            >
              ℹ️ About
            </button>
            <button
              onClick={() => handleMenuItemClick('Contact')}
              className="w-full text-left p-2 hover:bg-gray-100 rounded min-h-[44px] flex items-center"
              style={{ pointerEvents: 'auto', touchAction: 'manipulation' }}
            >
              📧 Contact
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Component to test pointer event interception
export function PointerEventsTester() {
  const [clicks, setClicks] = useState<Array<{x: number, y: number, target: string, timestamp: string}>>([])

  const handleClick = (e: React.MouseEvent) => {
    const click = {
      x: e.clientX,
      y: e.clientY,
      target: (e.target as Element).tagName + '.' + (e.target as Element).className,
      timestamp: new Date().toISOString()
    }
    console.log('🎯 CLICK DETECTED:', click)
    setClicks(prev => [click, ...prev.slice(0, 4)])
  }

  return (
    <div 
      className="fixed bottom-4 right-4 z-[200] bg-yellow-100 border-2 border-yellow-500 rounded-lg p-4 max-w-sm"
      onClick={handleClick}
    >
      <div className="text-xs font-bold mb-2">POINTER EVENTS DEBUG</div>
      <div className="text-xs space-y-1 max-h-32 overflow-y-auto">
        {clicks.length === 0 ? (
          <div>Click anywhere to test...</div>
        ) : (
          clicks.map((click, i) => (
            <div key={i} className="text-xs">
              {i + 1}. ({click.x}, {click.y}) on {click.target.substring(0, 20)}...
            </div>
          ))
        )}
      </div>
    </div>
  )
}