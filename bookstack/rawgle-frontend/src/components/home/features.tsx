'use client'

import { motion } from 'framer-motion'
import { 
  BarChart3, 
  Users, 
  MapPin, 
  Brain, 
  Calendar, 
  Heart,
  Coins,
  Shield,
  Smartphone,
  Globe,
  Zap,
  BookOpen
} from 'lucide-react'

const features = [
  {
    icon: Calendar,
    title: 'Smart Feeding Tracker',
    description: 'Log meals with voice commands, barcode scanning, or our intelligent batch confirmation system.',
    color: 'text-olivine',
    bg: 'bg-olivine/10 dark:bg-olivine/5',
  },
  {
    icon: Brain,
    title: 'AI Nutrition Assistant',
    description: 'Get personalized feeding recommendations based on your pet\'s breed, age, weight, and activity level.',
    color: 'text-charcoal',
    bg: 'bg-charcoal/10 dark:bg-charcoal/5',
  },
  {
    icon: MapPin,
    title: 'Local Store Finder',
    description: 'Instantly locate raw pet food suppliers near you with real-time inventory and price comparisons.',
    color: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
  },
  {
    icon: Users,
    title: 'Thriving Community',
    description: 'Connect with thousands of raw feeders, share recipes, and learn from experienced mentors.',
    color: 'text-purple-600',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
  },
  {
    icon: Coins,
    title: 'PAWS Token Rewards',
    description: 'Earn crypto rewards for logging meals, sharing knowledge, and contributing to the community.',
    color: 'text-sunglow',
    bg: 'bg-sunglow/10 dark:bg-sunglow/5',
  },
  {
    icon: BarChart3,
    title: 'Health Analytics',
    description: 'Track weight trends, symptoms, and correlate diet changes with health improvements.',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
  },
  {
    icon: Heart,
    title: 'Vet Integration',
    description: 'Share feeding and health data with your vet through secure QR codes and reports.',
    color: 'text-red-600',
    bg: 'bg-red-50 dark:bg-red-900/20',
  },
  {
    icon: Shield,
    title: 'Safe & Secure',
    description: 'Your data is encrypted and owned by you. Export anytime, delete anytime, full control.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
  },
  {
    icon: Smartphone,
    title: 'Mobile First',
    description: 'Progressive web app works offline, sends reminders, and feels like a native app.',
    color: 'text-cyan-600',
    bg: 'bg-cyan-50 dark:bg-cyan-900/20',
  },
  {
    icon: Globe,
    title: 'Global Network',
    description: 'Access to worldwide raw feeding community with multi-language support.',
    color: 'text-teal-600',
    bg: 'bg-teal-50 dark:bg-teal-900/20',
  },
  {
    icon: Zap,
    title: 'Instant Insights',
    description: 'Real-time nutritional analysis and cost optimization for every meal.',
    color: 'text-orange-600',
    bg: 'bg-orange-50 dark:bg-orange-900/20',
  },
  {
    icon: BookOpen,
    title: 'Education Hub',
    description: 'Comprehensive courses, guides, and scientific studies on raw feeding.',
    color: 'text-pink-600',
    bg: 'bg-pink-50 dark:bg-pink-900/20',
  },
]

export function Features() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl lg:text-5xl font-heading font-bold mb-4">
              Everything You Need for{' '}
              <span className="text-gradient">Raw Feeding Success</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              From tracking meals to earning rewards, RAWGLE provides all the tools you need to thrive in your raw feeding journey.
            </p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.05 }}
            >
              <div className="h-full p-6 rounded-xl border bg-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className={`w-12 h-12 rounded-lg ${feature.bg} flex items-center justify-center mb-4`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Feature Highlight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-olivine to-charcoal text-white"
        >
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-3xl font-heading font-bold mb-4">
                🎯 Quick Weekly Batch Confirmation
              </h3>
              <p className="text-lg mb-4 text-white/90">
                Our unique feature that sets us apart: Log in once a week and confirm "Same as last week" to instantly update all your feeding logs. Perfect for consistent feeders!
              </p>
              <ul className="space-y-2 text-white/90">
                <li className="flex items-center gap-2">
                  <span className="text-sunglow">✓</span>
                  One-tap weekly confirmation
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-sunglow">✓</span>
                  Smart deviation detection
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-sunglow">✓</span>
                  Bulk edit capabilities
                </li>
              </ul>
            </div>
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="text-center mb-4">
                  <div className="text-6xl mb-2">📅</div>
                  <h4 className="text-xl font-semibold">Weekly Check-in</h4>
                </div>
                <div className="space-y-3">
                  <button className="w-full p-3 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                    ✅ Same as last week
                  </button>
                  <button className="w-full p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                    ✏️ Make some changes
                  </button>
                  <button className="w-full p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                    🔄 Start fresh
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}