# GoHunta.com Accessibility Guidelines

## Overview

GoHunta.com is committed to providing an inclusive experience for all hunters, including those with visual, auditory, motor, and cognitive disabilities. Our accessibility framework ensures WCAG 2.1 AA compliance while maintaining the specialized functionality required for hunting applications.

## Accessibility Standards

### WCAG 2.1 AA Compliance
We adhere to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards:

#### Perceivable
- **Color Contrast**: 4.5:1 ratio for normal text, 3:1 for large text
- **Alternative Text**: All images and icons have meaningful alt text
- **Audio Descriptions**: Video content includes audio descriptions
- **Flexible Display**: Content works with 200% zoom and custom stylesheets

#### Operable
- **Keyboard Navigation**: All functionality available via keyboard
- **No Seizures**: No content flashes more than 3 times per second
- **Time Limits**: Users can extend or disable time limits
- **Focus Management**: Logical focus order and visible focus indicators

#### Understandable
- **Clear Language**: Content written at appropriate reading level
- **Predictable Navigation**: Consistent navigation patterns
- **Input Assistance**: Clear error messages and input requirements
- **Context Changes**: No unexpected context changes

#### Robust
- **Valid Code**: HTML validates and works with assistive technologies
- **Compatibility**: Functions with current and future assistive technologies
- **Future-Proof**: Semantic markup and ARIA implementation

## Hunting-Specific Accessibility Considerations

### Field Operation Accessibility
- **High Contrast Mode**: Enhanced visibility in bright sunlight
- **Large Touch Targets**: Minimum 44px for glove compatibility
- **Voice Commands**: Hands-free operation during hunting
- **Haptic Feedback**: Tactile confirmation for critical actions

### Assistive Technology Integration
- **Screen Readers**: Full compatibility with VoiceOver, TalkBack, NVDA
- **Voice Control**: iOS Voice Control, Android Voice Access support
- **Switch Navigation**: Support for external switch devices
- **Eye Tracking**: Compatible with eye-tracking input devices

## Implementation Framework

### CSS Accessibility Features

```css
/* High Contrast Mode */
@media (prefers-contrast: high) {
  :root {
    --contrast-ratio: 7:1;
    --primary-500: #000080;
    --background: #ffffff;
    --text: #000000;
  }
  
  .btn {
    border: 3px solid currentColor;
    font-weight: var(--font-bold);
  }
  
  .card {
    border: 2px solid var(--text);
    box-shadow: none;
  }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  .hunt-loading {
    animation: none;
  }
  
  .gps-pulse {
    animation: none;
  }
}

/* Focus Indicators */
.focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
  border-radius: 4px;
}

.focus-visible:not(:focus-visible) {
  outline: none;
}

/* Touch Target Sizing */
.touch-target {
  min-height: 44px;
  min-width: 44px;
  padding: var(--space-3);
}

.comfortable-touch {
  min-height: 48px;
  min-width: 48px;
  padding: var(--space-4);
}

/* Screen Reader Support */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.sr-only:focus {
  position: static;
  width: auto;
  height: auto;
  padding: inherit;
  margin: inherit;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

### React Accessibility Hooks

```tsx
// useAccessibilityAnnouncement.ts
import { useEffect, useRef } from 'react';

export const useAccessibilityAnnouncement = () => {
  const announcementRef = useRef<HTMLDivElement>(null);

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (announcementRef.current) {
      announcementRef.current.textContent = message;
      announcementRef.current.setAttribute('aria-live', priority);
    }
  };

  return {
    announce,
    AnnouncementRegion: () => (
      <div
        ref={announcementRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
    ),
  };
};

// useFocusManagement.ts
import { useEffect, useRef } from 'react';

export const useFocusManagement = (isOpen: boolean) => {
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Store current focus
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      // Focus first focusable element in container
      const firstFocusable = containerRef.current?.querySelector(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      
      firstFocusable?.focus();
    } else if (previousFocusRef.current) {
      // Restore previous focus
      previousFocusRef.current.focus();
    }
  }, [isOpen]);

  const trapFocus = (event: KeyboardEvent) => {
    if (!containerRef.current || event.key !== 'Tab') return;

    const focusableElements = containerRef.current.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    if (event.shiftKey && document.activeElement === firstElement) {
      lastElement.focus();
      event.preventDefault();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      firstElement.focus();
      event.preventDefault();
    }
  };

  return { containerRef, trapFocus };
};

