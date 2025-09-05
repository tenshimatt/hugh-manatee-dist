'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
// import { useAuth } from '@clerk/nextjs'
import { 
  Dog, 
  MapPin, 
  Calculator, 
  Calendar, 
  ShoppingCart, 
  MessageCircle,
  TrendingUp,
  Users,
  Award,
  Sparkles,
  ArrowRight,
  Check,
  Play
} from 'lucide-react'
import { Navigation } from '@/components/layout/navigation'
import { ChatWidget } from '@/components/chat/chat-widget'
import { ApiTestPanel } from '@/components/dev/ApiTestPanel'

const features = [
  {
    icon: Dog,
    title: 'Multi-Pet Management',
    description: 'Track feeding schedules, health records, and expenses for all your pets in one place.',
    color: 'olivine'
  },
  {
    icon: MapPin,
    title: 'Find Raw Suppliers',
    description: 'Locate raw pet food suppliers near you with real-time inventory and pricing.',
    color: 'zomp'
  },
  {
    icon: Calculator,
    title: 'Smart Feeding Calculator',
    description: 'AI-powered portion recommendations based on breed, weight, age, and activity level.',
    color: 'pumpkin'
  },
  {
    icon: Calendar,
    title: 'Auto-Order Supplements',
    description: 'Never run out of supplements with smart reordering based on your feeding schedule.',
    color: 'sunglow'
  },
  {
    icon: MessageCircle,
    title: 'AI Pet Nutritionist',
    description: 'Get instant answers to your raw feeding questions from our trained AI assistant.',
    color: 'charcoal'
  },
  {
    icon: TrendingUp,
    title: 'Health Analytics',
    description: 'Track weight, energy levels, and health improvements with beautiful visualizations.',
    color: 'olivine'
  }
]

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Golden Retriever Owner',
    content: 'RAWGLE transformed how I manage my dog\'s raw diet. The feeding calculator alone saved me hours every week!',
    avatar: '🧑‍🦰'
  },
  {
    name: 'Mike Chen',
    role: 'Multi-Pet Household',
    content: 'Managing three dogs on raw diets was overwhelming until RAWGLE. Now it\'s effortless!',
    avatar: '👨‍💼'
  },
  {
    name: 'Emma Williams',
    role: 'New Raw Feeder',
    content: 'The AI nutritionist helped me transition my puppy to raw food safely. Can\'t imagine doing it without RAWGLE!',
    avatar: '👩‍🔬'
  }
]

const pricingPlans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for getting started',
    features: [
      '1 Pet Profile',
      'Basic Feeding Tracker',
      'Store Locator',
      '5 AI Chat Messages/Day',
      'Community Access'
    ],
    cta: 'Start Free',
    highlighted: false
  },
  {
    name: 'Premium',
    price: '$9.99',
    period: 'per month',
    description: 'For serious raw feeders',
    features: [
      'Unlimited Pet Profiles',
      'Advanced Analytics',
      'Unlimited AI Chat',
      'Auto-Order System',
      'Priority Support',
      'Early Access Features',
      'Export Reports'
    ],
    cta: 'Start 14-Day Trial',
    highlighted: true
  },
  {
    name: 'Breeder',
    price: '$29.99',
    period: 'per month',
    description: 'For professionals',
    features: [
      'Everything in Premium',
      'Client Portal',
      'Litter Management',
      'White-Label Options',
      'API Access',
      'Custom Integrations',
      'Dedicated Support'
    ],
    cta: 'Contact Sales',
    highlighted: false
  }
]

