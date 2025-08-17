# Rawgle Platform - Developer Quick Start Guide

## 🚀 From Zero to Launch in 5 Steps

### Prerequisites
- Node.js 18+
- Cloudflare account
- Supabase account
- Basic knowledge of React and TypeScript

## Step 1: Clone and Setup (10 minutes)

```bash
# Clone the repository
git clone https://github.com/rawgle/platform.git
cd rawgle-platform

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your credentials
```

## Step 2: Database Setup (20 minutes)

```bash
# Start Supabase locally
npx supabase start

# Run migrations
npx supabase db push

# Seed with sample data
npm run db:seed

# Verify at http://localhost:54323
```

## Step 3: Deploy Workers (15 minutes)

```bash
# Login to Cloudflare
npx wrangler login

# Create KV namespaces
npx wrangler kv:namespace create "KV_CACHE"
npx wrangler kv:namespace create "SESSION_STORE"

# Create Durable Objects
npx wrangler publish --dry-run

# Deploy to production
npm run deploy:workers
```

## Step 4: Frontend Development (30 minutes)

```bash
# Start development server
npm run dev

# Open http://localhost:3000
# Hot reload enabled

# Build for production
npm run build

# Deploy to Cloudflare Pages
npm run deploy:frontend
```

## Step 5: Configure Integrations (20 minutes)

### Stripe Setup
```javascript
// Add to environment
STRIPE_PUBLIC_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

// Create products
npm run stripe:setup
```

### Email Configuration
```javascript
// SendGrid setup
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=hello@rawgle.com

// Test email
npm run test:email
```

## 📁 Project Structure

```
rawgle-platform/
├── apps/
│   ├── web/                 # Next.js frontend
│   │   ├── app/            # App router pages
│   │   ├── components/     # React components
│   │   └── lib/           # Utilities
│   └── mobile/            # React Native app
├── workers/
│   ├── api/               # Main API worker
│   ├── media/             # Image processing
│   └── analytics/         # Analytics worker
├── packages/
│   ├── ui/                # Shared UI components
│   ├── database/          # Prisma schema
│   └── types/             # TypeScript types
├── supabase/
│   ├── migrations/        # Database migrations
│   └── seed.sql          # Sample data
└── docs/                  # Documentation
```

## 🔧 Key Commands

```bash
# Development
npm run dev              # Start all services
npm run dev:web          # Frontend only
npm run dev:api          # Workers only
npm run dev:db           # Database UI

# Testing
npm test                 # Run all tests
npm run test:e2e         # End-to-end tests
npm run test:load        # Load testing

# Deployment
npm run deploy           # Deploy everything
npm run deploy:preview   # Preview deployment
npm run rollback         # Rollback last deploy

# Maintenance
npm run db:migrate       # Run migrations
npm run db:backup        # Backup database
npm run logs             # View logs
npm run monitor          # Open monitoring
```

## 🏗️ Core Features Implementation

### 1. Pet Profile Creation

```typescript
// app/pets/new/page.tsx
import { PetProfileForm } from '@/components/pets/profile-form'
import { createPet } from '@/lib/api/pets'

export default function NewPetPage() {
  return (
    <PetProfileForm 
      onSubmit={async (data) => {
        const pet = await createPet(data)
        redirect(`/pets/${pet.id}/recommendations`)
      }}
    />
  )
}
```

### 2. Food Recommendations

```typescript
// lib/api/recommendations.ts
export async function getRecommendations(petId: string) {
  const response = await fetch(`/api/pets/${petId}/recommendations`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  
  return response.json()
}

// components/recommendations/list.tsx
export function RecommendationsList({ petId }) {
  const { data, loading } = useRecommendations(petId)
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {data?.primary.map(item => (
        <ProductCard 
          key={item.id}
          product={item}
          cta="Order Now"
          badge="Best Match"
        />
      ))}
    </div>
  )
}
```

### 3. Review System

```typescript
// components/reviews/form.tsx
export function ReviewForm({ productId, petId }) {
  const [rating, setRating] = useState(5)
  const [photos, setPhotos] = useState([])
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const review = await createReview({
      productId,
      petId,
      rating,
      content: e.target.content.value,
      photos
    })
    
    // Show success with gamification
    showBadgeUnlock('first_review')
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <StarRating value={rating} onChange={setRating} />
      <textarea name="content" required />
      <PhotoUpload onChange={setPhotos} />
      <Button type="submit">Submit Review</Button>
    </form>
  )
}
```

### 4. Real-time Chat

