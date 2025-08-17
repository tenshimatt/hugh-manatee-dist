# GoHunta.com - UI/UX Specialist Specification

## UI Design Philosophy for Hunting Community

GoHunta.com serves dedicated hunters who use working dogs in challenging outdoor environments. The UI must be intuitive for users wearing gloves, visible in bright sunlight, functional on muddy devices, and accessible for hunters of all experience levels from teenagers to seasoned veterans.

## Design System Foundation

### Core Design Principles

```
1. Field-First Design
   - Touch targets optimized for gloved hands (44px minimum)
   - High contrast for outdoor visibility
   - Weather-resistant interaction patterns
   - Quick access to essential functions

2. Rural Accessibility
   - Works on slow connections (2G/3G)
   - Offline-first functionality with clear status
   - Minimal data usage indicators
   - Progressive enhancement approach

3. Community-Centric
   - Trust-building visual elements
   - Expertise highlighting design patterns
   - Regional identity representation
   - Respectful hunting culture integration

4. Mobile-Native Experience
   - Portrait orientation optimized
   - Thumb-zone navigation prioritization
   - Battery usage awareness
   - GPS integration visual feedback
```

### Color Palette & Visual Identity

```css
/* Primary Color System - Earth Tones */
:root {
  /* Primary - Hunter Orange for safety & recognition */
  --primary-50: #fff4e6;
  --primary-100: #ffe4cc;
  --primary-500: #ff7700; /* Hunter Orange */
  --primary-600: #e66a00;
  --primary-700: #cc5e00;
  --primary-900: #993d00;

  /* Secondary - Forest Green for outdoors */
  --secondary-50: #f0f9f0;
  --secondary-100: #e1f3e1;
  --secondary-500: #228b22; /* Forest Green */
  --secondary-600: #1e7a1e;
  --secondary-700: #1a6b1a;
  --secondary-900: #134e13;

  /* Neutral - Natural tones */
  --neutral-50: #fafafa;
  --neutral-100: #f5f5f4;
  --neutral-200: #e7e5e4;
  --neutral-300: #d6d3d1;
  --neutral-400: #a8a29e;
  --neutral-500: #78716c;
  --neutral-600: #57534e;
  --neutral-700: #44403c;
  --neutral-800: #292524;
  --neutral-900: #1c1917;

  /* Status Colors */
  --success: #10b981; /* GPS lock, successful save */
  --warning: #f59e0b; /* Poor signal, caution */
  --error: #ef4444;   /* Failed upload, danger */
  --info: #3b82f6;    /* Tips, information */

  /* Hunting-Specific */
  --camouflage: #6b5b5a;
  --leather: #8b4513;
  --field-tan: #d2b48c;
  --dawn-light: #ffd700;
}

/* Typography Scale - Optimized for outdoor reading */
.text-scale {
  --text-xs: 0.75rem;    /* 12px - minimal labels */
  --text-sm: 0.875rem;   /* 14px - secondary text */
  --text-base: 1rem;     /* 16px - body text */
  --text-lg: 1.125rem;   /* 18px - emphasized text */
  --text-xl: 1.25rem;    /* 20px - small headings */
  --text-2xl: 1.5rem;    /* 24px - headings */
  --text-3xl: 1.875rem;  /* 30px - large headings */
  --text-4xl: 2.25rem;   /* 36px - hero text */
}

/* Spacing System - Touch-friendly */
.spacing-scale {
  --space-1: 0.25rem;  /* 4px */
  --space-2: 0.5rem;   /* 8px */
  --space-3: 0.75rem;  /* 12px */
  --space-4: 1rem;     /* 16px */
  --space-5: 1.25rem;  /* 20px */
  --space-6: 1.5rem;   /* 24px */
  --space-8: 2rem;     /* 32px */
  --space-10: 2.5rem;  /* 40px */
  --space-12: 3rem;    /* 48px */
  --space-16: 4rem;    /* 64px */
}
```

