'use client'

import { BuilderComponent } from '@/lib/builder';
import '@/lib/builder-components';

const featuresPageContent = {
  id: 'features-page',
  name: 'Features Page',
  data: {
    blocks: [
      {
        '@type': '@builder.io/sdk:Element',
        component: {
          name: 'HeroSection',
          options: {
            title: 'Powerful Features for Raw Feeders',
            subtitle: 'Everything you need to provide the best nutrition for your pets',
            buttonText: 'Start Free Trial',
            buttonLink: '/auth/sign-up',
            backgroundImage: '/images/features-hero.jpg'
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
                title: 'Smart Pet Profiles',
                description: 'Create detailed profiles for each pet with breed-specific information, dietary requirements, and health history.',
                icon: '🐕‍🦺'
              },
              {
                title: 'Feeding Schedule Management',
                description: 'Set up automated feeding schedules with portion calculations and meal planning.',
                icon: '📋'
              },
              {
                title: 'Supplier Discovery',
                description: 'Find and compare raw food suppliers in your area with pricing and availability.',
                icon: '🏪'
              },
              {
                title: 'Health Tracking',
                description: 'Monitor weight, symptoms, and improvements to track your pet\'s health journey.',
                icon: '📊'
              },
              {
                title: 'AI Nutritionist Chat',
                description: 'Get instant answers to nutrition questions from our trained AI assistant.',
                icon: '🤖'
              },
              {
                title: 'Community Support',
                description: 'Connect with other raw feeders, share recipes, and get advice from experts.',
                icon: '👥'
              },
              {
                title: 'PAWS Token Rewards',
                description: 'Earn rewards for engagement and redeem for pet products and services.',
                icon: '🪙'
              },
              {
                title: 'Progress Analytics',
                description: 'Visualize your pet\'s health improvements with detailed charts and insights.',
                icon: '📈'
              },
              {
                title: 'Mobile App',
                description: 'Access all features on the go with our fully-featured mobile application.',
                icon: '📱'
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
            title: 'Ready to Get Started?',
            subtitle: 'Join thousands of pet parents using RAWGLE',
            buttonText: 'Start Your Free Trial',
            buttonLink: '/auth/sign-up',
            backgroundColor: 'primary'
          }
        }
      }
    ]
  }
};

export default function FeaturesPage() {
  return (
    <BuilderComponent
      model="page"
      content={featuresPageContent}
      fallback={<div>Loading features...</div>}
    />
  );
}