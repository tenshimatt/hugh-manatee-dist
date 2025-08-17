# Hunting-Specific UI Patterns

## Overview

GoHunta.com employs specialized UI patterns designed specifically for hunting contexts, workflows, and terminology. These patterns reflect the unique needs of hunters, the hunting culture, and the practical requirements of field operation with working dogs.

## Hunting Context Design Principles

### Authentic Hunting Culture Integration
- **Respectful Terminology**: Use authentic hunting language without glorifying violence
- **Educational Focus**: Emphasize conservation, ethics, and skill development
- **Community Values**: Reflect respect for wildlife, land stewardship, and tradition
- **Safety First**: Prioritize hunter safety and responsible hunting practices

### Field-Operational Design
- **Quick Decision Making**: Support rapid assessment and logging
- **Environmental Awareness**: Design for outdoor lighting and weather conditions
- **Equipment Integration**: Work seamlessly with hunting gear and GPS devices
- **Emergency Preparedness**: Provide immediate access to safety features

## Hunting-Specific Icon System

### Core Hunting Icons
```svg
<!-- Hunt Success Icon -->
<svg viewBox="0 0 24 24" className="hunt-success-icon">
  <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="2"/>
  <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"/>
</svg>

<!-- Dog Tracking Icon -->
<svg viewBox="0 0 24 24" className="dog-tracking-icon">
  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
  <circle cx="12" cy="9" r="2.5" fill="white"/>
  <path d="M8 15l2 2 4-4 2 2" stroke="white" strokeWidth="1.5" fill="none"/>
</svg>

<!-- Weather Conditions Icons -->
<svg viewBox="0 0 24 24" className="weather-clear-icon">
  <circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" strokeWidth="2"/>
  <line x1="12" y1="1" x2="12" y2="3" strokeWidth="2"/>
  <line x1="12" y1="21" x2="12" y2="23" strokeWidth="2"/>
  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" strokeWidth="2"/>
  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" strokeWidth="2"/>
</svg>

<!-- GPS Signal Strength -->
<svg viewBox="0 0 24 24" className="gps-signal-icon">
  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  <circle cx="12" cy="12" r="3" fill="white"/>
</svg>

<!-- Emergency/Safety Icon -->
<svg viewBox="0 0 24 24" className="emergency-icon">
  <path d="M12 2l2.5 7.5L22 10l-5.5 4.5L18 22l-6-4-6 4 1.5-7.5L2 10l7.5-.5L12 2z" fill="#ff0000"/>
  <text x="12" y="16" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">!</text>
</svg>

<!-- Species/Game Icons -->
<svg viewBox="0 0 24 24" className="waterfowl-icon">
  <path d="M8 4c-2 0-4 2-4 4 0 1 0.5 2 1.5 2.5L8 12l2.5-1.5C11.5 10 12 9 12 8c0-2-2-4-4-4z"/>
  <path d="M12 8c0 1-0.5 2-1.5 2.5L8 12v8c0 1 1 2 2 2s2-1 2-2v-8l-2.5-1.5z"/>
</svg>

<!-- Dog Breed/Type Icons -->
<svg viewBox="0 0 24 24" className="pointer-icon">
  <ellipse cx="8" cy="6" rx="2" ry="1.5"/>
  <path d="M6 7c-1 2-1 4 0 6l4 2c2 0 4-1 4-3v-2c0-1-0.5-2-1.5-2.5L8 6"/>
  <path d="M12 10l4 2c1 0 2-1 2-2s-1-2-2-2l-4 2"/>
</svg>
```

### Icon Usage Guidelines
```css
.hunt-icon {
  width: 24px;
  height: 24px;
  display: inline-block;
  vertical-align: middle;
  
  /* Color variations for different contexts */
  &.success { color: var(--success); }
  &.warning { color: var(--warning); }
  &.error { color: var(--error); }
  &.neutral { color: var(--neutral-600); }
  
  /* Size variations */
  &.sm { width: 16px; height: 16px; }
  &.lg { width: 32px; height: 32px; }
  &.xl { width: 48px; height: 48px; }
  
  /* High contrast mode adjustments */
  @media (prefers-contrast: high) {
    stroke-width: 3;
    filter: contrast(1.5);
  }
}
```

## Hunt Status Indicators

