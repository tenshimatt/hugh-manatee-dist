import Link from 'next/link'
import { Navigation } from '@/components/layout/navigation'

export default function FeaturesPage() {
  return (
    <>
      <Navigation />
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center max-w-2xl mx-auto px-4">
          <h1 className="text-4xl font-heading font-bold mb-4 text-charcoal">Features</h1>
          <p className="text-xl text-charcoal-600 mb-8">
            Discover all the powerful features that make RAWGLE the ultimate platform for raw pet food enthusiasts.
          </p>
          <p className="text-charcoal-400 mb-8">Coming soon...</p>
          <Link href="/" className="btn btn-primary">
            Back to Home
          </Link>
        </div>
      </div>
    </>
  )
}