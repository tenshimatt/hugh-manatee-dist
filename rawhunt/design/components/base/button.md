# Button Component

## Overview

The Button component is the foundation of user interactions in GoHunta.com, designed for reliable operation in field conditions with gloves and in various lighting conditions.

## Design Specifications

### Visual Design
- **Minimum touch target**: 44px × 44px (WCAG AA compliance)
- **Comfortable touch target**: 48px × 48px for primary actions
- **High contrast ratios**: 4.5:1 minimum for text and background
- **Clear focus indicators**: 2px outline with high contrast

### Variants

#### Primary Button
```css
.btn-primary {
  background-color: var(--primary-500);
  color: var(--neutral-50);
  border: 2px solid var(--primary-500);
  font-weight: var(--font-semibold);
}

.btn-primary:hover {
  background-color: var(--primary-600);
  border-color: var(--primary-600);
}

.btn-primary:focus {
  outline: 2px solid var(--primary-300);
  outline-offset: 2px;
}
```

#### Secondary Button
```css
.btn-secondary {
  background-color: transparent;
  color: var(--primary-500);
  border: 2px solid var(--primary-500);
  font-weight: var(--font-medium);
}

.btn-secondary:hover {
  background-color: var(--primary-50);
}
```

#### Success Button (Hunt Success)
```css
.btn-success {
  background-color: var(--success);
  color: var(--neutral-50);
  border: 2px solid var(--success);
}
```

#### Warning Button (Caution Actions)
```css
.btn-warning {
  background-color: var(--warning);
  color: var(--neutral-900);
  border: 2px solid var(--warning);
}
```

#### Danger Button (Emergency/Delete)
```css
.btn-danger {
  background-color: var(--error);
  color: var(--neutral-50);
  border: 2px solid var(--error);
}
```

### Sizes

#### Small (Secondary Actions)
```css
.btn-sm {
  min-height: 36px;
  min-width: 36px;
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
}
```

#### Medium (Default)
```css
.btn-md {
  min-height: 44px;
  min-width: 44px;
  padding: var(--space-3) var(--space-6);
  font-size: var(--text-base);
}
```

#### Large (Primary Actions)
```css
.btn-lg {
  min-height: 48px;
  min-width: 48px;
  padding: var(--space-4) var(--space-8);
  font-size: var(--text-lg);
}
```

### States

#### Disabled State
```css
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}
```

#### Loading State
```css
.btn-loading {
  position: relative;
  color: transparent;
}

.btn-loading::after {
  content: '';
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: inherit;
  border-radius: inherit;
}
```

## React Implementation

```tsx
import React from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  className,
  disabled,
  children,
  ...props
}) => {
  const buttonClasses = clsx(
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    {
      'btn-loading': loading,
      'btn-full-width': fullWidth,
      'btn-with-icon': icon,
    },
    className
  );

  return (
    <button
      className={buttonClasses}
      disabled={disabled || loading}
      {...props}
    >
      {icon && iconPosition === 'left' && (
        <span className="btn__icon btn__icon--left">{icon}</span>
      )}
      <span className="btn__text">{children}</span>
      {icon && iconPosition === 'right' && (
        <span className="btn__icon btn__icon--right">{icon}</span>
      )}
      {loading && (
        <span className="btn__spinner" aria-hidden="true">
          <LoadingSpinner size="sm" />
        </span>
      )}
    </button>
  );
};
```

## CSS Implementation

