'use client'

import { BuilderComponent } from '@/lib/builder';
import '@/lib/builder-components';

// Demo navigation content
const demoNavContent = {
  id: 'main-navigation',
  name: 'Main Navigation',
  data: {
    blocks: [
      {
        '@type': '@builder.io/sdk:Element',
        component: {
          name: 'NavigationMenu',
          options: {
            logo: '/images/rawgle-logo.png',
            items: [
              {
                title: 'Dashboard',
                href: '/dashboard',
                children: [
                  { title: 'Pets', href: '/dashboard/pets' },
                  { title: 'Feeding', href: '/dashboard/feeding' },
                  { title: 'Health', href: '/dashboard/health' },
                  { title: 'PAWS', href: '/dashboard/paws' }
                ]
              },
              {
                title: 'Locations',
                href: '/locations',
                children: [
                  { title: 'Suppliers', href: '/locations/suppliers' },
                  { title: 'Vets', href: '/locations/vets' },
                  { title: 'Emergency', href: '/locations/emergency' }
                ]
              },
              {
                title: 'Shop',
                href: '/shop',
                children: [
                  { title: 'Products', href: '/shop' },
                  { title: 'Subscriptions', href: '/shop/subscriptions' },
                  { title: 'Bulk Orders', href: '/shop/bulk' },
                  { title: 'Equipment', href: '/shop/equipment' }
                ]
              },
              {
                title: 'Community',
                href: '/community',
                children: [
                  { title: 'Forum', href: '/community' },
                  { title: 'Recipes', href: '/community/recipes' },
                  { title: 'Stories', href: '/community/stories' },
                  { title: 'Experts', href: '/community/experts' },
                  { title: 'Challenges', href: '/community/challenges' }
                ]
              },
              {
                title: 'Learn',
                href: '/learn',
                children: [
                  { title: 'Getting Started', href: '/learn/getting-started' },
                  { title: 'Guides', href: '/learn/guides' },
                  { title: 'Courses', href: '/learn/courses' },
                  { title: 'Webinars', href: '/learn/webinars' }
                ]
              },
              {
                title: 'Blog',
                href: '/blog'
              }
            ],
            ctaText: 'Sign Up Free',
            ctaLink: '/auth/sign-up'
          }
        }
      }
    ]
  }
};

export function BuilderNav() {
  return (
    <BuilderComponent
      model="navigation"
      url="/"
      content={demoNavContent}
      fallback={
        <nav className="border-b bg-background/95 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex h-16 items-center justify-between">
              <div className="font-bold text-xl">RAWGLE</div>
              <div>Loading navigation...</div>
            </div>
          </div>
        </nav>
      }
    />
  );
}