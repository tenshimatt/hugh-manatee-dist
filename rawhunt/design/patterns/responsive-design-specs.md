# Responsive Design Specifications

## Overview

GoHunta.com employs a mobile-first responsive design strategy tailored specifically for hunting scenarios. Our responsive approach prioritizes the most common use cases (mobile field operation) while providing progressively enhanced experiences on larger devices.

## Mobile-First Philosophy

### Primary Use Case Priority
1. **iPhone/Android in Field** (375px-414px) - 70% of usage
2. **Tablet for Planning** (768px-1024px) - 20% of usage  
3. **Desktop for Management** (1024px+) - 10% of usage

### Design Principles
- **Essential First**: Core hunting features optimized for mobile
- **Progressive Enhancement**: Additional features and content on larger screens
- **Touch-First**: All interactions designed for finger/glove operation
- **Context-Aware**: Layout adapts to hunting scenarios and device orientation

## Breakpoint Strategy

### Device-Focused Breakpoints
```css
/* Mobile Breakpoints - Based on Common Hunting Devices */
:root {
  --mobile-xs: 320px;   /* iPhone SE, older Android */
  --mobile-sm: 375px;   /* iPhone 13 mini, small Android */
  --mobile-md: 390px;   /* iPhone 14 standard */
  --mobile-lg: 414px;   /* iPhone 14 Plus, large Android */
  --mobile-xl: 430px;   /* iPhone 14 Pro Max */
  
  /* Tablet Breakpoints */
  --tablet-sm: 768px;   /* iPad mini, small tablets */
  --tablet-md: 820px;   /* iPad Air, standard tablets */
  --tablet-lg: 1024px;  /* iPad Pro 11", large tablets */
  --tablet-xl: 1180px;  /* iPad Pro 12.9" */
  
  /* Desktop Breakpoints */
  --desktop-sm: 1280px; /* Small laptops */
  --desktop-md: 1440px; /* Standard monitors */
  --desktop-lg: 1680px; /* Large monitors */
  --desktop-xl: 1920px; /* Full HD displays */
}
```

### Usage-Based Media Queries
```css
/* Hunting Context Media Queries */
@media (max-width: 430px) and (orientation: portrait) {
  /* Primary hunting scenario: phone in hand, portrait mode */
  .hunt-interface {
    --layout-mode: 'single-column';
    --nav-position: 'bottom';
    --content-density: 'sparse';
  }
}

@media (min-width: 431px) and (max-width: 1023px) {
  /* Secondary scenario: planning mode, tablet use */
  .hunt-interface {
    --layout-mode: 'dual-column';
    --nav-position: 'side';
    --content-density: 'medium';
  }
}

@media (min-width: 1024px) {
  /* Tertiary scenario: desktop management, detailed view */
  .hunt-interface {
    --layout-mode: 'multi-column';
    --nav-position: 'top-side';
    --content-density: 'dense';
  }
}
```

## Layout Patterns

### Mobile Layout (320px - 430px)

#### Single-Column Stack
```css
.mobile-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  
  /* Navigation at bottom for thumb accessibility */
  .navigation {
    order: 3;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 64px;
    background: var(--neutral-50);
    border-top: 1px solid var(--neutral-200);
    z-index: 100;
  }
  
  /* Header minimal and fixed */
  .header {
    order: 1;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 56px;
    background: var(--primary-500);
    color: white;
    z-index: 200;
  }
  
  /* Main content with safe area padding */
  .main-content {
    order: 2;
    flex: 1;
    padding-top: 56px; /* Header height */
    padding-bottom: 64px; /* Navigation height */
    padding-inline: var(--space-4);
    overflow-y: auto;
  }
}
```

