import { ComingSoonPage } from '@/components/ui/coming-soon-page'
import { Coins } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Earn & Stake Tokens | PAWS Dashboard',
  description: 'Earn PAWS tokens through activities and challenges, stake for rewards',
}

export default function EarnStakeTokensPage() {
  return (
    <ComingSoonPage
      title="Earn & Stake Tokens"
      description="Maximize your PAWS token earnings through daily activities, challenges, and community engagement. Stake your tokens for additional rewards and exclusive platform benefits."
      iconName="Coins"
      features={[
        'Daily activity rewards and milestone bonuses',
        'Community challenges with PAWS token prizes',
        'Staking pools with competitive APY rates',
        'Loyalty multipliers for long-term participation',
        'Referral bonuses and network growth rewards',
        'Exclusive token holder benefits and perks'
      ]}
      backLink="/dashboard/paws"
      backLinkText="Back to PAWS Dashboard"
      estimatedLaunch="Q4 2025"
    />
  )
}