## UI Component Library

### Core Components for Hunting Context

#### Positive UI Test Cases
```gherkin
Feature: Core UI Component Functionality

Scenario: Hunt Log Quick Entry Button
  Given hunter in field wants to log hunt
  When they access quick entry button
  Then button is easily tappable with gloves
  And provides immediate visual feedback
  And opens simplified entry form
  And works offline without connectivity
  And saves to local storage automatically

Scenario: GPS Status Indicator
  Given hunter relying on GPS tracking
  When GPS signal varies during hunt
  Then status indicator shows clear visual state
  And color changes are accessibility compliant
  And signal strength is represented accurately
  And battery impact is communicated
  And offline mode is clearly indicated

Scenario: Dog Performance Chart
  Given hunter reviewing training progress
  When viewing dog performance over time
  Then chart renders clearly on mobile
  And data points are interactive
  And trend lines are visually distinct
  And loading states are informative
  And empty states provide guidance

Scenario: Community Post Interaction
  Given hunter engaging with community content
  When interacting with posts and comments
  Then typography is readable in various lighting
  And touch targets are appropriately sized
  And interaction feedback is immediate
  And content hierarchy is clear
  And moderation tools are accessible
```

#### Negative UI Test Cases
```gherkin
Scenario: Component failure graceful degradation
  Given UI component encounters error
  When component fails to load or function
  Then fallback content displays appropriately
  And error state provides useful information
  And user can continue using other features
  And error reporting is user-friendly
  And retry mechanisms are available

Scenario: Poor network condition handling
  Given hunter in area with weak signal
  When UI components try to load data
  Then loading states clearly communicate status
  And partial content loads progressively
  And offline alternatives are provided
  And data usage is minimized
  And user expectations are managed

Scenario: Low battery impact awareness
  Given hunter's device has low battery
  When using resource-intensive UI features
  Then battery-conscious modes are offered
  And non-essential animations are reduced
  And GPS usage is optimized
  And user is informed of battery impact
  And core functions remain available
```

