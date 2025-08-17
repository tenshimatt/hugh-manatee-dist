# QuickLog Component

## Overview

The QuickLog component provides rapid hunt entry capabilities optimized for field use. It's designed for one-handed operation with gloves and includes automatic GPS capture, weather detection, and voice note integration.

## Design Specifications

### Visual Design
- **Floating action style**: Prominent placement for quick access
- **Large touch targets**: All interactive elements 48px minimum
- **High visibility colors**: Hunter orange for primary actions
- **Clear status indicators**: GPS, weather, and save states
- **Progressive disclosure**: Essential fields first, detailed options expandable

### Layout Structure
```
┌─ QuickLog Container ────────────────┐
│  ┌─ GPS Indicator ──┐               │
│  │ 📍 Accurate      │               │
│  └──────────────────┘               │
│                                     │
│  ┌─ Quick Action Buttons ──────────┐│
│  │ [🎯 Success] [❌ No Game]       ││
│  └──────────────────────────────────┘│
│                                     │
│  ┌─ Auto-captured Data ────────────┐│
│  │ 📍 Location: Auto-captured      ││
│  │ 🌤️  Weather: Clear, 45°F        ││
│  │ ⏰ Time: 6:30 AM                ││
│  └──────────────────────────────────┘│
│                                     │
│  ┌─ Optional Details ──────────────┐│
│  │ [+ Add Notes] [+ Add Photo]     ││
│  │ [+ Species] [+ Dogs]            ││
│  └──────────────────────────────────┘│
│                                     │
│  [Save Hunt Log]                    │
└─────────────────────────────────────┘
```

## React Implementation

