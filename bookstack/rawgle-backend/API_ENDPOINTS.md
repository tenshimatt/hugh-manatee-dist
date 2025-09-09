# RAWGLE Backend API - Complete Endpoint Reference

**Base URL:** `http://localhost:8000/api/v1`

## 🏥 Health & Status

- `GET /health` - Service health check
- `GET /api/v1` - API info and available endpoints

## 🔐 Authentication (`/auth/*`)

- `POST /auth/login` - User login
- `POST /auth/register` - User registration  
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Refresh JWT token
- `POST /auth/forgot-password` - Password reset request
- `POST /auth/reset-password` - Reset password with token

## 📚 Knowledge Base (`/blog/*`)

### Posts
- `GET /blog/posts` - List posts with pagination & filters
  - Query params: `q`, `category`, `tags`, `author`, `featured`, `page`, `limit`, `sort`, `order`
- `GET /blog/posts/:id` - Get post by ID
- `GET /blog/posts/slug/:slug` - Get post by slug
- `GET /blog/posts/featured` - Get featured posts
- `GET /blog/posts/recent` - Get recent posts  
- `GET /blog/posts/popular` - Get popular posts
- `POST /blog/posts/:id/view` - Track post view
- `POST /blog/posts/:id/like` - Like/unlike post

### Metadata
- `GET /blog/categories` - List all categories
- `GET /blog/tags` - List all tags with usage counts
- `GET /blog/stats` - Blog statistics and analytics

## 🐕 Pet Management (`/pets/*`)

### Pet CRUD
- `GET /pets` - List user's pets
- `POST /pets` - Create new pet profile
- `GET /pets/:id` - Get specific pet details
- `PUT /pets/:id` - Update pet information
- `DELETE /pets/:id` - Soft delete pet (mark inactive)

### Health Records
- `GET /pets/:id/health` - Get pet health records
  - Query params: `type`, `limit`, `offset`
- `POST /pets/:id/health` - Add health record
- `GET /pets/:id/vaccinations` - Get vaccination records
- `POST /pets/:id/vaccinations` - Add vaccination record
- `GET /pets/:id/upcoming` - Get upcoming appointments & reminders

## 🍽️ Feeding Management (`/feeding/*`)

### Schedules
- `GET /feeding/schedules` - List feeding schedules
  - Query params: `petId`, `active`
- `POST /feeding/schedules` - Create new schedule
- `PUT /feeding/schedules/:id` - Update schedule
- `DELETE /feeding/schedules/:id` - Delete schedule (soft delete)

### Feeding Entries
- `GET /feeding/entries` - Get feeding log entries
  - Query params: `petId`, `scheduleId`, `startDate`, `endDate`, `limit`, `offset`
- `POST /feeding/entries` - Log new feeding entry
- `PUT /feeding/entries/:id` - Update feeding entry
- `DELETE /feeding/entries/:id` - Delete feeding entry

### Goals & Analytics
- `GET /feeding/goals/:petId` - Get nutritional goals for pet
- `POST /feeding/goals` - Create/update nutritional goals
- `GET /feeding/upcoming/:petId` - Get upcoming feeding times
- `GET /feeding/summary/:petId` - Get feeding analytics & summary
  - Query params: `days` (default: 30)

## 🏪 Store Locator (`/stores/*`)

### Store Search
- `GET /stores/nearby` - Geographic store search
  - Required: `latitude`, `longitude`
  - Optional: `radius`, `storeType`, `openNow`, `hasDelivery`, `hasCurbsidePickup`, `limit`, `sortBy`
- `GET /stores/search` - Text search stores
  - Required: `q` (search query)
  - Optional: `storeType`, `openNow`, `hasDelivery`, `hasCurbsidePickup`, `priceRange`, `limit`, `sortBy`
- `GET /stores/:id` - Get specific store details

### Store Metadata
- `GET /stores/types` - List all store types
- `GET /stores/categories` - List all product categories
- `GET /stores/specialties` - List all specialties
- `GET /stores/stats` - Store statistics
- `GET /stores/open` - Currently open stores

## 🧪 TDD Portal (`/tdd/*`)

- `GET /tdd/` - TDD portal dashboard
- `GET /tdd/status` - System status
- `GET /tdd/reports/latest` - Latest test report
- `GET /tdd/logs` - System logs

---

## Common Query Parameters

### Pagination
- `page` - Page number (default: 1)
- `limit` - Items per page (default: varies by endpoint)

### Filtering
- `q` - Search query string
- `category` - Filter by category
- `tags` - Filter by tags
- `featured` - Filter featured items (`true`/`false`)
- `active` - Filter active items (`true`/`false`)

### Sorting
- `sort` - Sort field (`date`, `name`, `rating`, `views`, `likes`)
- `order` - Sort order (`asc`, `desc`)

### Date Filtering
- `startDate` - Filter from date (ISO string)
- `endDate` - Filter to date (ISO string)
- `days` - Number of days back from now

---

## Response Format

All endpoints return JSON in this format:

```typescript
{
  success: boolean;
  data?: any;           // Response payload
  message: string;      // Human-readable message
  error?: string;       // Error details (on failure)
}
```

### List Responses Include Pagination:
```typescript
{
  success: true,
  data: {
    items: [...],       // Array of items
    total: number,      // Total count
    page: number,       // Current page
    limit: number,      // Items per page
    totalPages: number, // Total pages
    hasNext: boolean,   // Has next page
    hasPrev: boolean    // Has previous page
  },
  message: string
}
```

---

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

---

## Content Types

- Request: `application/json`
- Response: `application/json`

---

**Server Status:** ✅ Running at http://localhost:8000
**Last Updated:** September 7, 2025
**API Version:** v1