import { ComingSoonPage } from '@/components/ui/coming-soon-page'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Portion Control | Rawgle Dashboard',
  description: 'Weight-based portion recommendations and feeding guidelines for optimal pet health',
}

export default function PortionControlPage() {
  return (
    <ComingSoonPage
      title="Portion Control"
      description="Get precise, weight-based portion recommendations tailored to your pet's age, activity level, and health goals. Never guess portions again with our smart portion calculator."
      iconName="Scale"
      features={[
        'Weight-based portion calculator using RER formulas',
        'Activity level and life stage adjustments',
        'Visual portion guides with measuring tools',
        'Portion tracking and weight correlation analysis',
        'Adjustable targets for weight management',
        'Integration with smart feeding devices'
      ]}
      backLink="/dashboard/feeding"
      backLinkText="Back to Feeding Dashboard"
      estimatedLaunch="Q1 2025"
    />
  )
}