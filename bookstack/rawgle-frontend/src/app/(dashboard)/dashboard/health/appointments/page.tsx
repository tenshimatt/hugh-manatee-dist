import { ComingSoonPage } from '@/components/ui/coming-soon-page'
import { Calendar } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Vet Appointments | Rawgle Dashboard',
  description: 'Schedule and manage veterinary appointments with integrated health records',
}

export default function VetAppointmentsPage() {
  return (
    <ComingSoonPage
      title="Vet Appointments"
      description="Streamline your veterinary care with integrated appointment scheduling, preparation checklists, and automatic health record sharing with your veterinary team."
      iconName="Calendar"
      features={[
        'Integrated appointment scheduling with local vets',
        'Pre-appointment health summaries and checklists',
        'Automatic sharing of health records with vets',
        'Post-appointment follow-up reminders',
        'Vaccination and preventive care scheduling',
        'Emergency appointment request system'
      ]}
      backLink="/dashboard/health"
      backLinkText="Back to Health Dashboard"
      estimatedLaunch="Q3 2025"
    />
  )
}