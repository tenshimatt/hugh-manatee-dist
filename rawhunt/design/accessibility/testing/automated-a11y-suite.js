/**
 * Automated Accessibility Testing Suite for GoHunta.com
 * Comprehensive WCAG 2.1 AA compliance testing framework
 */

import { render, screen, within, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

/**
 * Accessibility Test Helper Functions
 */
class AccessibilityTestHelpers {
  /**
   * Calculate color contrast ratio between foreground and background
   */
  static calculateContrastRatio(foreground, background) {
    const getLuminance = (color) => {
      const rgb = this.hexToRgb(color);
      if (!rgb) return 0;
      
      const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const l1 = getLuminance(foreground);
    const l2 = getLuminance(background);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  static hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * Get all focusable elements in a container
   */
  static getFocusableElements(container) {
    return container.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
  }

  /**
   * Test touch target minimum sizes
   */
  static testTouchTargetSize(element, minSize = 44) {
    const rect = element.getBoundingClientRect();
    const isMinimumSize = Math.max(rect.width, rect.height) >= minSize;
    
    return {
      isValid: isMinimumSize,
      width: rect.width,
      height: rect.height,
      minSize
    };
  }

  /**
   * Mock media queries for accessibility testing
   */
  static mockMediaQuery(query, matches = true) {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(q => ({
        matches: q === query ? matches : false,
        media: q,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  }
}

/**
 * Core Accessibility Tests
 */
describe('GoHunta Accessibility Test Suite', () => {
  beforeEach(() => {
    // Reset DOM and mocks before each test
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  describe('WCAG 2.1 AA Compliance', () => {
    describe('Color Contrast Requirements', () => {
      it('meets 4.5:1 contrast ratio for normal text', async () => {
        const { container } = render(
          <div>
            <p className="text-base text-neutral-900 bg-neutral-50">
              Normal body text with proper contrast
            </p>
            <button className="btn btn-primary">
              Primary button text
            </button>
          </div>
        );

        const results = await axe(container, {
          rules: {
            'color-contrast': { enabled: true }
          }
        });

        expect(results).toHaveNoViolations();
      });

      it('meets 3:1 contrast ratio for large text', async () => {
        const { container } = render(
          <div>
            <h1 className="text-3xl font-bold text-primary-600">
              Large heading text
            </h1>
            <h2 className="text-2xl font-semibold text-secondary-600">
              Secondary large heading
            </h2>
          </div>
        );

        const results = await axe(container, {
          rules: {
            'color-contrast': { enabled: true }
          }
        });

        expect(results).toHaveNoViolations();
      });

      it('maintains contrast in high contrast mode', async () => {
        AccessibilityTestHelpers.mockMediaQuery('(prefers-contrast: high)', true);
        
        const { container } = render(
          <div className="high-contrast-mode">
            <button className="btn btn-primary">High Contrast Button</button>
            <p className="text-base">High contrast text</p>
          </div>
        );

        // Test that high contrast styles are applied
        const button = screen.getByRole('button');
        const styles = getComputedStyle(button);
        
        // High contrast mode should have stronger borders and clearer text
        expect(styles.borderWidth).toBe('3px');
        
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });

    describe('Keyboard Navigation', () => {
      it('supports complete keyboard navigation', async () => {
        const user = userEvent.setup();
        
        render(
          <form>
            <label htmlFor="hunt-date">Hunt Date</label>
            <input id="hunt-date" type="date" />
            
            <label htmlFor="location">Location</label>
            <input id="location" type="text" />
            
            <fieldset>
              <legend>Hunt Outcome</legend>
              <label>
                <input type="radio" name="outcome" value="success" />
                Success
              </label>
              <label>
                <input type="radio" name="outcome" value="no-game" />
                No Game
              </label>
            </fieldset>
            
            <button type="submit">Save Hunt Log</button>
          </form>
        );

        // Test tab navigation through all elements
        const focusableElements = AccessibilityTestHelpers.getFocusableElements(document.body);
        
        await user.tab();
        expect(focusableElements[0]).toHaveFocus();
        
        await user.tab();
        expect(focusableElements[1]).toHaveFocus();
        
        await user.tab();
        expect(focusableElements[2]).toHaveFocus();
        
        // Test that all elements can receive focus
        expect(focusableElements).toHaveLength(5); // All form elements + submit button
      });

      it('manages focus in modal dialogs', async () => {
        const user = userEvent.setup();
        
        render(
          <div>
            <button data-testid="open-modal">Open Modal</button>
            <div role="dialog" aria-modal="true" aria-labelledby="modal-title">
              <h2 id="modal-title">Quick Hunt Log</h2>
              <button>Success</button>
              <button>No Game</button>
              <button data-testid="close-modal">Close</button>
            </div>
          </div>
        );

        const modal = screen.getByRole('dialog');
        const modalButtons = within(modal).getAllByRole('button');
        
        // Focus should trap within modal
        modalButtons[0].focus();
        expect(modalButtons[0]).toHaveFocus();
        
        // Tab through modal buttons
        await user.tab();
        expect(modalButtons[1]).toHaveFocus();
        
        await user.tab();
        expect(modalButtons[2]).toHaveFocus();
        
        // Should wrap to first button
        await user.tab();
        expect(modalButtons[0]).toHaveFocus();
        
        // Shift+Tab should go backwards
        await user.tab({ shift: true });
        expect(modalButtons[2]).toHaveFocus();
      });

      it('provides visible focus indicators', () => {
        render(
          <div>
            <button className="btn focus-visible">Focusable Button</button>
            <a href="#" className="link focus-visible">Focusable Link</a>
          </div>
        );

        const button = screen.getByRole('button');
        const link = screen.getByRole('link');
        
        // Simulate focus
        fireEvent.focus(button);
        
        const buttonStyles = getComputedStyle(button);
        expect(buttonStyles.outline).toBeDefined();
        expect(buttonStyles.outlineWidth).toBe('2px');
        
        fireEvent.focus(link);
        
        const linkStyles = getComputedStyle(link);
        expect(linkStyles.outline).toBeDefined();
      });
    });

    describe('Touch Target Sizing', () => {
      it('meets minimum 44px touch target requirement', () => {
        render(
          <div>
            <button className="btn btn-md">Standard Button</button>
            <button className="btn btn-sm">Small Button</button>
            <a href="#" className="link-button">Link Button</a>
          </div>
        );

        const buttons = screen.getAllByRole('button');
        const links = screen.getAllByRole('link');
        
        [...buttons, ...links].forEach(element => {
          const touchTest = AccessibilityTestHelpers.testTouchTargetSize(element, 44);
          expect(touchTest.isValid).toBe(true);
        });
      });

      it('provides comfortable 48px targets for primary actions', () => {
        render(
          <div>
            <button className="btn btn-primary btn-lg">Primary Action</button>
            <button className="btn btn-success btn-lg">Success Action</button>
          </div>
        );

        const primaryButtons = screen.getAllByRole('button');
        
        primaryButtons.forEach(button => {
          const touchTest = AccessibilityTestHelpers.testTouchTargetSize(button, 48);
          expect(touchTest.isValid).toBe(true);
        });
      });
    });

    describe('Screen Reader Support', () => {
      it('provides appropriate ARIA labels and roles', async () => {
        render(
          <div>
            <nav role="navigation" aria-label="Main navigation">
              <ul>
                <li><a href="/hunt-logs" aria-current="page">Hunt Logs</a></li>
                <li><a href="/dogs">Dogs</a></li>
                <li><a href="/community">Community</a></li>
              </ul>
            </nav>
            
            <main role="main" aria-labelledby="main-heading">
              <h1 id="main-heading">Hunt Logs</h1>
              
              <div role="status" aria-live="polite" aria-label="GPS status">
                GPS signal: Excellent
              </div>
              
              <button 
                aria-label="Log successful hunt"
                aria-describedby="hunt-log-help"
              >
                Quick Log
              </button>
              <div id="hunt-log-help">
                Quickly log a successful hunt with current GPS location
              </div>
            </main>
          </div>
        );

        const results = await axe(document.body, {
          rules: {
            'aria-roles': { enabled: true },
            'aria-valid-attr-value': { enabled: true },
            'aria-valid-attr': { enabled: true }
          }
        });

        expect(results).toHaveNoViolations();
        
        // Test specific ARIA implementations
        const navigation = screen.getByRole('navigation');
        expect(navigation).toHaveAttribute('aria-label', 'Main navigation');
        
        const status = screen.getByRole('status');
        expect(status).toHaveAttribute('aria-live', 'polite');
        
        const button = screen.getByRole('button', { name: /log successful hunt/i });
        expect(button).toHaveAttribute('aria-describedby', 'hunt-log-help');
      });

      it('announces dynamic content changes', async () => {
        const TestComponent = () => {
          const [status, setStatus] = React.useState('Ready');
          
          return (
            <div>
              <button onClick={() => setStatus('Saving...')}>Save Hunt</button>
              <div role="status" aria-live="assertive">{status}</div>
            </div>
          );
        };

        const user = userEvent.setup();
        render(<TestComponent />);
        
        const button = screen.getByRole('button');
        const statusElement = screen.getByRole('status');
        
        expect(statusElement).toHaveTextContent('Ready');
        
        await user.click(button);
        
        await waitFor(() => {
          expect(statusElement).toHaveTextContent('Saving...');
        });
        
        expect(statusElement).toHaveAttribute('aria-live', 'assertive');
      });

      it('provides form error announcements', async () => {
        const user = userEvent.setup();
        
        render(
          <form>
            <label htmlFor="required-field">Required Field</label>
            <input 
              id="required-field" 
              type="text" 
              required 
              aria-describedby="field-error"
            />
            <div id="field-error" role="alert" style={{display: 'none'}}>
              This field is required
            </div>
            <button type="submit">Submit</button>
          </form>
        );

        const input = screen.getByLabelText('Required Field');
        const submitButton = screen.getByRole('button', { name: 'Submit' });
        
        // Submit without filling required field
        await user.click(submitButton);
        
        // Error should be announced
        const errorElement = screen.getByRole('alert');
        expect(errorElement).toHaveStyle('display: block');
        expect(errorElement).toHaveTextContent('This field is required');
        
        expect(input).toHaveAttribute('aria-invalid', 'true');
      });
    });

    describe('Motion and Animation Accessibility', () => {
      it('respects reduced motion preferences', () => {
        AccessibilityTestHelpers.mockMediaQuery('(prefers-reduced-motion: reduce)', true);
        
        render(
          <div>
            <div className="loading-spinner animate-spin">Loading...</div>
            <button className="btn hover:transform">Animated Button</button>
          </div>
        );

        const spinner = screen.getByText('Loading...');
        const button = screen.getByRole('button');
        
        const spinnerStyles = getComputedStyle(spinner);
        const buttonStyles = getComputedStyle(button);
        
        // Animations should be disabled or minimal
        expect(spinnerStyles.animationDuration).toBe('0.01ms');
        expect(buttonStyles.transitionDuration).toBe('0.01ms');
      });

      it('provides animation control options', () => {
        render(
          <div>
            <button data-testid="toggle-animations">Toggle Animations</button>
            <div className="animated-content" data-animations="enabled">
              Animated content
            </div>
          </div>
        );

        const toggleButton = screen.getByTestId('toggle-animations');
        const animatedContent = screen.getByText('Animated content');
        
        // Should provide way to disable animations
        expect(animatedContent).toHaveAttribute('data-animations', 'enabled');
        
        fireEvent.click(toggleButton);
        
        // Should be able to disable animations
        expect(animatedContent).toHaveAttribute('data-animations', 'disabled');
      });
    });
  });

  describe('Hunting-Specific Accessibility Features', () => {
    describe('Field Operation Accessibility', () => {
      it('supports glove-friendly interactions', () => {
        render(
          <div className="hunt-controls">
            <button className="quick-action success-button">Log Success</button>
            <button className="quick-action no-game-button">No Game</button>
            <button className="emergency-button">Emergency</button>
          </div>
        );

        const buttons = screen.getAllByRole('button');
        
        buttons.forEach(button => {
          const touchTest = AccessibilityTestHelpers.testTouchTargetSize(button, 48);
          expect(touchTest.isValid).toBe(true);
          
          // Should have adequate spacing between buttons
          const styles = getComputedStyle(button);
          expect(parseInt(styles.margin)).toBeGreaterThanOrEqual(8);
        });
      });

      it('provides high visibility in bright conditions', () => {
        AccessibilityTestHelpers.mockMediaQuery('(prefers-contrast: high)', true);
        
        render(
          <div className="field-interface">
            <div className="gps-indicator excellent">GPS: Excellent</div>
            <button className="emergency-button">Emergency Contact</button>
            <div className="hunt-status">Ready to Hunt</div>
          </div>
        );

        const elements = screen.getAllByRole('button');
        const statusElements = [
          screen.getByText('GPS: Excellent'),
          screen.getByText('Ready to Hunt')
        ];

        // All elements should have high contrast styling
        [...elements, ...statusElements].forEach(element => {
          const styles = getComputedStyle(element);
          
          // Should have strong borders or backgrounds for visibility
          const hasBorder = styles.borderWidth && parseInt(styles.borderWidth) >= 2;
          const hasBackground = styles.backgroundColor !== 'rgba(0, 0, 0, 0)';
          
          expect(hasBorder || hasBackground).toBe(true);
        });
      });

      it('supports voice commands where available', async () => {
        // Mock speech recognition API
        const mockSpeechRecognition = {
          start: jest.fn(),
          stop: jest.fn(),
          addEventListener: jest.fn(),
          continuous: true,
          interimResults: false
        };

        Object.defineProperty(window, 'SpeechRecognition', {
          value: jest.fn(() => mockSpeechRecognition)
        });

        Object.defineProperty(window, 'webkitSpeechRecognition', {
          value: jest.fn(() => mockSpeechRecognition)
        });

        render(
          <div>
            <button data-voice-command="log success">Log Success</button>
            <button data-voice-command="emergency">Emergency</button>
          </div>
        );

        const buttons = screen.getAllByRole('button');
        
        buttons.forEach(button => {
          expect(button).toHaveAttribute('data-voice-command');
        });
      });
    });

    describe('GPS and Location Accessibility', () => {
      it('provides clear GPS status announcements', () => {
        render(
          <div>
            <div 
              role="status" 
              aria-live="polite" 
              aria-label="GPS Status: Acquiring signal"
            >
              Searching for GPS...
            </div>
            <div 
              role="status" 
              aria-live="polite" 
              aria-label="GPS Status: Excellent accuracy within 3 meters"
            >
              GPS: ±3m
            </div>
          </div>
        );

        const statusElements = screen.getAllByRole('status');
        
        expect(statusElements[0]).toHaveAttribute('aria-live', 'polite');
        expect(statusElements[0]).toHaveAttribute('aria-label');
        
        expect(statusElements[1]).toHaveAttribute('aria-label', 
          'GPS Status: Excellent accuracy within 3 meters');
      });

      it('handles GPS errors accessibly', () => {
        render(
          <div>
            <div 
              role="alert" 
              aria-live="assertive"
            >
              GPS error: Location services disabled. Enable in settings to continue.
            </div>
            <button aria-describedby="gps-help">Retry GPS</button>
            <div id="gps-help">
              Attempts to acquire GPS location again
            </div>
          </div>
        );

        const alert = screen.getByRole('alert');
        const retryButton = screen.getByRole('button', { name: 'Retry GPS' });
        
        expect(alert).toHaveAttribute('aria-live', 'assertive');
        expect(retryButton).toHaveAttribute('aria-describedby', 'gps-help');
      });
    });

    describe('Emergency Features Accessibility', () => {
      it('provides immediate emergency access', () => {
        render(
          <div>
            <button 
              className="emergency-button"
              aria-label="Emergency contact - calls your designated emergency contact immediately"
              style={{ 
                position: 'fixed', 
                bottom: '20px', 
                right: '20px',
                minHeight: '56px',
                minWidth: '56px'
              }}
            >
              🚨
            </button>
          </div>
        );

        const emergencyButton = screen.getByRole('button');
        
        // Should be easily accessible
        expect(emergencyButton).toHaveAttribute('aria-label');
        
        const touchTest = AccessibilityTestHelpers.testTouchTargetSize(emergencyButton, 56);
        expect(touchTest.isValid).toBe(true);
        
        // Should be prominently positioned
        const styles = getComputedStyle(emergencyButton);
        expect(styles.position).toBe('fixed');
      });

      it('provides emergency location sharing', () => {
        render(
          <div role="dialog" aria-labelledby="emergency-title" aria-modal="true">
            <h2 id="emergency-title">Emergency Mode Active</h2>
            
            <div role="status" aria-live="assertive">
              Sharing location: 40.7128° N, 74.0060° W
            </div>
            
            <button 
              aria-label="Call emergency contact now"
              className="emergency-call-button"
            >
              Call Emergency Contact
            </button>
            
            <button 
              aria-label="Send location via SMS to emergency contacts"
              className="share-location-button"
            >
              Send Location SMS
            </button>
          </div>
        );

        const dialog = screen.getByRole('dialog');
        const statusUpdate = screen.getByRole('status');
        const buttons = within(dialog).getAllByRole('button');
        
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(statusUpdate).toHaveAttribute('aria-live', 'assertive');
        
        buttons.forEach(button => {
          expect(button).toHaveAttribute('aria-label');
        });
      });
    });
  });

  describe('Performance and Accessibility Integration', () => {
    it('maintains accessibility during loading states', async () => {
      const LoadingComponent = ({ loading }) => (
        <div>
          <button disabled={loading} aria-busy={loading}>
            {loading ? 'Saving...' : 'Save Hunt Log'}
          </button>
          {loading && (
            <div role="status" aria-live="polite">
              Saving your hunt log, please wait...
            </div>
          )}
        </div>
      );

      const { rerender } = render(<LoadingComponent loading={false} />);
      
      let button = screen.getByRole('button');
      expect(button).not.toHaveAttribute('aria-busy', 'true');
      expect(button).toBeEnabled();
      
      rerender(<LoadingComponent loading={true} />);
      
      button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toBeDisabled();
      
      const statusUpdate = screen.getByRole('status');
      expect(statusUpdate).toHaveTextContent('Saving your hunt log, please wait...');
    });

    it('provides offline accessibility features', () => {
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      render(
        <div>
          <div role="status" aria-live="polite">
            Offline mode: Hunt logs will sync when connection is restored
          </div>
          
          <button 
            aria-describedby="offline-help"
            disabled={false}
          >
            Save Hunt Log (Offline)
          </button>
          
          <div id="offline-help">
            Hunt log will be saved locally and uploaded when you're back online
          </div>
        </div>
      );

      const status = screen.getByRole('status');
      const button = screen.getByRole('button');
      const helpText = screen.getByText(/hunt log will be saved locally/i);
      
      expect(status).toHaveTextContent(/offline mode/i);
      expect(button).toHaveAttribute('aria-describedby', 'offline-help');
      expect(helpText).toBeInTheDocument();
    });
  });
});

/**
 * Custom Accessibility Test Runner
 */
export class AccessibilityTestRunner {
  constructor() {
    this.testResults = [];
  }

  async runFullAccessibilityAudit(component, options = {}) {
    const { container } = render(component);
    
    // Run axe-core audit
    const axeResults = await axe(container, {
      rules: {
        'color-contrast': { enabled: true },
        'keyboard': { enabled: true },
        'aria-valid-attr': { enabled: true },
        'aria-valid-attr-value': { enabled: true },
        'button-name': { enabled: true },
        'image-alt': { enabled: true },
        'label': { enabled: true },
        ...options.axeRules
      }
    });

    // Custom GoHunta-specific tests
    const customResults = {
      touchTargets: this.testTouchTargets(container),
      gpsAccessibility: this.testGPSAccessibility(container),
      emergencyAccess: this.testEmergencyAccess(container),
      fieldUsability: this.testFieldUsability(container)
    };

    const fullResults = {
      axe: axeResults,
      custom: customResults,
      timestamp: new Date().toISOString(),
      component: component.type?.name || 'Unknown'
    };

    this.testResults.push(fullResults);
    return fullResults;
  }

  testTouchTargets(container) {
    const interactiveElements = container.querySelectorAll(
      'button, a, input, select, textarea, [role="button"], [tabindex]'
    );

    const results = Array.from(interactiveElements).map(element => {
      const test = AccessibilityTestHelpers.testTouchTargetSize(element, 44);
      return {
        element: element.tagName.toLowerCase(),
        className: element.className,
        ...test
      };
    });

    return {
      total: results.length,
      passed: results.filter(r => r.isValid).length,
      failed: results.filter(r => !r.isValid).length,
      details: results.filter(r => !r.isValid)
    };
  }

  testGPSAccessibility(container) {
    const gpsElements = container.querySelectorAll('[data-testid*="gps"], [aria-label*="GPS"], [aria-label*="location"]');
    
    return {
      hasGPSIndicators: gpsElements.length > 0,
      gpsElements: Array.from(gpsElements).map(el => ({
        hasAriaLabel: !!el.getAttribute('aria-label'),
        hasRole: !!el.getAttribute('role'),
        hasLiveRegion: !!el.getAttribute('aria-live')
      }))
    };
  }

  testEmergencyAccess(container) {
    const emergencyElements = container.querySelectorAll(
      '[class*="emergency"], [aria-label*="emergency"], [data-testid*="emergency"]'
    );

    return {
      hasEmergencyFeatures: emergencyElements.length > 0,
      emergencyElements: Array.from(emergencyElements).map(el => {
        const touchTest = AccessibilityTestHelpers.testTouchTargetSize(el, 48);
        return {
          hasAriaLabel: !!el.getAttribute('aria-label'),
          touchTargetSize: touchTest,
          isVisible: getComputedStyle(el).display !== 'none'
        };
      })
    };
  }

  testFieldUsability(container) {
    return {
      hasHighContrastSupport: !!container.querySelector('.high-contrast, [data-high-contrast]'),
      hasVoiceSupport: !!container.querySelector('[data-voice-command]'),
      hasOfflineSupport: !!container.querySelector('[data-offline], [aria-label*="offline"]'),
      hasGloveOptimization: !!container.querySelector('.glove-friendly, .touch-target')
    };
  }

  generateAccessibilityReport() {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(result => 
      result.axe.violations.length === 0
    ).length;

    return {
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: totalTests - passedTests,
        successRate: `${Math.round((passedTests / totalTests) * 100)}%`
      },
      results: this.testResults,
      recommendations: this.generateRecommendations()
    };
  }

  generateRecommendations() {
    const allViolations = this.testResults.flatMap(result => result.axe.violations);
    const violationCounts = allViolations.reduce((acc, violation) => {
      acc[violation.id] = (acc[violation.id] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(violationCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([violationId, count]) => ({
        issue: violationId,
        occurrences: count,
        priority: count > 5 ? 'high' : count > 2 ? 'medium' : 'low'
      }));
  }
}

// Export test helpers for use in other test files
export { AccessibilityTestHelpers };