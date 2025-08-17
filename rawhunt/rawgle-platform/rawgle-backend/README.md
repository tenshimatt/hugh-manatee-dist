# Rawgle Platform Backend API

A comprehensive backend API system for the Rawgle pet services platform, built on Cloudflare Workers with D1 database.

## 🚀 Features

### Core Components
- **User Authentication & Registration** - JWT-based auth with session management
- **Supplier Management** - CRUD operations with search and filtering
- **PAWS Cryptocurrency System** - Earning, spending, and transfer mechanics
- **Reviews & Ratings** - User feedback system with automated rating updates
- **Order Management** - Complete order lifecycle with status tracking
- **Location-based Services** - Geolocation search and distance calculations
- **Notification System** - Real-time user alerts and messaging

### Security Features
- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcrypt with configurable rounds
- **Rate Limiting** - Configurable request throttling per IP/endpoint
- **Input Validation** - Comprehensive sanitization and validation
- **CORS Configuration** - Secure cross-origin resource sharing
- **SQL Injection Prevention** - Parameterized queries and sanitization

### Performance & Reliability
- **Database Optimization** - Indexed queries and efficient pagination
- **Caching Strategies** - Built-in performance optimizations
- **Error Handling** - Comprehensive error management and logging
- **Scheduled Cleanup** - Automatic maintenance of sessions and rate limits

## 📊 Database Schema

### Tables
- **users** - User accounts with PAWS balance
- **suppliers** - Service providers with location data
- **reviews** - User feedback and ratings
- **orders** - Order tracking and management
- **transactions** - PAWS transaction history
- **notifications** - User alert system
- **user_sessions** - JWT session management
- **rate_limits** - Request throttling data
- **supplier_categories** - Service categorization

## 🛠 Installation & Setup

### Prerequisites
- Node.js 18+
- Cloudflare Workers CLI (Wrangler)
- D1 Database

### 1. Clone and Install
```bash
git clone <repository-url>
cd rawgle-backend
npm install
```

### 2. Database Setup
```bash
# Create D1 database
npm run db:create

# Run migrations
npm run db:migrate

# For local development
npm run db:migrate:local
```

### 3. Environment Configuration
Update `wrangler.toml` with your database ID and configure environment variables:

```toml
[vars]
JWT_SECRET = "your-secure-jwt-secret"
BCRYPT_ROUNDS = "12"
RATE_LIMIT_WINDOW = "60"
RATE_LIMIT_MAX_REQUESTS = "100"
PAWS_EARNING_RATES = '{"order_completion": 10, "review_submission": 5, "referral": 25}'
```

### 4. Development
```bash
# Start development server
npm run dev

# Run tests
npm test

# Run specific test suites
npm run test:integration
npm run test:security
npm run test:performance
```

### 5. Deployment
```bash
# Deploy to production
npm run deploy
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User authentication
- `POST /api/auth/logout` - Session termination
- `GET /api/auth/me` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Password change

### Suppliers
- `GET /api/suppliers` - Search/filter suppliers
- `GET /api/suppliers/:id` - Get supplier details
- `POST /api/suppliers` - Create supplier (admin)
- `PUT /api/suppliers/:id` - Update supplier (admin)
- `DELETE /api/suppliers/:id` - Delete supplier (admin)
- `GET /api/suppliers/categories` - Get categories
- `GET /api/suppliers/nearby` - Location-based search

### PAWS System
- `GET /api/paws/balance` - Get user balance
- `GET /api/paws/transactions` - Transaction history
- `POST /api/paws/transfer` - Transfer between users
- `POST /api/paws/earn` - Award PAWS (system)
- `POST /api/paws/spend` - Spend PAWS
- `GET /api/paws/leaderboard` - Top users

### Reviews
- `POST /api/reviews` - Create review
- `GET /api/reviews/supplier/:id` - Get supplier reviews
- `GET /api/reviews/user` - Get user reviews
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review
- `POST /api/reviews/:id/helpful` - Mark helpful

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Cancel order
- `POST /api/orders/:id/complete` - Complete order
- `GET /api/orders/stats` - Order statistics

### Notifications
- `GET /api/notifications` - Get notifications
- `POST /api/notifications` - Create notification (admin)
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all read
- `DELETE /api/notifications/:id` - Delete notification

## 🔒 Security

### Rate Limiting
- General API: 100 requests/minute per IP
- Authentication: 10 requests/15 minutes per IP
- Transfers: 5 requests/minute per user

### Authentication
- JWT tokens with 24-hour expiration
- Session management with token blacklisting
- Secure password hashing with bcrypt

### Input Validation
- Zod schema validation for all inputs
- XSS prevention through sanitization
- SQL injection prevention via parameterized queries

### CORS
- Configured allowed origins
- Security headers included
- Preflight request handling

## 🧪 Testing

### Test Structure
```bash
tests/
├── unit/           # Unit tests
├── integration/    # Integration tests
├── security/       # Security tests
├── performance/    # Performance tests
└── setup.js       # Test configuration
```

### Running Tests
```bash
# All tests
npm test

# Specific suites
npm run test:unit
npm run test:integration
npm run test:security
npm run test:performance

# With coverage
npm test -- --coverage
```

### Test Coverage
- Unit tests for utilities and helpers
- Integration tests for complete user flows
- Security tests for vulnerability prevention
- Performance tests for optimization validation

## 📈 Performance

### Optimizations
- Database indexing on frequently queried fields
- Efficient pagination with LIMIT/OFFSET
- Distance calculations optimized for geospatial queries
- JSON processing for metadata fields

### Monitoring
- Request ID tracking for debugging
- Performance metrics collection
- Error logging and alerting
- Database query optimization

## 🔧 Configuration

### Environment Variables
- `JWT_SECRET` - Secret key for JWT signing
- `BCRYPT_ROUNDS` - Password hashing rounds (default: 12)
- `RATE_LIMIT_WINDOW` - Rate limiting window in seconds
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window
- `PAWS_EARNING_RATES` - JSON config for PAWS rewards

### Database Configuration
- D1 database binding in wrangler.toml
- Migration scripts in `/migrations`
- Automated cleanup scheduling

## 📚 Architecture

### Tech Stack
- **Runtime**: Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Authentication**: JWT with bcrypt
- **Validation**: Zod schemas
- **Routing**: itty-router
- **Testing**: Vitest

### Design Patterns
- Router-based architecture
- Middleware for cross-cutting concerns
- Service layer for business logic
- Repository pattern for data access

## 🚀 Deployment

### Production Setup
1. Configure production environment in wrangler.toml
2. Set secure JWT secret
3. Configure allowed CORS origins
4. Run database migrations
5. Deploy with `npm run deploy`

### Environment Management
- Development: Local with D1 local database
- Staging: Cloudflare Workers with staging database
- Production: Cloudflare Workers with production database

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
- Create an issue in the repository
- Contact the development team
- Check the API documentation

---

Built with ❤️ for the Rawgle Platform