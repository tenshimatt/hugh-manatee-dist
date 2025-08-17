# Progressive Web App UI Patterns

## Overview

GoHunta.com is designed as a Progressive Web App (PWA) to provide native app-like experiences while maintaining web accessibility. Our PWA UI patterns focus on offline capability, installation prompts, and seamless synchronization - critical features for hunters operating in remote areas with limited connectivity.

## PWA Design Philosophy

### Native App Feel
- **Immersive Interface**: Full-screen experience without browser UI
- **App-like Navigation**: Bottom tab bars and gesture-based interactions
- **Native Interactions**: Smooth animations and responsive touch feedback
- **System Integration**: Works with device features like GPS, camera, and notifications

### Offline-First Approach
- **Core Functionality Available Offline**: Essential hunting features work without connection
- **Intelligent Caching**: Pre-cache critical data and routes
- **Background Sync**: Queue actions for when connectivity returns
- **Clear Offline Status**: Users always know their connection state

## Installation Experience

### Install Prompt Patterns

#### Custom Install Banner
```css
.pwa-install-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  color: white;
  padding: var(--space-6);
  transform: translateY(100%);
  transition: transform 0.3s ease-out;
  z-index: 1000;
  
  &.show {
    transform: translateY(0);
  }
  
  .banner-content {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    max-width: 600px;
    margin: 0 auto;
  }
  
  .app-icon {
    width: 64px;
    height: 64px;
    border-radius: 12px;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    
    img {
      width: 48px;
      height: 48px;
    }
  }
  
  .banner-text {
    flex: 1;
    
    .title {
      font-size: var(--text-lg);
      font-weight: var(--font-bold);
      margin-bottom: var(--space-1);
    }
    
    .subtitle {
      font-size: var(--text-sm);
      opacity: 0.9;
    }
  }
  
  .banner-actions {
    display: flex;
    gap: var(--space-2);
    
    .btn {
      min-width: auto;
      padding: var(--space-2) var(--space-4);
      font-size: var(--text-sm);
      
      &.install-btn {
        background: white;
        color: var(--primary-600);
        
        &:hover {
          background: var(--neutral-100);
        }
      }
      
      &.dismiss-btn {
        background: transparent;
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.3);
        
        &:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      }
    }
  }
}
```

#### In-App Install Promotion
```tsx
const PWAInstallPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      
      setDeferredPrompt(null);
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="pwa-install-card">
      <div className="install-icon">
        <DownloadIcon />
      </div>
      
      <div className="install-content">
        <h3>Install GoHunta App</h3>
        <p>
          Get the full hunting experience with offline access, 
          faster loading, and native app features.
        </p>
        
        <div className="install-benefits">
          <div className="benefit">
            <WifiOffIcon />
            <span>Works Offline</span>
          </div>
          <div className="benefit">
            <BatteryIcon />
            <span>Better Battery Life</span>
          </div>
          <div className="benefit">
            <SpeedIcon />
            <span>Faster Performance</span>
          </div>
        </div>
      </div>
      
      <div className="install-actions">
        <button 
          className="btn btn-primary"
          onClick={handleInstall}
        >
          Install App
        </button>
        <button 
          className="btn btn-secondary"
          onClick={() => setShowPrompt(false)}
        >
          Maybe Later
        </button>
      </div>
    </div>
  );
};
```

### Installation Success States

#### Welcome Screen After Install
```tsx
const PWAWelcomeScreen: React.FC = () => {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detect if app is running in standalone mode
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
                           (window.navigator as any).standalone;
    setIsStandalone(isStandaloneMode);
  }, []);

  if (!isStandalone) return null;

  return (
    <div className="pwa-welcome-overlay">
      <div className="welcome-content">
        <div className="welcome-icon">
          <CheckCircleIcon className="text-success" />
        </div>
        
        <h2>Welcome to GoHunta!</h2>
        <p>
          Your hunting companion is now installed and ready for the field.
          All core features work offline, so you can hunt anywhere.
        </p>
        
        <div className="welcome-features">
          <div className="feature">
            <LocationIcon />
            <div>
              <h4>GPS Tracking</h4>
              <p>Track hunts without internet</p>
            </div>
          </div>
          
          <div className="feature">
            <CameraIcon />
            <div>
              <h4>Photo Capture</h4>
              <p>Document your success</p>
            </div>
          </div>
          
          <div className="feature">
            <CloudSyncIcon />
            <div>
              <h4>Smart Sync</h4>
              <p>Data syncs when you're back online</p>
            </div>
          </div>
        </div>
        
        <button 
          className="btn btn-primary btn-lg"
          onClick={() => setIsStandalone(false)}
        >
          Start Hunting
        </button>
      </div>
    </div>
  );
};
```

## Offline Status Indicators

