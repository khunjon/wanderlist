# 👤 Users API

This document covers all API endpoints for user profile management, including profile creation, updates, photo uploads, preferences, and user analytics.

## 📋 Overview

The Users API provides comprehensive functionality for managing user profiles, preferences, social links, and profile photos with advanced features like completion tracking and privacy controls.

### 🎯 **Key Features**
- **Profile Management**: Complete CRUD operations for user profiles
- **Photo Upload**: Profile photo upload with automatic optimization
- **Social Integration**: Instagram and TikTok profile linking
- **Privacy Controls**: Configurable profile visibility settings
- **Completion Tracking**: Profile completeness percentage and guidance
- **Preferences**: Notification and language preferences
- **Analytics**: User activity and engagement tracking

### 📊 **Performance Metrics**
| Operation | Avg Response Time | Cache Strategy | Auth Required |
|-----------|-------------------|----------------|---------------|
| **Get Profile** | 45ms | 2min private cache | ✅ Yes |
| **Update Profile** | 85ms | Cache invalidation | ✅ Yes |
| **Photo Upload** | 1.2s | No cache | ✅ Yes |
| **Profile Analytics** | 120ms | 5min private cache | ✅ Yes |

## 🔗 Base Endpoints

### **Base URL Pattern**
```
/api/users/[id]              # Individual user operations
/api/users/[id]/profile      # Profile-specific operations
/api/users/[id]/photo        # Photo management
/api/users/[id]/preferences  # User preferences
/api/users/[id]/analytics    # User analytics
```

## 👤 Profile Management Endpoints

### **GET /api/users/[id]** - Get User Profile

Retrieve user profile information with privacy controls.

#### **Request**
```http
GET /api/users/123e4567-e89b-12d3-a456-426614174000
Authorization: Bearer <token>  # Required for private profiles
```

#### **Response - Public Profile**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "display_name": "John Doe",
  "bio": "Travel enthusiast and coffee lover. Always looking for the next great adventure!",
  "photo_url": "https://example.supabase.co/storage/v1/object/public/profile-photos/user-123/avatar.jpg",
  "profile_visibility": "public",
  "social_links": {
    "instagram": "johndoe_travels",
    "tiktok": "johndoe_adventures"
  },
  "created_at": "2025-01-15T10:00:00Z",
  "updated_at": "2025-06-10T15:30:00Z",
  "last_active": "2025-06-10T14:45:00Z",
  "public_stats": {
    "total_lists": 12,
    "public_lists": 8,
    "total_views": 1250,
    "follower_count": 45
  }
}
```

#### **Response - Enhanced Profile (Self)**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "john.doe@example.com",
  "display_name": "John Doe",
  "bio": "Travel enthusiast and coffee lover. Always looking for the next great adventure!",
  "photo_url": "https://example.supabase.co/storage/v1/object/public/profile-photos/user-123/avatar.jpg",
  "profile_visibility": "public",
  "timezone": "America/Los_Angeles",
  "language_preference": "en",
  "social_links": {
    "instagram": "johndoe_travels",
    "tiktok": "johndoe_adventures"
  },
  "preferences": {
    "email_notifications": true,
    "push_notifications": false,
    "marketing_emails": true,
    "weekly_digest": true
  },
  "profile_completion": {
    "percentage": 85,
    "missing_fields": ["timezone"],
    "is_complete": false
  },
  "created_at": "2025-01-15T10:00:00Z",
  "updated_at": "2025-06-10T15:30:00Z",
  "last_active": "2025-06-10T14:45:00Z",
  "analytics": {
    "total_lists": 12,
    "public_lists": 8,
    "private_lists": 4,
    "total_views": 1250,
    "unique_viewers": 320,
    "engagement_score": 78,
    "follower_count": 45,
    "following_count": 23
  }
}
```

#### **Response Headers**
```http
X-Response-Time: 45ms
Cache-Control: private, max-age=120
X-Profile-Completion: 85%
```

