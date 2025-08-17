import React from 'react';
import { Link } from 'react-router-dom';
import {
  HeartIcon,
  ChatBubbleLeftRightIcon,
  CameraIcon,
  CurrencyDollarIcon,
  PhotoIcon,
  ChartBarIcon,
  CheckIcon,
  StarIcon,
} from '@heroicons/react/24/outline';

const features = [
  {
    name: 'Pet Health Tracking',
    description: 'Monitor your pet\'s health with comprehensive profiles and daily activity logging.',
    icon: HeartIcon,
  },
  {
    name: 'AI Medical Consultations',
    description: 'Get instant AI-powered health advice and emergency guidance for your pets.',
    icon: ChatBubbleLeftRightIcon,
  },
  {
    name: 'Daily Feeding Tracker',
    description: 'Log and track feeding schedules, portions, and dietary habits.',
    icon: CameraIcon,
  },
  {
    name: 'PAWS Rewards System',
    description: 'Earn PAWS tokens for consistent pet care and redeem rewards.',
    icon: CurrencyDollarIcon,
  },
  {
    name: 'NFT Pet Collectibles',
    description: 'Create and collect unique NFTs celebrating your pet\'s milestones.',
    icon: PhotoIcon,
  },
  {
    name: 'Health Analytics',
    description: 'Visualize health trends and get insights into your pet\'s wellbeing.',
    icon: ChartBarIcon,
  },
];

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Dog Owner',
    content: 'Rawgle helped me catch early signs of illness in my Golden Retriever. The AI consultation feature is incredibly helpful!',
    rating: 5,
  },
  {
    name: 'Mike Chen',
    role: 'Cat Owner',
    content: 'The feeding tracker and PAWS rewards keep me motivated to take better care of my cats. Love the NFT milestones!',
    rating: 5,
  },
  {
    name: 'Emily Rodriguez',
    role: 'Multi-Pet Owner',
    content: 'Managing health records for my 3 pets has never been easier. The analytics give me great insights.',
    rating: 5,
  },
];

const pricingPlans = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    features: [
      'Up to 2 pets',
      'Basic health tracking',
      'AI consultations (5/month)',
      'PAWS rewards',
      'Community support',
    ],
    cta: 'Get Started Free',
    popular: false,
  },
  {
    name: 'Premium',
    price: '$9.99',
    period: '/month',
    features: [
      'Unlimited pets',
      'Advanced health analytics',
      'Unlimited AI consultations',
      '2x PAWS rewards',
      'NFT minting included',
      'Priority support',
    ],
    cta: 'Start Premium',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: '$29.99',
    period: '/month',
    features: [
      'Everything in Premium',
      'Veterinarian collaboration',
      '5x PAWS rewards',
      'Custom NFT collections',
      'API access',
      'Dedicated support',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              AI-Powered Pet Care
              <span className="text-primary-500"> Platform</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Track your pet's health, get AI medical consultations, earn rewards, and create NFT memories. 
              Everything you need for comprehensive pet care in one platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="btn-primary text-lg px-8 py-3">
                Start Free Today
              </Link>
              <Link to="/login" className="btn-secondary text-lg px-8 py-3">
                Sign In
              </Link>
            </div>
          </div>
        </div>

        {/* Hero illustration placeholder */}
        <div className="flex justify-center pb-16">
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl p-6 text-center">
                <HeartIcon className="w-12 h-12 text-primary-500 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900">Health Tracking</h3>
                <p className="text-sm text-gray-600 mt-2">Monitor vitals and activities</p>
              </div>
              <div className="bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-xl p-6 text-center">
                <ChatBubbleLeftRightIcon className="w-12 h-12 text-secondary-500 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900">AI Consultations</h3>
                <p className="text-sm text-gray-600 mt-2">Instant medical guidance</p>
              </div>
              <div className="bg-gradient-to-br from-accent-100 to-accent-200 rounded-xl p-6 text-center">
                <CurrencyDollarIcon className="w-12 h-12 text-accent-500 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900">PAWS Rewards</h3>
                <p className="text-sm text-gray-600 mt-2">Earn tokens for pet care</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Complete Pet Care Solution
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From daily care tracking to emergency medical guidance, 
              Rawgle provides everything you need to keep your pets healthy and happy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.name} className="card p-6 hover:shadow-lg transition-shadow">
                <feature.icon className="w-8 h-8 text-primary-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.name}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Loved by Pet Owners
            </h2>
            <p className="text-lg text-gray-600">
              See what pet owners are saying about Rawgle
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="card p-6">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">"{testimonial.content}"</p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-gray-600">
              Choose the plan that's right for you and your pets
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`card p-8 ${
                  plan.popular
                    ? 'ring-2 ring-primary-500 shadow-glow'
                    : ''
                } relative`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">
                      {plan.price}
                    </span>
                    <span className="text-gray-600">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckIcon className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to={plan.name === 'Enterprise' ? '/contact' : '/register'}
                  className={`w-full text-center ${
                    plan.popular ? 'btn-primary' : 'btn-secondary'
                  } block`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-gradient-to-br from-primary-500 to-secondary-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Pet Care?
          </h2>
          <p className="text-lg text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of pet owners who trust Rawgle for comprehensive pet health management.
          </p>
          <Link
            to="/register"
            className="bg-white text-primary-500 hover:bg-gray-100 font-medium py-3 px-8 rounded-lg text-lg transition-colors duration-200"
          >
            Start Your Free Account
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">R</span>
                </div>
                <span className="text-xl font-bold">Rawgle</span>
              </div>
              <p className="text-gray-400">
                AI-powered pet care platform for the modern pet owner.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link to="/api" className="hover:text-white transition-colors">API</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link to="/status" className="hover:text-white transition-colors">Status</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Rawgle. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;