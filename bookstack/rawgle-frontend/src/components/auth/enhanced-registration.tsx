'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Dog, 
  Mail, 
  Lock, 
  User,
  Eye, 
  EyeOff, 
  ArrowRight,
  AlertCircle,
  Loader2,
  Chrome,
  Apple,
  Check,
  Phone,
  X,
  Shield,
  Wifi,
  WifiOff
} from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import {
  registrationSchema,
  type RegistrationFormData,
  validateEmail,
  calculatePasswordStrength,
  checkPasswordBreach,
  debounce,
  getFieldAriaProps,
  sanitizeInput,
  getRateLimitState,
  updateRateLimitState,
  passwordRequirements,
  type ValidationState
} from '@/lib/validation'

interface RegistrationResponse {
  success: boolean
  message?: string
  errors?: Record<string, string[]>
  user?: {
    id: string
    email: string
  }
}

interface FormErrors {
  [key: string]: string
}

export default function EnhancedRegistration() {
  const router = useRouter()
  
  // Form state
  const [formData, setFormData] = useState<Partial<RegistrationFormData>>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    agreedToTerms: false,
    wantsNewsletter: true
  })
  
  // UI state
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  
  // Validation state
  const [fieldValidation, setFieldValidation] = useState<Record<string, ValidationState>>({})
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set())
  const [passwordStrength, setPasswordStrength] = useState(calculatePasswordStrength(''))
  const [passwordBreached, setPasswordBreached] = useState<boolean | null>(null)
  const [isCheckingBreach, setIsCheckingBreach] = useState(false)
  
  // Refs for accessibility
  const formRef = useRef<HTMLFormElement>(null)
  const firstErrorRef = useRef<HTMLDivElement>(null)
  
  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  
  // Debounced email validation
  const debouncedEmailValidation = useCallback(
    debounce(async (email: string) => {
      if (!email || !touchedFields.has('email')) return
      
      const validation = validateEmail(email)
      setFieldValidation(prev => ({
        ...prev,
        email: { ...validation, hasBeenTouched: true }
      }))
    }, 500),
    [touchedFields]
  )
  
  // Debounced password breach check
  const debouncedBreachCheck = useCallback(
    debounce(async (password: string) => {
      if (!password || password.length < 8) {
        setPasswordBreached(null)
        setIsCheckingBreach(false)
        return
      }
      
      setIsCheckingBreach(true)
      try {
        const isBreached = await checkPasswordBreach(password)
        setPasswordBreached(isBreached)
      } catch (error) {
        console.error('Breach check failed:', error)
        setPasswordBreached(null)
      } finally {
        setIsCheckingBreach(false)
      }
    }, 1000),
    []
  )
  
  // Debounced password confirmation validation
  const debouncedConfirmPasswordValidation = useCallback(
    debounce((password: string, confirmPassword: string) => {
      if (!confirmPassword || !touchedFields.has('confirmPassword')) return
      
      const isValid = password === confirmPassword
      setFieldValidation(prev => ({
        ...prev,
        confirmPassword: {
          isValid,
          error: isValid ? undefined : 'Passwords do not match',
          hasBeenTouched: true
        }
      }))
    }, 250),
    [touchedFields]
  )
  
  // Handle field changes
  const handleFieldChange = (field: keyof RegistrationFormData, value: any) => {
    const sanitizedValue = typeof value === 'string' ? sanitizeInput(value) : value
    
    setFormData(prev => ({
      ...prev,
      [field]: sanitizedValue
    }))
    
    // Clear form-level errors when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
    
    // Field-specific validation
    if (field === 'email' && typeof sanitizedValue === 'string') {
      debouncedEmailValidation(sanitizedValue)
    }
    
    if (field === 'password' && typeof sanitizedValue === 'string') {
      const strength = calculatePasswordStrength(sanitizedValue)
      setPasswordStrength(strength)
      debouncedBreachCheck(sanitizedValue)
      
      // Re-validate confirm password if it exists
      if (formData.confirmPassword) {
        debouncedConfirmPasswordValidation(sanitizedValue, formData.confirmPassword)
      }
    }
    
    if (field === 'confirmPassword' && typeof sanitizedValue === 'string') {
      debouncedConfirmPasswordValidation(formData.password || '', sanitizedValue)
    }
  }
  
  // Handle field blur (touched state)
  const handleFieldBlur = (field: string) => {
    setTouchedFields(prev => new Set(prev).add(field))
    
    // Immediate validation on blur
    if (field === 'email' && formData.email) {
      const validation = validateEmail(formData.email)
      setFieldValidation(prev => ({
        ...prev,
        email: { ...validation, hasBeenTouched: true }
      }))
    }
  }
  
  // OAuth handlers
  const handleOAuthSignUp = async (strategy: 'oauth_google' | 'oauth_apple') => {
    if (!isOnline) {
      toast.error('Please check your internet connection')
      return
    }
    
    try {
      setIsLoading(true)
      // In real implementation, this would integrate with your auth provider
      console.log('OAuth signup with:', strategy)
      toast.info('OAuth signup would redirect to provider')
    } catch (error) {
      console.error('OAuth error:', error)
      toast.error('Failed to sign up with provider')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isOnline) {
      toast.error('Please check your internet connection and try again')
      return
    }
    
    // Check rate limiting
    const rateLimitState = getRateLimitState('registration')
    if (rateLimitState.isBlocked) {
      const resetTimeLeft = Math.ceil((rateLimitState.resetTime - Date.now()) / (1000 * 60))
      toast.error(`Too many attempts. Please try again in ${resetTimeLeft} minutes.`)
      return
    }
    
    setIsLoading(true)
    setFormErrors({})
    
    try {
      // Validate form data
      const validationResult = registrationSchema.safeParse(formData)
      
      if (!validationResult.success) {
        const errors: FormErrors = {}
        validationResult.error.errors.forEach(error => {
          if (error.path.length > 0) {
            errors[error.path[0] as string] = error.message
          }
        })
        setFormErrors(errors)
        
        // Focus first error field
        const firstErrorField = Object.keys(errors)[0]
        if (firstErrorField) {
          const element = document.getElementById(firstErrorField)
          element?.focus()
        }
        
        updateRateLimitState('registration', false)
        return
      }
      
      // Check if password is breached
      if (passwordBreached) {
        setFormErrors({ password: 'This password has been found in data breaches. Please choose a different password.' })
        return
      }
      
      // Submit to API
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(validationResult.data)
      })
      
      const result: RegistrationResponse = await response.json()
      
      if (!response.ok || !result.success) {
        if (result.errors) {
          // Transform array errors to single string errors
          const transformedErrors: FormErrors = {}
          Object.entries(result.errors).forEach(([field, messages]) => {
            // Take the first error message or join multiple messages
            transformedErrors[field] = Array.isArray(messages) ? messages[0] : messages
          })
          setFormErrors(transformedErrors)
        } else {
          throw new Error(result.message || 'Registration failed')
        }
        updateRateLimitState('registration', false)
        return
      }
      
      // Success
      updateRateLimitState('registration', true)
      toast.success('Account created successfully! Please check your email for verification.')
      
      // Redirect to verification page
      router.push('/auth/verify-email?email=' + encodeURIComponent(validationResult.data.email))
      
    } catch (error: any) {
      console.error('Registration error:', error)
      
      if (error.name === 'AbortError') {
        toast.error('Request timed out. Please try again.')
      } else if (!navigator.onLine) {
        toast.error('No internet connection. Please check your network.')
      } else {
        toast.error(error.message || 'Failed to create account. Please try again.')
      }
      
      updateRateLimitState('registration', false)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Check if form is valid
  const isFormValid = () => {
    const requiredFields = ['firstName', 'lastName', 'email', 'password', 'confirmPassword']
    const hasRequiredFields = requiredFields.every(field => formData[field as keyof RegistrationFormData])
    const hasNoFieldErrors = Object.values(fieldValidation).every(v => v.isValid !== false)
    const passwordsMatch = formData.password === formData.confirmPassword
    const termsAgreed = formData.agreedToTerms
    const passwordStrong = passwordStrength.percentage >= 60 // Minimum acceptable strength
    
    return hasRequiredFields && hasNoFieldErrors && passwordsMatch && termsAgreed && passwordStrong && !passwordBreached
  }
  
  return (
    <div className="min-h-screen flex">
      {/* Offline indicator */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-red-500 text-white p-2 text-center z-50 text-sm">
          <WifiOff className="inline h-4 w-4 mr-2" />
          You&apos;re offline. Please check your internet connection.
        </div>
      )}
      
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
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
            <h1 className="text-3xl font-heading font-bold text-charcoal">
              Create Your Account
            </h1>
            <p className="mt-2 text-charcoal-600">
              Join the raw feeding revolution
            </p>
          </div>
          
          {/* OAuth Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => handleOAuthSignUp('oauth_google')}
              disabled={isLoading || !isOnline}
              className="btn btn-outline w-full flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Sign up with Google"
            >
              <Chrome className="h-5 w-5" aria-hidden="true" />
              <span>Sign up with Google</span>
            </button>
            
            <button
              onClick={() => handleOAuthSignUp('oauth_apple')}
              disabled={isLoading || !isOnline}
              className="btn btn-outline w-full flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Sign up with Apple"
            >
              <Apple className="h-5 w-5" aria-hidden="true" />
              <span>Sign up with Apple</span>
            </button>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-charcoal-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-charcoal-50 text-charcoal-600">Or sign up with email</span>
            </div>
          </div>
          
          {/* Registration Form */}
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Name Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* First Name */}
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-charcoal-700 mb-2">
                  First Name <span className="text-red-500" aria-label="required">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-charcoal-400" aria-hidden="true" />
                  </div>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    value={formData.firstName || ''}
                    onChange={(e) => handleFieldChange('firstName', e.target.value)}
                    onBlur={() => handleFieldBlur('firstName')}
                    className={cn(
                      "block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all",
                      formErrors.firstName
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500 animate-pulse"
                        : "border-charcoal-300 focus:ring-pumpkin focus:border-transparent"
                    )}
                    placeholder="John"
                    required
                    maxLength={50}
                    {...getFieldAriaProps('firstName', { 
                      isValid: !formErrors.firstName, 
                      hasBeenTouched: touchedFields.has('firstName'),
                      error: formErrors.firstName 
                    })}
                  />
                </div>
                {formErrors.firstName && (
                  <div 
                    id="firstName-error" 
                    className="mt-2 text-sm text-red-600 flex items-center"
                    role="alert"
                    aria-live="polite"
                  >
                    <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" aria-hidden="true" />
                    {formErrors.firstName}
                  </div>
                )}
              </div>
              
              {/* Last Name */}
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-charcoal-700 mb-2">
                  Last Name <span className="text-red-500" aria-label="required">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-charcoal-400" aria-hidden="true" />
                  </div>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    value={formData.lastName || ''}
                    onChange={(e) => handleFieldChange('lastName', e.target.value)}
                    onBlur={() => handleFieldBlur('lastName')}
                    className={cn(
                      "block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all",
                      formErrors.lastName
                        ? "border-red-300 focus:ring-red-500 focus:border-red-500 animate-pulse"
                        : "border-charcoal-300 focus:ring-pumpkin focus:border-transparent"
                    )}
                    placeholder="Doe"
                    required
                    maxLength={50}
                    {...getFieldAriaProps('lastName', { 
                      isValid: !formErrors.lastName, 
                      hasBeenTouched: touchedFields.has('lastName'),
                      error: formErrors.lastName 
                    })}
                  />
                </div>
                {formErrors.lastName && (
                  <div 
                    id="lastName-error" 
                    className="mt-2 text-sm text-red-600 flex items-center"
                    role="alert"
                    aria-live="polite"
                  >
                    <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" aria-hidden="true" />
                    {formErrors.lastName}
                  </div>
                )}
              </div>
            </div>
            
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-charcoal-700 mb-2">
                Email Address <span className="text-red-500" aria-label="required">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-charcoal-400" aria-hidden="true" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email || ''}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  onBlur={() => handleFieldBlur('email')}
                  className={cn(
                    "block w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all",
                    formErrors.email || fieldValidation.email?.error
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : fieldValidation.email?.isValid
                      ? "border-green-300 focus:ring-green-500 focus:border-green-500"
                      : "border-charcoal-300 focus:ring-pumpkin focus:border-transparent"
                  )}
                  placeholder="you@example.com"
                  required
                  maxLength={254}
                  {...getFieldAriaProps('email', fieldValidation.email || { isValid: true, hasBeenTouched: touchedFields.has('email') })}
                />
                {/* Email validation icon */}
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  {fieldValidation.email?.isChecking ? (
                    <Loader2 className="h-5 w-5 animate-spin text-charcoal-400" aria-hidden="true" />
                  ) : fieldValidation.email?.isValid ? (
                    <Check className="h-5 w-5 text-green-500" aria-hidden="true" />
                  ) : (fieldValidation.email?.error || formErrors.email) && touchedFields.has('email') ? (
                    <X className="h-5 w-5 text-red-500" aria-hidden="true" />
                  ) : null}
                </div>
              </div>
              {(formErrors.email || fieldValidation.email?.error) && (
                <div 
                  id="email-error" 
                  className="mt-2 text-sm text-red-600 flex items-center"
                  role="alert"
                  aria-live="polite"
                >
                  <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" aria-hidden="true" />
                  {formErrors.email || fieldValidation.email?.error}
                </div>
              )}
            </div>
            
            {/* Phone Field (Optional) */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-charcoal-700 mb-2">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-charcoal-400" aria-hidden="true" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={formData.phone || ''}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                  onBlur={() => handleFieldBlur('phone')}
                  className={cn(
                    "block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all",
                    formErrors.phone
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-charcoal-300 focus:ring-pumpkin focus:border-transparent"
                  )}
                  placeholder="+1 (555) 000-0000"
                  maxLength={20}
                  {...getFieldAriaProps('phone', { 
                    isValid: !formErrors.phone, 
                    hasBeenTouched: touchedFields.has('phone'),
                    error: formErrors.phone 
                  })}
                />
              </div>
              {formErrors.phone && (
                <div 
                  id="phone-error" 
                  className="mt-2 text-sm text-red-600 flex items-center"
                  role="alert"
                  aria-live="polite"
                >
                  <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" aria-hidden="true" />
                  {formErrors.phone}
                </div>
              )}
            </div>
            
            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-charcoal-700 mb-2">
                Password <span className="text-red-500" aria-label="required">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-charcoal-400" aria-hidden="true" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formData.password || ''}
                  onChange={(e) => handleFieldChange('password', e.target.value)}
                  onBlur={() => handleFieldBlur('password')}
                  className={cn(
                    "block w-full pl-10 pr-20 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all",
                    formErrors.password
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-charcoal-300 focus:ring-pumpkin focus:border-transparent"
                  )}
                  placeholder="••••••••"
                  required
                  maxLength={128}
                  {...getFieldAriaProps('password', { 
                    isValid: !formErrors.password, 
                    hasBeenTouched: touchedFields.has('password'),
                    error: formErrors.password 
                  }, true)}
                />
                
                {/* Password visibility toggle */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-charcoal-400 hover:text-charcoal-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-charcoal-400 hover:text-charcoal-600" />
                  )}
                </button>
                
                {/* Security indicator */}
                {isCheckingBreach && (
                  <div className="absolute inset-y-0 right-10 pr-2 flex items-center pointer-events-none">
                    <Shield className="h-4 w-4 text-blue-500 animate-pulse" aria-hidden="true" />
                  </div>
                )}
              </div>
              
              {/* Password strength indicator */}
              {formData.password && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-charcoal-700">Password strength</span>
                    <span className={cn(
                      "text-sm font-medium",
                      passwordStrength.color === 'green' ? 'text-green-600' :
                      passwordStrength.color === 'yellow' ? 'text-yellow-600' :
                      'text-red-600'
                    )}>
                      {passwordStrength.percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={cn(
                        "h-2 rounded-full transition-all duration-300",
                        passwordStrength.color === 'green' ? 'bg-green-500' :
                        passwordStrength.color === 'yellow' ? 'bg-yellow-500' :
                        'bg-red-500'
                      )}
                      style={{ width: `${passwordStrength.percentage}%` }}
                      role="progressbar"
                      aria-valuenow={passwordStrength.percentage}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Password strength: ${passwordStrength.percentage}%`}
                    />
                  </div>
                </div>
              )}
              
              {/* Password requirements checklist */}
              <div id="password-help" className="mt-3 space-y-2" role="group" aria-label="Password requirements">
                {passwordRequirements.map((req) => (
                  <div key={req.id} className="flex items-center space-x-2 text-sm">
                    <div className={cn(
                      "w-4 h-4 rounded-full flex items-center justify-center transition-colors",
                      req.test(formData.password || '') ? 'bg-green-500 text-white' : 'bg-charcoal-200'
                    )}>
                      {req.test(formData.password || '') && <Check className="h-3 w-3" aria-hidden="true" />}
                    </div>
                    <span className={cn(
                      "transition-colors",
                      req.test(formData.password || '') ? 'text-green-700' : 'text-charcoal-500'
                    )}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Password breach warning */}
              {passwordBreached && (
                <div 
                  className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3"
                  role="alert"
                  aria-live="assertive"
                >
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Password compromised</p>
                    <p className="text-sm text-red-700 mt-1">
                      This password has been found in data breaches. Please choose a different password for your security.
                    </p>
                  </div>
                </div>
              )}
              
              {formErrors.password && (
                <div 
                  id="password-error" 
                  className="mt-2 text-sm text-red-600 flex items-center"
                  role="alert"
                  aria-live="polite"
                >
                  <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" aria-hidden="true" />
                  {formErrors.password}
                </div>
              )}
            </div>
            
            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-charcoal-700 mb-2">
                Confirm Password <span className="text-red-500" aria-label="required">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-charcoal-400" aria-hidden="true" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formData.confirmPassword || ''}
                  onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
                  onBlur={() => handleFieldBlur('confirmPassword')}
                  className={cn(
                    "block w-full pl-10 pr-20 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all",
                    formErrors.confirmPassword || fieldValidation.confirmPassword?.error
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : fieldValidation.confirmPassword?.isValid
                      ? "border-green-300 focus:ring-green-500 focus:border-green-500"
                      : "border-charcoal-300 focus:ring-pumpkin focus:border-transparent"
                  )}
                  placeholder="••••••••"
                  required
                  maxLength={128}
                  {...getFieldAriaProps('confirmPassword', fieldValidation.confirmPassword || { isValid: true, hasBeenTouched: touchedFields.has('confirmPassword') })}
                />
                
                {/* Password visibility toggle */}
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-charcoal-400 hover:text-charcoal-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-charcoal-400 hover:text-charcoal-600" />
                  )}
                </button>
                
                {/* Match indicator */}
                <div className="absolute inset-y-0 right-10 pr-2 flex items-center pointer-events-none">
                  {formData.confirmPassword && formData.password === formData.confirmPassword ? (
                    <Check className="h-4 w-4 text-green-500" aria-hidden="true" />
                  ) : formData.confirmPassword && formData.password !== formData.confirmPassword ? (
                    <X className="h-4 w-4 text-red-500" aria-hidden="true" />
                  ) : null}
                </div>
              </div>
              {(formErrors.confirmPassword || fieldValidation.confirmPassword?.error) && (
                <div 
                  id="confirmPassword-error" 
                  className="mt-2 text-sm text-red-600 flex items-center"
                  role="alert"
                  aria-live="polite"
                >
                  <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" aria-hidden="true" />
                  {formErrors.confirmPassword || fieldValidation.confirmPassword?.error}
                </div>
              )}
            </div>
            
            {/* Terms and Newsletter */}
            <div className="space-y-3">
              <div className="flex items-start">
                <input
                  id="agreedToTerms"
                  name="agreedToTerms"
                  type="checkbox"
                  checked={formData.agreedToTerms || false}
                  onChange={(e) => handleFieldChange('agreedToTerms', e.target.checked)}
                  className={cn(
                    "h-4 w-4 rounded border-2 focus:ring-2 focus:ring-pumpkin focus:ring-offset-0 mt-0.5",
                    formErrors.agreedToTerms
                      ? "border-red-300 text-red-600"
                      : "border-charcoal-300 text-pumpkin"
                  )}
                  required
                  aria-describedby={formErrors.agreedToTerms ? "agreedToTerms-error" : undefined}
                />
                <label htmlFor="agreedToTerms" className="ml-2 block text-sm text-charcoal-700">
                  I agree to the{' '}
                  <Link 
                    href="/terms" 
                    className="text-pumpkin hover:text-pumpkin-600 underline focus:outline-none focus:ring-2 focus:ring-pumpkin focus:ring-offset-2"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link 
                    href="/privacy" 
                    className="text-pumpkin hover:text-pumpkin-600 underline focus:outline-none focus:ring-2 focus:ring-pumpkin focus:ring-offset-2"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Privacy Policy
                  </Link>{' '}
                  <span className="text-red-500" aria-label="required">*</span>
                </label>
              </div>
              {formErrors.agreedToTerms && (
                <div 
                  id="agreedToTerms-error" 
                  className="text-sm text-red-600 flex items-center"
                  role="alert"
                  aria-live="polite"
                >
                  <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" aria-hidden="true" />
                  {formErrors.agreedToTerms}
                </div>
              )}
              
              <div className="flex items-start">
                <input
                  id="wantsNewsletter"
                  name="wantsNewsletter"
                  type="checkbox"
                  checked={formData.wantsNewsletter || false}
                  onChange={(e) => handleFieldChange('wantsNewsletter', e.target.checked)}
                  className="h-4 w-4 text-pumpkin focus:ring-pumpkin border-charcoal-300 rounded mt-0.5"
                />
                <label htmlFor="wantsNewsletter" className="ml-2 block text-sm text-charcoal-700">
                  Send me tips, updates, and special offers (you can unsubscribe anytime)
                </label>
              </div>
            </div>
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !isFormValid() || !isOnline}
              className={cn(
                "w-full flex items-center justify-center space-x-2 font-semibold transition-all",
                "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pumpkin",
                isFormValid() && !isLoading && isOnline
                  ? "btn btn-primary hover:shadow-lg"
                  : "btn bg-charcoal-200 text-charcoal-500 cursor-not-allowed hover:transform-none"
              )}
              aria-describedby="submit-help"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </>
              )}
            </button>
            
            <p id="submit-help" className="text-xs text-charcoal-500 text-center">
              By creating an account, you agree to receive communication from Rawgle and can opt out at any time.
            </p>
          </form>
          
          <p className="text-center text-sm text-charcoal-600">
            Already have an account?{' '}
            <Link 
              href="/auth/sign-in" 
              className="font-medium text-pumpkin hover:text-pumpkin-600 focus:outline-none focus:ring-2 focus:ring-pumpkin focus:ring-offset-2"
            >
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
      
      {/* Right Panel - Benefits */}
      <div className="hidden lg:block lg:w-1/2 bg-gradient-to-br from-charcoal via-zomp to-olivine">
        <div className="h-full flex items-center justify-center p-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-white text-center max-w-md"
          >
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-white/10 backdrop-blur-sm rounded-full mb-6">
                <Shield className="h-12 w-12 text-sunglow" />
              </div>
              <h2 className="text-3xl font-heading font-bold mb-4">
                Secure & Simple
              </h2>
              <p className="text-white/80 text-lg mb-6">
                Your data is protected with enterprise-grade security. Join thousands of pet parents who trust Rawgle.
              </p>
            </div>
            
            <div className="space-y-4 text-left">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-sunglow/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="h-4 w-4 text-sunglow" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Free Forever Plan</h3>
                  <p className="text-sm text-white/70">Track one pet with basic features at no cost</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-sunglow/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="h-4 w-4 text-sunglow" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">AI Nutritionist</h3>
                  <p className="text-sm text-white/70">Get instant answers to all your raw feeding questions</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-sunglow/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="h-4 w-4 text-sunglow" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Community Access</h3>
                  <p className="text-sm text-white/70">Connect with thousands of raw feeders worldwide</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-white/10 backdrop-blur-sm rounded-lg">
              <div className="flex items-center justify-around mb-2">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-sunglow text-xl" aria-hidden="true">★</span>
                ))}
              </div>
              <p className="text-sm text-white/90">
                &quot;The best investment I&apos;ve made for my dogs&apos; health!&quot;
              </p>
              <p className="text-sm text-sunglow mt-1">- 10,000+ Happy Users</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}