#### Touch-Optimized Content Cards
```css
.hunt-card {
  /* Mobile-first card design */
  width: 100%;
  background: var(--neutral-50);
  border: 1px solid var(--neutral-200);
  border-radius: 12px;
  padding: var(--space-6);
  margin-bottom: var(--space-4);
  
  /* Large touch targets */
  min-height: 120px;
  
  /* Clear visual hierarchy */
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--space-4);
    
    .title {
      font-size: var(--text-xl);
      font-weight: var(--font-bold);
      line-height: var(--leading-tight);
    }
    
    .meta {
      font-size: var(--text-sm);
      color: var(--neutral-600);
    }
  }
  
  .card-content {
    margin-bottom: var(--space-4);
    line-height: var(--leading-relaxed);
  }
  
  .card-actions {
    display: flex;
    gap: var(--space-3);
    
    .btn {
      flex: 1;
      justify-content: center;
    }
  }
}
```

### Tablet Layout (768px - 1180px)

#### Dual-Column with Sidebar
```css
@media (min-width: 768px) {
  .tablet-layout {
    display: grid;
    grid-template-areas: 
      "header header"
      "sidebar content"
      "sidebar content";
    grid-template-columns: 280px 1fr;
    grid-template-rows: auto 1fr auto;
    height: 100vh;
    
    .header {
      grid-area: header;
      position: static;
      height: 72px;
      padding: var(--space-4) var(--space-8);
    }
    
    .sidebar {
      grid-area: sidebar;
      background: var(--neutral-100);
      border-right: 1px solid var(--neutral-200);
      padding: var(--space-6);
      overflow-y: auto;
    }
    
    .main-content {
      grid-area: content;
      padding: var(--space-8);
      overflow-y: auto;
    }
  }
  
  /* Card grid for better space usage */
  .hunt-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--space-6);
  }
  
  .hunt-card {
    /* Adjust padding for larger screens */
    padding: var(--space-8);
    
    /* Hover effects for pointer devices */
    transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    }
  }
}
```

#### Landscape Orientation Optimization
```css
@media (min-width: 768px) and (orientation: landscape) {
  /* Optimize for landscape tablet use */
  .hunt-interface {
    .quick-actions {
      position: fixed;
      right: var(--space-6);
      top: 50%;
      transform: translateY(-50%);
      flex-direction: column;
      gap: var(--space-3);
    }
    
    .map-view {
      /* Utilize horizontal space for maps */
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: var(--space-6);
      
      .map-container {
        aspect-ratio: 16 / 10; /* Wider aspect ratio */
      }
      
      .location-details {
        background: var(--neutral-50);
        padding: var(--space-6);
        border-radius: 8px;
      }
    }
  }
}
```

### Desktop Layout (1024px+)

#### Multi-Column Dashboard
```css
@media (min-width: 1024px) {
  .desktop-layout {
    display: grid;
    grid-template-areas:
      "header header header"
      "sidebar main aside"
      "sidebar main aside";
    grid-template-columns: 240px 1fr 320px;
    grid-template-rows: auto 1fr auto;
    height: 100vh;
    max-width: 1600px;
    margin: 0 auto;
    
    .header {
      grid-area: header;
      height: 64px;
      padding: var(--space-4) var(--space-8);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .sidebar {
      grid-area: sidebar;
      background: var(--neutral-100);
      padding: var(--space-6);
      overflow-y: auto;
    }
    
    .main-content {
      grid-area: main;
      padding: var(--space-8);
      overflow-y: auto;
    }
    
    .aside {
      grid-area: aside;
      background: var(--neutral-50);
      border-left: 1px solid var(--neutral-200);
      padding: var(--space-6);
      overflow-y: auto;
    }
  }
  
  /* Dense information display */
  .hunt-table {
    display: table;
    width: 100%;
    border-collapse: collapse;
    
    .hunt-row {
      display: table-row;
      border-bottom: 1px solid var(--neutral-200);
      
      &:hover {
        background: var(--neutral-50);
      }
      
      .hunt-cell {
        display: table-cell;
        padding: var(--space-3) var(--space-4);
        vertical-align: middle;
      }
    }
  }
}
```

## Component Responsive Behavior

### Navigation Patterns