```tsx
import React, { useState, useEffect } from 'react';
import { GPSIndicator } from './gps-indicator';
import { WeatherWidget } from './weather-widget';
import { VoiceNote } from '../forms/voice-note';
import { PhotoCapture } from '../forms/photo-capture';
import { Button } from '../base/button';

interface QuickLogProps {
  onSubmit: (huntData: HuntLogData) => Promise<void>;
  onCancel?: () => void;
  initialLocation?: GPSLocation;
  className?: string;
}

interface HuntLogData {
  id: string;
  success: boolean;
  location: GPSLocation;
  timestamp: Date;
  weather: WeatherData;
  notes?: string;
  photos?: File[];
  species?: string;
  dogs?: string[];
  duration?: number;
}

export const QuickLog: React.FC<QuickLogProps> = ({
  onSubmit,
  onCancel,
  initialLocation,
  className
}) => {
  const [huntData, setHuntData] = useState<Partial<HuntLogData>>({
    timestamp: new Date(),
    success: false,
  });
  
  const [gpsLocation, setGpsLocation] = useState<GPSLocation | null>(initialLocation || null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(!initialLocation);

  // Auto-capture GPS location
  useEffect(() => {
    if (!initialLocation) {
      captureGPSLocation();
    }
  }, [initialLocation]);

  // Auto-fetch weather data
  useEffect(() => {
    if (gpsLocation) {
      fetchWeatherData(gpsLocation);
    }
  }, [gpsLocation]);

  const captureGPSLocation = async () => {
    setGpsLoading(true);
    try {
      const position = await getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      });
      
      const location: GPSLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date(position.timestamp),
      };
      
      setGpsLocation(location);
      setHuntData(prev => ({ ...prev, location }));
    } catch (error) {
      console.error('GPS capture failed:', error);
      // Show user-friendly error
    } finally {
      setGpsLoading(false);
    }
  };

  const fetchWeatherData = async (location: GPSLocation) => {
    try {
      const weather = await getWeatherData(location);
      setWeatherData(weather);
      setHuntData(prev => ({ ...prev, weather }));
    } catch (error) {
      console.error('Weather fetch failed:', error);
    }
  };

  const handleQuickAction = (success: boolean) => {
    setHuntData(prev => ({ ...prev, success }));
  };

  const handleSubmit = async () => {
    if (!gpsLocation || !huntData.success !== undefined) {
      return;
    }

    setIsSaving(true);
    try {
      const completeHuntData: HuntLogData = {
        id: generateId(),
        success: huntData.success!,
        location: gpsLocation,
        timestamp: huntData.timestamp!,
        weather: weatherData!,
        notes: huntData.notes,
        photos: huntData.photos,
        species: huntData.species,
        dogs: huntData.dogs,
      };

      await onSubmit(completeHuntData);
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const isValid = gpsLocation && huntData.success !== undefined;

  return (
    <div className={`quick-log ${className}`}>
      {/* GPS Status */}
      <div className="quick-log__gps">
        <GPSIndicator 
          location={gpsLocation}
          loading={gpsLoading}
          onRetry={captureGPSLocation}
        />
      </div>

      {/* Quick Action Buttons */}
      <div className="quick-log__actions">
        <Button
          variant={huntData.success === true ? 'success' : 'secondary'}
          size="lg"
          icon={<TargetIcon />}
          onClick={() => handleQuickAction(true)}
          aria-label="Log successful hunt"
          aria-pressed={huntData.success === true}
        >
          Success
        </Button>
        
        <Button
          variant={huntData.success === false ? 'warning' : 'secondary'}
          size="lg"
          icon={<XIcon />}
          onClick={() => handleQuickAction(false)}
          aria-label="Log unsuccessful hunt"
          aria-pressed={huntData.success === false}
        >
          No Game
        </Button>
      </div>

      {/* Auto-captured Data Display */}
      <div className="quick-log__auto-data">
        {gpsLocation && (
          <div className="auto-data__item">
            <LocationIcon />
            <span className="auto-data__label">Location:</span>
            <span className="auto-data__value coordinates">
              {formatCoordinates(gpsLocation)}
            </span>
          </div>
        )}
        
        {weatherData && (
          <div className="auto-data__item">
            <WeatherWidget 
              weather={weatherData} 
              compact={true}
            />
          </div>
        )}
        
        <div className="auto-data__item">
          <ClockIcon />
          <span className="auto-data__label">Time:</span>
          <span className="auto-data__value">
            {formatTime(huntData.timestamp)}
          </span>
        </div>
      </div>

      {/* Expandable Details */}
      <div className="quick-log__details">
        <Button
          variant="secondary"
          size="sm"
          icon={isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? "Hide additional options" : "Show additional options"}
          aria-expanded={isExpanded}
        >
          {isExpanded ? 'Less Options' : 'More Options'}
        </Button>

        {isExpanded && (
          <div className="details__content">
            <div className="details__row">
              <VoiceNote
                onRecordingComplete={(audioBlob, transcript) => {
                  setHuntData(prev => ({ 
                    ...prev, 
                    notes: transcript || prev.notes 
                  }));
                }}
                maxDuration={60}
                className="details__voice-note"
              />
              
              <PhotoCapture
                onCapture={(files) => {
                  setHuntData(prev => ({ 
                    ...prev, 
                    photos: [...(prev.photos || []), ...files] 
                  }));
                }}
                maxPhotos={3}
                className="details__photo-capture"
              />
            </div>
            
            <div className="details__row">
              <input
                type="text"
                placeholder="Species (optional)"
                value={huntData.species || ''}
                onChange={(e) => setHuntData(prev => ({ 
                  ...prev, 
                  species: e.target.value 
                }))}
                className="details__input"
              />
              
              <input
                type="text"
                placeholder="Dogs involved (optional)"
                value={huntData.dogs?.join(', ') || ''}
                onChange={(e) => setHuntData(prev => ({ 
                  ...prev, 
                  dogs: e.target.value.split(',').map(d => d.trim()).filter(Boolean)
                }))}
                className="details__input"
              />
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="quick-log__submit">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={isSaving}
          disabled={!isValid}
          onClick={handleSubmit}
          aria-label="Save hunt log entry"
        >
          {isSaving ? 'Saving...' : 'Save Hunt Log'}
        </Button>
        
        {onCancel && (
          <Button
            variant="secondary"
            size="md"
            onClick={onCancel}
            aria-label="Cancel hunt log entry"
          >
            Cancel
          </Button>
        )}
      </div>

      {/* Offline Status */}
      {!navigator.onLine && (
        <div className="quick-log__offline-notice">
          <WifiOffIcon />
          <span>Will sync when online</span>
        </div>
      )}
    </div>
  );
};
```

## CSS Implementation

```css
.quick-log {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  
  padding: var(--space-6);
  background: var(--neutral-50);
  border: 1px solid var(--neutral-200);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  
  /* Ensure visibility in field conditions */
  max-width: 400px;
  margin: 0 auto;
}

/* GPS Status */
.quick-log__gps {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: var(--space-2);
  background: var(--neutral-100);
  border-radius: 8px;
}

/* Quick Action Buttons */
.quick-log__actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

.quick-log__actions .btn {
  min-height: 56px; /* Larger for primary actions */
  font-weight: var(--font-bold);
}

/* Auto-captured Data */
.quick-log__auto-data {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4);
  background: var(--neutral-100);
  border-radius: 8px;
  border-left: 4px solid var(--primary-500);
}

.auto-data__item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
}

.auto-data__item svg {
  width: 16px;
  height: 16px;
  color: var(--neutral-600);
}

.auto-data__label {
  font-weight: var(--font-medium);
  color: var(--neutral-700);
  min-width: 60px;
}

.auto-data__value {
  color: var(--neutral-900);
  font-family: var(--font-mono);
}

/* Details Section */
.quick-log__details {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.details__content {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-4);
  background: var(--neutral-50);
  border: 1px solid var(--neutral-200);
  border-radius: 8px;
}

.details__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

@media (max-width: 414px) {
  .details__row {
    grid-template-columns: 1fr;
  }
}

.details__input {
  padding: var(--space-3);
  border: 1px solid var(--neutral-300);
  border-radius: 6px;
  font-size: var(--text-base);
  background: var(--neutral-50);
}

.details__input:focus {
  outline: 2px solid var(--primary-500);
  border-color: var(--primary-500);
}

/* Submit Section */
.quick-log__submit {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

/* Offline Notice */
.quick-log__offline-notice {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  
  padding: var(--space-2);
  background: var(--warning-light);
  color: var(--warning-dark);
  border-radius: 6px;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
}

/* High Contrast Mode */
@media (prefers-contrast: high) {
  .quick-log {
    border: 3px solid var(--neutral-900);
  }
  
  .quick-log__auto-data {
    border-left-width: 6px;
  }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  .quick-log * {
    transition: none;
  }
}

/* Landscape Orientation Optimization */
@media (orientation: landscape) and (max-height: 500px) {
  .quick-log {
    max-height: 90vh;
    overflow-y: auto;
  }
  
  .quick-log__actions {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Print Styles */
@media print {
  .quick-log {
    break-inside: avoid;
    box-shadow: none;
    border: 2px solid var(--neutral-900);
  }
  
  .quick-log__actions .btn {
    border: 1px solid var(--neutral-900);
    background: transparent;
    color: var(--neutral-900);
  }
}
```

