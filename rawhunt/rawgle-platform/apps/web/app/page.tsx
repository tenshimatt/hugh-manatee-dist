// Homepage
import { Hero } from '@/components/home/hero';
import { Features } from '@/components/home/features';
import { HowItWorks } from '@/components/home/how-it-works';
import { Testimonials } from '@/components/home/testimonials';
import { SupplierCTA } from '@/components/home/supplier-cta';
import { EducationPreview } from '@/components/home/education-preview';
import { CommunityStats } from '@/components/home/community-stats';

export default function HomePage() {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <CommunityStats />
      <EducationPreview />
      <Testimonials />
      <SupplierCTA />
    </>
  );
}

// Hero Component
function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50 pt-16 pb-20">
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mb-6 text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
            The Smart Way to
            <span className="block text-emerald-600">Feed Raw</span>
          </h1>
          
          <p className="mb-10 text-xl text-gray-600 sm:text-2xl">
            Connect with trusted suppliers, get personalized recommendations for your dog, 
            and join thousands of raw feeding enthusiasts.
          </p>
          
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <a
              href="/onboarding"
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:bg-emerald-700 hover:shadow-xl"
            >
              Get Started Free
              <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
            
            <a
              href="/suppliers"
              className="inline-flex items-center justify-center rounded-lg border-2 border-emerald-600 px-8 py-4 text-lg font-semibold text-emerald-600 transition-all hover:bg-emerald-50"
            >
              Find Suppliers
            </a>
          </div>
          
          <div className="mt-12 grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-gray-900">15,000+</div>
              <div className="text-sm text-gray-600">Active Members</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">500+</div>
              <div className="text-sm text-gray-600">Verified Suppliers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">4.9/5</div>
              <div className="text-sm text-gray-600">Average Rating</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Features Component
