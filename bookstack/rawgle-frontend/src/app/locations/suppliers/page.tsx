import { ComingSoonPage } from '@/components/ui/coming-soon-page'
import { MapPin } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Local Raw Food Sources | Rawgle Locations',
  description: 'Find farm-direct suppliers and butchers for quality raw pet food ingredients',
}

export default function LocalSuppliersPage() {
  return (
    <ComingSoonPage
      title="Local Raw Food Sources"
      description="Discover local farms, butchers, and specialty suppliers offering high-quality raw ingredients for your pet. Support local businesses while ensuring the freshest, most nutritious meals."
      iconName="MapPin"
      features={[
        'Local farm and butcher directory with specialties',
        'Quality ratings and community reviews',
        'Seasonal availability and pricing information',
        'Bulk ordering and delivery coordination',
        'Organic and grass-fed supplier identification',
        'Direct communication with local suppliers'
      ]}
      backLink="/locations"
      backLinkText="Back to Location Services"
      estimatedLaunch="Q2 2025"
    />
  )
}