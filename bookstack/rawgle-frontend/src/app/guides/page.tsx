'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  BookOpen,
  Zap,
  Users,
  Calculator,
  MapPin,
  Shield,
  Heart,
  Smartphone,
  ChefHat,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Info,
  Star,
  Clock,
  Download,
  Video,
  FileText,
  MessageCircle
} from 'lucide-react'

interface GuideItem {
  id: string
  title: string
  description: string
  category: 'getting-started' | 'feeding' | 'suppliers' | 'community' | 'advanced'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  readTime: string
  icon: any
  color: string
  featured?: boolean
}

const guidesData: GuideItem[] = [
  // Getting Started
  {
    id: 'welcome-to-rawgle',
    title: 'Welcome to RAWGLE',
    description: 'Get started with RAWGLE - setup your profile, add your pets, and begin your raw feeding journey.',
    category: 'getting-started',
    difficulty: 'beginner',
    readTime: '5 min',
    icon: Heart,
    color: 'pumpkin',
    featured: true
  },
  {
    id: 'first-time-raw-feeding',
    title: 'First Time Raw Feeding Guide',
    description: 'Complete beginner\'s guide to raw feeding - safety, nutrition basics, and transitioning your pet.',
    category: 'getting-started',
    difficulty: 'beginner',
    readTime: '15 min',
    icon: BookOpen,
    color: 'olivine',
    featured: true
  },
  {
    id: 'setting-up-your-pets',
    title: 'Adding & Managing Your Pets',
    description: 'Learn how to add pet profiles, set feeding schedules, and track their health and progress.',
    category: 'getting-started',
    difficulty: 'beginner',
    readTime: '8 min',
    icon: Heart,
    color: 'zomp'
  },

  // Feeding Guides
  {
    id: 'feeding-calculator',
    title: 'Using the Smart Feeding Calculator',
    description: 'Master our AI-powered calculator to get precise portion recommendations for your pet.',
    category: 'feeding',
    difficulty: 'beginner',
    readTime: '10 min',
    icon: Calculator,
    color: 'sunglow',
    featured: true
  },
  {
    id: 'meal-planning',
    title: 'Advanced Meal Planning',
    description: 'Create balanced meal plans, rotate proteins, and ensure nutritional completeness.',
    category: 'feeding',
    difficulty: 'intermediate',
    readTime: '20 min',
    icon: ChefHat,
    color: 'pumpkin'
  },
  {
    id: 'supplement-guide',
    title: 'Supplements & Auto-ordering',
    description: 'Essential supplements for raw feeding and how to set up automatic reordering.',
    category: 'feeding',
    difficulty: 'intermediate',
    readTime: '12 min',
    icon: Zap,
    color: 'olivine'
  },

  // Suppliers
  {
    id: 'finding-suppliers',
    title: 'Finding Raw Food Suppliers',
    description: 'Use our supplier directory to find trusted raw food sources near you.',
    category: 'suppliers',
    difficulty: 'beginner',
    readTime: '7 min',
    icon: MapPin,
    color: 'zomp'
  },
  {
    id: 'supplier-reviews',
    title: 'Reading & Writing Supplier Reviews',
    description: 'How to evaluate suppliers and contribute helpful reviews for the community.',
    category: 'suppliers',
    difficulty: 'beginner',
    readTime: '5 min',
    icon: Star,
    color: 'sunglow'
  },

  // Community
  {
    id: 'joining-community',
    title: 'Joining the RAWGLE Community',
    description: 'Connect with fellow raw feeders, share experiences, and get expert advice.',
    category: 'community',
    difficulty: 'beginner',
    readTime: '6 min',
    icon: Users,
    color: 'pumpkin'
  },
  {
    id: 'chat-assistant',
    title: 'Using the AI Chat Assistant',
    description: 'Get instant answers to your raw feeding questions with our AI-powered chat.',
    category: 'community',
    difficulty: 'beginner',
    readTime: '4 min',
    icon: MessageCircle,
    color: 'zomp'
  },

  // Advanced
  {
    id: 'analytics-tracking',
    title: 'Advanced Analytics & Tracking',
    description: 'Dive deep into your pet\'s feeding data, health trends, and cost analysis.',
    category: 'advanced',
    difficulty: 'advanced',
    readTime: '25 min',
    icon: TrendingUp,
    color: 'charcoal'
  },
  {
    id: 'mobile-app',
    title: 'Mobile App Features',
    description: 'Make the most of RAWGLE on mobile - offline tracking, push notifications, and more.',
    category: 'advanced',
    difficulty: 'intermediate',
    readTime: '15 min',
    icon: Smartphone,
    color: 'olivine'
  }
]

const categories = [
  { id: 'getting-started', name: 'Getting Started', icon: BookOpen, color: 'pumpkin' },
  { id: 'feeding', name: 'Feeding & Nutrition', icon: ChefHat, color: 'olivine' },
  { id: 'suppliers', name: 'Suppliers & Shopping', icon: MapPin, color: 'zomp' },
  { id: 'community', name: 'Community & Support', icon: Users, color: 'sunglow' },
  { id: 'advanced', name: 'Advanced Features', icon: TrendingUp, color: 'charcoal' }
]

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'beginner': return 'text-olivine bg-olivine-100'
    case 'intermediate': return 'text-sunglow bg-sunglow-100'
    case 'advanced': return 'text-pumpkin bg-pumpkin-100'
    default: return 'text-gray-600 bg-gray-100'
  }
}

// Metadata is handled by layout.tsx for client components

