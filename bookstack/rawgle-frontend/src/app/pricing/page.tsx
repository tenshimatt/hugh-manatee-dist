import Link from 'next/link'
import { Navigation } from '@/components/layout/navigation'

export default function PricingPage() {
  return (
    <>
      <Navigation />
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <h1 className="text-4xl font-heading font-bold mb-4 text-charcoal">Pricing</h1>
          <p className="text-xl text-muted-foreground mb-8">Coming soon...</p>
          <Link href="/" className="btn btn-primary">Back to Home</Link>
        </div>
      </div>
    </>
  )
}