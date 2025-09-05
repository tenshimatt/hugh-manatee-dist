import { z } from 'zod'

// RFC 5322 email validation regex (simplified but comprehensive)
const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

// Common disposable email domains for basic detection
const disposableEmailDomains = [
  '10minutemail.com',
  'guerrillamail.com',
  'temp-mail.org',
  'throwaway.email',
  'mailinator.com',
  'dispostable.com',
  'yopmail.com',
  'fakeinbox.com'
]

// Password strength requirements
export const passwordRequirements = [
  { 
    id: 'length', 
    label: 'At least 8 characters', 
    test: (pw: string) => pw.length >= 8,
    weight: 2
  },
  { 
    id: 'uppercase', 
    label: 'One uppercase letter', 
    test: (pw: string) => /[A-Z]/.test(pw),
    weight: 1
  },
  { 
    id: 'lowercase', 
    label: 'One lowercase letter', 
    test: (pw: string) => /[a-z]/.test(pw),
    weight: 1
  },
  { 
    id: 'number', 
    label: 'One number', 
    test: (pw: string) => /\d/.test(pw),
    weight: 1
  },
  { 
    id: 'special', 
    label: 'One special character', 
    test: (pw: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw),
    weight: 2
  },
]

// Enhanced form validation schema
export const registrationSchema = z.object({
  firstName: z
    .string()
    .min(1, { message: 'First name is required' })
    .min(2, { message: 'First name must be at least 2 characters' })
    .max(50, { message: 'First name must be less than 50 characters' })
    .regex(/^[a-zA-Z\s'-]+$/, { message: 'First name can only contain letters, spaces, hyphens, and apostrophes' })
    .trim(),
  
  lastName: z
    .string()
    .min(1, { message: 'Last name is required' })
    .min(2, { message: 'Last name must be at least 2 characters' })
    .max(50, { message: 'Last name must be less than 50 characters' })
    .regex(/^[a-zA-Z\s'-]+$/, { message: 'Last name can only contain letters, spaces, hyphens, and apostrophes' })
    .trim(),
  
  email: z
    .string()
    .min(1, { message: 'Email address is required' })
    .regex(emailRegex, { message: 'Please enter a valid email address' })
    .max(254, { message: 'Email address is too long' })
    .toLowerCase()
    .refine(
      (email) => {
        const domain = email.split('@')[1]
        return !disposableEmailDomains.includes(domain)
      },
      { message: 'Please use a permanent email address' }
    ),
  
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters long' })
    .max(128, { message: 'Password must be less than 128 characters' })
    .refine(
      (password) => passwordRequirements.every(req => req.test(password)),
      { message: 'Password must meet all requirements' }
    ),
  
  confirmPassword: z.string(),
  
  phone: z
    .string()
    .optional()
    .refine(
      (phone) => {
        if (!phone) return true
        // E.164 format validation (international phone numbers)
        return /^\+?[1-9]\d{1,14}$/.test(phone.replace(/[\s\-\(\)]/g, ''))
      },
      { message: 'Please enter a valid phone number' }
    ),
  
  agreedToTerms: z
    .boolean()
    .refine(val => val === true, { message: 'You must agree to the terms and conditions' }),
  
  wantsNewsletter: z.boolean().optional()
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  }
)

export type RegistrationFormData = z.infer<typeof registrationSchema>

// Validation state types
export interface ValidationState {
  isValid: boolean
  isChecking?: boolean
  error?: string
  hasBeenTouched?: boolean
}

export interface PasswordStrength {
  score: number
  percentage: number
  color: 'red' | 'yellow' | 'green'
  feedback: string[]
}

// Email validation functions
export function validateEmail(email: string): ValidationState {
  try {
    const result = registrationSchema.shape.email.safeParse(email)
    return {
      isValid: result.success,
      error: result.success ? undefined : result.error.errors[0]?.message
    }
  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid email format'
    }
  }
}

export function isDisposableEmail(email: string): boolean {
  const domain = email.toLowerCase().split('@')[1]
  return domain ? disposableEmailDomains.includes(domain) : false
}

// Password strength calculation
export function calculatePasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return {
      score: 0,
      percentage: 0,
      color: 'red',
      feedback: ['Enter a password']
    }
  }

  const passedRequirements = passwordRequirements.filter(req => req.test(password))
  const totalWeight = passwordRequirements.reduce((sum, req) => sum + req.weight, 0)
  const achievedWeight = passedRequirements.reduce((sum, req) => sum + req.weight, 0)
  
  const percentage = Math.round((achievedWeight / totalWeight) * 100)
  
  let color: 'red' | 'yellow' | 'green' = 'red'
  let feedback: string[] = []
  
  if (percentage >= 85) {
    color = 'green'
    feedback = ['Strong password!']
  } else if (percentage >= 60) {
    color = 'yellow'
    feedback = ['Good password, consider adding more complexity']
  } else {
    color = 'red'
    feedback = passwordRequirements
      .filter(req => !req.test(password))
      .map(req => `Missing: ${req.label}`)
  }

  // Additional feedback for common patterns
  if (password.length > 0) {
    if (/^(.)\1+$/.test(password)) {
      feedback.push('Avoid repeating characters')
    }
    if (/^(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(password)) {
      feedback.push('Avoid sequential characters')
    }
    if (/^(password|123456|qwerty|abc123|admin|welcome)/i.test(password)) {
      feedback.push('Avoid common passwords')
    }
  }

  return {
    score: achievedWeight,
    percentage,
    color,
    feedback
  }
}

// HaveIBeenPwned password breach check
export async function checkPasswordBreach(password: string): Promise<boolean> {
  if (!password || password.length < 1) return false
  
  try {
    // Create SHA-1 hash
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-1', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase()
    
    // Use k-anonymity: send first 5 chars, get back suffixes
    const prefix = hashHex.slice(0, 5)
    const suffix = hashHex.slice(5)
    
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Rawgle-Registration-Check'
      }
    })
    
    if (!response.ok) {
      // If service is down, don't block registration
      console.warn('Password breach check service unavailable')
      return false
    }
    
    const text = await response.text()
    const breached = text.includes(suffix)
    
    return breached
  } catch (error) {
    console.error('Password breach check failed:', error)
    // If check fails, don't block registration
    return false
  }
}

