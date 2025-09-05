import { ComingSoonPage } from '@/components/ui/coming-soon-page'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Meal Planning & Prep | Rawgle Dashboard',
  description: 'Weekly meal planning with prep guides for your pet\'s raw food diet',
}

export default function MealPlannerPage() {
  return (
    <ComingSoonPage
      title="Meal Planning & Prep"
      description="Plan your pet's meals for the week with smart preparation guides, batch cooking suggestions, and automated shopping lists based on your pet's nutritional needs."
      iconName="Calendar"
      features={[
        'Weekly meal planning with drag-and-drop interface',
        'Batch preparation guides and timing recommendations',
        'Automated shopping lists based on planned meals',
        'Prep time optimization for busy pet parents',
        'Integration with local supplier inventory',
        'Nutritional balance tracking across the week'
      ]}
      backLink="/dashboard/feeding"
      backLinkText="Back to Feeding Dashboard"
      estimatedLaunch="Q2 2025"
    />
  )
}