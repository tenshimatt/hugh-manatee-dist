# Rawgle Platform Frontend Integration Guide

## API Base Configuration
```javascript
const API_BASE = 'https://rawgle-api.findrawdogfood.workers.dev';
```

## Authentication System

### Registration Endpoint
```javascript
POST /api/auth/register
Headers: { 'Content-Type': 'application/json' }
Body: {
  email: string,
  password: string, 
  name: string
}
Response: {
  userId: string,
  pawsBalance: number, // 50 welcome bonus
  message: string
}
```

### Login Endpoint  
```javascript
POST /api/auth/login
Headers: { 'Content-Type': 'application/json' }
Body: {
  email: string,
  password: string
}
Response: {
  sessionToken: string,
  userId: string,
  message: string
}
```

### Authentication Headers
All authenticated endpoints require:
```javascript
Headers: { 'Authorization': `Bearer ${sessionToken}` }
```

## Pet Management System

### Create Pet Profile
```javascript
POST /api/pets
Headers: { 
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${authToken}`
}
Body: {
  name: string,
  breed: string,
  age: string,
  weight: string,
  gender?: string,
  activityLevel?: string,
  medicalConditions?: string,
  allergies?: string,
  dietaryRequirements?: string
}
Response: {
  pet: {
    id: string,
    name: string,
    breed: string,
    profileCompletion: number // percentage
  }
}
```

### Get Pet Details
```javascript
GET /api/pets/{petId}
Headers: { 'Authorization': `Bearer ${authToken}` }
Response: {
  pet: {
    id: string,
    name: string,
    breed: string,
    age: string,
    weight: string,
    // ... other pet data
  }
}
```

## PAWS Cryptocurrency System

### Check PAWS Balance
```javascript
GET /api/paws/balance?userId={userId}
Headers: { 'Authorization': `Bearer ${authToken}` }
Response: {
  balance: number,
  userId: string
}
```

### PAWS Earning Events
- **Welcome Bonus**: 50 PAWS on registration
- **Profile Completion**: Variable PAWS based on completion percentage
- **Daily Feeding**: PAWS per feeding log entry
- **Consistency Bonuses**: Weekly rewards for consistent feeding
- **Premium Multipliers**: Enhanced rewards for subscribers

## Feeding Log System

### Log Daily Feeding
```javascript
POST /api/feeding
Headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${authToken}`
}
Body: {
  petId: string,
  logDate: string, // YYYY-MM-DD format
  mealTime: string, // 'breakfast', 'lunch', 'dinner'
  foodType: string, // 'dry_food', 'wet_food', 'treats'
  quantity: string,
  notes?: string
}
Response: {
  log: {
    id: string,
    food_type: string,
    feeding_time: string,
    quantity: string
  },
  dailyReward: number, // PAWS earned
  streakData: {
    currentStreak: number,
    longestStreak: number
  }
}
```

### Get Feeding Logs
```javascript
GET /api/feeding/{petId}
Headers: { 'Authorization': `Bearer ${authToken}` }
Response: {
  logs: [{
    id: string,
    log_date: string,
    meal_time: string,
    food_type: string,
    quantity: string,
    notes: string,
    paws_earned: number
  }]
}
```

### Feeding Overview
```javascript
GET /api/feeding/overview?timeframe=7d
Headers: { 'Authorization': `Bearer ${authToken}` }
Response: {
  overview: {
    totalLogs: number
  },
  pets: [...]
}
```

## AI Medical Consultation

### Submit Medical Consultation
```javascript
POST /api/ai-medical
Headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${authToken}`
}
Body: {
  petId: string,
  symptoms: string // Natural language description
}
Response: {
  consultationId: string,
  emergency: boolean, // true for urgent cases
  assessment: string, // AI analysis
  confidence: number, // 0-1 confidence score
  recommendations: string[] // Array of recommendations
}
```

### Get Consultation History
```javascript
GET /api/ai-medical/history/{petId}
Headers: { 'Authorization': `Bearer ${authToken}` }
Response: {
  consultations: [{
    id: string,
    symptoms: string,
    assessment: string,
    emergency: boolean,
    created_at: string
  }]
}
```

## NFT System

### Check NFT Minting Cost
```javascript
GET /api/nft/mint-cost
Headers: { 'Authorization': `Bearer ${authToken}` }
Response: {
  cost: number, // PAWS required
  premiumDiscount?: number, // If premium subscriber
  subscriberRate?: number
}
```

### Mint NFT for Pet
```javascript
POST /api/nft/mint
Headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${authToken}`
}
Body: {
  petId: string,
  nftName: string,
  description: string,
  attributes: {
    breed: string,
    age: string,
    weight: string
  }
}
Response: {
  nft: {
    tokenId: string,
    name: string,
    description: string
  }
}
```

### Get User's NFT Collection
```javascript
GET /api/nft/collection/{userId}
Headers: { 'Authorization': `Bearer ${authToken}` }
Response: {
  nfts: [{
    tokenId: string,
    name: string,
    description: string,
    attributes: object
  }]
}
```

## Subscription System

### Get Available Subscription Tiers
```javascript
GET /api/subscription/tiers
Headers: { 'Authorization': `Bearer ${authToken}` }
Response: {
  tiers: [{
    name: string,
    cost: number,
    benefits: string[]
  }]
}
```

