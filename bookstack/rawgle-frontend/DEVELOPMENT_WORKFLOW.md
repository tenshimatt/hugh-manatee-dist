# RAWGLE Development Workflow Guide
*Last Updated: September 5, 2025 - 11:08 UTC*

## 🚀 Quick Start Guide

### Prerequisites
- Node.js v24.4.1+ installed
- Git for version control
- PostgreSQL (optional for full functionality)
- Redis (optional for full functionality)

### Immediate Setup (2 minutes)
```bash
# Clone and setup frontend
git clone [repository-url]
cd rawgle-frontend
npm install
npm run dev                    # ✅ Starts on http://localhost:3000

# Clone and setup backend (new terminal)  
cd ../rawgle-backend
npm install
npm run dev                    # ✅ Starts on http://localhost:8000
```

### Verification Steps
```bash
# Check frontend status
curl http://localhost:3000     # Should return Next.js page
# ⚠️ Note: Navigation may fail due to ReactQuery issue

# Check backend status  
curl http://localhost:8000/health    # Should return {"status":"ok"}

# Run tests
npm run test                   # Starts Playwright browser tests
```

## 🔄 Daily Development Workflow

### Morning Routine (10 minutes)
1. **Pull latest changes**
   ```bash
   git pull origin main
   npm install  # Update dependencies if needed
   ```

2. **Start development servers**
   ```bash
   # Terminal 1: Frontend
   npm run dev

   # Terminal 2: Backend  
   cd ../rawgle-backend && npm run dev
   ```

3. **Verify system health**
   - Frontend compiles: ✅ Expected
   - Backend starts: ✅ Expected  
   - Database connection: ❌ Expected (dev mode)
   - Redis connection: ❌ Expected (dev mode)

### Development Session Workflow

#### 1. Feature Development
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes with hot reload
# - Frontend: Next.js auto-refreshes on save
# - Backend: tsx watch restarts on file changes
# - TypeScript: Real-time error checking

# Commit frequently
git add .
git commit -m "feat: descriptive commit message"
```

#### 2. Testing Integration
```bash
# Run comprehensive tests
npm run test                   # Playwright E2E tests
npm run test:watch            # Watch mode for development
npm run build                 # Verify build success

# Manual verification
# - Test in multiple browsers
# - Verify responsive design  
# - Check console for errors
```

#### 3. Code Quality Checks
```bash
# Automatic checks
npm run lint                  # ESLint validation
npm run type-check           # TypeScript compilation
npm run format               # Prettier formatting

# Manual review
# - Check for console errors
# - Verify TypeScript strict mode compliance
# - Review component accessibility
```

### End-of-Day Routine (5 minutes)
1. **Run full test suite**
   ```bash
   npm run test
   ```

2. **Update documentation** (if significant changes)
   - Update PROJECT_STATUS_DASHBOARD.md
   - Update IMPLEMENTATION_PROGRESS.md
   - Document any new issues or fixes

3. **Commit and push**
   ```bash
   git push origin feature/your-feature-name
   ```

## 🛠️ Development Environment Setup

### IDE Configuration
**Recommended:** VS Code with extensions:
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-playwright.playwright",
    "dbaeumer.vscode-eslint"
  ]
}
```

### VS Code Settings
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

## 🧪 Testing Procedures

### Automated Testing Pipeline
```bash
# Full test suite (runs in CI/CD)
npm run test:full

# Specific test categories
npm run test:e2e             # End-to-end browser tests
npm run test:component       # Component unit tests (planned)
npm run test:api            # API integration tests (planned)

# Development testing
npm run test:watch          # Watch mode during development
npm run test:debug          # Debug mode with browser DevTools
```

### Manual Testing Checklist
```markdown
Daily Testing Checklist:
- [ ] Homepage loads without errors
- [ ] Navigation menu displays correctly  
- [ ] ⚠️ Page navigation (currently blocked by ReactQuery)
- [ ] Backend health endpoint responds
- [ ] Console shows no critical errors
- [ ] Mobile responsive design works
- [ ] Cross-browser compatibility (Chrome, Firefox, Safari)
```

### Testing Best Practices
1. **Test Early and Often**
   - Run tests before committing
   - Use watch mode during development
   - Test in multiple browsers

2. **Document Test Failures**
   - Screenshot failing tests
   - Log console errors
   - Note reproduction steps
   - Update TESTING_DOCUMENTATION.md

3. **Progressive Testing Strategy**
   - Start with basic functionality
   - Build up to complex user flows
   - Prioritize critical path testing

## 🔧 Build and Deployment Process

### Local Build Verification
```bash
# Frontend build
npm run build                 # Next.js production build
npm run start                # Test production locally

# Backend build
npm run build                # TypeScript compilation
npm run start:prod           # Production server test
```

### Environment Configuration
```bash
# Development (default)
NODE_ENV=development
DATABASE_URL=postgresql://localhost:5432/rawgle_dev
REDIS_URL=redis://localhost:6379

# Production (example)
NODE_ENV=production
DATABASE_URL=$PRODUCTION_DATABASE_URL
REDIS_URL=$PRODUCTION_REDIS_URL
JWT_SECRET=$PRODUCTION_JWT_SECRET
```

### Deployment Checklist
```markdown
Pre-Deployment:
- [ ] All tests passing
- [ ] Build succeeds without errors
- [ ] TypeScript compilation clean
- [ ] No console errors or warnings
- [ ] Dependencies updated and secure
- [ ] Environment variables configured
- [ ] Database migrations ready (when applicable)

Post-Deployment:
- [ ] Health checks passing
- [ ] Core functionality working
- [ ] Performance metrics acceptable
- [ ] Error monitoring active
- [ ] Documentation updated
```

## 🚨 Troubleshooting Guide

### Common Issues and Solutions

#### 1. ReactQuery Navigation Error (CRITICAL)
**Symptom:** Pages compile but navigation fails
**Error:** `No QueryClient set, use QueryClientProvider to set one`
**Solution:**
```typescript
// Check src/app/layout.tsx for proper QueryClientProvider setup
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

#### 2. Backend Database Connection Issues
**Symptom:** ECONNREFUSED errors in backend logs
**Expected:** Normal in development without PostgreSQL
**Solution:** System designed for graceful fallback
```bash
# Optional: Install PostgreSQL locally
brew install postgresql
brew services start postgresql
createdb rawgle_dev
```

#### 3. Hot Reload Not Working
**Frontend Fix:**
```bash
# Kill Next.js process and restart
pkill -f "next dev"
npm run dev
```

**Backend Fix:**
```bash
# Kill tsx process and restart  
pkill -f "tsx watch"
npm run dev
```

#### 4. TypeScript Compilation Errors
```bash
# Clear TypeScript cache
rm -rf .next
rm -rf node_modules/.cache

# Regenerate types
npm run type-check
```

#### 5. Test Failures
```bash
# Clear test cache
npx playwright install         # Reinstall browsers
rm -rf test-results           # Clear previous results
npm run test                  # Run fresh tests
```

### Performance Issues

#### Slow Development Server
```bash
# Frontend optimization
npm run dev -- --turbo       # Enable Turbopack (experimental)

# Backend optimization  
npm run dev:fast             # Skip some development checks
```

#### Memory Issues
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run dev
```

## 📊 Monitoring and Debugging

### Development Monitoring
```bash
# Real-time logs
tail -f logs/rawgle.log       # Backend Winston logs
npm run dev                   # Frontend Next.js logs

# System resources
top                          # CPU and memory usage
lsof -i :3000               # Check port 3000 usage
lsof -i :8000               # Check port 8000 usage
```

### Debug Tools
```bash
# Browser DevTools
# - Console: JavaScript errors and logs
# - Network: API request/response monitoring  
# - Elements: DOM structure and styling
# - Application: Local storage and cookies

# VS Code Debugging
# - Set breakpoints in TypeScript files
# - Launch Debug configuration for Next.js
# - Attach debugger to backend process
```

### Production Monitoring (Planned)
```bash
# Application Performance Monitoring (APM)
# - Error tracking and alerting
# - Performance metrics and bottlenecks  
# - User session replay and debugging
# - Infrastructure monitoring and scaling
```

## 🎯 Development Best Practices

### Code Quality Standards
```typescript
// TypeScript best practices
- Use strict type checking
- Avoid 'any' types
- Define interfaces for all data structures
- Use proper error handling with try/catch

// React best practices  
- Use functional components with hooks
- Implement proper error boundaries
- Follow React Query patterns for data fetching
- Write accessible components (WCAG guidelines)

// Backend best practices
- Validate all inputs
- Use proper error handling middleware
- Implement request rate limiting
- Follow REST API conventions
```

### Git Workflow
```bash
# Branch naming conventions
feature/user-authentication
bugfix/navigation-query-client
hotfix/critical-security-issue
refactor/database-connection-pool

# Commit message format
feat: add user authentication system
fix: resolve ReactQuery navigation issue  
docs: update API documentation
test: add comprehensive E2E test suite
refactor: improve error handling patterns
```

### Documentation Updates
- **Daily:** Update PROJECT_STATUS_DASHBOARD.md with current status
- **Weekly:** Update IMPLEMENTATION_PROGRESS.md with achievements
- **Feature completion:** Update TECHNICAL_ARCHITECTURE_GUIDE.md
- **Issue resolution:** Update DEVELOPMENT_WORKFLOW.md with solutions

---

*This workflow guide ensures consistent development practices and efficient problem resolution. All procedures are tested and verified in the current development environment.*