export default function GuidesPage() {
  const featuredGuides = guidesData.filter(guide => guide.featured)
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-olivine-50">
      {/* Header */}
      <div className="relative bg-charcoal text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal via-charcoal-600 to-charcoal opacity-90"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="flex items-center justify-center mb-6">
              <BookOpen className="w-12 h-12 text-sunglow mr-4" />
              <Shield className="w-8 h-8 text-olivine" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold font-heading mb-6">
              User Guides
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Everything you need to know about raw pet feeding and using RAWGLE. From beginner basics to advanced techniques.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-2 text-sm">
            <Link href="/" className="text-charcoal hover:text-pumpkin transition-colors">
              Home
            </Link>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">Guides</span>
          </nav>
        </div>
      </div>

      {/* Featured Guides */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-16"
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold font-heading text-charcoal mb-4">
              Featured Guides
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Start here! Our most popular guides to get you up and running with raw feeding.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {featuredGuides.map((guide, index) => {
              const IconComponent = guide.icon
              return (
                <motion.div
                  key={guide.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="group"
                >
                  <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow p-6 h-full border-l-4 border-pumpkin">
                    <div className="flex items-center mb-4">
                      <div className={`w-12 h-12 bg-${guide.color}-100 rounded-xl flex items-center justify-center mr-4`}>
                        <IconComponent className={`w-6 h-6 text-${guide.color}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(guide.difficulty)}`}>
                            {guide.difficulty}
                          </span>
                          <div className="flex items-center text-gray-500 text-sm">
                            <Clock className="w-4 h-4 mr-1" />
                            {guide.readTime}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold font-heading text-charcoal mb-3 group-hover:text-pumpkin transition-colors">
                      {guide.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">
                      {guide.description}
                    </p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center text-sm text-gray-500">
                        <FileText className="w-4 h-4 mr-1" />
                        Guide
                      </div>
                      <button className="text-pumpkin hover:text-pumpkin-600 font-medium text-sm flex items-center group-hover:translate-x-1 transition-transform">
                        Read Guide
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold font-heading text-charcoal mb-8 text-center">
            Browse by Category
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
            {categories.map((category, index) => {
              const IconComponent = category.icon
              const categoryGuides = guidesData.filter(guide => guide.category === category.id)
              
              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                  className="group cursor-pointer"
                >
                  <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 text-center">
                    <div className={`w-16 h-16 bg-${category.color}-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                      <IconComponent className={`w-8 h-8 text-${category.color}`} />
                    </div>
                    <h3 className="font-semibold text-charcoal mb-2 group-hover:text-pumpkin transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {categoryGuides.length} guides
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* All Guides List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold font-heading text-charcoal">
              All Guides
            </h2>
            <div className="flex items-center space-x-4">
              <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pumpkin focus:border-pumpkin">
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-pumpkin focus:border-pumpkin">
                <option value="">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {guidesData.map((guide, index) => {
              const IconComponent = guide.icon
              return (
                <motion.div
                  key={guide.id}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.05 }}
                  className="group"
                >
                  <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border-l-2 border-gray-200 hover:border-pumpkin">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 bg-${guide.color}-100 rounded-lg flex items-center justify-center mr-3`}>
                          <IconComponent className={`w-5 h-5 text-${guide.color}`} />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-charcoal group-hover:text-pumpkin transition-colors">
                            {guide.title}
                          </h3>
                          <div className="flex items-center space-x-3 mt-1">
                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(guide.difficulty)}`}>
                              {guide.difficulty}
                            </span>
                            <div className="flex items-center text-gray-500 text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              {guide.readTime}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">
                      {guide.description}
                    </p>
                    
                    <button className="text-pumpkin hover:text-pumpkin-600 font-medium text-sm flex items-center group-hover:translate-x-1 transition-transform">
                      Read Guide
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Quick Help Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16"
        >
          <div className="bg-gradient-to-r from-zomp to-olivine rounded-2xl p-8 text-white text-center">
            <MessageCircle className="w-12 h-12 mx-auto mb-6" />
            <h2 className="text-2xl font-bold font-heading mb-4">
              Need Immediate Help?
            </h2>
            <p className="text-lg mb-6 max-w-2xl mx-auto">
              Can't find what you're looking for? Our AI chat assistant is available 24/7 to answer your raw feeding questions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="inline-flex items-center px-6 py-3 bg-white text-zomp rounded-xl font-medium hover:bg-gray-100 transition-colors">
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat with AI Assistant
              </button>
              <Link 
                href="/community"
                className="inline-flex items-center px-6 py-3 border-2 border-white text-white rounded-xl font-medium hover:bg-white hover:text-zomp transition-colors"
              >
                Join Community
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer Resources */}
      <div className="bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <Video className="w-8 h-8 text-pumpkin mx-auto mb-3" />
              <h3 className="font-semibold text-charcoal mb-2">Video Tutorials</h3>
              <p className="text-sm text-gray-600">Watch step-by-step video guides</p>
            </div>
            <div>
              <Download className="w-8 h-8 text-olivine mx-auto mb-3" />
              <h3 className="font-semibold text-charcoal mb-2">PDF Guides</h3>
              <p className="text-sm text-gray-600">Download guides for offline reading</p>
            </div>
            <div>
              <Users className="w-8 h-8 text-zomp mx-auto mb-3" />
              <h3 className="font-semibold text-charcoal mb-2">Expert Support</h3>
              <p className="text-sm text-gray-600">Get help from veterinarians and experts</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}