### Hunt Outcome Visual Language
```tsx
const HuntOutcomeIndicator: React.FC<{
  outcome: 'success' | 'no-game' | 'in-progress' | 'cancelled';
  species?: string;
  count?: number;
}> = ({ outcome, species, count }) => {
  const getOutcomeConfig = () => {
    switch (outcome) {
      case 'success':
        return {
          icon: <TargetIcon className="text-success" />,
          label: 'Successful Hunt',
          color: 'success',
          bgColor: 'bg-success-light'
        };
      case 'no-game':
        return {
          icon: <XCircleIcon className="text-neutral-500" />,
          label: 'No Game Taken',
          color: 'neutral',
          bgColor: 'bg-neutral-100'
        };
      case 'in-progress':
        return {
          icon: <ClockIcon className="text-info animate-pulse" />,
          label: 'Hunt in Progress',
          color: 'info',
          bgColor: 'bg-info-light'
        };
      case 'cancelled':
        return {
          icon: <BanIcon className="text-warning" />,
          label: 'Hunt Cancelled',
          color: 'warning',
          bgColor: 'bg-warning-light'
        };
    }
  };

  const config = getOutcomeConfig();

  return (
    <div className={`hunt-outcome-indicator ${config.bgColor}`}>
      <div className="outcome-icon">
        {config.icon}
      </div>
      
      <div className="outcome-details">
        <div className={`outcome-label text-${config.color}`}>
          {config.label}
        </div>
        
        {outcome === 'success' && (
          <div className="outcome-meta">
            {species && <span className="species">{species}</span>}
            {count && count > 1 && <span className="count">×{count}</span>}
          </div>
        )}
      </div>
    </div>
  );
};
```

### GPS Accuracy Visual Feedback
```tsx
const GPSAccuracyIndicator: React.FC<{
  accuracy: number | null;
  isActive: boolean;
}> = ({ accuracy, isActive }) => {
  const getAccuracyLevel = () => {
    if (!accuracy) return { level: 0, label: 'No Signal', color: 'error' };
    if (accuracy <= 3) return { level: 4, label: 'Excellent', color: 'success' };
    if (accuracy <= 8) return { level: 3, label: 'Good', color: 'success' };
    if (accuracy <= 15) return { level: 2, label: 'Fair', color: 'warning' };
    return { level: 1, label: 'Poor', color: 'error' };
  };

  const { level, label, color } = getAccuracyLevel();

  return (
    <div className={`gps-accuracy-indicator ${isActive ? 'active' : 'inactive'}`}>
      <div className="signal-bars">
        {[1, 2, 3, 4].map((bar) => (
          <div 
            key={bar}
            className={`signal-bar ${bar <= level ? `active-${color}` : 'inactive'}`}
            style={{ height: `${bar * 25}%` }}
          />
        ))}
      </div>
      
      <div className="accuracy-details">
        <div className={`accuracy-label text-${color}`}>{label}</div>
        {accuracy && (
          <div className="accuracy-value">±{accuracy}m</div>
        )}
      </div>
      
      {isActive && <div className="gps-pulse" />}
    </div>
  );
};
```

### Weather Condition Patterns
```tsx
const WeatherDisplay: React.FC<{
  temperature: number;
  condition: string;
  windSpeed: number;
  windDirection: string;
  barometric: number;
  huntingConditions: 'excellent' | 'good' | 'fair' | 'poor';
}> = ({ temperature, condition, windSpeed, windDirection, barometric, huntingConditions }) => {
  const getWeatherIcon = (condition: string) => {
    const iconMap = {
      'clear': <SunIcon />,
      'partly-cloudy': <CloudSunIcon />,
      'overcast': <CloudIcon />,
      'rain': <RainIcon />,
      'snow': <SnowIcon />,
      'fog': <FogIcon />
    };
    return iconMap[condition] || <QuestionIcon />;
  };

  const getHuntingConditionColor = (condition: string) => {
    const colorMap = {
      'excellent': 'success',
      'good': 'info',
      'fair': 'warning',
      'poor': 'error'
    };
    return colorMap[condition] || 'neutral';
  };

  return (
    <div className="weather-display">
      <div className="weather-header">
        <div className="weather-icon">
          {getWeatherIcon(condition)}
        </div>
        <div className="weather-temp">
          {temperature}°F
        </div>
      </div>
      
      <div className="weather-details">
        <div className="weather-item">
          <WindIcon />
          <span>{windSpeed} mph {windDirection}</span>
        </div>
        
        <div className="weather-item">
          <BarometerIcon />
          <span>{barometric}" Hg</span>
        </div>
        
        <div className={`hunting-conditions text-${getHuntingConditionColor(huntingConditions)}`}>
          <div className="conditions-label">Hunting Conditions</div>
          <div className="conditions-value">{huntingConditions.toUpperCase()}</div>
        </div>
      </div>
    </div>
  );
};
```