#### **Error Responses**
```json
// 404 - User not found
{
  "error": "User not found",
  "code": "RESOURCE_NOT_FOUND"
}

// 403 - Private profile access denied
{
  "error": "Profile is private",
  "code": "AUTH_INSUFFICIENT",
  "details": {
    "profile_visibility": "private",
    "requires_authentication": true
  }
}
```

### **PUT /api/users/[id]** - Update User Profile

Update user profile information.

#### **Request**
```http
PUT /api/users/123e4567-e89b-12d3-a456-426614174000
Authorization: Bearer <token>
Content-Type: application/json

{
  "display_name": "John Doe",
  "bio": "Updated bio with new adventures and experiences!",
  "profile_visibility": "public",
  "timezone": "America/New_York",
  "language_preference": "en",
  "social_links": {
    "instagram": "johndoe_travels",
    "tiktok": "johndoe_adventures"
  },
  "preferences": {
    "email_notifications": true,
    "push_notifications": false,
    "marketing_emails": false,
    "weekly_digest": true
  }
}
```

#### **Request Body Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `display_name` | string | ❌ No | Display name (1-50 characters) |
| `bio` | string | ❌ No | Profile bio (max 1000 characters) |
| `profile_visibility` | string | ❌ No | "public", "private", or "friends" |
| `timezone` | string | ❌ No | IANA timezone identifier |
| `language_preference` | string | ❌ No | ISO language code (e.g., "en", "es") |
| `social_links` | object | ❌ No | Social media usernames |
| `preferences` | object | ❌ No | User notification preferences |

#### **Response**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "profile_data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "display_name": "John Doe",
    "bio": "Updated bio with new adventures and experiences!",
    "profile_visibility": "public",
    "timezone": "America/New_York",
    "updated_at": "2025-06-10T16:00:00Z",
    "profile_completion": {
      "percentage": 95,
      "missing_fields": [],
      "is_complete": true
    }
  }
}
```

#### **Error Responses**
```json
// 400 - Validation failed
{
  "error": "Bio exceeds maximum length",
  "code": "VALIDATION_FAILED",
  "details": {
    "field": "bio",
    "max_length": 1000,
    "current_length": 1050
  }
}

// 403 - Permission denied
{
  "error": "You can only update your own profile",
  "code": "AUTH_INSUFFICIENT"
}
```

## 📸 Profile Photo Management

### **POST /api/users/[id]/photo** - Upload Profile Photo

Upload and update user profile photo with automatic optimization.

#### **Request**
```http
POST /api/users/123e4567-e89b-12d3-a456-426614174000/photo
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "photo": <file_data>
}
```

#### **Request Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `photo` | File | ✅ Yes | Image file (JPG, PNG, GIF, WebP, max 5MB) |

#### **Supported Formats**
- **JPEG/JPG**: High quality photos
- **PNG**: Images with transparency
- **GIF**: Animated or static images
- **WebP**: Modern optimized format

#### **Image Processing**
- **Automatic Compression**: Optimized for web delivery
- **Resizing**: Maximum 800px width, maintains aspect ratio
- **Format Preservation**: PNG transparency maintained
- **Cache Busting**: Automatic URL updates for immediate display

#### **Response**
```json
{
  "success": true,
  "message": "Profile photo updated successfully",
  "photo_url": "https://example.supabase.co/storage/v1/object/public/profile-photos/user-123/avatar.jpg?t=1623456789",
  "metadata": {
    "original_size": 2048576,
    "compressed_size": 245760,
    "compression_ratio": 88,
    "dimensions": {
      "width": 800,
      "height": 600
    },
    "format": "jpeg"
  }
}
```

#### **Error Responses**
```json
// 400 - Invalid file format
{
  "error": "Unsupported file format",
  "code": "VALIDATION_FAILED",
  "details": {
    "supported_formats": ["jpg", "jpeg", "png", "gif", "webp"],
    "received_format": "bmp"
  }
}

