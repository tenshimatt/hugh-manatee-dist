# Admin Bypass System - Rawgle Platform

The Admin Bypass system allows you to access all content, menus, and pages after authentication by granting admin-level access to authenticated users.

## 🚨 Quick Setup for Development

### Method 1: Environment Variable Bypass (Easiest)

Set the `BYPASS_AUTH` environment variable to `true`:

```bash
# In your .env file or environment
BYPASS_AUTH=true
ENVIRONMENT=development
```

This will grant **ANY authenticated user** full admin access to all platform features.

### Method 2: Email-based Admin Access

Add your email to the admin whitelist:

```bash
# In your .env file
ADMIN_EMAILS=your-email@domain.com,another-admin@domain.com
```

### Method 3: User ID Whitelist

Add specific user IDs to the admin list:

```bash
# In your .env file
ADMIN_USER_IDS=user-id-1,user-id-2
```

### Method 4: Database Role

Update your user record in the database:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your-email@domain.com';
-- OR
UPDATE users SET is_admin = 1 WHERE email = 'your-email@domain.com';
```

## 🔧 Configuration Options

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `BYPASS_AUTH` | Grant admin access to all authenticated users | `true` |
| `ENVIRONMENT` | Environment mode (auto-grants admin if `development`) | `development` |
| `ADMIN_EMAILS` | Comma-separated list of admin emails | `admin@rawgle.com,dev@rawgle.com` |
| `ADMIN_USER_IDS` | Comma-separated list of admin user IDs | `user-123,user-456` |

### Wrangler Configuration

For Cloudflare Workers, set these in your `wrangler.toml`:

```toml
[env.development.vars]
ENVIRONMENT = "development"
BYPASS_AUTH = "true"
ADMIN_EMAILS = "admin@rawgle.com,dev@rawgle.com"

[env.production.vars]
ENVIRONMENT = "production" 
BYPASS_AUTH = "false"
# Only specific emails in production
ADMIN_EMAILS = "admin@rawgle.com"
```

## 🎯 What Admin Access Provides

Once you have admin access, you can:

### Backend API Access
- **Bypass ownership restrictions** - Access any user's data
- **View all pets and health records** - Access feeding logs, medical history
- **Administrative endpoints** - System stats, user management
- **Data export capabilities** - Export any user's health data

### Frontend Features
- **Admin Dashboard** (`/admin`) - Complete system overview
- **User Management** - View all users, their pets, and activity
- **System Statistics** - Platform-wide metrics and health
- **Data Insights** - Access to all feeding logs and health data

### API Endpoints Available

```bash
# Check your admin status
GET /api/admin-bypass/status

# System administration
GET /api/admin-bypass/all-users
GET /api/admin-bypass/all-dogs  
GET /api/admin-bypass/user-details/:userId
GET /api/admin-bypass/system-stats

# User impersonation (for support)
POST /api/admin-bypass/impersonate
```

## 🔍 Verifying Admin Access

### Check via API
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:8787/api/admin-bypass/status
```

### Check via Frontend
1. Navigate to `/admin` in your browser
2. Look for the "Admin Access Status" component
3. Green status = Admin access enabled
4. Lists which access method granted you admin privileges

### Admin Status Response
```json
{
  "success": true,
  "data": {
    "user_id": "user-123",
    "email": "admin@rawgle.com", 
    "has_admin_access": true,
    "admin_bypass_active": true,
    "access_methods": {
      "database_role": false,
      "environment_email": true,
      "development_mode": true,
      "user_id_whitelist": false
    },
    "capabilities": [
      "Access all user data",
      "View all pets and health records", 
      "Bypass ownership restrictions",
      "Export any data"
    ]
  }
}
```

## 🛡️ Security Considerations

### Development vs Production

- **Development**: Use `BYPASS_AUTH=true` for easy testing
- **Production**: Only use specific email/ID whitelists

### Access Methods Priority

1. **Database role** (`role = 'admin'` or `is_admin = true`)
2. **Email whitelist** (`ADMIN_EMAILS`)
3. **Development mode** (`ENVIRONMENT=development` or `BYPASS_AUTH=true`)
4. **User ID whitelist** (`ADMIN_USER_IDS`)

### Audit Logging

All admin actions are logged including:
- Data access requests
- User impersonation
- System statistics access
- Administrative endpoint usage

## 📱 Frontend Usage

### Admin Dashboard
Visit `/admin` to access the complete admin interface with:

- **Overview Tab**: System-wide statistics
- **Users Tab**: All registered users with management options
- **Pets Tab**: All registered pets and their health data
- **System Tab**: Platform health and configuration

### Admin Status Component
The `AdminBypassStatus` component shows your current access level and can be added to any page:

```jsx
import AdminBypassStatus from '../components/AdminBypassStatus';

// Use in any component
<AdminBypassStatus />
```

## 🚀 Testing Your Setup

1. **Authenticate** with the platform (register/login)
2. **Set admin access** using one of the methods above
3. **Visit** `/admin` to see the admin dashboard
4. **Check status** at `/api/admin-bypass/status`
5. **Test access** to protected endpoints like `/api/admin-bypass/all-users`

## 🔧 Troubleshooting

### "Access denied" errors
- Verify your environment variables are set correctly
- Check that you're authenticated (have a valid JWT token)
- Ensure your email matches exactly (case-sensitive)

### Admin dashboard not loading
- Check browser console for API errors
- Verify the backend is running and accessible
- Confirm your admin access via `/api/admin-bypass/status`

### Can't see admin menu
- The admin link appears in the navigation under "Management"
- Admin access is required to see admin-only features

## 🎯 Quick Test Commands

```bash
# Test authentication
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password"}'

# Check admin status (replace TOKEN with your JWT)
curl -H "Authorization: Bearer TOKEN" \
     http://localhost:8787/api/admin-bypass/status

# View all users (admin endpoint)
curl -H "Authorization: Bearer TOKEN" \
     http://localhost:8787/api/admin-bypass/all-users
```

---

**⚠️ WARNING**: The `BYPASS_AUTH=true` setting grants full admin access to ANY authenticated user. Only use this in development environments!