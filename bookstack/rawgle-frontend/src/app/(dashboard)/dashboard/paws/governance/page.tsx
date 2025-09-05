import { ComingSoonPage } from '@/components/ui/coming-soon-page'
import { Vote } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Governance & Voting | PAWS Dashboard',
  description: 'Participate in platform governance and vote on community decisions',
}

export default function GovernanceVotingPage() {
  return (
    <ComingSoonPage
      title="Governance & Voting"
      description="Help shape the future of Rawgle by participating in community governance. Vote on platform features, policy changes, and strategic decisions that affect the entire raw feeding community."
      iconName="Vote"
      features={[
        'Democratic voting on platform features and updates',
        'Community proposals and discussion forums',
        'Transparent governance processes and results',
        'Voting power based on token holdings and activity',
        'Governance rewards for active participation',
        'Integration with decentralized governance protocols'
      ]}
      backLink="/dashboard/paws"
      backLinkText="Back to PAWS Dashboard"
      estimatedLaunch="Q4 2025"
    />
  )
}