function Features() {
  const features = [
    {
      icon: '🎯',
      title: 'Smart Matching',
      description: 'Our AI analyzes your dog\'s breed, age, health, and location to recommend the perfect raw food options.',
    },
    {
      icon: '⭐',
      title: 'Verified Reviews',
      description: 'Read real reviews from verified buyers. See which foods work best for dogs like yours.',
    },
    {
      icon: '📍',
      title: 'Local Suppliers',
      description: 'Find trusted suppliers near you. Compare prices, delivery options, and product quality.',
    },
    {
      icon: '🎓',
      title: 'Expert Education',
      description: 'Learn from veterinary nutritionists and experienced raw feeders with our comprehensive guides.',
    },
    {
      icon: '💬',
      title: 'Active Community',
      description: 'Connect with thousands of raw feeders. Get advice, share experiences, and find support.',
    },
    {
      icon: '📊',
      title: 'Track Progress',
      description: 'Monitor your dog\'s health improvements, feeding costs, and nutritional balance over time.',
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Everything You Need for Raw Feeding Success
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From finding the right food to connecting with experts, we've built the complete platform for raw feeders.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:shadow-lg"
            >
              <div className="mb-4 text-5xl">{feature.icon}</div>
              <h3 className="mb-3 text-xl font-bold text-gray-900">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// How It Works Component
function HowItWorks() {
  const steps = [
    {
      number: '1',
      title: 'Create Your Pack Profile',
      description: 'Tell us about your dog(s) - breed, age, weight, activity level, and any health considerations.',
      image: '/images/step-1-profile.png',
    },
    {
      number: '2',
      title: 'Get Personalized Matches',
      description: 'Our smart algorithm analyzes your needs and matches you with the best food options and suppliers.',
      image: '/images/step-2-matching.png',
    },
    {
      number: '3',
      title: 'Compare & Choose',
      description: 'Read reviews, compare prices, check delivery options, and choose what works best for your pack.',
      image: '/images/step-3-compare.png',
    },
    {
      number: '4',
      title: 'Join the Community',
      description: 'Connect with other raw feeders, track progress, and get ongoing support for your journey.',
      image: '/images/step-4-community.png',
    },
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Getting Started is Easy
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join thousands who've made the switch to raw feeding with confidence.
          </p>
        </div>
        
        <div className="space-y-16">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`flex flex-col lg:flex-row items-center gap-12 ${
                index % 2 === 1 ? 'lg:flex-row-reverse' : ''
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-2xl font-bold text-white">
                    {step.number}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{step.title}</h3>
                </div>
                <p className="text-lg text-gray-600">{step.description}</p>
              </div>
              
              <div className="flex-1">
                <div className="relative aspect-video rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 p-8">
                  <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-20">
                    🐕
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Community Stats Component
function CommunityStats() {
  return (
    <section className="py-20 bg-emerald-600 text-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Join a Thriving Community</h2>
          <p className="text-xl opacity-90">Real results from real raw feeders</p>
        </div>
        
        <div className="grid md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-5xl font-bold mb-2">94%</div>
            <div className="text-lg opacity-90">Report Healthier Dogs</div>
          </div>
          <div className="text-center">
            <div className="text-5xl font-bold mb-2">87%</div>
            <div className="text-lg opacity-90">Save Money vs Kibble</div>
          </div>
          <div className="text-center">
            <div className="text-5xl font-bold mb-2">250K+</div>
            <div className="text-lg opacity-90">Reviews Posted</div>
          </div>
          <div className="text-center">
            <div className="text-5xl font-bold mb-2">50K+</div>
            <div className="text-lg opacity-90">Dogs Fed Raw</div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Education Preview Component
function EducationPreview() {
  const topics = [
    {
      icon: '📚',
      title: 'Beginner\'s Guide',
      description: 'Everything you need to know to start raw feeding safely and confidently.',
      link: '/education/beginners-guide',
    },
    {
      icon: '🥩',
      title: 'Nutrition Basics',
      description: 'Understanding proteins, fats, bones, and organs for optimal health.',
      link: '/education/nutrition-basics',
    },
    {
      icon: '🔄',
      title: 'Transition Guide',
      description: 'Step-by-step process to switch your dog from kibble to raw.',
      link: '/education/transition-guide',
    },
    {
      icon: '🧮',
      title: 'Portion Calculator',
      description: 'Calculate exact feeding amounts based on your dog\'s needs.',
      link: '/tools/portion-calculator',
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Learn from the Experts
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive guides, video tutorials, and tools to master raw feeding.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {topics.map((topic, index) => (
            <a
              key={index}
              href={topic.link}
              className="group rounded-xl border border-gray-200 bg-white p-6 transition-all hover:shadow-lg hover:border-emerald-200"
            >
              <div className="text-4xl mb-4">{topic.icon}</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-emerald-600">
                {topic.title}
              </h3>
              <p className="text-gray-600">{topic.description}</p>
            </a>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <a
            href="/education"
            className="inline-flex items-center text-emerald-600 font-semibold hover:text-emerald-700"
          >
            Explore All Learning Resources
            <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}

// Testimonials Component
function Testimonials() {
  const testimonials = [
    {
      name: 'Sarah Miller',
      role: 'German Shepherd Owner',
      avatar: '/avatars/sarah.jpg',
      content: 'Rawgle made switching to raw so easy. My dog\'s coat is shinier, teeth are cleaner, and he has so much more energy!',
      rating: 5,
    },
    {
      name: 'Mike Chen',
      role: 'Husky Parent',
      avatar: '/avatars/mike.jpg',
      content: 'The supplier matching is incredible. Found a local farm that delivers fresh food weekly at half the price of premium kibble.',
      rating: 5,
    },
    {
      name: 'Emma Wilson',
      role: 'Multi-Dog Household',
      avatar: '/avatars/emma.jpg',
      content: 'Managing different diets for my three dogs was a nightmare. Rawgle\'s tools make it simple to track everything.',
      rating: 5,
    },
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Trusted by Thousands of Dog Parents
          </h2>
          <p className="text-xl text-gray-600">
            See what our community has to say
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <svg key={i} className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              
              <p className="text-gray-700 mb-6">"{testimonial.content}"</p>
              
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-200" />
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-600">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Supplier CTA Component
function SupplierCTA() {
  return (
    <section className="py-20 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Are You a Raw Food Supplier?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join our network and connect with thousands of dedicated raw feeders. 
            Get verified, showcase your products, and grow your business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/suppliers/join"
              className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-4 text-lg font-semibold text-emerald-600 shadow-lg transition-all hover:shadow-xl"
            >
              Become a Supplier
            </a>
            <a
              href="/suppliers/benefits"
              className="inline-flex items-center justify-center rounded-lg border-2 border-white px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-white hover:text-emerald-600"
            >
              Learn More
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
