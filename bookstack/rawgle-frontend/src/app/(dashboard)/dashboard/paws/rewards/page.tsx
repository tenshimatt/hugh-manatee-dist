import { ComingSoonPage } from '@/components/ui/coming-soon-page'
import { Gift } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Token Rewards Program | PAWS Dashboard',
  description: 'Redeem PAWS tokens for products, services, and exclusive rewards',
}

export default function TokenRewardsPage() {
  return (
    <ComingSoonPage
      title="Token Rewards Program"
      description="Redeem your hard-earned PAWS tokens for exclusive rewards, premium products, and special services. The more you engage with the platform, the more valuable rewards you unlock."
      iconName="Gift"
      features={[
        'Exclusive product discounts and free shipping',
        'Premium feature access and service upgrades',
        'Limited-edition merchandise and collectibles',
        'Expert consultation sessions and priority support',
        'Event tickets and community meetup access',
        'Charity donation matching and social impact'
      ]}
      backLink="/dashboard/paws"
      backLinkText="Back to PAWS Dashboard"
      estimatedLaunch="Q4 2025"
    />
  )
}