// Form validation utilities
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(null, args), delay)
  }
}

// Accessibility helpers
export function getAriaDescribedBy(fieldId: string, hasError: boolean, hasHelp: boolean = false): string {
  const ids: string[] = []
  
  if (hasError) {
    ids.push(`${fieldId}-error`)
  }
  
  if (hasHelp) {
    ids.push(`${fieldId}-help`)
  }
  
  return ids.length > 0 ? ids.join(' ') : ''
}

export function getFieldAriaProps(fieldId: string, validation: ValidationState, hasHelp: boolean = false) {
  return {
    'aria-invalid': validation.hasBeenTouched && !validation.isValid,
    'aria-describedby': getAriaDescribedBy(fieldId, Boolean(validation.error), hasHelp) || undefined
  }
}

// Input sanitization
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>'"&]/g, '') // Remove potential XSS characters
    .trim()
}

// Rate limiting helpers
export interface RateLimitState {
  attempts: number
  lastAttempt: number
  isBlocked: boolean
  resetTime: number
}

export function getRateLimitState(key: string): RateLimitState {
  const stored = localStorage.getItem(`rate_limit_${key}`)
  if (!stored) {
    return { attempts: 0, lastAttempt: 0, isBlocked: false, resetTime: 0 }
  }
  
  try {
    return JSON.parse(stored)
  } catch {
    return { attempts: 0, lastAttempt: 0, isBlocked: false, resetTime: 0 }
  }
}

export function updateRateLimitState(key: string, success: boolean = false): RateLimitState {
  const current = getRateLimitState(key)
  const now = Date.now()
  const hourInMs = 60 * 60 * 1000
  
  // Reset if more than an hour has passed
  if (now - current.lastAttempt > hourInMs) {
    current.attempts = 0
    current.isBlocked = false
  }
  
  if (success) {
    // Reset on success
    current.attempts = 0
    current.isBlocked = false
  } else {
    // Increment attempts
    current.attempts += 1
    current.lastAttempt = now
    
    // Block after 3 attempts
    if (current.attempts >= 3) {
      current.isBlocked = true
      current.resetTime = now + hourInMs
    }
  }
  
  localStorage.setItem(`rate_limit_${key}`, JSON.stringify(current))
  return current
}