#### Step Classes (UI Component Testing)
```typescript
// ui-component-steps.ts
export class UIComponentSteps {
  async testHuntLogQuickEntry() {
    // Test button accessibility and interaction
    const quickEntryButton = screen.getByRole('button', { name: /quick log hunt/i });
    
    // Verify touch target size
    const buttonRect = quickEntryButton.getBoundingClientRect();
    expect(buttonRect.width).toBeGreaterThanOrEqual(44);
    expect(buttonRect.height).toBeGreaterThanOrEqual(44);
    
    // Test visual feedback
    await userEvent.hover(quickEntryButton);
    expect(quickEntryButton).toHaveClass('hover:bg-primary-600');
    
    await userEvent.click(quickEntryButton);
    
    // Verify form opens
    const quickEntryForm = await screen.findByTestId('quick-hunt-form');
    expect(quickEntryForm).toBeInTheDocument();
    
    // Test offline functionality
    Object.defineProperty(navigator, 'onLine', { value: false });
    
    const offlineIndicator = await screen.findByText(/working offline/i);
    expect(offlineIndicator).toBeInTheDocument();
  }

  async testGPSStatusIndicator() {
    const gpsIndicator = screen.getByTestId('gps-status-indicator');
    
    // Test different GPS states
    const gpsStates = [
      { accuracy: 3, signal: 'excellent', color: 'text-success' },
      { accuracy: 10, signal: 'good', color: 'text-warning' },
      { accuracy: 50, signal: 'poor', color: 'text-error' },
      { accuracy: null, signal: 'searching', color: 'text-neutral-400' }
    ];

    for (const state of gpsStates) {
      // Simulate GPS state change
      fireEvent(gpsIndicator, new CustomEvent('gpsStateChange', { 
        detail: state 
      }));
      
      await waitFor(() => {
        expect(gpsIndicator).toHaveClass(state.color);
        expect(gpsIndicator).toHaveAttribute('aria-label', 
          expect.stringContaining(state.signal));
      });
    }
  }

  async testDogPerformanceChart() {
    const chartContainer = screen.getByTestId('dog-performance-chart');
    
    // Verify chart renders
    expect(chartContainer).toBeInTheDocument();
    
    // Test responsive behavior
    Object.defineProperty(window, 'innerWidth', { value: 375 }); // iPhone SE
    fireEvent(window, new Event('resize'));
    
    await waitFor(() => {
      const chart = within(chartContainer).getByRole('img', { hidden: true });
      expect(chart).toHaveAttribute('width', '343'); // 375 - 32px padding
    });
    
    // Test interaction
    const dataPoints = within(chartContainer).getAllByTestId('data-point');
    expect(dataPoints.length).toBeGreaterThan(0);
    
    await userEvent.click(dataPoints[0]);
    
    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent(/performance rating/i);
  }

  async testCommunityPostInteraction() {
    const communityPost = screen.getByTestId('community-post');
    
    // Test readability
    const postContent = within(communityPost).getByText(/hunt report/i);
    const computedStyle = window.getComputedStyle(postContent);
    
    // Verify contrast ratio
    const contrast = this.calculateContrastRatio(
      computedStyle.color, 
      computedStyle.backgroundColor
    );
    expect(contrast).toBeGreaterThan(4.5); // WCAG AA standard
    
    // Test interaction elements
    const likeButton = within(communityPost).getByRole('button', { name: /like/i });
    const commentButton = within(communityPost).getByRole('button', { name: /comment/i });
    
    // Verify touch targets
    [likeButton, commentButton].forEach(button => {
      const rect = button.getBoundingClientRect();
      expect(rect.width).toBeGreaterThanOrEqual(44);
      expect(rect.height).toBeGreaterThanOrEqual(44);
    });
    
    // Test interaction feedback
    await userEvent.click(likeButton);
    expect(likeButton).toHaveAttribute('aria-pressed', 'true');
  }

  private calculateContrastRatio(foreground: string, background: string): number {
    // Implementation of WCAG contrast ratio calculation
    const getLuminance = (color: string) => {
      // Convert color to RGB and calculate relative luminance
      const rgb = this.hexToRgb(color);
      if (!rgb) return 0;
      
      const { r, g, b } = rgb;
      const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    const l1 = getLuminance(foreground);
    const l2 = getLuminance(background);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
}
```

## Mobile-First Responsive Design

### Breakpoint Strategy for Hunting Context

```css
/* Mobile-first breakpoints optimized for common hunting devices */
:root {
  --mobile-small: 320px;  /* iPhone SE, older Android */
  --mobile: 375px;        /* iPhone 13 mini */
  --mobile-large: 414px;  /* iPhone 13 Pro Max */
  --tablet: 768px;        /* iPad mini */
  --desktop: 1024px;      /* iPad Pro landscape, small laptops */
  --desktop-large: 1440px; /* Desktop monitors */
}

/* Grid system optimized for hunting content */
.container {
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  padding-left: 1rem;
  padding-right: 1rem;
  
  @media (min-width: 768px) {
    max-width: 768px;
    padding-left: 2rem;
    padding-right: 2rem;
  }
  
  @media (min-width: 1024px) {
    max-width: 1024px;
  }
}

/* Touch-friendly component sizing */
.hunt-log-card {
  /* Mobile first - full width cards */
  width: 100%;
  margin-bottom: 1rem;
  
  @media (min-width: 768px) {
    /* Tablet - 2 columns */
    width: calc(50% - 0.5rem);
    margin-right: 1rem;
    
    &:nth-child(2n) {
      margin-right: 0;
    }
  }
  
  @media (min-width: 1024px) {
    /* Desktop - 3 columns */
    width: calc(33.333% - 0.667rem);
    
    &:nth-child(2n) {
      margin-right: 1rem;
    }
    
    &:nth-child(3n) {
      margin-right: 0;
    }
  }
}
```

