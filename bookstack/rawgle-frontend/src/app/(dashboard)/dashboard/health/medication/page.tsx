import { ComingSoonPage } from '@/components/ui/coming-soon-page'
import { Pill } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Medication Management | Rawgle Dashboard',
  description: 'Track medications, set reminders, and manage your pet\'s healthcare routine',
}

export default function MedicationManagementPage() {
  return (
    <ComingSoonPage
      title="Medication Management"
      description="Never miss a dose again. Track medications, supplements, and treatments with smart reminders, dosage calculations, and progress monitoring for your pet's health journey."
      iconName="Pill"
      features={[
        'Smart medication reminders and notifications',
        'Dosage tracking with weight-based calculations',
        'Medication interaction warnings and alerts',
        'Prescription refill reminders and automation',
        'Progress tracking for treatment effectiveness',
        'Veterinary integration for prescription management'
      ]}
      backLink="/dashboard/health"
      backLinkText="Back to Health Dashboard"
      estimatedLaunch="Q2 2025"
    />
  )
}