```typescript
// hooks/use-chat.ts
export function useChat(channel: string) {
  const [messages, setMessages] = useState([])
  const ws = useRef<WebSocket>()
  
  useEffect(() => {
    ws.current = new WebSocket(`wss://api.rawgle.com/chat/${channel}`)
    
    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data)
      setMessages(prev => [...prev, message])
    }
    
    return () => ws.current?.close()
  }, [channel])
  
  const sendMessage = (text: string) => {
    ws.current?.send(JSON.stringify({ 
      type: 'message', 
      content: text 
    }))
  }
  
  return { messages, sendMessage }
}
```

## 🧪 Testing Strategy

### Unit Tests
```typescript
// __tests__/recommendation-engine.test.ts
describe('Recommendation Engine', () => {
  it('should match foods based on breed', async () => {
    const pet = { breed: 'Labrador', weight: 30 }
    const recommendations = await generateRecommendations(pet)
    
    expect(recommendations.primary).toHaveLength(3)
    expect(recommendations.primary[0].matchScore).toBeGreaterThan(0.8)
  })
})
```

### E2E Tests
```typescript
// e2e/onboarding.spec.ts
test('complete onboarding flow', async ({ page }) => {
  await page.goto('/onboarding')
  
  // Step 1: Create account
  await page.fill('[name=email]', 'test@example.com')
  await page.fill('[name=password]', 'SecurePass123!')
  await page.click('button:has-text("Create Account")')
  
  // Step 2: Add pet
  await page.fill('[name=name]', 'Rex')
  await page.selectOption('[name=breed]', 'Labrador')
  await page.click('button:has-text("Continue")')
  
  // Verify recommendations
  await expect(page).toHaveURL('/recommendations')
  await expect(page.locator('.product-card')).toHaveCount(3)
})
```

## 🚀 Performance Optimization

### Edge Caching
```typescript
// workers/api/src/middleware/cache.ts
export async function withCache(request: Request, env: Env) {
  const cacheKey = new Request(request.url, request)
  const cache = caches.default
  
  // Check cache
  let response = await cache.match(cacheKey)
  if (response) {
    response = new Response(response.body, response)
    response.headers.set('X-Cache', 'HIT')
    return response
  }
  
  // Generate response
  response = await generateResponse(request, env)
  
  // Cache it
  response.headers.set('Cache-Control', 'public, max-age=3600')
  response.headers.set('X-Cache', 'MISS')
  await cache.put(cacheKey, response.clone())
  
  return response
}
```

### Image Optimization
```typescript
// Use Cloudflare Images
const optimizedUrl = `https://images.rawgle.com/${imageId}/public`

// Responsive images
<img 
  src={optimizedUrl}
  srcSet={`
    ${optimizedUrl}?w=320 320w,
    ${optimizedUrl}?w=640 640w,
    ${optimizedUrl}?w=1280 1280w
  `}
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
/>
```

## 📊 Monitoring & Analytics

### Custom Analytics
```typescript
// lib/analytics.ts
export function trackEvent(event: string, properties?: any) {
  // Send to Cloudflare Analytics Engine
  fetch('/api/analytics', {
    method: 'POST',
    body: JSON.stringify({ event, properties })
  })
  
  // Also send to PostHog for detailed analysis
  if (typeof window !== 'undefined') {
    window.posthog?.capture(event, properties)
  }
}

// Usage
trackEvent('recommendation_viewed', {
  petId: 'xxx',
  productCount: 3,
  userTier: 'premium'
})
```

### Error Tracking
```typescript
// app/error.tsx
'use client'

import * as Sentry from '@sentry/nextjs'

export default function Error({ error, reset }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])
  
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

## 🔐 Security Best Practices

### API Security
```typescript
// Rate limiting
const rateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100 // requests per window
})

// Input validation
const schema = z.object({
  name: z.string().min(1).max(50),
  email: z.string().email(),
  // ... other fields
})

// SQL injection prevention (Supabase handles this)
const { data } = await supabase
  .from('pets')
  .select('*')
  .eq('user_id', userId) // Parameterized queries
```

### Authentication
```typescript
// Middleware protection
export async function middleware(request: Request) {
  const token = request.headers.get('Authorization')
  
  if (!token) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  const user = await verifyToken(token)
  if (!user) {
    return new Response('Invalid token', { status: 403 })
  }
  
  // Add user to request context
  request.headers.set('X-User-Id', user.id)
}
```

## 🌟 Launch Checklist

### Pre-Launch
- [ ] All tests passing
- [ ] Security audit completed
- [ ] Performance benchmarks met (<2s load time)
- [ ] SEO meta tags configured
- [ ] Analytics tracking verified
- [ ] Error monitoring active
- [ ] Backup strategy tested
- [ ] SSL certificates valid
- [ ] Legal pages ready (Privacy, Terms)
- [ ] Support system configured

### Launch Day
- [ ] Deploy to production
- [ ] DNS propagation confirmed
- [ ] Monitor error rates
- [ ] Watch performance metrics
- [ ] Test critical user flows
- [ ] Announce on social media
- [ ] Enable gradual rollout
- [ ] Support team briefed

### Post-Launch
- [ ] Gather user feedback
- [ ] Fix critical bugs
- [ ] Optimize based on analytics
- [ ] Plan feature roadmap
- [ ] Celebrate! 🎉

## 🆘 Troubleshooting

### Common Issues

**Build Failures**
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

**Database Connection**
```bash
# Check Supabase status
npx supabase status

# Reset database
npx supabase db reset
```

**Worker Deployment**
```bash
# Check logs
npx wrangler tail

# Rollback if needed
npx wrangler rollback
```

## 📚 Resources

- **Documentation**: [docs.rawgle.com](https://docs.rawgle.com)
- **API Reference**: [api.rawgle.com/docs](https://api.rawgle.com/docs)
- **Design System**: [design.rawgle.com](https://design.rawgle.com)
- **Status Page**: [status.rawgle.com](https://status.rawgle.com)
- **Support**: [support@rawgle.com](mailto:support@rawgle.com)

---

**Ready to build?** Join our developer community on Discord for help and updates!

*"Ship fast, iterate faster, feed dogs best."* 🚀🐕