### Layout Patterns for Hunting Workflows

#### Positive Layout Test Cases
```gherkin
Feature: Responsive Layout Adaptation

Scenario: Hunt log entry on mobile device
  Given hunter using iPhone in field
  When they create new hunt log
  Then form fills screen efficiently
  And input fields are thumb-accessible
  And keyboard doesn't obscure critical buttons
  And progress is saved on orientation change
  And form works in both portrait and landscape

Scenario: Dog profile viewing on tablet
  Given user reviewing dog profiles on iPad
  When switching between portrait and landscape
  Then layout adapts smoothly without reflow
  And images scale appropriately
  And text remains readable
  And touch targets maintain proper sizing
  And navigation remains accessible

Scenario: Community feed on various devices
  Given users on different screen sizes
  When viewing community posts
  Then content density adjusts appropriately
  And reading experience is optimized
  And images load in correct sizes
  And infinite scroll performs smoothly
  And interaction elements remain consistent
```

#### Step Classes (Responsive Design Testing)
```typescript
// responsive-design-steps.ts
export class ResponsiveDesignSteps {
  async testMobileHuntLogEntry() {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/hunt-logs/new');
    
    // Test form layout
    const form = page.locator('[data-testid="hunt-log-form"]');
    await expect(form).toBeVisible();
    
    // Verify full-width layout
    const formWidth = await form.evaluate(el => el.getBoundingClientRect().width);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(formWidth).toBeGreaterThan(viewportWidth * 0.9); // At least 90% width
    
    // Test thumb zone accessibility
    const submitButton = page.locator('button[type="submit"]');
    const buttonPosition = await submitButton.boundingBox();
    expect(buttonPosition?.y).toBeGreaterThan(400); // Lower third of screen
    
    // Test keyboard interaction
    await page.locator('input[name="location"]').fill('Test Location');
    await page.keyboard.press('Tab');
    
    // Verify button remains visible with keyboard
    await expect(submitButton).toBeInViewport();
  }

  async testTabletOrientationChanges() {
    // Start in portrait
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/dogs');
    
    const dogGrid = page.locator('[data-testid="dog-grid"]');
    
    // Verify 2-column layout in portrait
    const portraitColumns = await dogGrid.evaluate(el => {
      return window.getComputedStyle(el).gridTemplateColumns;
    });
    expect(portraitColumns).toContain('1fr 1fr'); // 2 columns
    
    // Switch to landscape
    await page.setViewportSize({ width: 1024, height: 768 });
    
    // Verify 3-column layout in landscape
    const landscapeColumns = await dogGrid.evaluate(el => {
      return window.getComputedStyle(el).gridTemplateColumns;
    });
    expect(landscapeColumns).toContain('1fr 1fr 1fr'); // 3 columns
    
    // Test that images adapt
    const dogImage = page.locator('[data-testid="dog-photo"]').first();
    const imageSize = await dogImage.boundingBox();
    expect(imageSize?.width).toBeLessThan(300); // Reasonably sized for layout
  }

  async testCommunityFeedResponsiveness() {
    const breakpoints = [
      { width: 320, height: 568, name: 'mobile-small' },
      { width: 375, height: 667, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1024, height: 768, name: 'desktop' }
    ];

    for (const breakpoint of breakpoints) {
      await page.setViewportSize(breakpoint);
      await page.goto('/community');
      
      const posts = page.locator('[data-testid="community-post"]');
      await expect(posts.first()).toBeVisible();
      
      // Test post width adaptation
      const postWidth = await posts.first().evaluate(el => 
        el.getBoundingClientRect().width
      );
      const containerWidth = await page.evaluate(() => 
        document.querySelector('.container')?.getBoundingClientRect().width || 0
      );
      
      // Posts should use appropriate width for each breakpoint
      if (breakpoint.width < 768) {
        expect(postWidth).toBeGreaterThan(containerWidth * 0.9); // Nearly full width on mobile
      } else {
        expect(postWidth).toBeLessThan(containerWidth * 0.8); // Constrained on larger screens
      }
      
      // Test image responsiveness
      const postImage = page.locator('[data-testid="post-image"]').first();
      if (await postImage.count() > 0) {
        const imageWidth = await postImage.evaluate(el => 
          el.getBoundingClientRect().width
        );
        expect(imageWidth).toBeLessThanOrEqual(postWidth);
      }
    }
  }

  async testTouchTargetAccessibility() {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Get all interactive elements
    const interactiveElements = page.locator('button, a, input, select, [role="button"]');
    const count = await interactiveElements.count();
    
    for (let i = 0; i < count; i++) {
      const element = interactiveElements.nth(i);
      const box = await element.boundingBox();
      
      if (box) {
        // WCAG recommendation: minimum 44x44px for touch targets
        expect(Math.max(box.width, box.height)).toBeGreaterThanOrEqual(44);
      }
    }
  }

  async testContentReflow() {
    // Test that content doesn't cause horizontal scrolling
    const breakpoints = [320, 375, 414, 768, 1024];
    
    for (const width of breakpoints) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/hunt-logs');
      
      // Check for horizontal overflow
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1); // Allow 1px tolerance
    }
  }
}
```