// 413 - File too large
{
  "error": "File size exceeds maximum limit",
  "code": "FILE_TOO_LARGE",
  "details": {
    "max_size": 5242880,
    "file_size": 8388608
  }
}
```

### **DELETE /api/users/[id]/photo** - Delete Profile Photo

Remove user profile photo.

#### **Request**
```http
DELETE /api/users/123e4567-e89b-12d3-a456-426614174000/photo
Authorization: Bearer <token>
```

#### **Response**
```json
{
  "success": true,
  "message": "Profile photo deleted successfully"
}
```

## ⚙️ User Preferences

### **GET /api/users/[id]/preferences** - Get User Preferences

Retrieve user notification and privacy preferences.

#### **Request**
```http
GET /api/users/123e4567-e89b-12d3-a456-426614174000/preferences
Authorization: Bearer <token>
```

#### **Response**
```json
{
  "preferences": {
    "notifications": {
      "email_notifications": true,
      "push_notifications": false,
      "marketing_emails": false,
      "weekly_digest": true,
      "list_comments": true,
      "follower_updates": true
    },
    "privacy": {
      "profile_visibility": "public",
      "show_email": false,
      "show_activity": true,
      "allow_discovery": true
    },
    "display": {
      "timezone": "America/Los_Angeles",
      "language_preference": "en",
      "date_format": "MM/DD/YYYY",
      "distance_unit": "miles"
    }
  }
}
```

### **PUT /api/users/[id]/preferences** - Update User Preferences

Update user preferences and settings.

#### **Request**
```http
PUT /api/users/123e4567-e89b-12d3-a456-426614174000/preferences
Authorization: Bearer <token>
Content-Type: application/json

{
  "notifications": {
    "email_notifications": false,
    "push_notifications": true,
    "weekly_digest": false
  },
  "privacy": {
    "profile_visibility": "friends",
    "allow_discovery": false
  },
  "display": {
    "timezone": "America/New_York",
    "language_preference": "es"
  }
}
```

#### **Response**
```json
{
  "success": true,
  "message": "Preferences updated successfully",
  "preferences": {
    "notifications": {
      "email_notifications": false,
      "push_notifications": true,
      "weekly_digest": false
    },
    "privacy": {
      "profile_visibility": "friends",
      "allow_discovery": false
    },
    "display": {
      "timezone": "America/New_York",
      "language_preference": "es"
    }
  }
}
```

## 📊 User Analytics

### **GET /api/users/[id]/analytics** - Get User Analytics

Retrieve detailed user analytics and engagement metrics.

#### **Request**
```http
GET /api/users/123e4567-e89b-12d3-a456-426614174000/analytics?period=30d
Authorization: Bearer <token>
```

#### **Query Parameters**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `period` | string | 30d | Analytics period: "7d", "30d", "90d", "1y" |
| `include_trends` | boolean | false | Include trend data and comparisons |

#### **Response**
```json
{
  "analytics": {
    "overview": {
      "total_lists": 12,
      "public_lists": 8,
      "private_lists": 4,
      "total_places": 156,
      "total_views": 1250,
      "unique_viewers": 320,
      "engagement_score": 78
    },
    "social": {
      "follower_count": 45,
      "following_count": 23,
      "profile_views": 89,
      "list_shares": 12
    },
    "activity": {
      "lists_created": 3,
      "places_added": 24,
      "notes_written": 18,
      "last_active": "2025-06-10T14:45:00Z",
      "active_days": 22
    },
    "popular_lists": [
      {
        "id": "list-uuid-1",
        "name": "Best Coffee in SF",
        "view_count": 245,
        "place_count": 12
      }
    ],
    "trends": {
      "views_change": "+15%",
      "followers_change": "+8%",
      "engagement_change": "+22%"
    }
  },
  "period": "30d",
  "generated_at": "2025-06-10T16:00:00Z"
}
```

### **GET /api/users/[id]/completion** - Get Profile Completion

Check profile completion status and get improvement suggestions.

#### **Request**
```http
GET /api/users/123e4567-e89b-12d3-a456-426614174000/completion
Authorization: Bearer <token>
```

#### **Response**
```json
{
  "completion": {
    "percentage": 85,
    "is_complete": false,
    "missing_fields": [
      "timezone",
      "bio"
    ],
    "completed_fields": [
      "display_name",
      "photo_url",
      "social_links"
    ],
    "suggestions": [
      {
        "field": "timezone",
        "priority": "high",
        "description": "Add your timezone for better experience",
        "points": 10
      },
      {
        "field": "bio",
        "priority": "medium",
        "description": "Write a bio to help others discover your lists",
        "points": 5
      }
    ]
  },
  "rewards": {
    "current_level": "Explorer",
    "next_level": "Curator",
    "points_needed": 15,
    "total_points": 85
  }
}
```

## 🔍 User Search and Discovery

### **GET /api/users/search** - Search Users

Search for users by display name or username.

#### **Request**
```http
GET /api/users/search?query=john&limit=20&filter=public
```

#### **Query Parameters**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `query` | string | - | Search query for display name |
| `limit` | number | 20 | Maximum results (max 50) |
| `filter` | string | all | Filter: "all", "public", "verified" |

#### **Response**
```json
{
  "users": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "display_name": "John Doe",
      "bio": "Travel enthusiast and coffee lover",
      "photo_url": "https://example.com/avatar.jpg",
      "public_stats": {
        "total_lists": 12,
        "public_lists": 8,
        "follower_count": 45
      },
      "last_active": "2025-06-10T14:45:00Z"
    }
  ],
  "total": 1,
  "has_more": false
}
```

## 🔄 Real-time Integration

### **WebSocket Subscriptions**
```typescript
// Subscribe to profile updates
const subscription = supabase
  .channel('profile-updates')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'users',
    filter: `id=eq.${userId}`
  }, (payload) => {
    handleProfileUpdate(payload)
  })
  .subscribe()

