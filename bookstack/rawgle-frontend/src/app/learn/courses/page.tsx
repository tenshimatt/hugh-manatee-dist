import { ComingSoonPage } from '@/components/ui/coming-soon-page'
import { Play } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Video Courses | Rawgle Learn',
  description: 'Expert-led video courses and tutorials on raw feeding',
}

export default function VideoCoursesPage() {
  return (
    <ComingSoonPage
      title="Video Courses"
      description="Learn from certified experts through comprehensive video courses. Master raw feeding techniques, nutrition planning, and health optimization with interactive lessons and practical demonstrations."
      iconName="Play"
      features={[
        'Expert-led courses by certified nutritionists',
        'Interactive video lessons with practical demos',
        'Course completion certificates and badges',
        'Downloadable resources and meal planning templates',
        'Live Q&A sessions with course instructors',
        'Progress tracking and personalized learning paths'
      ]}
      backLink="/blog"
      backLinkText="Back to Blog & Articles"
      estimatedLaunch="Q3 2025"
    />
  )
}