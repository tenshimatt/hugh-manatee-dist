import { ComingSoonPage } from '@/components/ui/coming-soon-page'
import { ChefHat } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Recipe Exchange | Rawgle Community',
  description: 'Share and discover raw food recipes from the Rawgle community',
}

export default function RecipeExchangePage() {
  return (
    <ComingSoonPage
      title="Recipe Exchange"
      description="Discover and share delicious, nutritionally balanced raw food recipes with fellow pet parents. From beginner-friendly meals to gourmet preparations, find the perfect recipes for your pet."
      iconName="ChefHat"
      features={[
        'Thousands of community-tested raw food recipes',
        'Nutritional analysis for every shared recipe',
        'Recipe rating and review system',
        'Dietary restriction and allergy filters',
        'Photo and video recipe instructions',
        'Personal recipe collection and meal planning'
      ]}
      backLink="/community"
      backLinkText="Back to Community Hub"
      estimatedLaunch="Q1 2025"
    />
  )
}