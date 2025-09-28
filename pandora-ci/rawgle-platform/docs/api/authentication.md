# Authentication API Documentation

## JWT Authentication System

### Overview
Rawgle uses JWT (JSON Web Tokens) for stateless authentication. All protected endpoints require a valid JWT token in the Authorization header.

### Token Structure
```
Authorization: Bearer <jwt_token>
```

### Authentication Endpoints

#### POST /api/auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 123,
    "email": "user@example.com",
    "name": "User Name"
  },
  "expiresIn": 3600
}
```

**Error Responses:**
- 400: Invalid email/password format
- 401: Invalid credentials
- 429: Too many login attempts

#### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "User Name",
  "acceptTerms": true
}
```

**Validation Rules:**
- Email: Must be valid email format, unique
- Password: Minimum 8 characters, must include uppercase, lowercase, number
- Name: Required, 2-50 characters
- acceptTerms: Must be true

#### POST /api/auth/refresh
Refresh an existing JWT token.

**Request Headers:**
```
Authorization: Bearer <current_token>
```

**Response:**
```json
{
  "success": true,
  "token": "new_jwt_token_here",
  "expiresIn": 3600
}
```

#### POST /api/auth/logout
Invalidate current token (adds to blacklist).

**Request Headers:**
```
Authorization: Bearer <token_to_invalidate>
```

### Middleware Implementation

All protected routes must use the `authenticateToken` middleware:

```javascript
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};
```

### Security Requirements

1. **Token Expiration**: JWT tokens expire after 1 hour
2. **Refresh Strategy**: Clients should refresh tokens when they receive 401 responses
3. **Secret Management**: JWT_SECRET must be stored in environment variables
4. **Rate Limiting**: Login endpoint limited to 5 attempts per IP per minute
5. **Token Blacklist**: Logout adds tokens to Redis blacklist

### Error Handling

Authentication errors should return standardized responses:

```json
{
  "success": false,
  "error": "Authentication failed",
  "code": "AUTH_INVALID_TOKEN",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Testing Requirements

All authentication tests must verify:
1. Valid credentials return proper JWT
2. Invalid credentials return 401
3. Expired tokens are rejected
4. Protected routes require authentication
5. Token refresh works correctly
6. Logout invalidates tokens