## Accessibility & Inclusive Design

### WCAG 2.1 AA Compliance for Hunting Community

#### Positive Accessibility Test Cases
```gherkin
Feature: Accessible Interface for All Hunters

Scenario: Screen reader navigation for visually impaired hunters
  Given hunter using screen reader software
  When navigating through hunt log interface
  Then all content has appropriate ARIA labels
  And heading structure is logical and navigable
  And form fields have proper descriptions
  And dynamic content changes are announced
  And skip links allow efficient navigation

Scenario: High contrast mode for outdoor visibility
  Given hunter in bright sunlight conditions
  When enabling high contrast mode
  Then color contrast exceeds WCAG AAA standards
  And information conveyed by color has text alternatives
  And focus indicators are clearly visible
  And interactive elements remain distinguishable
  And critical actions are always accessible

Scenario: Keyboard navigation for hunters with motor impairments
  Given hunter who cannot use touch interface
  When navigating with keyboard only
  Then all functionality is accessible via keyboard
  And tab order is logical and predictable
  And focus is clearly visible at all times
  And keyboard shortcuts work consistently
  And modal dialogs trap focus appropriately

Scenario: Voice control compatibility for hands-free operation
  Given hunter wanting hands-free operation
  When using voice commands
  Then voice control software can identify elements
  And buttons have voice-friendly names
  And form fields accept voice input
  And navigation commands work reliably
  And voice feedback is provided when possible
```

