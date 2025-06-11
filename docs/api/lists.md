# 📝 Lists API

This document covers all API endpoints for list management, including creation, retrieval, updates, deletion, and place management within lists.

## 📋 Overview

The Lists API provides comprehensive functionality for managing user-created lists of places, including public list discovery, private list management, and collaborative features.

### 🎯 **Key Features**
- **CRUD Operations**: Create, read, update, delete lists
- **Public Discovery**: Browse and search public lists
- **Privacy Controls**: Public/private list visibility
- **Place Management**: Add/remove places from lists
- **Real-time Updates**: Live collaboration and updates
- **Performance Optimization**: Cached responses and parallel processing

### 📊 **Performance Metrics**
| Operation | Avg Response Time | Cache Strategy | Auth Required |
|-----------|-------------------|----------------|---------------|
| **Get Public Lists** | 85ms | 60s public cache | ❌ No |
| **Get User Lists** | 95ms | 30s private cache | ✅ Yes |
| **Get List Details** | 75ms | 60s public / 30s private | Conditional |
| **Create List** | 120ms | No cache | ✅ Yes |
| **Update List** | 90ms | Cache invalidation | ✅ Yes |

## 🔗 Base Endpoints

### **Base URL Pattern**
```
/api/lists              # Collection operations
/api/lists/[id]         # Individual list operations
/api/lists/public       # Public list discovery
/api/lists/search       # List search operations
```

## 📖 List Retrieval Endpoints

### **GET /api/lists/[id]** - Get List Details

Retrieve detailed information about a specific list, including all places.

#### **Request**
```http
GET /api/lists/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <token>  # Required for private lists
```

#### **Response - Public List**
```json
{
  "list": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Best Coffee Shops in SF",
    "description": "My favorite coffee spots around the city",
    "city": "San Francisco",
    "tags": ["coffee", "work-friendly", "wifi"],
    "is_public": true,
    "view_count": 245,
    "created_at": "2025-06-01T10:00:00Z",
    "updated_at": "2025-06-10T15:30:00Z"
  },
  "places": [
    {
      "id": "place-uuid-1",
      "list_id": "550e8400-e29b-41d4-a716-446655440000",
      "place_id": "google-place-id-1",
      "notes": "Great espresso and quiet atmosphere",
      "added_at": "2025-06-01T10:30:00Z",
      "places": {
        "id": "google-place-id-1",
        "google_place_id": "ChIJN1t_tDeuEmsRUsoyG83frY4",
        "name": "Blue Bottle Coffee",
        "address": "66 Mint St, San Francisco, CA 94103",
        "latitude": 37.7749,
        "longitude": -122.4194,
        "rating": 4.5,
        "photo_url": "https://example.com/photo.jpg",
        "place_types": ["cafe", "food", "establishment"]
      }
    }
  ]
}
```

#### **Response Headers**
```http
X-Response-Time: 75ms
Cache-Control: public, s-maxage=60, stale-while-revalidate=300  # Public lists
Cache-Control: private, max-age=30                              # Private lists
```

#### **Error Responses**
```json
// 404 - List not found
{
  "error": "List not found",
  "code": "RESOURCE_NOT_FOUND"
}

// 401 - Authentication required for private list
{
  "error": "Authentication required for private list",
  "code": "AUTH_REQUIRED"
}

// 403 - Access denied to private list
{
  "error": "Access denied to private list",
  "code": "AUTH_INSUFFICIENT"
}
```

### **GET /api/lists/public** - Get Public Lists

Retrieve paginated public lists for discovery.

#### **Request**
```http
GET /api/lists/public?limit=20&offset=0&sort=view_count&order=desc&search=coffee
```

#### **Query Parameters**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 20 | Number of lists to return (max 100) |
| `offset` | integer | 0 | Number of lists to skip for pagination |
| `sort` | string | view_count | Sort field: `view_count`, `created_at`, `updated_at` |
| `order` | string | desc | Sort order: `asc` or `desc` |
| `search` | string | - | Search query for list name, description, or city |
| `city` | string | - | Filter by city |
| `tags` | string | - | Comma-separated tags to filter by |

