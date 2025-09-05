/**
 * Loading Spinner Component
 * 
 * Beautiful, accessible loading spinner with multiple sizes and colors
 * that matches the Rawgle brand design system.
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'pumpkin' | 'sunglow' | 'olivine' | 'zomp' | 'charcoal' | 'white';
  className?: string;
  'aria-label'?: string;
}

const sizeClasses = {
  small: 'w-4 h-4',
  medium: 'w-8 h-8',
  large: 'w-12 h-12',
};

const colorClasses = {
  pumpkin: 'text-pumpkin',
  sunglow: 'text-sunglow',
  olivine: 'text-olivine',
  zomp: 'text-zomp',
  charcoal: 'text-charcoal',
  white: 'text-white',
};

export function LoadingSpinner({
  size = 'medium',
  color = 'pumpkin',
  className,
  'aria-label': ariaLabel = 'Loading',
  ...props
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-current border-t-transparent',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      role="status"
      aria-label={ariaLabel}
      {...props}
    >
      <span className="sr-only">{ariaLabel}</span>
    </div>
  );
}

// Alternative spinner designs
export function PulseSpinner({
  size = 'medium',
  color = 'pumpkin',
  className,
  'aria-label': ariaLabel = 'Loading',
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-full bg-current',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      role="status"
      aria-label={ariaLabel}
    >
      <span className="sr-only">{ariaLabel}</span>
    </div>
  );
}

export function DotsSpinner({
  size = 'medium',
  color = 'pumpkin',
  className,
  'aria-label': ariaLabel = 'Loading',
}: LoadingSpinnerProps) {
  const dotSize = {
    small: 'w-1 h-1',
    medium: 'w-2 h-2',
    large: 'w-3 h-3',
  };

  return (
    <div
      className={cn('flex space-x-1', className)}
      role="status"
      aria-label={ariaLabel}
    >
      <span className="sr-only">{ariaLabel}</span>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'animate-bounce rounded-full bg-current',
            dotSize[size],
            colorClasses[color]
          )}
          style={{
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}

export function BrandSpinner({
  size = 'medium',
  className,
  'aria-label': ariaLabel = 'Loading',
}: Omit<LoadingSpinnerProps, 'color'>) {
  const logoSize = {
    small: 'w-6 h-6',
    medium: 'w-12 h-12',
    large: 'w-16 h-16',
  };

  return (
    <div
      className={cn('relative', logoSize[size], className)}
      role="status"
      aria-label={ariaLabel}
    >
      <span className="sr-only">{ariaLabel}</span>
      
      {/* Outer spinning ring */}
      <div className="absolute inset-0 animate-spin">
        <div className="h-full w-full rounded-full border-2 border-pumpkin border-t-transparent" />
      </div>
      
      {/* Inner pulsing dot */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-2 h-2 bg-pumpkin rounded-full animate-pulse" />
      </div>
    </div>
  );
}