### Connection Status Banner
```css
.connection-status {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  z-index: 999;
  transition: transform 0.3s ease-out;
  
  &.online {
    background: var(--success);
    color: white;
    transform: translateY(-100%);
    
    &.show {
      transform: translateY(0);
    }
  }
  
  &.offline {
    background: var(--warning);
    color: var(--neutral-900);
    transform: translateY(0);
  }
  
  .status-icon {
    width: 16px;
    height: 16px;
    margin-right: var(--space-2);
  }
  
  .status-text {
    margin-right: var(--space-4);
  }
  
  .retry-btn {
    background: transparent;
    border: 1px solid currentColor;
    color: inherit;
    padding: var(--space-1) var(--space-2);
    border-radius: 4px;
    font-size: var(--text-xs);
    cursor: pointer;
    
    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }
}
```

### Feature-Level Offline Indicators
```tsx
const OfflineFeatureIndicator: React.FC<{
  feature: string;
  isOffline: boolean;
  syncPending?: boolean;
}> = ({ feature, isOffline, syncPending }) => {
  if (!isOffline && !syncPending) return null;

  return (
    <div className="offline-indicator">
      {syncPending ? (
        <div className="sync-pending">
          <SyncIcon className="animate-spin" />
          <span>Syncing {feature}...</span>
        </div>
      ) : (
        <div className="offline-mode">
          <WifiOffIcon />
          <span>Using {feature} offline</span>
        </div>
      )}
    </div>
  );
};

// Usage in components
const HuntLogForm = () => {
  const { isOffline, syncPending } = useConnectionStatus();
  
  return (
    <div className="hunt-log-form">
      <OfflineFeatureIndicator 
        feature="Hunt Logging"
        isOffline={isOffline}
        syncPending={syncPending}
      />
      
      {/* Form content */}
    </div>
  );
};
```

## Background Sync Patterns

