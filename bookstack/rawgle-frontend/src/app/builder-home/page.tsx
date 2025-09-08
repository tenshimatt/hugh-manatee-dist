'use client'

import { BuilderComponent } from '@/lib/builder';
import '@/lib/builder-components'; // Register components

// Demo content for Builder.io homepage
const demoHomeContent = {
  id: 'home-page',
  name: 'Homepage',
  data: {
    blocks: [
      {
        '@type': '@builder.io/sdk:Element',
        component: {
          name: 'HeroSection',
          options: {
            title: 'The Ultimate Raw Pet Food Platform',
            subtitle: 'Track feeding schedules, find local suppliers, connect with the community, and earn rewards. Everything you need for your pet\'s raw food journey in one powerful platform.',
            buttonText: 'Start Free Today',
            buttonLink: '/auth/sign-up',
            backgroundImage: '/images/hero-bg.jpg',
            overlay: true
          }
        }
      },
      {
        '@type': '@builder.io/sdk:Element', 
        component: {
          name: 'FeatureGrid',
          options: {
            features: [
              {
                title: 'Multi-Pet Management',
                description: 'Track feeding schedules, health records, and expenses for all your pets in one place.',
                icon: '🐕'
              },
              {
                title: 'Find Raw Suppliers',
                description: 'Locate raw pet food suppliers near you with real-time inventory and pricing.',
                icon: '📍'
              },
              {
                title: 'Smart Feeding Calculator',
                description: 'AI-powered portion recommendations based on breed, weight, age, and activity level.',
                icon: '🧮'
              },
              {
                title: 'Auto-Order Supplements',
                description: 'Never run out of supplements with smart reordering based on your feeding schedule.',
                icon: '📅'
              },
              {
                title: 'AI Pet Nutritionist',
                description: 'Get instant answers to your raw feeding questions from our trained AI assistant.',
                icon: '💬'
              },
              {
                title: 'Health Analytics',
                description: 'Track weight, energy levels, and health improvements with beautiful visualizations.',
                icon: '📈'
              }
            ]
          }
        }
      },
      {
        '@type': '@builder.io/sdk:Element',
        component: {
          name: 'StatsSection',
          options: {
            stats: [
              {
                value: '10,000+',
                label: 'Active Users',
                description: 'Pet parents trust RAWGLE'
              },
              {
                value: '9,000+',
                label: 'Store Locations',
                description: 'Suppliers worldwide'
              },
              {
                value: '4.9/5',
                label: 'Rating',
                description: 'From satisfied customers'
              },
              {
                value: '24/7',
                label: 'AI Support',
                description: 'Always available'
              }
            ]
          }
        }
      },
      {
        '@type': '@builder.io/sdk:Element',
        component: {
          name: 'TestimonialSection',
          options: {
            testimonials: [
              {
                quote: 'RAWGLE transformed how I manage my dog\'s raw diet. The feeding calculator alone saved me hours every week!',
                author: 'Sarah Johnson',
                title: 'Golden Retriever Owner',
                avatar: '/images/testimonials/sarah.jpg',
                rating: 5
              },
              {
                quote: 'Managing three dogs on raw diets was overwhelming until RAWGLE. Now it\'s effortless!',
                author: 'Mike Chen',
                title: 'Multi-Pet Household',
                avatar: '/images/testimonials/mike.jpg',
                rating: 5
              },
              {
                quote: 'The AI nutritionist helped me transition my puppy to raw food safely. Can\'t imagine doing it without RAWGLE!',
                author: 'Emma Williams',
                title: 'New Raw Feeder',
                avatar: '/images/testimonials/emma.jpg',
                rating: 5
              }
            ]
          }
        }
      },
      {
        '@type': '@builder.io/sdk:Element',
        component: {
          name: 'CTASection',
          options: {
            title: 'Ready to Transform Your Pet\'s Health?',
            subtitle: 'Join thousands of pet parents who\'ve made the switch to raw feeding with RAWGLE',
            buttonText: 'Start Your Free Trial',
            buttonLink: '/auth/sign-up',
            secondaryButtonText: 'Find Stores Near You',
            secondaryButtonLink: '/locations/suppliers',
            backgroundColor: 'primary'
          }
        }
      }
    ]
  }
};

export default function BuilderHomePage() {
  return (
    <div className="min-h-screen">
      <BuilderComponent 
        model="page"
        content={demoHomeContent}
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-4">Welcome to RAWGLE</h1>
              <p className="text-muted-foreground">Builder.io integration loading...</p>
            </div>
          </div>
        }
      />
    </div>
  );
}