## Dog Performance Visualization

### Training Progress Indicators
```tsx
const DogTrainingProgress: React.FC<{
  dog: Dog;
  skills: TrainingSkill[];
  recentSessions: TrainingSession[];
}> = ({ dog, skills, recentSessions }) => {
  return (
    <div className="dog-training-progress">
      <div className="progress-header">
        <div className="dog-info">
          <div className="dog-avatar">
            {dog.photo ? (
              <img src={dog.photo} alt={dog.name} />
            ) : (
              <DogIcon />
            )}
          </div>
          <div className="dog-details">
            <h3 className="dog-name">{dog.name}</h3>
            <div className="dog-meta">
              <span className="breed">{dog.breed}</span>
              <span className="age">{calculateAge(dog.birthDate)}</span>
            </div>
          </div>
        </div>
        
        <div className="overall-level">
          <div className="level-indicator">
            {getTrainingLevelIcon(dog.overallLevel)}
          </div>
          <div className="level-text">
            {dog.overallLevel.toUpperCase()}
          </div>
        </div>
      </div>
      
      <div className="skills-breakdown">
        {skills.map((skill) => (
          <div key={skill.id} className="skill-item">
            <div className="skill-header">
              <span className="skill-name">{skill.name}</span>
              <span className="skill-score">{skill.currentScore}/10</span>
            </div>
            
            <div className="skill-progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${(skill.currentScore / 10) * 100}%` }}
              />
              <div className="progress-markers">
                {[2, 4, 6, 8].map((marker) => (
                  <div 
                    key={marker}
                    className="progress-marker"
                    style={{ left: `${(marker / 10) * 100}%` }}
                  />
                ))}
              </div>
            </div>
            
            <div className="skill-trend">
              {skill.trend === 'improving' && (
                <div className="trend improving">
                  <TrendUpIcon />
                  <span>Improving</span>
                </div>
              )}
              {skill.trend === 'stable' && (
                <div className="trend stable">
                  <TrendFlatIcon />
                  <span>Stable</span>
                </div>
              )}
              {skill.trend === 'declining' && (
                <div className="trend declining">
                  <TrendDownIcon />
                  <span>Needs Work</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="recent-activity">
        <h4>Recent Training</h4>
        <div className="session-list">
          {recentSessions.map((session) => (
            <div key={session.id} className="session-item">
              <div className="session-date">
                {formatDate(session.date)}
              </div>
              <div className="session-type">
                {session.type}
              </div>
              <div className="session-rating">
                <StarRating rating={session.rating} readonly />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

### Hunt Performance Metrics
```tsx
const HuntPerformanceChart: React.FC<{
  huntLogs: HuntLog[];
  timeframe: 'week' | 'month' | 'season' | 'year';
}> = ({ huntLogs, timeframe }) => {
  const metrics = calculateHuntingMetrics(huntLogs, timeframe);

  return (
    <div className="hunt-performance-chart">
      <div className="metrics-overview">
        <div className="metric-card success-rate">
          <div className="metric-icon">
            <TargetIcon />
          </div>
          <div className="metric-content">
            <div className="metric-value">{metrics.successRate}%</div>
            <div className="metric-label">Success Rate</div>
          </div>
          <div className={`metric-trend ${metrics.successTrend}`}>
            {metrics.successTrend === 'up' ? <TrendUpIcon /> : <TrendDownIcon />}
            {Math.abs(metrics.successChange)}%
          </div>
        </div>
        
        <div className="metric-card total-hunts">
          <div className="metric-icon">
            <CalendarIcon />
          </div>
          <div className="metric-content">
            <div className="metric-value">{metrics.totalHunts}</div>
            <div className="metric-label">Total Hunts</div>
          </div>
        </div>
        
        <div className="metric-card avg-duration">
          <div className="metric-icon">
            <ClockIcon />
          </div>
          <div className="metric-content">
            <div className="metric-value">{formatDuration(metrics.avgDuration)}</div>
            <div className="metric-label">Avg Duration</div>
          </div>
        </div>
        
        <div className="metric-card favorite-location">
          <div className="metric-icon">
            <MapPinIcon />
          </div>
          <div className="metric-content">
            <div className="metric-value">{metrics.favoriteLocation}</div>
            <div className="metric-label">Top Location</div>
          </div>
        </div>
      </div>
      
      <div className="performance-timeline">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={metrics.timelineData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(date) => formatDateForChart(date, timeframe)}
            />
            <YAxis domain={[0, 100]} />
            <Tooltip 
              formatter={(value) => [`${value}%`, 'Success Rate']}
              labelFormatter={(date) => formatDate(date)}
            />
            <Line 
              type="monotone" 
              dataKey="successRate" 
              stroke="var(--success)" 
              strokeWidth={3}
              dot={{ fill: 'var(--success)', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: 'var(--success)' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
```

## Species and Location Patterns

### Species Classification Display
```tsx
const SpeciesCard: React.FC<{
  species: Species;
  huntCount: number;
  lastHuntDate: Date;
  personalBest?: HuntRecord;
}> = ({ species, huntCount, lastHuntDate, personalBest }) => {
  return (
    <div className="species-card">
      <div className="species-header">
        <div className="species-image">
          {species.image ? (
            <img src={species.image} alt={species.name} />
          ) : (
            <div className="species-placeholder">
              {getSpeciesIcon(species.type)}
            </div>
          )}
        </div>
        
        <div className="species-info">
          <h3 className="species-name">{species.name}</h3>
          <div className="species-meta">
            <span className="scientific-name">{species.scientificName}</span>
            <span className={`conservation-status ${species.conservationStatus.toLowerCase()}`}>
              {species.conservationStatus}
            </span>
          </div>
        </div>
      </div>
      
      <div className="species-stats">
        <div className="stat-item">
          <div className="stat-icon">
            <CalendarIcon />
          </div>
          <div className="stat-content">
            <div className="stat-value">{huntCount}</div>
            <div className="stat-label">Hunts</div>
          </div>
        </div>
        
        <div className="stat-item">
          <div className="stat-icon">
            <ClockIcon />
          </div>
          <div className="stat-content">
            <div className="stat-value">{formatTimeAgo(lastHuntDate)}</div>
            <div className="stat-label">Last Hunt</div>
          </div>
        </div>
        
        {personalBest && (
          <div className="stat-item">
            <div className="stat-icon">
              <TrophyIcon />
            </div>
            <div className="stat-content">
              <div className="stat-value">{personalBest.weight}lbs</div>
              <div className="stat-label">Personal Best</div>
            </div>
          </div>
        )}
      </div>
      
      <div className="species-seasons">
        <h4>Hunting Seasons</h4>
        <div className="season-timeline">
          {species.seasons.map((season) => (
            <div 
              key={season.id}
              className={`season-period ${season.isActive ? 'active' : 'inactive'}`}
              style={{
                left: `${(season.startMonth / 12) * 100}%`,
                width: `${(season.duration / 12) * 100}%`
              }}
            >
              <div className="season-label">{season.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

### Hunting Location Management
```tsx
const LocationCard: React.FC<{
  location: HuntingLocation;
  recentActivity: HuntLog[];
  permissions: LocationPermissions;
}> = ({ location, recentActivity, permissions }) => {
  return (
    <div className="location-card">
      <div className="location-header">
        <div className="location-map-thumbnail">
          <StaticMap 
            coordinates={location.coordinates}
            zoom={12}
            markers={[location.coordinates]}
            size={120}
          />
        </div>
        
        <div className="location-info">
          <h3 className="location-name">{location.name}</h3>
          <div className="location-meta">
            <span className="location-type">{location.type}</span>
            <span className="location-access">{location.access}</span>
          </div>
          <div className="location-coordinates">
            {formatCoordinates(location.coordinates)}
          </div>
        </div>
        
        <div className="location-status">
          {permissions.isActive && (
            <div className="permission-badge active">
              <CheckIcon />
              <span>Active Permit</span>
            </div>
          )}
          {permissions.expiresAt && (
            <div className="permission-expiry">
              Expires {formatDate(permissions.expiresAt)}
            </div>
          )}
        </div>
      </div>
      
      <div className="location-features">
        {location.features.map((feature) => (
          <div key={feature} className="feature-tag">
            {getFeatureIcon(feature)}
            <span>{feature}</span>
          </div>
        ))}
      </div>
      
      <div className="recent-activity">
        <h4>Recent Activity</h4>
        <div className="activity-timeline">
          {recentActivity.map((hunt) => (
            <div key={hunt.id} className="activity-item">
              <div className="activity-date">
                {formatRelativeDate(hunt.date)}
              </div>
              <div className="activity-outcome">
                <HuntOutcomeIndicator 
                  outcome={hunt.outcome}
                  species={hunt.species}
                />
              </div>
            </div>
          ))}
        </div>
        
        {recentActivity.length === 0 && (
          <div className="no-activity">
            <MapIcon />
            <span>No recent hunts at this location</span>
          </div>
        )}
      </div>
      
      <div className="location-actions">
        <button 
          className="btn btn-primary"
          onClick={() => navigateToLocation(location)}
        >
          <DirectionsIcon />
          Get Directions
        </button>
        
        <button 
          className="btn btn-secondary"
          onClick={() => planHuntAtLocation(location)}
        >
          <CalendarPlusIcon />
          Plan Hunt
        </button>
      </div>
    </div>
  );
};
```

## Safety and Emergency Patterns

### Emergency Contact Interface
```tsx
const EmergencyInterface: React.FC<{
  isActive: boolean;
  location: GPSLocation;
  emergencyContacts: EmergencyContact[];
}> = ({ isActive, location, emergencyContacts }) => {
  return (
    <div className={`emergency-interface ${isActive ? 'active' : 'standby'}`}>
      {isActive && (
        <div className="emergency-active">
          <div className="emergency-header">
            <div className="emergency-icon">
              <AlertTriangleIcon />
            </div>
            <div className="emergency-title">
              <h2>Emergency Mode Active</h2>
              <p>Help is on the way</p>
            </div>
          </div>
          
          <div className="location-sharing">
            <div className="location-status">
              <GPSIcon className="text-success" />
              <span>Sharing location: {formatCoordinates(location)}</span>
            </div>
            
            <div className="share-actions">
              <button className="btn btn-emergency">
                <PhoneIcon />
                Call 911
              </button>
              
              <button className="btn btn-emergency-secondary">
                <MessageIcon />
                Send Location SMS
              </button>
            </div>
          </div>
          
          <div className="emergency-contacts">
            <h3>Emergency Contacts Notified</h3>
            <div className="contact-list">
              {emergencyContacts.map((contact) => (
                <div key={contact.id} className="contact-item">
                  <div className="contact-info">
                    <span className="contact-name">{contact.name}</span>
                    <span className="contact-relation">{contact.relation}</span>
                  </div>
                  
                  <div className="contact-status">
                    {contact.notified ? (
                      <CheckIcon className="text-success" />
                    ) : (
                      <ClockIcon className="text-warning" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {!isActive && (
        <button 
          className="emergency-trigger"
          aria-label="Activate emergency mode"
        >
          <EmergencyIcon />
          <span>Emergency</span>
        </button>
      )}
    </div>
  );
};
```

### Safety Checklist Pattern
```tsx
const SafetyChecklist: React.FC<{
  items: SafetyChecklistItem[];
  onItemCheck: (itemId: string, checked: boolean) => void;
  onComplete: () => void;
}> = ({ items, onItemCheck, onComplete }) => {
  const completedCount = items.filter(item => item.checked).length;
  const completionPercent = (completedCount / items.length) * 100;

  return (
    <div className="safety-checklist">
      <div className="checklist-header">
        <h3>Pre-Hunt Safety Check</h3>
        <div className="completion-indicator">
          <div className="completion-ring">
            <div 
              className="completion-fill"
              style={{ 
                transform: `rotate(${completionPercent * 3.6}deg)` 
              }}
            />
            <div className="completion-text">
              {completedCount}/{items.length}
            </div>
          </div>
        </div>
      </div>
      
      <div className="checklist-items">
        {items.map((item) => (
          <div 
            key={item.id} 
            className={`checklist-item ${item.checked ? 'checked' : ''} ${item.priority}`}
          >
            <button
              className="item-checkbox"
              onClick={() => onItemCheck(item.id, !item.checked)}
              aria-label={`${item.checked ? 'Uncheck' : 'Check'} ${item.title}`}
            >
              {item.checked ? <CheckIcon /> : <div className="checkbox-empty" />}
            </button>
            
            <div className="item-content">
              <div className="item-title">{item.title}</div>
              {item.description && (
                <div className="item-description">{item.description}</div>
              )}
            </div>
            
            <div className="item-priority">
              {item.priority === 'critical' && <AlertIcon className="text-error" />}
              {item.priority === 'important' && <InfoIcon className="text-warning" />}
            </div>
          </div>
        ))}
      </div>
      
      <div className="checklist-actions">
        <button 
          className={`btn ${completedCount === items.length ? 'btn-success' : 'btn-secondary'}`}
          disabled={completedCount < items.filter(i => i.priority === 'critical').length}
          onClick={onComplete}
        >
          {completedCount === items.length ? (
            <>
              <CheckCircleIcon />
              Ready to Hunt
            </>
          ) : (
            <>
              <ClockIcon />
              Complete Safety Check
            </>
          )}
        </button>
      </div>
    </div>
  );
};
```

## Community and Social Patterns

### Hunt Story Sharing
```tsx
const HuntStoryCard: React.FC<{
  story: HuntStory;
  currentUser: User;
  onLike: (storyId: string) => void;
  onComment: (storyId: string, comment: string) => void;
}> = ({ story, currentUser, onLike, onComment }) => {
  return (
    <article className="hunt-story-card">
      <header className="story-header">
        <div className="author-info">
          <div className="author-avatar">
            {story.author.avatar ? (
              <img src={story.author.avatar} alt={story.author.name} />
            ) : (
              <UserIcon />
            )}
          </div>
          
          <div className="author-details">
            <h3 className="author-name">{story.author.name}</h3>
            <div className="author-meta">
              <span className="location">{story.location.name}</span>
              <span className="separator">•</span>
              <time dateTime={story.date.toISOString()}>
                {formatRelativeDate(story.date)}
              </time>
            </div>
          </div>
        </div>
        
        <div className="story-outcome">
          <HuntOutcomeIndicator 
            outcome={story.outcome}
            species={story.species}
            count={story.gameCount}
          />
        </div>
      </header>
      
      <div className="story-content">
        <div className="story-text">
          <p>{story.description}</p>
        </div>
        
        {story.photos && story.photos.length > 0 && (
          <div className="story-photos">
            <PhotoGallery 
              photos={story.photos}
              altText={`${story.species} hunt photos from ${story.location.name}`}
            />
          </div>
        )}
        
        {story.weatherConditions && (
          <div className="story-conditions">
            <WeatherIcon />
            <span>
              {story.weatherConditions.temperature}°F, {story.weatherConditions.description}
            </span>
          </div>
        )}
      </div>
      
      <footer className="story-footer">
        <div className="story-stats">
          <button 
            className={`stat-button ${story.userLiked ? 'liked' : ''}`}
            onClick={() => onLike(story.id)}
            aria-label={story.userLiked ? 'Unlike this story' : 'Like this story'}
          >
            <HeartIcon className={story.userLiked ? 'filled' : 'outline'} />
            <span>{story.likeCount}</span>
          </button>
          
          <button 
            className="stat-button"
            onClick={() => scrollToComments(story.id)}
            aria-label="View comments"
          >
            <CommentIcon />
            <span>{story.commentCount}</span>
          </button>
          
          <button 
            className="stat-button"
            onClick={() => shareStory(story)}
            aria-label="Share this story"
          >
            <ShareIcon />
          </button>
        </div>
        
        <div className="story-tags">
          {story.tags.map((tag) => (
            <span key={tag} className="story-tag">
              #{tag}
            </span>
          ))}
        </div>
      </footer>
    </article>
  );
};
```

## Related Documentation

- [Component Library](../components/README.md)
- [Design System](../system/README.md)
- [User Journey Maps](./user-journey-maps.md)
- [Icon Library](../assets/icons/README.md)