import { ComingSoonPage } from '@/components/ui/coming-soon-page'
import { Palette } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'NFT Collection | PAWS Dashboard',
  description: 'Exclusive pet-themed NFT collectibles for the Rawgle community',
}

export default function NFTCollectionPage() {
  return (
    <ComingSoonPage
      title="NFT Collection"
      description="Collect unique, pet-themed NFTs that celebrate your journey in raw feeding. Each NFT represents milestones, achievements, and special moments in your pet's health transformation."
      iconName="Palette"
      features={[
        'Milestone achievement NFTs and digital badges',
        'Custom pet portrait NFTs with transformation stories',
        'Limited edition seasonal and event collectibles',
        'Utility NFTs with real-world platform benefits',
        'NFT marketplace for trading and gifting',
        'Integration with popular wallet providers'
      ]}
      backLink="/dashboard/paws"
      backLinkText="Back to PAWS Dashboard"
      estimatedLaunch="Q4 2025"
    />
  )
}