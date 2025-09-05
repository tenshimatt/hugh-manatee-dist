import { ComingSoonPage } from '@/components/ui/coming-soon-page'
import { Brain } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Health Insights | Rawgle Dashboard',
  description: 'Get predictive health recommendations and AI-powered insights for your pet',
}

export default function AIHealthInsightsPage() {
  return (
    <ComingSoonPage
      title="AI Health Insights"
      description="Harness the power of artificial intelligence to get predictive health recommendations, early warning signs, and personalized care suggestions based on your pet's unique health patterns."
      iconName="Brain"
      features={[
        'Predictive health analytics and early warnings',
        'Personalized care recommendations using AI',
        'Health trend analysis and pattern recognition',
        'Risk assessment for breed-specific conditions',
        'Integration with wearable device data',
        'Veterinary-grade health scoring algorithms'
      ]}
      backLink="/dashboard/health"
      backLinkText="Back to Health Dashboard"
      estimatedLaunch="Q4 2025"
    />
  )
}