// useKeyboardNavigation.ts
export const useKeyboardNavigation = (
  items: any[],
  onSelect: (index: number) => void
) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % items.length);
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        onSelect(selectedIndex);
        break;
      case 'Home':
        event.preventDefault();
        setSelectedIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setSelectedIndex(items.length - 1);
        break;
    }
  };

  return { selectedIndex, handleKeyDown };
};
```

## Component-Specific Accessibility

### Accessible Hunt Log Form

```tsx
const AccessibleHuntLogForm: React.FC = () => {
  const { announce, AnnouncementRegion } = useAccessibilityAnnouncement();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (formData: HuntLogData) => {
    try {
      await submitHuntLog(formData);
      announce('Hunt log saved successfully', 'assertive');
    } catch (error) {
      announce('Error saving hunt log. Please check your entries.', 'assertive');
      setErrors(validateForm(formData));
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      role="form"
      aria-labelledby="hunt-log-title"
      aria-describedby="hunt-log-description"
    >
      <h2 id="hunt-log-title">Hunt Log Entry</h2>
      <p id="hunt-log-description">
        Record details of your hunting session including location, weather, and outcomes.
      </p>

      <fieldset>
        <legend>Hunt Details</legend>
        
        <div className="field-group">
          <label htmlFor="hunt-date">
            Date and Time
            <span aria-hidden="true">*</span>
          </label>
          <input
            id="hunt-date"
            type="datetime-local"
            required
            aria-describedby={errors.date ? 'date-error' : 'date-help'}
            aria-invalid={!!errors.date}
          />
          <div id="date-help" className="field-help">
            When did this hunt take place?
          </div>
          {errors.date && (
            <div id="date-error" className="field-error" role="alert">
              {errors.date}
            </div>
          )}
        </div>

        <div className="field-group">
          <label htmlFor="location">
            Hunting Location
            <span aria-hidden="true">*</span>
          </label>
          <input
            id="location"
            type="text"
            required
            aria-describedby="location-help"
            placeholder="e.g., North Field, Private Land"
          />
          <div id="location-help" className="field-help">
            GPS coordinates will be captured automatically
          </div>
        </div>

        <fieldset>
          <legend>Hunt Outcome</legend>
          <div role="radiogroup" aria-required="true">
            <div>
              <input
                id="outcome-success"
                type="radio"
                name="outcome"
                value="success"
                aria-describedby="outcome-help"
              />
              <label htmlFor="outcome-success">Successful Hunt</label>
            </div>
            <div>
              <input
                id="outcome-no-game"
                type="radio"
                name="outcome"
                value="no-game"
                aria-describedby="outcome-help"
              />
              <label htmlFor="outcome-no-game">No Game Taken</label>
            </div>
          </div>
          <div id="outcome-help" className="field-help">
            Select the outcome of your hunting session
          </div>
        </fieldset>
      </fieldset>

      <div className="form-actions">
        <button
          type="submit"
          className="btn btn-primary btn-lg"
          aria-describedby="submit-help"
        >
          Save Hunt Log
        </button>
        <div id="submit-help" className="field-help">
          Your hunt log will be saved to your profile
        </div>
      </div>

      <AnnouncementRegion />
    </form>
  );
};
```

### Accessible GPS Indicator

```tsx
const AccessibleGPSIndicator: React.FC<{
  accuracy: number | null;
  loading: boolean;
}> = ({ accuracy, loading }) => {
  const getStatusDescription = () => {
    if (loading) return 'Acquiring GPS signal...';
    if (!accuracy) return 'GPS signal not available';
    if (accuracy <= 5) return 'Excellent GPS accuracy';
    if (accuracy <= 15) return 'Good GPS accuracy';
    if (accuracy <= 50) return 'Fair GPS accuracy';
    return 'Poor GPS accuracy';
  };

  const getStatusColor = () => {
    if (loading || !accuracy) return 'text-neutral-400';
    if (accuracy <= 5) return 'text-success';
    if (accuracy <= 15) return 'text-success';
    if (accuracy <= 50) return 'text-warning';
    return 'text-error';
  };

  return (
    <div
      className={`gps-indicator ${getStatusColor()}`}
      role="status"
      aria-live="polite"
      aria-label={getStatusDescription()}
    >
      <div className="gps-icon" aria-hidden="true">
        {loading ? (
          <LoadingIcon className="animate-spin" />
        ) : (
          <GPSIcon />
        )}
      </div>
      
      <div className="gps-text">
        <span className="sr-only">{getStatusDescription()}</span>
        <span aria-hidden="true">
          {loading ? 'Searching...' : accuracy ? `±${accuracy}m` : 'No Signal'}
        </span>
      </div>

      {accuracy && accuracy > 50 && (
        <button
          className="gps-retry btn btn-sm btn-secondary"
          onClick={() => window.location.reload()}
          aria-label="Retry GPS location acquisition"
        >
          Retry
        </button>
      )}
    </div>
  );
};
```

## Testing Framework

### Automated Accessibility Tests

```typescript
// accessibility-test-suite.ts
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';

expect.extend(toHaveNoViolations);

describe('Accessibility Test Suite', () => {
  describe('Color Contrast', () => {
    it('meets WCAG AA contrast requirements', async () => {
      const { container } = render(<HuntLogForm />);
      
      // Test with axe-core
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });
      
      expect(results).toHaveNoViolations();
    });

    it('maintains contrast in high contrast mode', async () => {
      // Mock high contrast media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
        })),
      });

      const { container } = render(<HuntLogForm />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports full keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<HuntLogForm />);

      // Tab through all form elements
      await user.tab();
      expect(screen.getByLabelText('Date and Time')).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText('Hunting Location')).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText('Successful Hunt')).toHaveFocus();

      // Test submit with keyboard
      await user.tab({ shift: true }); // Go back
      await user.tab({ shift: true }); // Go back to submit button
      
      const submitButton = screen.getByRole('button', { name: /save hunt log/i });
      expect(submitButton).toHaveFocus();
      
      await user.keyboard('{Enter}');
      // Verify form submission behavior
    });

    it('traps focus in modal dialogs', async () => {
      const user = userEvent.setup();
      render(<QuickLogModal isOpen={true} />);

      const modal = screen.getByRole('dialog');
      const focusableElements = within(modal).getAllByRole('button');
      
      // Focus should start on first element
      expect(focusableElements[0]).toHaveFocus();

      // Tab to last element
      for (let i = 1; i < focusableElements.length; i++) {
        await user.tab();
      }
      expect(focusableElements[focusableElements.length - 1]).toHaveFocus();

      // Tab should wrap to first element
      await user.tab();
      expect(focusableElements[0]).toHaveFocus();

      // Shift+Tab should wrap to last element
      await user.tab({ shift: true });
      expect(focusableElements[focusableElements.length - 1]).toHaveFocus();
    });
  });

  describe('Screen Reader Support', () => {
    it('provides appropriate ARIA labels', () => {
      render(<GPSIndicator accuracy={5} loading={false} />);
      
      const indicator = screen.getByRole('status');
      expect(indicator).toHaveAttribute('aria-label', 'Excellent GPS accuracy');
    });

    it('announces dynamic content changes', async () => {
      const user = userEvent.setup();
      render(<HuntLogForm />);

      const submitButton = screen.getByRole('button', { name: /save hunt log/i });
      await user.click(submitButton);

      // Check for announcement region
      const announcement = screen.getByRole('status');
      expect(announcement).toBeInTheDocument();
    });

    it('provides form error announcements', async () => {
      const user = userEvent.setup();
      render(<HuntLogForm />);

      // Submit empty form
      const submitButton = screen.getByRole('button', { name: /save hunt log/i });
      await user.click(submitButton);

      // Check for error announcements
      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toBeInTheDocument();
      expect(errorAlert).toHaveTextContent(/required/i);
    });
  });

  describe('Touch Target Size', () => {
    it('meets minimum 44px touch target requirement', () => {
      render(<QuickLogButton />);
      
      const button = screen.getByRole('button');
      const styles = getComputedStyle(button);
      
      expect(parseInt(styles.minHeight)).toBeGreaterThanOrEqual(44);
      expect(parseInt(styles.minWidth)).toBeGreaterThanOrEqual(44);
    });

    it('provides comfortable 48px targets for primary actions', () => {
      render(<QuickLogButton variant="primary" size="lg" />);
      
      const button = screen.getByRole('button');
      const styles = getComputedStyle(button);
      
      expect(parseInt(styles.minHeight)).toBeGreaterThanOrEqual(48);
      expect(parseInt(styles.minWidth)).toBeGreaterThanOrEqual(48);
    });
  });

  describe('Motion and Animation', () => {
    it('respects reduced motion preferences', () => {
      // Mock reduced motion media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
        })),
      });

      render(<LoadingSpinner />);
      
      const spinner = screen.getByTestId('loading-spinner');
      const styles = getComputedStyle(spinner);
      
      expect(styles.animationDuration).toBe('0.01ms');
    });
  });
});
```

### Manual Testing Checklist

#### Screen Reader Testing
- [ ] VoiceOver (iOS/macOS) navigation
- [ ] TalkBack (Android) compatibility  
- [ ] NVDA (Windows) functionality
- [ ] JAWS (Windows) compatibility

#### Keyboard Testing
- [ ] Tab order is logical and complete
- [ ] All functionality available via keyboard
- [ ] Focus indicators are visible
- [ ] Modal focus trapping works correctly
- [ ] Skip links function properly

#### Visual Testing
- [ ] 200% zoom readability
- [ ] High contrast mode functionality
- [ ] Color-only information has alternatives
- [ ] Text meets contrast requirements

#### Motor Accessibility Testing
- [ ] Voice control functionality
- [ ] Switch navigation support
- [ ] Touch target sizing
- [ ] Gesture alternative options

## Performance and Accessibility

### Optimized Loading
```css
/* Ensure content is visible during font loading */
@font-face {
  font-family: 'Inter';
  font-display: swap;
  src: url('/fonts/inter.woff2') format('woff2');
}

