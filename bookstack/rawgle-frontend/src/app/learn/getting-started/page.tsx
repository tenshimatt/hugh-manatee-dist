import { ComingSoonPage } from '@/components/ui/coming-soon-page'
import { BookOpen } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Getting Started Guide | Rawgle Learn',
  description: 'Complete beginner guide to raw feeding for your pet',
}

export default function GettingStartedGuidePage() {
  return (
    <ComingSoonPage
      title="Getting Started Guide"
      description="New to raw feeding? Start your journey with confidence using our comprehensive beginner's guide. Learn the fundamentals, avoid common mistakes, and set your pet up for success."
      iconName="BookOpen"
      features={[
        'Step-by-step introduction to raw feeding principles',
        'Safety guidelines and food handling best practices',
        'Transitioning from commercial to raw food plans',
        'Essential equipment and preparation setup',
        'Common beginner mistakes and how to avoid them',
        'Progress tracking and milestone celebrations'
      ]}
      backLink="/blog"
      backLinkText="Back to Blog & Articles"
      estimatedLaunch="Q1 2025"
    />
  )
}