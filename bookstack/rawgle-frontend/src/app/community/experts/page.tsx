import { ComingSoonPage } from '@/components/ui/coming-soon-page'
import { GraduationCap } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Expert Network | Rawgle Community',
  description: 'Connect with certified veterinarians and nutritionists for expert raw feeding guidance',
}

export default function ExpertNetworkPage() {
  return (
    <ComingSoonPage
      title="Expert Network"
      description="Get direct access to certified veterinarians, pet nutritionists, and raw feeding specialists. Ask questions, schedule consultations, and get expert guidance for your pet's health journey."
      iconName="GraduationCap"
      features={[
        'Certified veterinarians specializing in raw diets',
        'Board-certified pet nutritionists and specialists',
        'One-on-one consultation booking system',
        'Expert Q&A sessions and live webinars',
        'Personalized nutrition plan development',
        'Emergency consultation availability'
      ]}
      backLink="/community"
      backLinkText="Back to Community Hub"
      estimatedLaunch="Q2 2025"
    />
  )
}