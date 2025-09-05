import { ComingSoonPage } from '@/components/ui/coming-soon-page'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Symptom Monitoring | Rawgle Dashboard',
  description: 'Track and monitor your pet\'s symptoms with severity levels and health insights',
}

export default function SymptomMonitoringPage() {
  return (
    <ComingSoonPage
      title="Symptom Monitoring"
      description="Track your pet's symptoms with detailed logging, severity ratings, and pattern recognition. Help your veterinarian with comprehensive health data when it matters most."
      iconName="Activity"
      features={[
        'Comprehensive symptom tracking with severity scales',
        'Photo and video documentation for symptoms',
        'Pattern recognition and trend analysis',
        'Automatic alerts for concerning patterns',
        'Integration with veterinary appointments',
        'Shareable health reports for your vet'
      ]}
      backLink="/dashboard/health"
      backLinkText="Back to Health Dashboard"
      estimatedLaunch="Q1 2025"
    />
  )
}