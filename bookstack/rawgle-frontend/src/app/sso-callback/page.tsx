'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Dog } from 'lucide-react'

/**
 * SSO Callback page - handles OAuth redirects from providers
 * Note: Clerk functionality disabled - redirects to sign-in for now
 */
export default function SSOCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Mock SSO callback processing
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Since Clerk is disabled, redirect to dashboard with demo user
        router.push('/dashboard?sso_callback=success')
      } catch (error) {
        console.error('SSO callback error:', error)
        router.push('/auth/sign-in?error=sso_failed')
      }
    }

    handleCallback()
  }, [router])

  // Show loading state during OAuth callback processing
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-charcoal via-zomp to-olivine">
      <div className="text-center text-white">
        <div className="mb-6">
          <Dog className="h-16 w-16 mx-auto text-white mb-4" />
          <div className="text-3xl font-heading font-bold">RAWGLE</div>
        </div>
        <div className="flex items-center justify-center space-x-3">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-lg">Completing authentication...</span>
        </div>
        <p className="text-white/60 mt-4 text-sm">
          Please wait while we finalize your sign-in
        </p>
      </div>
    </div>
  )
}