### Upgrade Subscription
```javascript
POST /api/subscription/upgrade
Headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${authToken}`
}
Body: {
  tier: string, // 'premium'
  paymentMethod: string, // 'paws'
  duration: string // 'monthly', 'yearly'
}
Response: {
  subscription: {
    tier: string,
    expiresAt: string
  }
}
```

### Check Subscription Status
```javascript
GET /api/subscription/status
Headers: { 'Authorization': `Bearer ${authToken}` }
Response: {
  tier: string, // 'free' or 'premium'
  isPremium: boolean,
  expiresAt?: string
}
```

### Get Premium Benefits
```javascript
GET /api/subscription/benefits
Headers: { 'Authorization': `Bearer ${authToken}` }
Response: {
  benefits: {
    pawsMultiplier: number,
    nftDiscount: number,
    premiumAnalytics: boolean,
    prioritySupport: boolean
  }
}
```

## Analytics Dashboard

### User Dashboard Analytics
```javascript
GET /api/analytics/dashboard
Headers: { 'Authorization': `Bearer ${authToken}` }
Response: {
  totalPets: number,
  totalFeedings: number,
  pawsBalance: number,
  weeklyActivity: number,
  // Additional metrics...
}
```

### Pet-Specific Analytics
```javascript
GET /api/analytics/pet/{petId}?timeframe=30d
Headers: { 'Authorization': `Bearer ${authToken}` }
Response: {
  feedingFrequency: number,
  consistencyScore: number,
  healthTrends: object,
  // Pet-specific metrics...
}
```

### PAWS Analytics
```javascript
GET /api/analytics/paws?timeframe=30d
Headers: { 'Authorization': `Bearer ${authToken}` }
Response: {
  totalEarned: number,
  transactions: [{
    amount: number,
    type: string,
    date: string
  }]
}
```

### Premium Analytics (Subscribers Only)
```javascript
GET /api/analytics/premium-insights
Headers: { 'Authorization': `Bearer ${authToken}` }
Response: {
  advancedMetrics: object,
  predictiveAnalytics: object,
  customReports: object
}
```

## User Profile Management

### Update User Profile
```javascript
PUT /api/user/profile
Headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${authToken}`
}
Body: {
  phone?: string,
  address?: string,
  emergencyContact?: string,
  emergencyPhone?: string,
  preferences?: {
    notifications: boolean,
    newsletter: boolean
  }
}
Response: {
  profileCompletion: number, // Updated completion percentage
  pawsEarned?: number // If completion bonus awarded
}
```

### Get User Profile
```javascript
GET /api/user/profile
Headers: { 'Authorization': `Bearer ${authToken}` }
Response: {
  userId: string,
  email: string,
  name: string,
  phone?: string,
  address?: string,
  profileCompletion: number,
  // Additional profile data...
}
```

## Feeding Streak & Consistency

### Get Feeding Streak
```javascript
GET /api/feeding/streak/{petId}
Headers: { 'Authorization': `Bearer ${authToken}` }
Response: {
  currentStreak: number,
  longestStreak: number,
  lastFeedingDate: string
}
```

### Weekly Feeding Summary
```javascript
GET /api/feeding/weekly-summary?petId={petId}
Headers: { 'Authorization': `Bearer ${authToken}` }
Response: {
  feedingsThisWeek: number,
  consistencyScore: number, // Percentage
  weeklyGoal: number
}
```

### Weekly Consistency Bonus Check
```javascript
GET /api/paws/weekly-bonus-check
Headers: { 'Authorization': `Bearer ${authToken}` }
Response: {
  eligible: boolean,
  bonusAmount: number,
  bonusAvailable: boolean,
  requirementsLeft: string[]
}
```

## Error Handling

### Common HTTP Status Codes
- **200**: Success
- **201**: Created (registration, pet creation)
- **400**: Bad Request (validation errors, insufficient PAWS)
- **401**: Unauthorized (invalid/missing auth token)
- **403**: Forbidden (premium features for free users)
- **404**: Not Found (pet not found, endpoint not found)
- **500**: Internal Server Error

### Error Response Format
```javascript
{
  error: true,
  message: string,
  details?: string
}
```

## Frontend State Management Recommendations

### Authentication State
```javascript
const authState = {
  isAuthenticated: boolean,
  user: {
    userId: string,
    email: string,
    name: string
  },
  sessionToken: string,
  pawsBalance: number
}
```

### Pet Management State
```javascript
const petState = {
  pets: [{
    id: string,
    name: string,
    breed: string,
    profileCompletion: number
  }],
  activePet: petId,
  feedingHistory: feedingLog[]
}
```

### Subscription State
```javascript
const subscriptionState = {
  tier: 'free' | 'premium',
  isPremium: boolean,
  benefits: {
    pawsMultiplier: number,
    nftDiscount: number
  }
}
```

## UI/UX Considerations

### Key User Flows
1. **Registration → Welcome Bonus → Pet Creation**
2. **Daily Feeding Log → PAWS Rewards → Streak Building**
3. **AI Medical Consultation → Emergency Detection**
4. **PAWS Accumulation → NFT Minting**
5. **Subscription Upgrade → Premium Benefits**

### Essential UI Components
- **PAWS Balance Display**: Always visible, real-time updates
- **Pet Profile Cards**: Show completion percentage, quick actions
- **Feeding Log Calendar**: Visual streak tracking
- **Emergency Alert Modal**: For urgent AI medical assessments
- **NFT Gallery**: Display owned NFTs with metadata
- **Analytics Dashboard**: Charts and metrics visualization
- **Premium Upgrade Prompts**: Feature discovery and conversion

### Real-time Updates Needed
- PAWS balance after actions
- Feeding streaks after logging
- Profile completion percentages
- Subscription status changes

This comprehensive integration guide provides everything needed to connect a Figma frontend template to the fully functional Rawgle backend API system.