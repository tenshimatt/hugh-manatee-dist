import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import ThemeSelector from './ThemeSelector.jsx'

const Navbar = () => {
  const location = useLocation()
  
  const navLinks = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/dogs', label: 'Pack', icon: '🐕' },
    { path: '/routes', label: 'Routes', icon: '🗺️' },
    { path: '/events', label: 'Events', icon: '🏆' },
    { path: '/gear', label: 'Gear', icon: '⚡' },
    { path: '/ethics', label: 'Ethics', icon: '📚' },
    { path: '/posts', label: 'Brag Board', icon: '📸' },
  ]

  const managementLinks = [
    { path: '/analytics', label: 'Analytics', icon: '📊' },
    { path: '/styler', label: 'UI Styler', icon: '🎨' },
  ]

  return (
    <nav className="hunting-bg shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-white">🎯 HUNTA</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === link.path
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="mr-1">{link.icon}</span>
                {link.label}
              </Link>
            ))}
            
            {/* Management Section */}
            <div className="ml-4 pl-4 border-l border-white/20">
              {managementLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ml-1 ${
                    location.pathname === link.path
                      ? 'bg-white/20 text-white'
                      : 'text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="mr-1">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
            </div>
            
            {/* Theme Selector */}
            <ThemeSelector />
          </div>

          {/* Mobile theme selector and menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeSelector />
            <button className="text-white p-2">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div className="md:hidden pb-4">
          <div className="flex flex-wrap gap-2 mb-3">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-1 rounded text-sm ${
                  location.pathname === link.path
                    ? 'bg-white/20 text-white'
                    : 'text-white/80'
                }`}
              >
                {link.icon} {link.label}
              </Link>
            ))}
          </div>
          <div className="border-t border-white/20 pt-3">
            <div className="text-white/60 text-xs font-medium mb-2 px-3">MANAGEMENT</div>
            <div className="flex flex-wrap gap-2">
              {managementLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-1 rounded text-sm ${
                    location.pathname === link.path
                      ? 'bg-white/20 text-white'
                      : 'text-white/60'
                  }`}
                >
                  {link.icon} {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar