# Rawgle Frontend

A modern React frontend for the Rawgle pet care platform with AI health consultations, feeding tracking, PAWS rewards, and NFT features.

## Features

- **Landing Page**: Marketing page with hero section, features overview, testimonials, and pricing
- **Authentication**: Sign up/login with email or Solana wallet integration
- **Dashboard**: Main hub showing pet overview, quick actions, and recent activity
- **Pet Management**: Add, edit, and view detailed pet profiles
- **Feeding Tracker**: Log daily feeding activities and earn PAWS rewards
- **AI Health Consultant**: Chat interface for AI-powered medical advice
- **PAWS Wallet**: View balance, transaction history, and transfer tokens
- **NFT Gallery**: View and manage pet NFTs (marketplace integration ready)
- **Analytics**: Pet health trends and insights with charts
- **Settings**: Account management, notifications, subscription, privacy

## Tech Stack

- **React 18** with hooks and context
- **Vite** for fast development and building
- **Tailwind CSS** for styling with custom design system
- **React Router** for client-side routing
- **Recharts** for analytics visualizations
- **Heroicons** for consistent iconography
- **Axios** for API integration
- **Solana Web3.js** for wallet integration (ready for implementation)

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.jsx      # Main layout wrapper
│   ├── Navbar.jsx      # Navigation header
│   ├── Sidebar.jsx     # Dashboard sidebar
│   ├── LoadingSpinner.jsx
│   └── ProtectedRoute.jsx
├── pages/              # Route-based page components
│   ├── LandingPage.jsx
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   ├── Dashboard.jsx
│   ├── PetsPage.jsx
│   ├── AddPetPage.jsx
│   ├── PetDetailPage.jsx
│   ├── FeedingPage.jsx
│   ├── AIMedicalPage.jsx
│   ├── PawsWalletPage.jsx
│   ├── NFTGalleryPage.jsx
│   ├── MarketplacePage.jsx
│   ├── AnalyticsPage.jsx
│   └── SettingsPage.jsx
├── context/            # React context providers
│   └── AuthContext.jsx # Authentication state
├── hooks/              # Custom React hooks
│   └── usePets.js      # Pet data management
├── services/           # API integration
│   └── api.js          # Centralized API client
├── utils/              # Helper functions
│   ├── constants.js    # App constants
│   └── helpers.js      # Utility functions
└── index.css          # Global styles with Tailwind
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Access to Rawgle API at `https://rawgle-api.findrawdogfood.workers.dev`

### Installation

1. **Install dependencies**:
   ```bash
   cd /Users/mattwright/pandora/rawgle-platform/rawgle-pure/frontend
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Open in browser**:
   Navigate to `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start development server on port 3000
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## API Integration

The frontend integrates with the Rawgle API using organized service modules:

- **Authentication**: Registration, login, wallet linking
- **Pet Management**: CRUD operations for pet profiles
- **Feeding**: Log and retrieve feeding history
- **AI Medical**: Health consultations and emergency detection
- **PAWS**: Balance, transactions, rewards system
- **NFT**: Minting, marketplace, collection management
- **Analytics**: Health trends and insights
- **Subscriptions**: Plan management and benefits

API base URL is configured in `src/services/api.js` and can be modified for different environments.

## Design System

### Colors
- **Primary**: Orange tones (#f17426) for main actions
- **Secondary**: Green tones (#22c55e) for success/health
- **Accent**: Yellow tones (#f59e0b) for rewards/PAWS
- **Gray scale**: For text and backgrounds

### Components
- **Buttons**: `.btn-primary`, `.btn-secondary`, `.btn-accent`
- **Cards**: `.card` with consistent padding and shadows  
- **Forms**: `.input-field` for consistent form styling
- **Navigation**: `.nav-link` and `.nav-link-active`

### Responsive Design
- Mobile-first approach with Tailwind breakpoints
- Collapsible sidebar on mobile devices
- Responsive grids and flexible layouts
- Touch-friendly button and input sizes

## State Management

- **AuthContext**: User authentication and session management
- **usePets Hook**: Pet data fetching and CRUD operations  
- **Local State**: Component-level state for forms and UI
- **API Integration**: Centralized error handling and loading states

## Accessibility Features

- Semantic HTML structure
- ARIA labels and roles where needed
- Keyboard navigation support
- Focus management for modals and forms
- Color contrast compliance
- Screen reader friendly content

## Performance Optimizations

- Code splitting with React.lazy (ready for implementation)
- Image optimization and lazy loading
- API response caching
- Debounced search inputs
- Optimized re-renders with React.memo

## Development Notes

### Authentication Flow
1. User registers/logs in via email or Solana wallet
2. JWT token stored in localStorage
3. Token included in API requests via axios interceptor
4. Protected routes redirect to login if unauthenticated

### Pet Management
- Full CRUD operations with form validation
- Image upload ready for implementation
- Health records and medical history tracking
- Age calculation and breed information

### PAWS Rewards System
- Automatic reward earning for pet care activities
- Transaction history with categorization
- Balance display with subscription multipliers
- Transfer functionality between users

### AI Medical Integration
- Emergency symptom detection
- Image analysis capability (ready for implementation)
- Consultation history and recommendations
- Confidence scoring and emergency level indicators

## Deployment Ready

The frontend is production-ready with:
- Environment variable support
- Build optimization
- Error boundaries (ready for implementation)  
- SEO-friendly meta tags
- Progressive Web App features (ready for implementation)

## Future Enhancements

- Real-time notifications with WebSocket
- Offline support with service workers
- Advanced image processing and analysis
- Integration with wearable pet devices
- Social features and pet community
- Multilingual support with i18n

## Browser Support

- Chrome 90+
- Firefox 88+  
- Safari 14+
- Edge 90+

## License

Private - Rawgle Pet Care Platform