#### Mobile Navigation (Bottom Tab Bar)
```css
.mobile-navigation {
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 64px;
  background: var(--neutral-50);
  border-top: 1px solid var(--neutral-200);
  
  .nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-1);
    padding: var(--space-2);
    min-width: 64px;
    min-height: 64px;
    color: var(--neutral-600);
    text-decoration: none;
    transition: color 0.2s ease-out;
    
    .icon {
      width: 24px;
      height: 24px;
    }
    
    .label {
      font-size: var(--text-xs);
      font-weight: var(--font-medium);
    }
    
    &.active,
    &:hover {
      color: var(--primary-600);
    }
  }
}
```

#### Tablet Navigation (Side Panel)
```css
@media (min-width: 768px) {
  .tablet-navigation {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: var(--space-6);
    
    .nav-section {
      margin-bottom: var(--space-6);
      
      .section-title {
        font-size: var(--text-sm);
        font-weight: var(--font-semibold);
        color: var(--neutral-700);
        text-transform: uppercase;
        letter-spacing: var(--tracking-wide);
        margin-bottom: var(--space-3);
      }
      
      .nav-item {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-3);
        border-radius: 6px;
        color: var(--neutral-700);
        text-decoration: none;
        transition: background-color 0.2s ease-out;
        
        .icon {
          width: 20px;
          height: 20px;
        }
        
        .label {
          font-size: var(--text-base);
          font-weight: var(--font-medium);
        }
        
        &.active {
          background: var(--primary-100);
          color: var(--primary-700);
        }
        
        &:hover {
          background: var(--neutral-100);
        }
      }
    }
  }
}
```

### Form Responsive Behavior

#### Mobile Form Layout
```css
.hunt-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  
  .form-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    
    .label {
      font-size: var(--text-sm);
      font-weight: var(--font-semibold);
      color: var(--neutral-700);
    }
    
    .input {
      padding: var(--space-4);
      border: 1px solid var(--neutral-300);
      border-radius: 8px;
      font-size: var(--text-base);
      background: var(--neutral-50);
      
      /* Large touch target */
      min-height: 48px;
      
      &:focus {
        outline: 2px solid var(--primary-500);
        border-color: var(--primary-500);
      }
    }
  }
  
  .form-actions {
    margin-top: var(--space-6);
    
    .btn {
      width: 100%;
      justify-content: center;
      margin-bottom: var(--space-3);
      
      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}
```

#### Tablet/Desktop Form Layout
```css
@media (min-width: 768px) {
  .hunt-form {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-6);
    
    .form-group {
      &.full-width {
        grid-column: 1 / -1;
      }
    }
    
    .form-actions {
      grid-column: 1 / -1;
      display: flex;
      justify-content: flex-end;
      gap: var(--space-3);
      margin-top: var(--space-8);
      
      .btn {
        width: auto;
        min-width: 120px;
      }
    }
  }
}
```

### Data Visualization Responsive Patterns

#### Mobile Chart Display
```css
.hunt-chart {
  width: 100%;
  background: var(--neutral-50);
  border-radius: 8px;
  padding: var(--space-4);
  margin-bottom: var(--space-4);
  
  .chart-header {
    text-align: center;
    margin-bottom: var(--space-4);
    
    .title {
      font-size: var(--text-lg);
      font-weight: var(--font-bold);
      margin-bottom: var(--space-2);
    }
    
    .subtitle {
      font-size: var(--text-sm);
      color: var(--neutral-600);
    }
  }
  
  .chart-container {
    position: relative;
    width: 100%;
    height: 200px; /* Fixed height for mobile */
    
    /* Ensure chart is touch-friendly */
    canvas, svg {
      max-width: 100%;
      height: 100%;
      touch-action: pan-x pan-y;
    }
  }
  
  .chart-legend {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--space-3);
    margin-top: var(--space-4);
    
    .legend-item {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--text-sm);
      
      .color-swatch {
        width: 12px;
        height: 12px;
        border-radius: 50%;
      }
    }
  }
}
```

