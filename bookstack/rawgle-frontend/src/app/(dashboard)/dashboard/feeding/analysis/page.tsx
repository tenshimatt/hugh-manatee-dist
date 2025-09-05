import { ComingSoonPage } from '@/components/ui/coming-soon-page'
import { BarChart3 } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Nutritional Analysis | Rawgle Dashboard',
  description: 'Comprehensive macro and micro nutrient tracking for your pet\'s raw food diet',
}

export default function NutritionalAnalysisPage() {
  return (
    <ComingSoonPage
      title="Nutritional Analysis"
      description="Deep dive into your pet's nutritional intake with comprehensive tracking of macronutrients, micronutrients, and dietary balance. Get insights that matter for optimal health."
      iconName="BarChart3"
      features={[
        'Detailed macro and micronutrient breakdown',
        'Nutritional deficiency alerts and recommendations',
        'Historical nutrition trends and patterns',
        'Comparison against AAFCO and NRC guidelines',
        'Custom nutritional goals and tracking',
        'Veterinarian-ready nutrition reports'
      ]}
      backLink="/dashboard/feeding"
      backLinkText="Back to Feeding Dashboard"
      estimatedLaunch="Q2 2025"
    />
  )
}