// Subscribe to follower updates
const followersSubscription = supabase
  .channel('follower-updates')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'user_followers',
    filter: `following_id=eq.${userId}`
  }, (payload) => {
    handleFollowerUpdate(payload)
  })
  .subscribe()
```

## 🚀 Performance Optimization

### **Caching Strategy**
- **Profile Data**: 2-minute private cache for authenticated users
- **Public Profiles**: 5-minute public cache for non-sensitive data
- **Analytics**: 5-minute cache with background refresh
- **Photo URLs**: 1-hour cache with automatic cache busting

### **Image Optimization**
- **Automatic Compression**: 80% quality JPEG compression
- **Progressive Loading**: Optimized for fast display
- **CDN Delivery**: Global content delivery network
- **Format Selection**: WebP for modern browsers, JPEG fallback

### **Database Optimization**
- **Indexed Queries**: Optimized user lookup and search
- **Batch Operations**: Efficient bulk updates
- **Connection Pooling**: Optimized database connections
- **Query Optimization**: Sub-50ms response times

## 🔗 Integration Examples

### **Frontend Integration**
```typescript
// Get user profile with error handling
async function getUserProfile(userId: string) {
  try {
    const response = await fetch(`/api/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    })
    
    if (!response.ok) {
      throw new Error(`Profile fetch failed: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Profile fetch error:', error)
    return null
  }
}

// Upload profile photo with progress
async function uploadProfilePhoto(userId: string, file: File) {
  const formData = new FormData()
  formData.append('photo', file)
  
  const response = await fetch(`/api/users/${userId}/photo`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`
    },
    body: formData
  })
  
  return response.json()
}
```

### **Profile Completion Tracking**
```typescript
// Check and display profile completion
async function checkProfileCompletion(userId: string) {
  const response = await fetch(`/api/users/${userId}/completion`)
  const data = await response.json()
  
  // Display completion percentage and suggestions
  updateCompletionUI(data.completion)
}
```

## 🔗 Related Documentation

- **[Authentication API](./auth.md)** - User authentication and session management
- **[Lists API](./lists.md)** - User list management
- **[Database Functions](../database/functions/user-management.md)** - User-related database functions
- **[Security Policies](../security/)** - User data protection and privacy

---

*Last Updated: June 10, 2025* 