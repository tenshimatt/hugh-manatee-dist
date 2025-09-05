'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Dog } from 'lucide-react'

/**
 * Register page redirect - redirects to /auth/sign-up
 * This page exists to handle navigation links that point to /auth/register
 * while the actual sign-up page is at /auth/sign-up
 */
export default function RegisterRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    // Immediate redirect to the actual sign-up page
    router.replace('/auth/sign-up')
  }, [router])

  // Show loading state during redirect
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-charcoal via-zomp to-olivine">
      <div className="text-center text-white">
        <div className="mb-6">
          <Dog className="h-16 w-16 mx-auto text-white mb-4" />
          <div className="text-3xl font-heading font-bold">RAWGLE</div>
        </div>
        <div className="flex items-center justify-center space-x-3">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-lg">Redirecting to sign up...</span>
        </div>
      </div>
    </div>
  )
}