#### **Response**
```json
{
  "lists": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Best Coffee Shops in SF",
      "description": "My favorite coffee spots around the city",
      "city": "San Francisco",
      "tags": ["coffee", "work-friendly"],
      "view_count": 245,
      "place_count": 12,
      "user_id": "123e4567-e89b-12d3-a456-426614174000",
      "user_display_name": "John Doe",
      "user_photo_url": "https://example.com/avatar.jpg",
      "created_at": "2025-06-01T10:00:00Z",
      "updated_at": "2025-06-10T15:30:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}
```

### **GET /api/lists/user/[userId]** - Get User Lists

Retrieve all lists for a specific user (requires authentication).

#### **Request**
```http
GET /api/lists/user/123e4567-e89b-12d3-a456-426614174000
Authorization: Bearer <token>
```

#### **Response**
```json
{
  "lists": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Best Coffee Shops in SF",
      "description": "My favorite coffee spots around the city",
      "city": "San Francisco",
      "tags": ["coffee", "work-friendly"],
      "is_public": true,
      "view_count": 245,
      "place_count": 12,
      "created_at": "2025-06-01T10:00:00Z",
      "updated_at": "2025-06-10T15:30:00Z"
    }
  ]
}
```

## ✏️ List Management Endpoints

### **POST /api/lists** - Create List

Create a new list.

#### **Request**
```http
POST /api/lists
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Best Coffee Shops in SF",
  "description": "My favorite coffee spots around the city",
  "city": "San Francisco",
  "tags": ["coffee", "work-friendly", "wifi"],
  "is_public": false
}
```

#### **Request Body Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | ✅ Yes | List name (1-100 characters) |
| `description` | string | ❌ No | List description (max 500 characters) |
| `city` | string | ❌ No | City or location context |
| `tags` | string[] | ❌ No | Array of tags (max 10 tags) |
| `is_public` | boolean | ❌ No | Public visibility (default: false) |

#### **Response**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Best Coffee Shops in SF",
  "description": "My favorite coffee spots around the city",
  "city": "San Francisco",
  "tags": ["coffee", "work-friendly", "wifi"],
  "is_public": false,
  "view_count": 0,
  "created_at": "2025-06-10T16:00:00Z",
  "updated_at": "2025-06-10T16:00:00Z"
}
```

#### **Error Responses**
```json
// 400 - Validation failed
{
  "error": "List name cannot be empty",
  "code": "VALIDATION_FAILED",
  "details": {
    "field": "name",
    "constraint": "required"
  }
}

// 401 - Authentication required
{
  "error": "Authentication required",
  "code": "AUTH_REQUIRED"
}
```

### **PUT /api/lists/[id]** - Update List

Update an existing list.

#### **Request**
```http
PUT /api/lists/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Coffee Shops in SF",
  "description": "My updated favorite coffee spots",
  "is_public": true,
  "tags": ["coffee", "updated"]
}
```

#### **Response**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Updated Coffee Shops in SF",
  "description": "My updated favorite coffee spots",
  "city": "San Francisco",
  "tags": ["coffee", "updated"],
  "is_public": true,
  "view_count": 245,
  "created_at": "2025-06-01T10:00:00Z",
  "updated_at": "2025-06-10T16:15:00Z"
}
```

### **DELETE /api/lists/[id]** - Delete List

Delete a list and all associated places.

#### **Request**
```http
DELETE /api/lists/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <token>
```

#### **Response**
```http
HTTP/1.1 204 No Content
```

#### **Error Responses**
```json
// 404 - List not found
{
  "error": "List not found",
  "code": "RESOURCE_NOT_FOUND"
}

// 403 - Permission denied
{
  "error": "You can only delete your own lists",
  "code": "AUTH_INSUFFICIENT"
}
```

## 📍 Place Management Endpoints

### **POST /api/lists/[id]/places** - Add Place to List

Add a place to a list.

#### **Request**
```http
POST /api/lists/550e8400-e29b-41d4-a716-446655440000/places
Authorization: Bearer <token>
Content-Type: application/json

{
  "google_place_id": "ChIJN1t_tDeuEmsRUsoyG83frY4",
  "notes": "Great espresso and quiet atmosphere"
}
```

