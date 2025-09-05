import { ComingSoonPage } from '@/components/ui/coming-soon-page'
import { Video } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Expert Webinars | Rawgle Learn',
  description: 'Live Q&A sessions and webinars with raw feeding experts',
}

export default function ExpertWebinarsPage() {
  return (
    <ComingSoonPage
      title="Expert Webinars"
      description="Join live interactive webinars with leading veterinarians, nutritionists, and raw feeding experts. Get your questions answered in real-time and learn from the latest research and case studies."
      iconName="Video"
      features={[
        'Monthly live webinars with certified experts',
        'Interactive Q&A sessions and case discussions',
        'Recorded webinar library for on-demand viewing',
        'Specialized topics and advanced nutrition concepts',
        'Small group workshops and intensive sessions',
        'Continuing education credits for professionals'
      ]}
      backLink="/blog"
      backLinkText="Back to Blog & Articles"
      estimatedLaunch="Q3 2025"
    />
  )
}