/* Prevent layout shift with image placeholders */
.hunt-photo {
  aspect-ratio: 16 / 9;
  background: var(--neutral-200);
}

/* Smooth focus transitions without motion sensitivity */
.focus-visible {
  transition: outline-color 0.15s ease-out;
}

@media (prefers-reduced-motion: reduce) {
  .focus-visible {
    transition: none;
  }
}
```

### Progressive Enhancement
```typescript
// Ensure core functionality works without JavaScript
const EnhancedHuntLog = () => {
  const [jsEnabled, setJsEnabled] = useState(false);
  
  useEffect(() => {
    setJsEnabled(true);
  }, []);

  return (
    <form method="POST" action="/api/hunt-logs">
      {/* Basic form fields work without JS */}
      <input type="text" name="location" required />
      <button type="submit">Save Hunt Log</button>
      
      {/* Enhanced features with JS */}
      {jsEnabled && (
        <>
          <GPSCapture onLocationUpdate={handleLocation} />
          <PhotoUpload onUpload={handlePhotoUpload} />
        </>
      )}
    </form>
  );
};
```

## Accessibility Documentation

### Component Accessibility Notes
Each component includes accessibility documentation:

```markdown
## Button Component Accessibility

### ARIA Support
- `aria-label`: Provides accessible name when text isn't sufficient
- `aria-pressed`: Indicates toggle button state
- `aria-expanded`: Shows collapsible content state
- `aria-describedby`: Links to help text

### Keyboard Support
- **Space/Enter**: Activates button
- **Tab**: Focuses next element
- **Shift+Tab**: Focuses previous element

### Screen Reader Behavior
- Announces button purpose and current state
- Indicates when button is disabled and why
- Provides context for icon-only buttons
```

### Testing Documentation
```markdown
## Accessibility Testing Requirements

### Automated Tests
- axe-core integration in Jest
- Color contrast validation
- ARIA attribute verification
- Keyboard navigation testing

### Manual Tests
- Screen reader walkthrough
- Keyboard-only navigation
- Voice control testing
- High contrast mode verification

### Field Tests
- Glove compatibility testing
- Bright sunlight usability
- Voice command accuracy
- Emergency access verification
```

## Related Documentation

- [Component Library](../components/README.md)
- [Testing Framework](../testing/README.md)
- [Design System](../system/README.md)
- [User Journey Maps](../patterns/user-journey-maps.md)