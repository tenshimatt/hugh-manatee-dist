import { ComingSoonPage } from '@/components/ui/coming-soon-page'
import { Settings } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Equipment & Supplies | Rawgle Shop',
  description: 'Essential equipment for raw feeding preparation and storage',
}

export default function EquipmentSuppliesPage() {
  return (
    <ComingSoonPage
      title="Equipment & Supplies"
      description="Get everything you need for safe and efficient raw food preparation. From grinders and storage solutions to feeding accessories, find high-quality equipment trusted by raw feeding experts."
      iconName="Settings"
      features={[
        'Professional-grade meat grinders and food processors',
        'Vacuum sealers and long-term storage solutions',
        'Stainless steel feeding bowls and accessories',
        'Portion scales and measuring tools',
        'Freezer organization and labeling systems',
        'Expert equipment reviews and buying guides'
      ]}
      backLink="/shop"
      backLinkText="Back to Marketplace"
      estimatedLaunch="Q2 2025"
    />
  )
}