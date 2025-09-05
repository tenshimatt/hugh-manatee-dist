'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Mail, Dog, ArrowLeft, Check } from 'lucide-react'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center space-x-2 mb-6">
            <Dog className="h-8 w-8 text-pumpkin" />
            <span className="text-2xl font-heading font-bold text-gradient-brand">RAWGLE</span>
          </Link>
          
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          
          <h1 className="text-2xl font-heading font-bold text-charcoal mb-2">
            Account Created Successfully!
          </h1>
          
          <p className="text-charcoal-600 mb-4">
            {email ? (
              <>We've sent a verification email to <strong>{email}</strong></>
            ) : (
              'We\'ve sent you a verification email'
            )}
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Mail className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-blue-800 mb-1">
                  Check Your Email
                </h3>
                <p className="text-sm text-blue-700">
                  Click the verification link in your email to activate your account and start using Rawgle.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center space-y-4">
            <p className="text-sm text-charcoal-600">
              Didn't receive the email? Check your spam folder or{' '}
              <button 
                className="text-pumpkin hover:text-pumpkin-600 font-medium focus:outline-none focus:ring-2 focus:ring-pumpkin focus:ring-offset-2"
                onClick={() => {
                  // In real implementation, resend verification email
                  console.log('Resending verification email to:', email)
                  // toast.success('Verification email sent!')
                }}
              >
                resend the email
              </button>
            </p>

            <div className="pt-4">
              <Link 
                href="/auth/sign-in"
                className="btn btn-primary w-full flex items-center justify-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Return to Sign In</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-charcoal-200">
          <div className="text-center text-sm text-charcoal-500">
            <h4 className="font-medium mb-2">What's next?</h4>
            <ul className="space-y-1">
              <li>✓ Verify your email address</li>
              <li>✓ Complete your pet profile</li>
              <li>✓ Start tracking your raw feeding journey</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pumpkin"></div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}