#### Step Classes (Accessibility Testing)
```typescript
// accessibility-steps.ts
export class AccessibilitySteps {
  async testScreenReaderCompatibility() {
    await page.goto('/hunt-logs');
    
    // Test heading structure
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingLevels = await headings.evaluateAll(elements => 
      elements.map(el => parseInt(el.tagName.substring(1)))
    );
    
    // Verify logical heading progression (no skipped levels)
    for (let i = 1; i < headingLevels.length; i++) {
      const diff = headingLevels[i] - headingLevels[i - 1];
      expect(diff).toBeLessThanOrEqual(1);
    }
    
    // Test ARIA labels on interactive elements
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const hasLabel = await button.evaluate(el => {
        return !!(
          el.getAttribute('aria-label') ||
          el.getAttribute('aria-labelledby') ||
          el.textContent?.trim()
        );
      });
      expect(hasLabel).toBe(true);
    }
    
    // Test skip links
    await page.keyboard.press('Tab');
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeFocused();
    
    await skipLink.click();
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeFocused();
  }

  async testColorContrastCompliance() {
    await page.goto('/');
    
    // Get all text elements
    const textElements = page.locator('p, span, div, h1, h2, h3, h4, h5, h6, a, button');
    const count = await textElements.count();
    
    for (let i = 0; i < Math.min(count, 50); i++) { // Sample 50 elements
      const element = textElements.nth(i);
      
      const styles = await element.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          fontSize: computed.fontSize
        };
      });
      
      const contrast = this.calculateContrastRatio(styles.color, styles.backgroundColor);
      const fontSize = parseFloat(styles.fontSize);
      
      // WCAG AA standards
      if (fontSize >= 18 || (fontSize >= 14 && await element.evaluate(el => 
        window.getComputedStyle(el).fontWeight >= '700'
      ))) {
        expect(contrast).toBeGreaterThanOrEqual(3.0); // Large text
      } else {
        expect(contrast).toBeGreaterThanOrEqual(4.5); // Normal text
      }
    }
  }

  async testKeyboardNavigation() {
    await page.goto('/dogs/new');
    
    // Test tab order
    const focusableElements = page.locator(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    const expectedOrder = await focusableElements.evaluateAll(elements => 
      elements.map((el, index) => ({
        index,
        tagName: el.tagName,
        id: el.id,
        className: el.className
      }))
    );
    
    // Navigate through all elements with Tab
    await page.keyboard.press('Tab');
    
    for (let i = 0; i < expectedOrder.length; i++) {
      const currentFocus = page.locator(':focus');
      const focusedElement = await currentFocus.evaluate(el => ({
        tagName: el.tagName,
        id: el.id,
        className: el.className
      }));
      
      // Verify we're on the expected element
      expect(focusedElement.tagName).toBe(expectedOrder[i].tagName);
      
      await page.keyboard.press('Tab');
    }
  }

  async testFocusManagement() {
    await page.goto('/');
    
    // Test modal focus trapping
    const openModalButton = page.locator('[data-testid="open-modal"]');
    await openModalButton.click();
    
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    
    // Focus should be trapped within modal
    const modalFocusableElements = modal.locator(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
    );
    
    const firstElement = modalFocusableElements.first();
    const lastElement = modalFocusableElements.last();
    
    // Focus should start on first element
    await expect(firstElement).toBeFocused();
    
    // Tab to last element
    const count = await modalFocusableElements.count();
    for (let i = 1; i < count; i++) {
      await page.keyboard.press('Tab');
    }
    
    await expect(lastElement).toBeFocused();
    
    // Tab should wrap to first element
    await page.keyboard.press('Tab');
    await expect(firstElement).toBeFocused();
    
    // Shift+Tab should go to last element
    await page.keyboard.press('Shift+Tab');
    await expect(lastElement).toBeFocused();
  }

  async testVoiceControlCompatibility() {
    await page.goto('/hunt-logs');
    
    // Test that buttons have voice-friendly names
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const accessibleName = await button.evaluate(el => {
        // Get the accessible name as computed by accessibility APIs
        return el.getAttribute('aria-label') || 
               el.textContent?.trim() || 
               el.getAttribute('title') || 
               el.getAttribute('alt');
      });
      
      expect(accessibleName).toBeTruthy();
      expect(accessibleName.length).toBeGreaterThan(0);
      
      // Voice-friendly names should be descriptive
      const voiceUnfriendlyWords = ['click', 'button', 'link'];
      const isVoiceFriendly = !voiceUnfriendlyWords.some(word => 
        accessibleName.toLowerCase().includes(word)
      );
      expect(isVoiceFriendly).toBe(true);
    }
  }

  private calculateContrastRatio(foreground: string, background: string): number {
    // RGB conversion and luminance calculation
    const getRGB = (color: string) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      return ctx.getImageData(0, 0, 1, 1).data;
    };

    const getLuminance = (r: number, g: number, b: number) => {
      const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    const fgRGB = getRGB(foreground);
    const bgRGB = getRGB(background);
    
    const fgLuminance = getLuminance(fgRGB[0], fgRGB[1], fgRGB[2]);
    const bgLuminance = getLuminance(bgRGB[0], bgRGB[1], bgRGB[2]);
    
    const lighter = Math.max(fgLuminance, bgLuminance);
    const darker = Math.min(fgLuminance, bgLuminance);
    
    return (lighter + 0.05) / (darker + 0.05);
  }
}
```

