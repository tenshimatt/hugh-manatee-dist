# Rawgle Frontend Integration Guide

This document outlines the API format standards, CORS configuration, and integration requirements for the Rawgle frontend at `https://afc39a6e.rawgle-frontend.pages.dev`.

## Table of Contents
- [API Standards](#api-standards)
- [CORS Configuration](#cors-configuration)
- [Authentication Flow](#authentication-flow)
- [Response Formats](#response-formats)
- [Error Handling](#error-handling)
- [Integration Testing](#integration-testing)

## API Standards

### Base URL
- **Production**: `https://rawgle-backend.your-subdomain.workers.dev`
- **Development**: `http://localhost:8787`

### Content Type
All API endpoints expect and return `application/json` content type.

### Required Headers
```javascript
{
  'Content-Type': 'application/json',
  'Origin': 'https://afc39a6e.rawgle-frontend.pages.dev',
  'X-Platform': 'rawgle',
  'Authorization': 'Bearer <token>' // For protected endpoints
}
```

## CORS Configuration

### Allowed Origins
The API is configured to accept requests from:
- `https://afc39a6e.rawgle-frontend.pages.dev` (Production frontend)
- `http://localhost:3000` (Development - React default)
- `http://localhost:5173` (Development - Vite default)
- `https://rawgle.com` (Production domain)
- `https://www.rawgle.com` (Production www subdomain)

### CORS Headers Sent by API
```javascript
{
  'Access-Control-Allow-Origin': 'https://afc39a6e.rawgle-frontend.pages.dev',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Platform, X-User-Agent, X-Request-ID',
  'Access-Control-Expose-Headers': 'X-Total-Count, X-Rate-Limit-Remaining',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400'
}
```

### Preflight Requests
All non-simple requests will trigger a preflight `OPTIONS` request. The API handles these automatically.

## Authentication Flow

### 1. User Registration
```javascript
// POST /api/auth/register
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "location": "San Francisco, CA"
}

// Response
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "user": { /* user object */ },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expires_at": "2024-08-15T15:30:00Z"
  }
}
```

### 2. User Login
```javascript
// POST /api/auth/login
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "remember_me": false
}

// Response
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { /* user object */ },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expires_at": "2024-08-15T15:30:00Z"
  }
}
```

### 3. Token Storage
Store the JWT token in localStorage or sessionStorage:
```javascript
localStorage.setItem('rawgle_token', response.data.token);
```

### 4. Authenticated Requests
Include the token in the Authorization header:
```javascript
fetch('/api/pets', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('rawgle_token')}`,
    'Content-Type': 'application/json',
    'Origin': 'https://afc39a6e.rawgle-frontend.pages.dev'
  }
})
```

## Response Formats

### Success Response Format
All successful API responses follow this format:
```javascript
{
  "success": true,
  "message": "Optional success message",
  "data": {
    // Response data here
  },
  "timestamp": "2024-08-14T15:30:00Z" // Optional
}
```

### Pagination Format
For endpoints that return lists:
```javascript
{
  "success": true,
  "data": {
    "items": [ /* array of items */ ],
    "pagination": {
      "total": 150,
      "limit": 20,
      "offset": 0,
      "pages": 8,
      "current_page": 1,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

### Platform Identification
All responses include platform identification:
```javascript
{
  "success": true,
  "platform": "rawgle", // Always present in root or data
  "data": {
    // ... rest of data
  }
}
```

## Error Handling

### Error Response Format
All error responses follow this format:
```javascript
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human readable error message",
  "platform": "rawgle",
  "timestamp": "2024-08-14T15:30:00Z",
  "details": { /* optional additional error details */ }
}
```

### Common Error Codes

#### Authentication Errors (401)
```javascript
{
  "success": false,
  "error": "AUTHENTICATION_REQUIRED",
  "message": "Authorization header with Bearer token is required"
}

{
  "success": false,
  "error": "TOKEN_EXPIRED",
  "message": "Authentication token has expired"
}

{
  "success": false,
  "error": "INVALID_TOKEN",
  "message": "Invalid authentication token"
}
```

#### Validation Errors (400)
```javascript
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Pet name is required",
  "details": {
    "field": "name",
    "constraint": "required"
  }
}
```

#### Not Found Errors (404)
```javascript
{
  "success": false,
  "error": "PET_NOT_FOUND",
  "message": "Pet not found or access denied"
}
```

#### Rate Limiting (429)
```javascript
{
  "success": false,
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests. Please try again later.",
  "retry_after": 60
}
```

## Frontend Integration Examples

### React Hook for API Calls
```javascript
import { useState, useEffect } from 'react';

const useRawgleApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const apiCall = async (endpoint, options = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('rawgle_token');
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://afc39a6e.rawgle-frontend.pages.dev',
          'X-Platform': 'rawgle',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers
        },
        ...options
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'API request failed');
      }
      
      return data.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  return { apiCall, loading, error };
};
```

### Error Boundary Component
```javascript
class RawgleErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Rawgle API Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong with the Rawgle API</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Integration Testing

### Testing Checklist
- [ ] CORS headers are present for frontend origin
- [ ] All API responses include `success` field
- [ ] Error responses include proper error codes
- [ ] Authentication flow works end-to-end
- [ ] Token expiration is handled gracefully
- [ ] Platform identifier is present in responses
- [ ] Pagination format is consistent
- [ ] Response times are acceptable (<2s for most endpoints)

### Test Endpoints for Frontend Verification
```javascript
// 1. Health Check
GET /health
// Should return: { status: 'healthy', platform: 'rawgle' }

// 2. Authentication Test (should fail without token)
GET /api/pets
// Should return: { success: false, error: 'AUTHENTICATION_REQUIRED' }

// 3. CORS Preflight Test
OPTIONS /api/pets
// Should return proper CORS headers

// 4. Error Handling Test
GET /api/nonexistent
// Should return: { success: false, error: 'Not Found', platform: 'rawgle' }
```

### Frontend Compatibility Script
Run the automated frontend compatibility test:
```bash
node scripts/test-frontend-compatibility.js
```

This script will:
- Test CORS configuration
- Verify API response formats
- Check authentication flow
- Validate error handling
- Test response performance
- Generate compatibility report

## Deployment Notes

### Environment Variables
Ensure these environment variables are set:
- `RAWGLE_FRONTEND_URL`: `https://afc39a6e.rawgle-frontend.pages.dev`
- `CORS_ORIGINS`: Array of allowed origins
- `ENVIRONMENT`: `production` | `staging` | `development`

### Health Monitoring
The API provides several health check endpoints:
- `GET /health` - Basic health check
- `GET /health/frontend` - Frontend connectivity test
- `GET /health/database` - Database health check

Monitor these endpoints to ensure API availability for the frontend.

## Support and Troubleshooting

### Common Issues

#### 1. CORS Errors
**Symptom**: Browser blocks requests with CORS error
**Solution**: Verify the frontend origin is in the allowed origins list

#### 2. Authentication Issues
**Symptom**: API returns 401 for authenticated requests
**Solution**: Check token format, expiration, and platform header

#### 3. Response Format Issues
**Symptom**: Frontend can't parse API responses
**Solution**: Verify all responses include `success` field and proper structure

#### 4. Performance Issues
**Symptom**: Slow API responses
**Solution**: Check health endpoints and consider caching strategies

### Debug Mode
For development, set `DEBUG=true` in environment variables to get detailed error responses.

### Contact
For API issues affecting frontend integration, check:
1. Health endpoint: `/health`
2. API documentation: `/api/docs`
3. Frontend compatibility test results