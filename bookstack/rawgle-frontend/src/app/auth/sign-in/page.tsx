'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
// import { useSignIn } from '@clerk/nextjs'  // Temporarily disabled
import { motion } from 'framer-motion'
import { 
  Dog, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight,
  AlertCircle,
  Loader2,
  Chrome,
  Apple,
  Wallet
} from 'lucide-react'
import { toast } from 'sonner'

export default function SignInPage() {
  // const { isLoaded, signIn, setActive } = useSignIn()  // Temporarily disabled
  const isLoaded = false  // Temporarily disabled
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('Authentication temporarily disabled for styling fixes')
    // Temporarily disabled authentication
  }

  const handleOAuthSignIn = async (strategy: 'oauth_google' | 'oauth_apple') => {
    setError('OAuth authentication temporarily disabled for styling fixes')
    // Temporarily disabled authentication
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 lg:py-0">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full space-y-8"
        >
          {/* Logo and Header */}
          <div className="text-center">
            <Link href="/" className="inline-flex items-center justify-center space-x-2 mb-6">
              <Dog className="h-10 w-10 text-pumpkin" />
              <span className="text-3xl font-heading font-bold text-gradient-brand">RAWGLE</span>
            </Link>
            <h2 className="text-3xl font-heading font-bold text-charcoal">
              Welcome Back
            </h2>
            <p className="mt-2 text-charcoal-600">
              Sign in to access your pet dashboard
            </p>
          </div>

          {/* OAuth Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => handleOAuthSignIn('oauth_google')}
              className="btn btn-outline w-full flex items-center justify-center space-x-3"
            >
              <Chrome className="h-5 w-5" />
              <span>Continue with Google</span>
            </button>
            
            <button
              onClick={() => handleOAuthSignIn('oauth_apple')}
              className="btn btn-outline w-full flex items-center justify-center space-x-3"
            >
              <Apple className="h-5 w-5" />
              <span>Continue with Apple</span>
            </button>
            
            <button
              disabled
              className="btn btn-outline w-full flex items-center justify-center space-x-3 opacity-50 cursor-not-allowed"
            >
              <Wallet className="h-5 w-5" />
              <span>Connect Web3 Wallet (Coming Soon)</span>
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-charcoal-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-charcoal-600">Or continue with email</span>
            </div>
          </div>

          {/* Sign In Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3"
              >
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </motion.div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-charcoal-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-charcoal-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-charcoal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pumpkin focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-charcoal-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-charcoal-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-12 py-3 border border-charcoal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pumpkin focus:border-transparent"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-charcoal-400 hover:text-charcoal-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-charcoal-400 hover:text-charcoal-600" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-pumpkin focus:ring-pumpkin border-charcoal-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-charcoal-700">
                  Remember me
                </label>
              </div>

              <Link href="/auth/forgot-password" className="text-sm text-pumpkin hover:text-pumpkin-600">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-charcoal-600">
            Don&apos;t have an account?{' '}
            <Link href="/auth/sign-up" className="font-medium text-pumpkin hover:text-pumpkin-600">
              Sign up for free
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right Panel - Image/Graphics */}
      <div className="lg:w-1/2 bg-gradient-to-br from-charcoal via-zomp to-olivine min-h-48 lg:min-h-screen">
        <div className="h-full flex items-center justify-center p-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-white text-center max-w-md"
          >
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-white/10 backdrop-blur-sm rounded-full mb-6">
                <Dog className="h-12 w-12 text-white" />
              </div>
              <h3 className="text-3xl font-heading font-bold mb-4">
                Track Every Meal
              </h3>
              <p className="text-white/80 text-lg">
                Monitor your pet&apos;s nutrition journey with detailed feeding logs, health tracking, and smart analytics.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold text-sunglow mb-1">10,000+</div>
                <div className="text-sm text-white/70">Active Users</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold text-sunglow mb-1">9,000+</div>
                <div className="text-sm text-white/70">Store Locations</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold text-sunglow mb-1">50,000+</div>
                <div className="text-sm text-white/70">Pets Tracked</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold text-sunglow mb-1">4.9/5</div>
                <div className="text-sm text-white/70">User Rating</div>
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-white/10 backdrop-blur-sm rounded-lg">
              <p className="text-sm text-white/90 italic">
                &quot;RAWGLE completely transformed how I manage my pack&apos;s raw diet. The auto-reorder feature alone saves me hours every month!&quot;
              </p>
              <p className="text-sm text-sunglow mt-2">- Sarah, Pack Leader of 4</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
