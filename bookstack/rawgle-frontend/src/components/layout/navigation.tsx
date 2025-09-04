'use client'

import { useState, useEffect } from 'react'
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
  Crown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'

const navigation = [
  { name: 'Home', href: '/' },
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
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Render navigation immediately, handle theme button separately to avoid hydration issues

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
            <span className="text-2xl font-heading font-bold text-gradient">RAWGLE</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navigation.map((item) => (
              <div key={item.name} className="relative group">
                {item.children ? (
                  <>
                    <button className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                      {item.icon && <item.icon className="w-4 h-4" />}
                      {item.name}
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <div className="absolute top-full left-0 mt-2 w-80 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-3 max-h-96 overflow-y-auto">
                        <div className="mb-3 pb-2 border-b border-gray-100">
                          <div className="flex items-center text-sm font-semibold text-gray-800">
                            {item.icon && <item.icon className="w-5 h-5 mr-2 text-blue-600" />}
                            {item.name}
                          </div>
                        </div>
                        {item.children.map((child) => (
                          <Link
                            key={child.name}
                            href={child.href}
                            className="block px-3 py-3 text-sm rounded-lg hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-b-0"
                          >
                            <div className="font-medium text-gray-900 mb-1">{child.name}</div>
                            {child.description && (
                              <div className="text-xs text-gray-600">{child.description}</div>
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
            {/* Theme Toggle - Only show after hydration to avoid theme mismatch */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
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
                <button className="btn btn-outline">Sign In</button>
              </Link>
              <Link href="/auth/register">
                <button className="btn btn-primary">
                  Get Started
                  <Coins className="ml-2 w-4 h-4" />
                </button>
              </Link>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-background border-b"
          >
            <div className="container mx-auto px-4 py-4">
              <div className="space-y-4">
                {navigation.map((item) => (
                  <div key={item.name}>
                    {item.children ? (
                      <div className="space-y-2">
                        <div className="font-medium text-sm text-muted-foreground">
                          {item.name}
                        </div>
                        <div className="pl-4 space-y-2">
                          {item.children.map((child) => (
                            <Link
                              key={child.name}
                              href={child.href}
                              className="block text-sm hover:text-primary transition-colors"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              {child.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <Link
                        href={item.href}
                        className="block text-sm font-medium hover:text-primary transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    )}
                  </div>
                ))}
                
                <div className="pt-4 border-t space-y-3">
                  <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                    <button className="btn btn-outline w-full">Sign In</button>
                  </Link>
                  <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)}>
                    <button className="btn btn-primary w-full">Get Started</button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}