#### **Request Body Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `google_place_id` | string | ✅ Yes | Google Places API place ID |
| `notes` | string | ❌ No | Personal notes about the place |

#### **Response**
```json
{
  "id": "place-list-uuid",
  "list_id": "550e8400-e29b-41d4-a716-446655440000",
  "place_id": "internal-place-uuid",
  "notes": "Great espresso and quiet atmosphere",
  "added_at": "2025-06-10T16:30:00Z"
}
```

### **PUT /api/lists/[id]/places/[placeId]** - Update Place Notes

Update notes for a place in a list.

#### **Request**
```http
PUT /api/lists/550e8400-e29b-41d4-a716-446655440000/places/place-uuid
Authorization: Bearer <token>
Content-Type: application/json

{
  "notes": "Updated notes about this place"
}
```

#### **Response**
```json
{
  "id": "place-list-uuid",
  "list_id": "550e8400-e29b-41d4-a716-446655440000",
  "place_id": "place-uuid",
  "notes": "Updated notes about this place",
  "added_at": "2025-06-10T16:30:00Z"
}
```

### **DELETE /api/lists/[id]/places/[placeId]** - Remove Place from List

Remove a place from a list.

#### **Request**
```http
DELETE /api/lists/550e8400-e29b-41d4-a716-446655440000/places/place-uuid
Authorization: Bearer <token>
```

#### **Response**
```http
HTTP/1.1 204 No Content
```

## 📊 Analytics Endpoints

### **POST /api/lists/[id]/view** - Increment View Count

Track a list view for analytics.

#### **Request**
```http
POST /api/lists/550e8400-e29b-41d4-a716-446655440000/view
```

#### **Response**
```json
{
  "view_count": 246
}
```

### **GET /api/lists/[id]/stats** - Get List Statistics

Get detailed statistics for a list (owner only).

#### **Request**
```http
GET /api/lists/550e8400-e29b-41d4-a716-446655440000/stats
Authorization: Bearer <token>
```

#### **Response**
```json
{
  "view_count": 245,
  "place_count": 12,
  "unique_viewers": 89,
  "avg_view_duration": 120,
  "last_viewed": "2025-06-10T15:45:00Z",
  "popular_places": [
    {
      "place_id": "place-uuid-1",
      "name": "Blue Bottle Coffee",
      "view_count": 45
    }
  ]
}
```

## 🔄 Real-time Integration

### **WebSocket Subscriptions**
```typescript
// Subscribe to list changes
const subscription = supabase
  .channel('list-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'lists',
    filter: `id=eq.${listId}`
  }, (payload) => {
    // Handle list updates
    handleListUpdate(payload)
  })
  .subscribe()

// Subscribe to place additions/removals
const placesSubscription = supabase
  .channel('list-places-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'list_places',
    filter: `list_id=eq.${listId}`
  }, (payload) => {
    // Handle place changes
    handlePlaceUpdate(payload)
  })
  .subscribe()
```

## 🚀 Performance Optimization

### **Caching Strategy**
- **Public Lists**: 60-second cache with stale-while-revalidate
- **Private Lists**: 30-second private cache
- **List Details**: Conditional caching based on privacy
- **Search Results**: 5-minute cache for common queries

### **Database Optimization**
- **Parallel Queries**: List and places fetched simultaneously
- **Indexed Queries**: Optimized with covering indexes
- **Connection Pooling**: Efficient database connection management
- **Query Optimization**: Sub-100ms response times

### **Response Headers**
```http
X-Response-Time: 85ms
X-Cache-Status: HIT
X-Database-Time: 25ms
Cache-Control: public, s-maxage=60, stale-while-revalidate=300
```

## 🔗 Related Documentation

- **[Places API](./places.md)** - Place search and management
- **[Users API](./users.md)** - User profile management
- **[Authentication API](./auth.md)** - Authentication patterns
- **[Database Functions](../database/functions/list-operations.md)** - Database function documentation

---

*Last Updated: June 10, 2025* 