## Accessibility Features

### Keyboard Navigation
- Tab order follows logical flow: GPS → Quick actions → Details → Submit
- Enter/Space activates buttons
- Arrow keys navigate between quick action buttons
- Escape closes expanded details

### Screen Reader Support
```tsx
// ARIA labels and descriptions
<div 
  role="form" 
  aria-labelledby="quick-log-title"
  aria-describedby="quick-log-description"
>
  <h2 id="quick-log-title" className="sr-only">Quick Hunt Log</h2>
  <p id="quick-log-description" className="sr-only">
    Rapidly log hunt results with automatic location and weather capture
  </p>
  
  {/* Status announcements */}
  <div aria-live="polite" aria-atomic="true">
    {gpsLoading && "Acquiring GPS location..."}
    {isSaving && "Saving hunt log..."}
    {!navigator.onLine && "Offline mode - will sync when connected"}
  </div>
</div>
```

### Voice Commands (where supported)
- "Log success" → Activates success button
- "Log no game" → Activates no game button
- "Add note" → Opens voice note recording
- "Save hunt" → Submits the form

## Testing Guidelines

### Unit Tests
```typescript
describe('QuickLog Component', () => {
  it('auto-captures GPS location on mount', async () => {
    const mockGeolocation = createMockGeolocation();
    Object.defineProperty(navigator, 'geolocation', {
      value: mockGeolocation,
    });

    render(<QuickLog onSubmit={jest.fn()} />);

    await waitFor(() => {
      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
    });
  });

  it('validates required data before submission', async () => {
    const handleSubmit = jest.fn();
    render(<QuickLog onSubmit={handleSubmit} />);

    const submitButton = screen.getByRole('button', { name: /save hunt log/i });
    expect(submitButton).toBeDisabled();

    // Should enable after GPS and success state are set
    fireEvent.click(screen.getByRole('button', { name: /log successful hunt/i }));
    
    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });
  });
});
```

### Integration Tests
- GPS location capture and display
- Weather data fetching and display
- Offline functionality and sync
- Voice note integration
- Photo capture integration

### Field Testing
- Glove compatibility on all interactive elements
- Sunlight visibility of all states
- Battery impact during GPS capture
- Network interruption handling
- One-handed operation scenarios

## Performance Considerations

### Bundle Size
- Core component: ~8KB gzipped
- With all dependencies: ~15KB gzipped
- Lazy-loaded features (voice, photos): +5KB each

### Runtime Performance
- GPS capture throttling (max once per 30 seconds)
- Weather data caching (5-minute expiry)
- Optimized image compression for photos
- Minimal re-renders during data entry

### Battery Optimization
- GPS capture timeout after 10 seconds
- Background fetch disabled when battery low
- Reduced update frequency in power saving mode
- Efficient location accuracy settings

## Usage Examples

### Basic Implementation
```tsx
<QuickLog
  onSubmit={async (huntData) => {
    await saveHuntLog(huntData);
    showSuccessMessage('Hunt logged successfully!');
  }}
  onCancel={() => setShowQuickLog(false)}
/>
```

### With Initial GPS Location
```tsx
<QuickLog
  onSubmit={handleSave}
  initialLocation={currentGPSLocation}
  className="hunt-quick-log"
/>
```

### Standalone Page Usage
```tsx
const QuickLogPage = () => {
  return (
    <div className="quick-log-page">
      <h1>Log Your Hunt</h1>
      <QuickLog
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </div>
  );
};
```

## Related Components

- [GPSIndicator](./gps-indicator.md) - Location display and status
- [WeatherWidget](./weather-widget.md) - Weather information
- [VoiceNote](../forms/voice-note.md) - Voice recording
- [PhotoCapture](../forms/photo-capture.md) - Camera integration
- [Button](../base/button.md) - Interactive buttons