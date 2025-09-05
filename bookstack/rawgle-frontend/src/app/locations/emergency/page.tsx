import { ComingSoonPage } from '@/components/ui/coming-soon-page'
import { AlertTriangle } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Emergency Services | Rawgle Locations',
  description: 'Find 24/7 emergency veterinary services and urgent care in your area',
}

export default function EmergencyServicesPage() {
  return (
    <ComingSoonPage
      title="Emergency Services"
      description="When every minute counts, find the nearest 24/7 emergency veterinary services. Get instant access to emergency care locations, contact information, and real-time availability."
      iconName="AlertTriangle"
      features={[
        '24/7 emergency veterinary hospital locator',
        'Real-time availability and wait time information',
        'One-touch emergency contact integration',
        'GPS navigation and estimated arrival times',
        'Emergency preparedness guides and checklists',
        'Poison control and emergency first aid resources'
      ]}
      backLink="/locations"
      backLinkText="Back to Location Services"
      estimatedLaunch="Q1 2025"
    />
  )
}