```css
/* Base Button Styles */
.btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  
  font-family: var(--font-sans);
  font-weight: var(--font-medium);
  line-height: var(--leading-none);
  text-decoration: none;
  text-align: center;
  white-space: nowrap;
  vertical-align: middle;
  
  border: 2px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  user-select: none;
  
  transition: all 0.2s ease-out;
  
  /* Ensure minimum touch target */
  min-height: 44px;
  min-width: 44px;
}

/* Focus Management */
.btn:focus {
  outline: 2px solid var(--primary-300);
  outline-offset: 2px;
}

.btn:focus:not(:focus-visible) {
  outline: none;
}

/* Icon Handling */
.btn__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.btn__icon--left {
  margin-right: var(--space-1);
}

.btn__icon--right {
  margin-left: var(--space-1);
}

/* Loading Spinner */
.btn__spinner {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: inherit;
  border-radius: inherit;
  color: inherit;
}

/* Full Width */
.btn-full-width {
  width: 100%;
}

/* Responsive Adjustments */
@media (min-width: 768px) {
  .btn {
    transition: all 0.15s ease-out;
  }
  
  .btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
}

/* High Contrast Mode */
@media (prefers-contrast: high) {
  .btn {
    border-width: 3px;
  }
  
  .btn:focus {
    outline-width: 3px;
  }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .btn {
    transition: none;
  }
  
  .btn:hover {
    transform: none;
  }
}

/* Print Styles */
@media print {
  .btn {
    border: 2px solid var(--neutral-900);
    background: transparent !important;
    color: var(--neutral-900) !important;
  }
}
```

## Hunting-Specific Usage Examples

### Quick Hunt Log Button
```tsx
<Button
  variant="success"
  size="lg"
  icon={<TargetIcon />}
  onClick={handleQuickLog}
  aria-label="Log successful hunt with current GPS location"
>
  Quick Log Hunt
</Button>
```

### Emergency Contact Button
```tsx
<Button
  variant="danger"
  size="lg"
  fullWidth
  icon={<PhoneIcon />}
  onClick={handleEmergencyContact}
  aria-label="Call emergency contact"
>
  Emergency Contact
</Button>
```

### GPS Location Button
```tsx
<Button
  variant="secondary"
  size="md"
  icon={<LocationIcon />}
  loading={gpsLoading}
  disabled={!gpsAvailable}
  onClick={handleGetLocation}
  aria-label="Get current GPS location"
>
  {gpsLoading ? 'Getting Location...' : 'Get GPS Location'}
</Button>
```

## Accessibility Features

### ARIA Support
```tsx
<Button
  aria-label="Save hunt log entry"
  aria-describedby="save-help"
  aria-pressed={isSaved}
>
  Save Hunt Log
</Button>
<div id="save-help" className="sr-only">
  Saves current hunt information to your profile
</div>
```

### Keyboard Navigation
- **Space/Enter**: Activates button
- **Tab**: Focuses next element
- **Shift+Tab**: Focuses previous element

### Screen Reader Support
- Announces button purpose and state
- Indicates loading states
- Describes disabled reasons

## Testing Guidelines

### Unit Tests
```typescript
describe('Button Component', () => {
  it('renders with correct accessibility attributes', () => {
    render(
      <Button aria-label="Test button">Click me</Button>
    );
    
    const button = screen.getByRole('button', { name: 'Test button' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'Test button');
  });

  it('meets minimum touch target size', () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByRole('button');
    const styles = getComputedStyle(button);
    
    expect(parseInt(styles.minHeight)).toBeGreaterThanOrEqual(44);
    expect(parseInt(styles.minWidth)).toBeGreaterThanOrEqual(44);
  });

  it('handles loading state correctly', () => {
    render(
      <Button loading aria-label="Loading button">
        Submit
      </Button>
    );
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('btn-loading');
  });
});
```

### Visual Regression Tests
- All variants and sizes
- Focus states
- Hover states (desktop)
- High contrast mode
- Different screen sizes

### Integration Tests
- Button click handling
- Form submission
- Navigation triggers
- Loading state management

## Performance Considerations

### Bundle Size
- Base button styles: ~2KB gzipped
- With all variants: ~3KB gzipped
- Icon handling: Lazy-loaded where possible

### Runtime Performance
- Minimal re-renders
- Efficient event handling
- Optimized transitions
- Memory-conscious icon management

## Browser Support

- iOS Safari 14+
- Chrome Mobile 90+
- Firefox Mobile 90+
- Samsung Internet 14+
- Desktop browsers with full feature support

## Related Components

- [Loading](./loading.md) - For loading states
- [Icon](../base/icon.md) - For button icons
- [Form](../forms/README.md) - Form integration
- [QuickActions](../navigation/quick-actions.md) - Floating action buttons