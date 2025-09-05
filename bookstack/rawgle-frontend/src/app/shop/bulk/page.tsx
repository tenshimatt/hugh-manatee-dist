import { ComingSoonPage } from '@/components/ui/coming-soon-page'
import { Package } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bulk Ordering | Rawgle Shop',
  description: 'Wholesale pricing and bulk orders for raw pet food products',
}

export default function BulkOrderingPage() {
  return (
    <ComingSoonPage
      title="Bulk Ordering"
      description="Save money with wholesale pricing on bulk orders. Perfect for multi-pet households, co-ops, or stocking up on your pet's favorite proteins with significant cost savings."
      iconName="Package"
      features={[
        'Wholesale pricing tiers based on order volume',
        'Co-op organizing tools for group purchases',
        'Flexible delivery scheduling for large orders',
        'Freezer space calculator and storage guides',
        'Custom bulk order requests and quotations',
        'Loyalty rewards for regular bulk purchasers'
      ]}
      backLink="/shop"
      backLinkText="Back to Marketplace"
      estimatedLaunch="Q2 2025"
    />
  )
}