### Sync Queue Visualization
```tsx
const SyncQueueStatus: React.FC = () => {
  const { queue, isOnline } = useBackgroundSync();
  
  if (queue.length === 0) return null;

  return (
    <div className="sync-queue-status">
      <div className="queue-header">
        <div className="queue-info">
          <CloudSyncIcon className={isOnline ? 'syncing' : 'paused'} />
          <span>
            {queue.length} item{queue.length !== 1 ? 's' : ''} waiting to sync
          </span>
        </div>
        
        <div className="queue-actions">
          {isOnline ? (
            <span className="syncing-text">Syncing...</span>
          ) : (
            <span className="waiting-text">Will sync when online</span>
          )}
        </div>
      </div>
      
      <div className="queue-items">
        {queue.map((item, index) => (
          <div key={item.id} className="queue-item">
            <div className="item-icon">
              {getIconForAction(item.action)}
            </div>
            
            <div className="item-details">
              <div className="item-title">{item.title}</div>
              <div className="item-time">{formatTimeAgo(item.timestamp)}</div>
            </div>
            
            <div className="item-status">
              {item.status === 'pending' && <ClockIcon />}
              {item.status === 'syncing' && <SyncIcon className="animate-spin" />}
              {item.status === 'success' && <CheckIcon className="text-success" />}
              {item.status === 'failed' && <AlertIcon className="text-error" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Sync Success/Failure Notifications
```tsx
const SyncNotification: React.FC<{
  type: 'success' | 'failure' | 'partial';
  items: SyncItem[];
  onDismiss: () => void;
}> = ({ type, items, onDismiss }) => {
  const getNotificationConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircleIcon className="text-success" />,
          title: 'Sync Complete',
          message: `${items.length} items synced successfully`,
          className: 'success'
        };
      case 'failure':
        return {
          icon: <AlertCircleIcon className="text-error" />,
          title: 'Sync Failed',
          message: `Failed to sync ${items.length} items`,
          className: 'error'
        };
      case 'partial':
        const successful = items.filter(item => item.status === 'success').length;
        return {
          icon: <WarningIcon className="text-warning" />,
          title: 'Partial Sync',
          message: `${successful} of ${items.length} items synced`,
          className: 'warning'
        };
    }
  };

  const config = getNotificationConfig();

  return (
    <div className={`sync-notification ${config.className}`}>
      <div className="notification-content">
        <div className="notification-icon">{config.icon}</div>
        
        <div className="notification-text">
          <div className="notification-title">{config.title}</div>
          <div className="notification-message">{config.message}</div>
        </div>
        
        <button 
          className="notification-dismiss"
          onClick={onDismiss}
          aria-label="Dismiss notification"
        >
          <XIcon />
        </button>
      </div>
      
      {type === 'failure' && (
        <div className="notification-actions">
          <button className="btn btn-sm btn-primary">
            Retry Sync
          </button>
          <button className="btn btn-sm btn-secondary">
            View Details
          </button>
        </div>
      )}
    </div>
  );
};
```

## Update Patterns

### App Update Available
```tsx
const PWAUpdatePrompt: React.FC = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Listen for service worker update available
    const handleUpdateAvailable = () => {
      setUpdateAvailable(true);
    };

    // Register service worker update listener
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
          handleUpdateAvailable();
        }
      });
    }
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);
    
    // Send message to service worker to skip waiting
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
      
      // Reload page after service worker takes control
      window.location.reload();
    }
  };

  if (!updateAvailable) return null;

  return (
    <div className="update-prompt">
      <div className="update-content">
        <div className="update-icon">
          <UpgradeIcon />
        </div>
        
        <div className="update-text">
          <h3>App Update Available</h3>
          <p>
            A new version of GoHunta is ready with improvements and new features.
          </p>
          
          <div className="update-features">
            <div className="feature-item">
              <SparkleIcon />
              <span>Enhanced GPS accuracy</span>
            </div>
            <div className="feature-item">
              <BugIcon />
              <span>Bug fixes and stability improvements</span>
            </div>
            <div className="feature-item">
              <FeatherIcon />
              <span>Faster performance</span>
            </div>
          </div>
        </div>
        
        <div className="update-actions">
          <button 
            className="btn btn-primary"
            onClick={handleUpdate}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <>
                <LoadingIcon className="animate-spin" />
                Updating...
              </>
            ) : (
              'Update Now'
            )}
          </button>
          
          <button 
            className="btn btn-secondary"
            onClick={() => setUpdateAvailable(false)}
            disabled={isUpdating}
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
};
```

## Cache Management UI

### Storage Usage Indicator
```tsx
const StorageIndicator: React.FC = () => {
  const [storage, setStorage] = useState<{
    used: number;
    available: number;
    percentage: number;
  } | null>(null);

  useEffect(() => {
    const checkStorage = async () => {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const used = estimate.usage || 0;
        const quota = estimate.quota || 0;
        const available = quota - used;
        const percentage = (used / quota) * 100;

        setStorage({
          used: used / (1024 * 1024), // Convert to MB
          available: available / (1024 * 1024),
          percentage
        });
      }
    };

    checkStorage();
  }, []);

  if (!storage) return null;

  return (
    <div className="storage-indicator">
      <div className="storage-header">
        <h4>App Storage</h4>
        <span className="storage-usage">
          {storage.used.toFixed(1)} MB used
        </span>
      </div>
      
      <div className="storage-bar">
        <div 
          className="storage-fill"
          style={{ width: `${storage.percentage}%` }}
        />
      </div>
      
      <div className="storage-details">
        <span className="storage-available">
          {storage.available.toFixed(1)} MB available
        </span>
        
        {storage.percentage > 80 && (
          <button 
            className="btn btn-sm btn-secondary"
            onClick={() => {/* Clear cache */}}
          >
            Clear Cache
          </button>
        )}
      </div>
    </div>
  );
};
```

### Offline Content Management
```tsx
const OfflineContentManager: React.FC = () => {
  const [offlineContent, setOfflineContent] = useState<OfflineContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOfflineContent();
  }, []);

  const loadOfflineContent = async () => {
    setIsLoading(true);
    try {
      // Get cached content information
      const content = await getCachedContentList();
      setOfflineContent(content);
    } catch (error) {
      console.error('Failed to load offline content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveContent = async (contentId: string) => {
    try {
      await removeOfflineContent(contentId);
      setOfflineContent(prev => prev.filter(item => item.id !== contentId));
    } catch (error) {
      console.error('Failed to remove content:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="offline-content-loading">
        <LoadingSpinner />
        <span>Loading offline content...</span>
      </div>
    );
  }

  return (
    <div className="offline-content-manager">
      <div className="content-header">
        <h3>Offline Content</h3>
        <p>Manage what's stored on your device for offline use</p>
      </div>
      
      <div className="content-categories">
        {Object.entries(groupBy(offlineContent, 'category')).map(([category, items]) => (
          <div key={category} className="content-category">
            <div className="category-header">
              <h4>{category}</h4>
              <span className="category-count">
                {items.length} item{items.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="category-items">
              {items.map((item) => (
                <div key={item.id} className="content-item">
                  <div className="item-info">
                    <div className="item-title">{item.title}</div>
                    <div className="item-meta">
                      <span className="item-size">{formatBytes(item.size)}</span>
                      <span className="item-date">
                        Cached {formatTimeAgo(item.cachedAt)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="item-actions">
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleRemoveContent(item.id)}
                      aria-label={`Remove ${item.title} from offline storage`}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {offlineContent.length === 0 && (
        <div className="no-content">
          <div className="no-content-icon">
            <CloudOffIcon />
          </div>
          <h4>No Offline Content</h4>
          <p>Content you download for offline use will appear here</p>
        </div>
      )}
    </div>
  );
};
```

## Native Integration Patterns

### Share API Integration
```tsx
const ShareHuntLog: React.FC<{ huntLog: HuntLog }> = ({ huntLog }) => {
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare('share' in navigator);
  }, []);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${huntLog.species} Hunt - ${formatDate(huntLog.date)}`,
          text: `Check out my ${huntLog.species} hunt from ${huntLog.location}!`,
          url: `${window.location.origin}/hunts/${huntLog.id}`,
        });
      } catch (error) {
        // User cancelled share or error occurred
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback to copy link
      copyToClipboard(`${window.location.origin}/hunts/${huntLog.id}`);
    }
  };

  return (
    <button 
      className="btn btn-secondary"
      onClick={handleShare}
    >
      <ShareIcon />
      {canShare ? 'Share Hunt' : 'Copy Link'}
    </button>
  );
};
```

### Fullscreen Toggle
```tsx
const FullscreenToggle: React.FC = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen toggle failed:', error);
    }
  };

  return (
    <button 
      className="btn btn-secondary fullscreen-toggle"
      onClick={toggleFullscreen}
      aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
    >
      {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
    </button>
  );
};
```

## Performance Optimization Patterns

### Lazy Loading with Intersection Observer
```tsx
const LazyHuntCard: React.FC<{ huntLog: HuntLog }> = ({ huntLog }) => {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '50px' }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={cardRef} className="hunt-card">
      {isVisible ? (
        <HuntCardContent huntLog={huntLog} />
      ) : (
        <div className="hunt-card-skeleton">
          <div className="skeleton-header" />
          <div className="skeleton-content" />
          <div className="skeleton-actions" />
        </div>
      )}
    </div>
  );
};
```

### Preloading Critical Resources
```tsx
const usePreloadCriticalData = () => {
  useEffect(() => {
    const preloadData = async () => {
      // Preload critical hunting data
      const criticalData = [
        '/api/weather/current',
        '/api/user/profile',
        '/api/hunt-logs/recent'
      ];

      criticalData.forEach(url => {
        fetch(url, { method: 'GET' });
      });
    };

    // Preload on app start if online
    if (navigator.onLine) {
      preloadData();
    }
  }, []);
};
```

## Testing PWA Features

### PWA Feature Testing Suite
```typescript
describe('PWA Features', () => {
  describe('Installation', () => {
    it('shows install prompt when criteria are met', async () => {
      // Mock beforeinstallprompt event
      const mockEvent = new Event('beforeinstallprompt');
      mockEvent.preventDefault = jest.fn();
      
      render(<App />);
      fireEvent(window, mockEvent);
      
      await waitFor(() => {
        expect(screen.getByText('Install GoHunta App')).toBeInTheDocument();
      });
    });

    it('handles install prompt acceptance', async () => {
      const mockPrompt = jest.fn().mockResolvedValue({ outcome: 'accepted' });
      const mockEvent = { prompt: mockPrompt, preventDefault: jest.fn() };
      
      render(<PWAInstallPrompt />);
      
      // Simulate beforeinstallprompt
      fireEvent(window, new CustomEvent('beforeinstallprompt', { detail: mockEvent }));
      
      const installButton = screen.getByText('Install App');
      await userEvent.click(installButton);
      
      expect(mockPrompt).toHaveBeenCalled();
    });
  });

  describe('Offline Functionality', () => {
    it('shows offline indicator when network is unavailable', () => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      
      render(<App />);
      
      expect(screen.getByText(/offline mode/i)).toBeInTheDocument();
    });

    it('queues actions for background sync when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      
      render(<HuntLogForm />);
      
      // Fill and submit form
      await userEvent.type(screen.getByLabelText('Location'), 'North Field');
      await userEvent.click(screen.getByText('Save Hunt Log'));
      
      // Should show queued for sync
      expect(screen.getByText(/will sync when online/i)).toBeInTheDocument();
    });
  });

  describe('Cache Management', () => {
    it('displays cache usage information', async () => {
      // Mock storage API
      Object.defineProperty(navigator, 'storage', {
        value: {
          estimate: jest.fn().mockResolvedValue({
            usage: 50 * 1024 * 1024, // 50MB
            quota: 100 * 1024 * 1024  // 100MB
          })
        }
      });

      render(<StorageIndicator />);
      
      await waitFor(() => {
        expect(screen.getByText('50.0 MB used')).toBeInTheDocument();
      });
    });
  });
});
```

## Related Documentation

- [Component Library](../components/README.md)
- [Responsive Design](./responsive-design-specs.md)
- [Accessibility Guidelines](../accessibility/README.md)
- [Performance Specifications](../../performance/README.md)