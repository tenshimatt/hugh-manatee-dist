'use client'

import { Button, ButtonProps } from '@/components/ui/button'
import { forwardRef } from 'react'

interface AccessibleButtonProps extends ButtonProps {
  'aria-label'?: string
  'aria-describedby'?: string
  loading?: boolean
  loadingText?: string
}

const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({ children, loading, loadingText, 'aria-label': ariaLabel, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        aria-label={loading ? loadingText : ariaLabel}
        aria-busy={loading}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading ? loadingText || 'Loading...' : children}
      </Button>
    )
  }
)

AccessibleButton.displayName = 'AccessibleButton'

export default AccessibleButton