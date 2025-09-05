import { ComingSoonPage } from '@/components/ui/coming-soon-page'
import { Stethoscope } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Veterinarian Directory | Rawgle Locations',
  description: 'Find raw-feeding friendly veterinarians in your area',
}

export default function VeterinarianDirectoryPage() {
  return (
    <ComingSoonPage
      title="Veterinarian Directory"
      description="Find veterinarians who understand and support raw feeding in your area. Connect with professionals who share your commitment to species-appropriate nutrition for optimal pet health."
      iconName="Stethoscope"
      features={[
        'Raw-feeding friendly veterinarian network',
        'Detailed practitioner profiles and specializations',
        'Patient reviews and raw feeding success stories',
        'Direct appointment booking integration',
        'Holistic and integrative veterinary options',
        'Emergency and after-hours care availability'
      ]}
      backLink="/locations"
      backLinkText="Back to Location Services"
      estimatedLaunch="Q2 2025"
    />
  )
}