export default function HomePage() {
  // const { isSignedIn } = useAuth()
  const isSignedIn = false // Temporarily disabled for styling

  return (
    <div className="min-h-screen">
      {/* Comprehensive Navigation with all features */}
      <Navigation />

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center space-x-2 bg-sunglow/20 px-4 py-2 rounded-full mb-6">
              <Sparkles className="h-4 w-4 text-sunglow" />
              <span className="text-sm font-medium text-charcoal">Earn PAWS tokens for every action</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-heading font-bold mb-6 text-center">
              The Ultimate <span className="text-gradient-paws">Raw Pet Food</span> Platform
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Track feeding schedules, find local suppliers, connect with the community, and earn rewards. 
              Everything you need for your pet&apos;s raw food journey in one powerful platform.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Link 
                href="/auth/sign-up"
                className="inline-flex items-center justify-center px-8 py-4 rounded-lg font-semibold text-lg bg-pumpkin text-white hover:bg-pumpkin/90 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 min-h-[50px] space-x-2 cursor-pointer"
              >
                <span>Start Free Today</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link 
                href="#demo"
                className="inline-flex items-center justify-center px-8 py-4 rounded-lg font-semibold text-lg bg-sunglow text-charcoal hover:bg-sunglow/90 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 min-h-[50px] space-x-2 cursor-pointer"
              >
                <span>Watch Demo</span>
                <Play className="h-5 w-5" />
              </Link>
            </div>
            
            <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-olivine" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-olivine" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-olivine" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </motion.div>

          {/* Hero Image/Animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-16 relative"
          >
            <div className="bg-gradient-to-br from-charcoal to-zomp rounded-2xl p-8 shadow-2xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg p-6 card-hover">
                  <Dog className="h-12 w-12 text-pumpkin mb-4" />
                  <h3 className="font-heading font-semibold mb-2">Pet Profiles</h3>
                  <p className="text-sm text-muted-foreground">Manage all your pets in one place</p>
                </div>
                <div className="bg-white rounded-lg p-6 card-hover">
                  <Calculator className="h-12 w-12 text-olivine mb-4" />
                  <h3 className="font-heading font-semibold mb-2">Smart Calculator</h3>
                  <p className="text-sm text-muted-foreground">AI-powered feeding recommendations</p>
                </div>
                <div className="bg-white rounded-lg p-6 card-hover">
                  <MapPin className="h-12 w-12 text-zomp mb-4" />
                  <h3 className="font-heading font-semibold mb-2">Find Suppliers</h3>
                  <p className="text-sm text-muted-foreground">9000+ locations worldwide</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-heading font-bold mb-4">Everything You Need</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed by raw feeders, for raw feeders
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border border-border card-hover"
              >
                <feature.icon className={`h-12 w-12 text-${feature.color} mb-4`} />
                <h3 className="text-xl font-heading font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-olivine/10 to-zomp/10">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-heading font-bold mb-4">Loved by Raw Feeders</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join thousands of pet parents who&apos;ve transformed their feeding routine
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-xl p-6 shadow-lg"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className="text-4xl">{testimonial.avatar}</div>
                  <div>
                    <h4 className="font-heading font-semibold">{testimonial.name}</h4>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-foreground italic">&ldquo;{testimonial.content}&rdquo;</p>
                <div className="flex space-x-1 mt-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-sunglow text-xl">★</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-heading font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your pack
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`rounded-xl p-8 ${
                  plan.highlighted 
                    ? 'bg-gradient-to-br from-charcoal to-zomp text-white shadow-2xl scale-105' 
                    : 'bg-white border border-border'
                }`}
              >
                {plan.highlighted && (
                  <div className="inline-block bg-sunglow text-charcoal px-3 py-1 rounded-full text-sm font-medium mb-4">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-heading font-bold mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className={`text-sm ${plan.highlighted ? 'text-white/80' : 'text-muted-foreground'}`}>
                    /{plan.period}
                  </span>
                </div>
                <p className={`mb-6 ${plan.highlighted ? 'text-white/90' : 'text-muted-foreground'}`}>
                  {plan.description}
                </p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center space-x-2">
                      <Check className={`h-5 w-5 ${plan.highlighted ? 'text-sunglow' : 'text-olivine'}`} />
                      <span className={`text-sm ${plan.highlighted ? 'text-white' : 'text-foreground'}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link 
                  href="/auth/sign-up"
                  className={`w-full text-center py-3 px-6 rounded-lg font-medium transition-all cursor-pointer inline-block ${
                    plan.highlighted
                      ? 'bg-sunglow text-charcoal hover:bg-sunglow/80'
                      : 'bg-charcoal text-white hover:bg-charcoal/80'
                  }`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-charcoal to-zomp">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-4xl font-heading font-bold text-white mb-4">
              Ready to Transform Your Pet&apos;s Health?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Join thousands of pet parents who&apos;ve made the switch to raw feeding with RAWGLE
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/auth/sign-up"
                className="inline-flex items-center justify-center px-8 py-4 rounded-lg text-lg font-medium bg-sunglow text-charcoal hover:bg-sunglow/80 transition-all min-h-[50px] space-x-2 cursor-pointer"
              >
                <span>Start Your Free Trial</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link 
                href="/find-stores"
                className="inline-flex items-center justify-center px-8 py-4 rounded-lg text-lg font-medium bg-white text-charcoal hover:bg-white/80 transition-all min-h-[50px] cursor-pointer"
              >
                Find Stores Near You
              </Link>
            </div>
            <div className="mt-8 flex items-center justify-center space-x-8 text-white/80">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>10,000+ Active Users</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>9,000+ Store Locations</span>
              </div>
              <div className="flex items-center space-x-2">
                <Award className="h-5 w-5" />
                <span>4.9/5 Rating</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-charcoal text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Dog className="h-8 w-8 text-sunglow" />
                <span className="text-2xl font-heading font-bold">RAWGLE</span>
              </div>
              <p className="text-white/70">
                The ultimate platform for raw pet food enthusiasts.
              </p>
            </div>
            
            <div>
              <h4 className="font-heading font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-white/70">
                <li><Link href="/features" className="hover:text-sunglow transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-sunglow transition-colors">Pricing</Link></li>
                <li><Link href="/api" className="hover:text-sunglow transition-colors">API</Link></li>
                <li><Link href="/roadmap" className="hover:text-sunglow transition-colors">Roadmap</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-heading font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-white/70">
                <li><Link href="/blog" className="hover:text-sunglow transition-colors">Blog</Link></li>
                <li><Link href="/guides" className="hover:text-sunglow transition-colors">Guides</Link></li>
                <li><Link href="/community" className="hover:text-sunglow transition-colors">Community</Link></li>
                <li><Link href="/support" className="hover:text-sunglow transition-colors">Support</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-heading font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-white/70">
                <li><Link href="/about" className="hover:text-sunglow transition-colors">About</Link></li>
                <li><Link href="/careers" className="hover:text-sunglow transition-colors">Careers</Link></li>
                <li><Link href="/privacy" className="hover:text-sunglow transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-sunglow transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between">
            <p className="text-white/70 text-sm">
              © 2025 RAWGLE. All rights reserved.
            </p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <span className="text-sm text-white/70">Powered by</span>
              <span className="text-sunglow font-semibold">PAWS Token</span>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Chat Widget */}
      <ChatWidget />
      
      {/* Development API Test Panel */}
      <ApiTestPanel />
    </div>
  )
}
