import { ComingSoonPage } from '@/components/ui/coming-soon-page'
import { Heart } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Success Stories | Rawgle Community',
  description: 'Read inspiring transformation stories from the raw feeding community',
}

export default function SuccessStoriesPage() {
  return (
    <ComingSoonPage
      title="Success Stories"
      description="Be inspired by real transformation stories from pet parents who've seen incredible health improvements with raw feeding. Share your own journey and celebrate wins together."
      iconName="Heart"
      features={[
        'Real before-and-after health transformations',
        'Detailed case studies with photos and timelines',
        'Veterinarian-verified improvement documentation',
        'Community voting and featured story highlights',
        'Success story submission and sharing tools',
        'Breed-specific transformation collections'
      ]}
      backLink="/community"
      backLinkText="Back to Community Hub"
      estimatedLaunch="Q1 2025"
    />
  )
}