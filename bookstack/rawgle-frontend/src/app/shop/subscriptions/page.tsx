import { ComingSoonPage } from '@/components/ui/coming-soon-page'
import { RotateCcw } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Subscription Boxes | Rawgle Shop',
  description: 'Monthly curated raw food deliveries tailored to your pet\'s needs',
}

export default function SubscriptionBoxesPage() {
  return (
    <ComingSoonPage
      title="Subscription Boxes"
      description="Never run out of fresh, high-quality raw food again. Get monthly curated boxes delivered to your door, perfectly portioned for your pet's specific nutritional needs and preferences."
      iconName="RotateCcw"
      features={[
        'Personalized monthly boxes based on pet profiles',
        'Variety packs featuring different proteins and cuts',
        'Flexible subscription management and modifications',
        'Seasonal specials and limited-edition proteins',
        'Automatic delivery scheduling and adjustments',
        'Member-exclusive pricing and early access'
      ]}
      backLink="/shop"
      backLinkText="Back to Marketplace"
      estimatedLaunch="Q3 2025"
    />
  )
}