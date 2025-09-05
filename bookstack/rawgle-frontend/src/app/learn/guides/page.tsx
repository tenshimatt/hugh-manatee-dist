import { ComingSoonPage } from '@/components/ui/coming-soon-page'
import { FileText } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Raw Feeding Guides | Rawgle Learn',
  description: 'Comprehensive raw feeding guides for all pet types and life stages',
}

export default function RawFeedingGuidesPage() {
  return (
    <ComingSoonPage
      title="Raw Feeding Guides"
      description="Comprehensive guides tailored for every pet type, breed, and life stage. From puppies to seniors, large breeds to small, find specific guidance for your pet's unique needs."
      iconName="FileText"
      features={[
        'Breed-specific feeding guides and considerations',
        'Life stage nutrition from puppy to senior',
        'Special dietary needs and health condition guides',
        'Seasonal feeding adjustments and recommendations',
        'Raw feeding for cats, ferrets, and exotic pets',
        'Troubleshooting guides for common challenges'
      ]}
      backLink="/blog"
      backLinkText="Back to Blog & Articles"
      estimatedLaunch="Q2 2025"
    />
  )
}