## Hunting-Specific UI Patterns

### Contextual Design Elements

```typescript
// hunting-ui-patterns.ts
export class HuntingUIPatterns {
  // Weather condition icons and indicators
  getWeatherIcon(conditions: WeatherConditions): string {
    const iconMap = {
      'clear': '☀️',
      'partly_cloudy': '⛅',
      'overcast': '☁️',
      'light_rain': '🌦️',
      'heavy_rain': '🌧️',
      'snow': '🌨️',
      'fog': '🌫️',
      'windy': '💨'
    };
    return iconMap[conditions.type] || '❓';
  }

  // Hunting success visual indicators
  getSuccessRating(rating: number): { color: string; icon: string; description: string } {
    const ratings = {
      5: { color: 'text-success', icon: '🎯', description: 'Exceptional hunt' },
      4: { color: 'text-warning', icon: '✅', description: 'Great hunt' },
      3: { color: 'text-info', icon: '👍', description: 'Good hunt' },
      2: { color: 'text-warning', icon: '⚠️', description: 'Challenging hunt' },
      1: { color: 'text-error', icon: '❌', description: 'Difficult hunt' }
    };
    return ratings[rating] || ratings[3];
  }

  // Dog training level visual progression
  getTrainingLevelBadge(level: TrainingLevel): { color: string; label: string; progress: number } {
    const levels = {
      'puppy': { color: 'bg-neutral-200', label: 'Puppy', progress: 20 },
      'started': { color: 'bg-info', label: 'Started', progress: 40 },
      'seasoned': { color: 'bg-warning', label: 'Seasoned', progress: 60 },
      'finished': { color: 'bg-success', label: 'Finished', progress: 80 },
      'master': { color: 'bg-primary-600', label: 'Master', progress: 100 }
    };
    return levels[level] || levels['puppy'];
  }

  // GPS signal strength indicator
  getGPSSignalIndicator(accuracy: number | null): { color: string; bars: number; description: string } {
    if (!accuracy) {
      return { color: 'text-neutral-400', bars: 0, description: 'Searching for GPS' };
    }
    
    if (accuracy <= 5) {
      return { color: 'text-success', bars: 4, description: 'Excellent GPS signal' };
    } else if (accuracy <= 15) {
      return { color: 'text-success', bars: 3, description: 'Good GPS signal' };
    } else if (accuracy <= 50) {
      return { color: 'text-warning', bars: 2, description: 'Fair GPS signal' };
    } else {
      return { color: 'text-error', bars: 1, description: 'Poor GPS signal' };
    }
  }
}
```

## Performance-Optimized Animations

### Battery-Conscious Animation Strategy

```css
/* Reduced motion preferences respected */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Battery-conscious animations */
.hunt-card-enter {
  animation: slideInUp 0.3s ease-out;
  will-change: transform;
}

.hunt-card-enter-active {
  transform: translateY(0);
}

@keyframes slideInUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* GPS tracking animation - minimal battery impact */
.gps-pulse {
  animation: pulse 2s infinite;
  animation-timing-function: ease-in-out;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.05);
  }
}

/* Loading states optimized for outdoor visibility */
.hunt-loading {
  background: linear-gradient(
    90deg,
    var(--neutral-200) 25%,
    var(--neutral-300) 50%,
    var(--neutral-200) 75%
  );
  background-size: 200% 100%;
  animation: loading-shimmer 1.5s infinite;
}

@keyframes loading-shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
```

This UI specification provides comprehensive guidance for creating an interface that serves the unique needs of hunters while maintaining modern usability standards and accessibility compliance.