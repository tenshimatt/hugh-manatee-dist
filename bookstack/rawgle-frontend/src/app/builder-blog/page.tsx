'use client'

import { BuilderComponent } from '@/lib/builder';
import '@/lib/builder-components';

const blogPageContent = {
  id: 'blog-page',
  name: 'Blog Page',
  data: {
    blocks: [
      {
        '@type': '@builder.io/sdk:Element',
        component: {
          name: 'HeroSection',
          options: {
            title: 'Raw Feeding Insights & Stories',
            subtitle: 'Expert advice, success stories, and the latest in raw pet nutrition',
            buttonText: 'Subscribe to Newsletter',
            buttonLink: '/newsletter',
            backgroundImage: '/images/blog-hero.jpg'
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
                title: 'Expert Articles',
                description: 'Get insights from veterinarians and nutrition experts on raw feeding best practices.',
                icon: '📚'
              },
              {
                title: 'Success Stories',
                description: 'Real transformations from pet parents who switched to raw feeding.',
                icon: '🌟'
              },
              {
                title: 'Recipe Library',
                description: 'Tried and tested raw food recipes from the RAWGLE community.',
                icon: '👨‍🍳'
              },
              {
                title: 'Nutrition Science',
                description: 'Latest research and studies on raw pet food nutrition and health benefits.',
                icon: '🔬'
              },
              {
                title: 'Seasonal Tips',
                description: 'Seasonal feeding advice and adjustments for optimal pet health.',
                icon: '🍂'
              },
              {
                title: 'Product Reviews',
                description: 'Honest reviews of raw food brands, supplements, and feeding equipment.',
                icon: '⭐'
              }
            ]
          }
        }
      },
      {
        '@type': '@builder.io/sdk:Element',
        responsiveStyles: {
          large: {
            display: 'block',
            marginTop: '40px',
            marginBottom: '40px'
          }
        },
        children: [
          {
            '@type': '@builder.io/sdk:Element',
            component: {
              name: 'BlogCard',
              options: {
                title: 'The Complete Guide to Raw Feeding for Puppies',
                excerpt: 'Everything you need to know about transitioning your puppy to a raw diet safely and effectively.',
                author: 'Dr. Sarah Mitchell',
                date: 'Jan 15, 2025',
                category: 'Guides',
                image: '/images/blog/puppy-guide.jpg',
                href: '/blog/puppy-raw-feeding-guide'
              }
            }
          },
          {
            '@type': '@builder.io/sdk:Element',
            component: {
              name: 'BlogCard',
              options: {
                title: 'Max\'s 6-Month Transformation',
                excerpt: 'How switching to raw food helped Max overcome allergies and digestive issues.',
                author: 'Jennifer Thompson',
                date: 'Jan 12, 2025',
                category: 'Success Stories',
                image: '/images/blog/max-transformation.jpg',
                href: '/blog/max-transformation'
              }
            }
          },
          {
            '@type': '@builder.io/sdk:Element',
            component: {
              name: 'BlogCard',
              options: {
                title: '5 Common Raw Feeding Mistakes to Avoid',
                excerpt: 'Learn from the most common mistakes new raw feeders make and how to avoid them.',
                author: 'Marcus Rodriguez',
                date: 'Jan 10, 2025',
                category: 'Tips',
                image: '/images/blog/common-mistakes.jpg',
                href: '/blog/common-raw-feeding-mistakes'
              }
            }
          }
        ]
      }
    ]
  }
};

export default function BlogPage() {
  return (
    <div>
      <BuilderComponent
        model="page"
        content={blogPageContent}
        fallback={<div>Loading blog...</div>}
      />
    </div>
  );
}