#### Desktop Chart Display
```css
@media (min-width: 1024px) {
  .hunt-chart {
    padding: var(--space-8);
    
    .chart-header {
      text-align: left;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      
      .chart-controls {
        display: flex;
        gap: var(--space-2);
        
        .btn {
          font-size: var(--text-sm);
          padding: var(--space-2) var(--space-3);
        }
      }
    }
    
    .chart-container {
      height: 400px; /* Larger height for desktop */
    }
    
    .chart-legend {
      justify-content: flex-start;
      margin-top: var(--space-6);
    }
  }
}
```

## Performance Considerations

### Mobile-First Loading Strategy
```css
/* Critical styles inline in <head> */
.critical-mobile-styles {
  /* Layout and navigation styles for mobile */
  /* Typography and color system */
  /* Essential component styles */
}

/* Progressive enhancement for larger screens */
@media (min-width: 768px) {
  /* Load tablet-specific styles */
}

@media (min-width: 1024px) {
  /* Load desktop-specific styles */
}
```

### Image Responsive Loading
```html
<!-- Mobile-first responsive images -->
<picture>
  <source 
    media="(min-width: 1024px)" 
    srcset="hunt-photo-large.webp 1x, hunt-photo-large@2x.webp 2x"
    type="image/webp"
  >
  <source 
    media="(min-width: 768px)" 
    srcset="hunt-photo-medium.webp 1x, hunt-photo-medium@2x.webp 2x"
    type="image/webp"
  >
  <source 
    media="(max-width: 767px)" 
    srcset="hunt-photo-small.webp 1x, hunt-photo-small@2x.webp 2x"
    type="image/webp"
  >
  <img 
    src="hunt-photo-small.jpg" 
    alt="Successful duck hunt with retriever"
    loading="lazy"
    width="400"
    height="300"
  >
</picture>
```

### Container Queries (Modern Browsers)
```css
/* Container-based responsive design */
.hunt-card {
  container-type: inline-size;
}

@container (min-width: 300px) {
  .hunt-card .title {
    font-size: var(--text-xl);
  }
}

@container (min-width: 500px) {
  .hunt-card {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: var(--space-6);
  }
}
```

## Testing Strategy

### Device Testing Matrix
```markdown
**Priority 1 Devices (Must Test)**
- iPhone 13/14 (390px × 844px)
- iPhone 13/14 Pro Max (430px × 932px)
- Samsung Galaxy S22 (360px × 800px)
- iPad Air (820px × 1180px)
- iPad Pro 11" (834px × 1194px)

**Priority 2 Devices (Should Test)**
- iPhone SE (375px × 667px)
- Google Pixel 6 (411px × 823px)
- Samsung Galaxy Tab (768px × 1024px)
- iPad Pro 12.9" (1024px × 1366px)

**Priority 3 Devices (Nice to Test)**
- Various Android tablets
- Surface Pro devices
- Desktop monitors (1440px+)
```

### Responsive Testing Checklist
```markdown
**Layout Testing**
- [ ] No horizontal scrolling at any breakpoint
- [ ] Touch targets minimum 44px on mobile
- [ ] Navigation accessible at all screen sizes
- [ ] Content hierarchy maintained across devices
- [ ] Images scale appropriately

**Interaction Testing**
- [ ] All buttons/links work on touch devices  
- [ ] Hover states work on pointer devices
- [ ] Keyboard navigation functional at all sizes
- [ ] Gestures work on touch devices
- [ ] No layout shift during interactions

**Content Testing**
- [ ] Text readable at all screen sizes
- [ ] Critical content visible without scrolling
- [ ] Forms usable at all breakpoints
- [ ] Charts/graphs legible and interactive
- [ ] Media loads efficiently for each device

**Performance Testing**
- [ ] Fast loading on mobile networks
- [ ] Efficient use of screen real estate
- [ ] Battery impact acceptable
- [ ] Memory usage within limits
- [ ] No janky animations or scrolling
```

## Related Documentation

- [Component Library](../components/README.md)
- [Design System](../system/README.md)
- [User Journey Maps](./user-journey-maps.md)
- [Field Usability Testing](../testing/field-usability-testing.md)