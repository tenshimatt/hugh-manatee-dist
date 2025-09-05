'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Menu, 
  X, 
  ChevronDown, 
  Coins, 
  Sun, 
  Moon,
  Heart,
  Calculator,
  Stethoscope,
  Users,
  MapPin,
  ShoppingCart,
  BookOpen,
  Crown,
  Bot
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'AI Assistant', href: '/chat', icon: Bot },
  {
    name: 'Pet Management',
    href: '#',
    icon: Heart,
    children: [
      { name: 'Pet Profiles & Multi-Pet Dashboard', href: '/dashboard/pets', description: 'Manage multiple pets with detailed profiles' },
      { name: 'Add New Pet', href: '/dashboard/pets/add', description: '5-step pet setup with photo & health info' },
      { name: 'Pet Health Records', href: '/dashboard/health', description: 'Comprehensive health tracking system' },
      { name: 'Feeding Schedules', href: '/dashboard/feeding', description: 'Customized feeding plans & schedules' },
    ],
  },
  {
    name: 'Smart Feeding',
    href: '#',
    icon: Calculator,
    children: [
      { name: 'AI Feeding Calculator', href: '/dashboard/feeding/calculator', description: 'Personalized portions with RER calculations' },
      { name: 'Meal Planning & Prep', href: '/dashboard/feeding/planner', description: 'Weekly meal planning with prep guides' },
      { name: 'Portion Control', href: '/dashboard/feeding/portions', description: 'Weight-based portion recommendations' },
      { name: 'Nutritional Analysis', href: '/dashboard/feeding/analysis', description: 'Macro & micro nutrient tracking' },
    ],
  },
  {
    name: 'Health & Wellness',
    href: '#',
    icon: Stethoscope,
    children: [
      { name: 'Health Tracking Dashboard', href: '/dashboard/health', description: 'Complete health monitoring with AI insights' },
      { name: 'Symptom Monitoring', href: '/dashboard/health/symptoms', description: 'Track symptoms with severity levels' },
      { name: 'Medication Management', href: '/dashboard/health/medication', description: 'Medication tracking & reminders' },
      { name: 'Vet Appointments', href: '/dashboard/health/appointments', description: 'Schedule & manage vet visits' },
      { name: 'AI Health Insights', href: '/dashboard/health/insights', description: 'Predictive health recommendations' },
    ],
  },
  {
    name: 'Community & Social',
    href: '#',
    icon: Users,
    children: [
      { name: 'Community Hub', href: '/community', description: '12,000+ member community with experts' },
      { name: 'Challenges & Competitions', href: '/community/challenges', description: 'PAWS token challenges & competitions' },
      { name: 'Expert Network', href: '/community/experts', description: 'Certified veterinarians & nutritionists' },
      { name: 'Recipe Exchange', href: '/community/recipes', description: 'Share & discover raw food recipes' },
      { name: 'Success Stories', href: '/community/stories', description: 'Real transformation stories from users' },
    ],
  },
  {
    name: 'Location Services',
    href: '#',
    icon: MapPin,
    children: [
      { name: 'Store & Supplier Finder', href: '/locations', description: 'Find local raw food suppliers & stores' },
      { name: 'Veterinarian Directory', href: '/locations/vets', description: 'Raw-feeding friendly veterinarians' },
      { name: 'Emergency Services', href: '/locations/emergency', description: '24/7 emergency veterinary services' },
      { name: 'Local Raw Food Sources', href: '/locations/suppliers', description: 'Farm-direct suppliers & butchers' },
    ],
  },
  {
    name: 'Shop & Marketplace',
    href: '#',
    icon: ShoppingCart,
    children: [
      { name: 'Raw Food Marketplace', href: '/shop', description: 'Premium raw food products & ingredients' },
      { name: 'Bulk Ordering', href: '/shop/bulk', description: 'Wholesale pricing for bulk orders' },
      { name: 'Subscription Boxes', href: '/shop/subscriptions', description: 'Monthly curated raw food deliveries' },
      { name: 'Equipment & Supplies', href: '/shop/equipment', description: 'Grinders, storage & feeding equipment' },
    ],
  },
  {
    name: 'Education & Learning',
    href: '#',
    icon: BookOpen,
    children: [
      { name: 'Getting Started Guide', href: '/learn/getting-started', description: 'Complete beginner guide to raw feeding' },
      { name: 'Video Courses', href: '/learn/courses', description: 'Expert-led video courses & tutorials' },
      { name: 'Raw Feeding Guides', href: '/learn/guides', description: 'Comprehensive guides for all pet types' },
      { name: 'Expert Webinars', href: '/learn/webinars', description: 'Live Q&A sessions with experts' },
      { name: 'Blog & Articles', href: '/blog', description: 'Latest research & feeding insights' },
    ],
  },
  {
    name: 'PAWS Ecosystem',
    href: '#',
    icon: Crown,
    children: [
      { name: 'PAWS Token Dashboard', href: '/paws', description: 'Track earnings, staking & token balance' },
      { name: 'Earn & Stake Tokens', href: '/paws/earn', description: 'Earn tokens through activities & challenges' },
      { name: 'Token Rewards Program', href: '/paws/rewards', description: 'Redeem tokens for products & services' },
      { name: 'NFT Collection', href: '/paws/nfts', description: 'Exclusive pet-themed NFT collectibles' },
      { name: 'Governance & Voting', href: '/paws/governance', description: 'Vote on platform decisions & features' },
    ],
  },
]

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [activeDesktopDropdown, setActiveDesktopDropdown] = useState<string | null>(null)
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // Ensure client-side rendering to prevent hydration mismatches
  useEffect(() => {
    setIsClient(true)
    setMounted(true)
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    
    // Close mobile menu on resize to desktop, close desktop dropdowns on resize to mobile
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false)
        setExpandedSection(null)
      } else {
        setActiveDesktopDropdown(null)
      }
    }
    
    // Close mobile menu and desktop dropdowns when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (mobileMenuOpen && !target.closest('nav') && !target.closest('#mobile-navigation-menu')) {
        setMobileMenuOpen(false)
        setExpandedSection(null)
      }
      // Close desktop dropdowns when clicking outside
      if (activeDesktopDropdown && !target.closest('.desktop-dropdown-container')) {
        setActiveDesktopDropdown(null)
      }
    }
    
    // Handle keyboard navigation for accessibility
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (mobileMenuOpen) {
          setMobileMenuOpen(false)
          setExpandedSection(null)
        }
        if (activeDesktopDropdown) {
          setActiveDesktopDropdown(null)
        }
      }
    }
    
    window.addEventListener('scroll', handleScroll)
    window.addEventListener('resize', handleResize)
    document.addEventListener('click', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [mobileMenuOpen, activeDesktopDropdown])

  // Memoized handlers to ensure consistent references
  const handleMobileMenuToggle = useCallback(() => {
    setMobileMenuOpen(prev => !prev)
    // Close desktop dropdowns when opening mobile menu
    setActiveDesktopDropdown(null)
  }, [])

  const handleThemeToggle = useCallback(() => {
    if (theme === 'dark') {
      setTheme('light')
    } else {
      setTheme('dark')
    }
  }, [theme, setTheme])

  const handleMobileMenuClose = useCallback(() => {
    setMobileMenuOpen(false)
    setExpandedSection(null)
  }, [])

  const handleSectionToggle = useCallback((sectionName: string) => {
    setExpandedSection(prev => prev === sectionName ? null : sectionName)
  }, [])

  const handleDesktopDropdownToggle = useCallback((sectionName: string, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }
    setActiveDesktopDropdown(prev => prev === sectionName ? null : sectionName)
  }, [])

  const handleDesktopDropdownHover = useCallback((sectionName: string | null) => {
    setActiveDesktopDropdown(sectionName)
  }, [])

  const handleDesktopDropdownClose = useCallback(() => {
    setActiveDesktopDropdown(null)
  }, [])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mobileMenuOpen])

  // Don't render until client-side to avoid hydration issues

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? 'bg-background/95 backdrop-blur-sm border-b shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <nav className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="text-3xl">🐾</div>
            <span className="text-2xl font-heading font-bold text-gradient-brand">RAWGLE</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navigation.map((item) => (
              <div key={item.name} className="relative desktop-dropdown-container">
                {item.children ? (
                  <>
                    <button 
                      onClick={(e) => handleDesktopDropdownToggle(item.name, e)}
                      onMouseEnter={() => handleDesktopDropdownHover(item.name)}
                      className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
                      type="button"
                      aria-expanded={activeDesktopDropdown === item.name}
                      aria-haspopup="true"
                    >
                      {item.icon && <item.icon className="w-4 h-4" />}
                      {item.name}
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
                        activeDesktopDropdown === item.name ? 'rotate-180' : ''
                      }`} />
                    </button>
                    <div 
                      className={`absolute top-full left-0 mt-2 w-80 transition-all duration-200 z-50 ${
                        activeDesktopDropdown === item.name 
                          ? 'opacity-100 visible' 
                          : 'opacity-0 invisible pointer-events-none'
                      }`}
                      onMouseEnter={() => handleDesktopDropdownHover(item.name)}
                      onMouseLeave={() => handleDesktopDropdownHover(null)}
                    >
                      <div className="bg-card dark:bg-popover rounded-lg shadow-xl border border-border dark:border-border p-3 max-h-96 overflow-y-auto">
                        <div className="mb-3 pb-2 border-b border-border dark:border-border">
                          <div className="flex items-center text-sm font-semibold text-card-foreground dark:text-popover-foreground">
                            {item.icon && <item.icon className="w-5 h-5 mr-2 text-primary" />}
                            {item.name}
                          </div>
                        </div>
                        {item.children.map((child) => (
                          <Link
                            key={child.name}
                            href={child.href}
                            onClick={handleDesktopDropdownClose}
                            className="block px-3 py-3 text-sm rounded-lg hover:bg-accent dark:hover:bg-accent transition-colors border-b border-border/30 dark:border-border/30 last:border-b-0"
                          >
                            <div className="font-medium text-card-foreground dark:text-popover-foreground mb-1">{child.name}</div>
                            {child.description && (
                              <div className="text-xs text-muted-foreground dark:text-muted-foreground">{child.description}</div>
                            )}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className={`text-sm font-medium transition-colors ${
                      pathname === item.href
                        ? 'text-primary'
                        : 'hover:text-primary'
                    }`}
                  >
                    {item.name}
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle - Only show after client-side hydration */}
            {isClient && mounted && (
              <button
                onClick={handleThemeToggle}
                className="p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                type="button"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>
            )}

            {/* Desktop Auth Buttons */}
            <div className="hidden lg:flex items-center gap-3">
              <Link href="/auth/login">
                <Button variant="outline" className="min-h-[44px] px-6">Sign In</Button>
              </Link>
              <Link href="/auth/register">
                <Button className="min-h-[44px] px-6 bg-pumpkin hover:bg-pumpkin/90">
                  Get Started
                  <Coins className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={handleMobileMenuToggle}
              className="lg:hidden p-2 rounded-lg hover:bg-muted transition-all duration-200 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2"
              type="button"
              aria-label={mobileMenuOpen ? 'Close mobile menu' : 'Open mobile menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation-menu"
            >
              <AnimatePresence mode="wait">
                {mobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="w-6 h-6" aria-hidden="true" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="w-6 h-6" aria-hidden="true" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            id="mobile-navigation-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="lg:hidden bg-background/95 backdrop-blur-sm border-b shadow-lg"
            role="navigation"
            aria-label="Mobile navigation menu"
          >
            <div className="container mx-auto px-4 py-4">
              <div className="max-h-[calc(100vh-80px)] overflow-y-auto scrollbar-hide">
                <div className="space-y-3">
                  {navigation.map((item) => (
                    <div key={item.name} className="border-b border-border/50 last:border-b-0 pb-3 last:pb-0">
                      {item.children ? (
                        <div className="space-y-2">
                          <button
                            onClick={() => handleSectionToggle(item.name)}
                            className="w-full flex items-center justify-between p-3 rounded-lg text-left font-medium text-sm hover:bg-muted transition-all duration-200 cursor-pointer min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary/50"
                            type="button"
                            aria-expanded={expandedSection === item.name}
                            aria-controls={`mobile-section-${item.name.replace(/\s+/g, '-').toLowerCase()}`}
                          >
                            <div className="flex items-center gap-2">
                              {item.icon && <item.icon className="w-5 h-5 text-primary" aria-hidden="true" />}
                              <span>{item.name}</span>
                            </div>
                            <motion.div
                              animate={{ rotate: expandedSection === item.name ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ChevronDown className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                            </motion.div>
                          </button>
                          <AnimatePresence>
                            {expandedSection === item.name && (
                              <motion.div
                                id={`mobile-section-${item.name.replace(/\s+/g, '-').toLowerCase()}`}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="pl-6 space-y-2 overflow-hidden"
                              >
                                {item.children.map((child) => (
                                  <Link
                                    key={child.name}
                                    href={child.href}
                                    className="block p-3 text-sm rounded-lg hover:bg-muted/50 hover:text-primary transition-all duration-200 cursor-pointer min-h-[44px] flex items-center focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    onClick={handleMobileMenuClose}
                                  >
                                    <span>{child.name}</span>
                                  </Link>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ) : (
                        <Link
                          href={item.href}
                          className="block p-3 text-sm font-medium rounded-lg hover:bg-muted hover:text-primary transition-all duration-200 cursor-pointer min-h-[44px] flex items-center focus:outline-none focus:ring-2 focus:ring-primary/50"
                          onClick={handleMobileMenuClose}
                        >
                          {item.name}
                        </Link>
                      )}
                    </div>
                  ))}
                  
                  <div className="pt-4 border-t border-border/50 space-y-3">
                    <Link href="/auth/login" onClick={handleMobileMenuClose}>
                      <Button variant="outline" className="w-full min-h-[44px] text-base">Sign In</Button>
                    </Link>
                    <Link href="/auth/register" onClick={handleMobileMenuClose}>
                      <Button className="w-full min-h-[44px] bg-pumpkin hover:bg-pumpkin/90 text-base">
                        Get Started
                        <Coins className="ml-2 w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}