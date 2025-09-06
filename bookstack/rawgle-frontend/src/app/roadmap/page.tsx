'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Calendar,
  CheckCircle,
  Circle,
  Clock,
  Target,
  Zap,
  Users,
  Smartphone,
  Brain,
  Globe,
  Shield,
  Sparkles,
  ArrowRight,
  MapPin,
  TrendingUp
} from 'lucide-react'

interface RoadmapItem {
  id: string
  title: string
  description: string
  status: 'completed' | 'in-progress' | 'planned' | 'future'
  quarter: string
  features: string[]
  icon: any
  color: string
}

const roadmapData: RoadmapItem[] = [
  {
    id: 'q4-2024',
    title: 'Foundation & Core Features',
    description: 'Essential platform features for raw pet food enthusiasts',
    status: 'completed',
    quarter: 'Q4 2024',
    features: [
      'User authentication & profiles',
      'Multi-pet management system',
      'Basic feeding tracker',
      'Supplier directory (beta)',
      'Mobile-responsive design'
    ],
    icon: CheckCircle,
    color: 'olivine'
  },
  {
    id: 'q1-2025',
    title: 'Smart Features & AI Integration',
    description: 'AI-powered recommendations and intelligent automation',
    status: 'in-progress',
    quarter: 'Q1 2025',
    features: [
      'AI feeding calculator',
      'Smart supplement ordering',
      'Nutrition analysis & recommendations',
      'Chat-based pet nutrition advisor',
      'Advanced feeding analytics'
    ],
    icon: Brain,
    color: 'pumpkin'
  },
  {
    id: 'q2-2025',
    title: 'Community & Social Features',
    description: 'Connect with fellow raw feeding enthusiasts',
    status: 'planned',
    quarter: 'Q2 2025',
    features: [
      'Community forums & discussions',
      'Expert vet consultations',
      'Recipe sharing platform',
      'Local raw feeding groups',
      'Success story showcase'
    ],
    icon: Users,
    color: 'zomp'
  },
  {
    id: 'q3-2025',
    title: 'Mobile App & Enhanced Experience',
    description: 'Native mobile apps with advanced features',
    status: 'planned',
    quarter: 'Q3 2025',
    features: [
      'iOS & Android native apps',
      'Offline feeding tracking',
      'Camera-based food logging',
      'Push notifications & reminders',
      'Apple Health & Google Fit integration'
    ],
    icon: Smartphone,
    color: 'sunglow'
  },
  {
    id: 'q4-2025',
    title: 'Global Expansion & Partnerships',
    description: 'Worldwide supplier network and strategic partnerships',
    status: 'future',
    quarter: 'Q4 2025',
    features: [
      'International supplier network',
      'Multi-currency & multi-language',
      'Veterinary clinic partnerships',
      'Pet insurance integrations',
      'Global shipping calculator'
    ],
    icon: Globe,
    color: 'charcoal'
  },
  {
    id: 'q1-2026',
    title: 'Advanced Analytics & Insights',
    description: 'Deep insights and predictive health analytics',
    status: 'future',
    quarter: 'Q1 2026',
    features: [
      'Predictive health monitoring',
      'Custom meal planning algorithms',
      'Veterinary report generation',
      'Cost optimization insights',
      'Environmental impact tracking'
    ],
    icon: TrendingUp,
    color: 'olivine'
  }
]

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="w-5 h-5 text-olivine" />
    case 'in-progress':
      return <Clock className="w-5 h-5 text-pumpkin" />
    case 'planned':
      return <Target className="w-5 h-5 text-zomp" />
    case 'future':
      return <Circle className="w-5 h-5 text-gray-400" />
    default:
      return <Circle className="w-5 h-5 text-gray-400" />
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'completed':
      return 'Completed'
    case 'in-progress':
      return 'In Progress'
    case 'planned':
      return 'Planned'
    case 'future':
      return 'Future'
    default:
      return 'Unknown'
  }
}

// Metadata is handled by layout.tsx for client components

export default function RoadmapPage() {
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
              <MapPin className="w-12 h-12 text-sunglow mr-4" />
              <Sparkles className="w-8 h-8 text-olivine" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold font-heading mb-6">
              Product Roadmap
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Our journey to revolutionize raw pet feeding. See what's coming next and help shape the future of pet nutrition.
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
            <span className="text-gray-600">Roadmap</span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Current Status Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12"
        >
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold font-heading text-charcoal mb-6">Current Development Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-olivine-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-8 h-8 text-olivine" />
                </div>
                <div className="text-2xl font-bold text-charcoal">1</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-pumpkin-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-8 h-8 text-pumpkin" />
                </div>
                <div className="text-2xl font-bold text-charcoal">1</div>
                <div className="text-sm text-gray-600">In Progress</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-zomp-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Target className="w-8 h-8 text-zomp" />
                </div>
                <div className="text-2xl font-bold text-charcoal">2</div>
                <div className="text-sm text-gray-600">Planned</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Circle className="w-8 h-8 text-gray-400" />
                </div>
                <div className="text-2xl font-bold text-charcoal">2</div>
                <div className="text-sm text-gray-600">Future</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Roadmap Timeline */}
        <div className="space-y-8">
          {roadmapData.map((item, index) => {
            const IconComponent = item.icon
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="relative"
              >
                <div className={`bg-white rounded-2xl shadow-lg p-8 border-l-4 border-${item.color}`}>
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center">
                      <div className={`w-12 h-12 bg-${item.color}-100 rounded-xl flex items-center justify-center mr-4`}>
                        <IconComponent className={`w-6 h-6 text-${item.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center mb-2">
                          <h3 className="text-xl font-bold font-heading text-charcoal mr-3">
                            {item.title}
                          </h3>
                          <div className="flex items-center">
                            {getStatusIcon(item.status)}
                            <span className="text-sm text-gray-600 ml-2">
                              {getStatusLabel(item.status)}
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-600">{item.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-${item.color}-100 text-${item.color}`}>
                        <Calendar className="w-4 h-4 mr-1" />
                        {item.quarter}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-charcoal">Key Features:</h4>
                    <ul className="space-y-2">
                      {item.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center text-gray-700">
                          <CheckCircle className="w-4 h-4 text-olivine mr-3 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16 text-center"
        >
          <div className="bg-gradient-to-r from-pumpkin to-sunglow rounded-2xl p-8 text-white">
            <Zap className="w-12 h-12 mx-auto mb-6" />
            <h2 className="text-2xl font-bold font-heading mb-4">
              Help Shape Our Roadmap
            </h2>
            <p className="text-lg mb-6 max-w-2xl mx-auto">
              Your feedback drives our development. Join our community to suggest features, vote on priorities, and stay updated on progress.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/community"
                className="inline-flex items-center px-6 py-3 bg-white text-pumpkin rounded-xl font-medium hover:bg-gray-100 transition-colors"
              >
                Join Community
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
              <Link 
                href="/guides"
                className="inline-flex items-center px-6 py-3 border-2 border-white text-white rounded-xl font-medium hover:bg-white hover:text-pumpkin transition-colors"
              >
                View Guides
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer Note */}
      <div className="bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-600 text-sm">
            * Timelines are estimates and may change based on community feedback and development priorities. 
            We're committed to delivering quality features that truly benefit raw pet food enthusiasts.
          </p>
        </div>
      </div>
    </div>
  )
}