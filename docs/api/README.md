---
title: "Wanderlist API Documentation"
last_updated: "2025-01-15"
status: "current"
review_cycle: "monthly"
---

# 🚀 Wanderlist API Documentation

> **📍 Navigation:** [Documentation Hub](../README.md) → [API Documentation](./README.md) → API Overview

This directory contains comprehensive documentation for Wanderlist's REST API endpoints, including authentication, data operations, and integration patterns.

## 📋 API Overview

### 🎯 **API Architecture**
- **Base Technology**: Next.js 15 App Router API Routes
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Authentication**: Supabase Auth with Google OAuth
- **Response Format**: JSON with consistent error handling
- **Performance**: Optimized with caching and parallel processing

### 📊 **API Status**
| Component | Status | Performance | Security |
|-----------|--------|-------------|----------|
| **Lists API** | ✅ COMPLETED | <100ms avg | ✅ RLS Protected |
| **Places API** | ✅ COMPLETED | <200ms avg | ✅ Rate Limited |
| **Users API** | ✅ COMPLETED | <50ms avg | ✅ Auth Required |
| **Auth API** | ✅ COMPLETED | <300ms avg | ✅ OAuth 2.0 |
| **Admin API** | ✅ COMPLETED | <500ms avg | ✅ Admin Only |
| **GraphQL API** | 📋 PLANNED | TBD | Q4 2025 |
| **Webhooks** | 📋 PLANNED | TBD | Q1 2026 |

## 🌐 Base URL and Common Patterns

### **Base URL**
```
Production:  https://placemarks.xyz/api
Development: http://localhost:3000/api
```

### **✅ Common Request Headers - COMPLETED**
```http
Content-Type: application/json
Authorization: Bearer <supabase_access_token>
```

### **✅ Common Response Headers - COMPLETED**
```http
Content-Type: application/json
X-Response-Time: 45ms
Cache-Control: public, s-maxage=60, stale-while-revalidate=300
```

### **✅ URL Patterns - COMPLETED**
```
/api/lists              # List collection operations
/api/lists/[id]         # Individual list operations
/api/places/search      # Place search operations
/api/places/details     # Place detail operations
/api/users/[id]         # User profile operations
/api/auth/*             # Authentication operations
/api/admin/*            # Administrative operations
/api/health/*           # Health check endpoints
```

## 🔐 Authentication Overview

### **✅ Authentication Methods - COMPLETED**
1. **Supabase Session Cookies** (Primary)
2. **Bearer Token** (API Access)
3. **Google OAuth 2.0** (User Login)

### **✅ Authentication Flow - COMPLETED**
```typescript
// 1. User authenticates via Google OAuth
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: 'https://placemarks.xyz/auth/callback' }
})

// 2. Session established with cookies
// 3. API requests include session automatically
const response = await fetch('/api/lists', {
  headers: { 'Authorization': `Bearer ${session.access_token}` }
})
```

### **✅ Authentication Requirements - COMPLETED**
| Endpoint Category | Auth Required | Permission Level |
|-------------------|---------------|------------------|
| **Public Lists** | ❌ No | Public read access |
| **Private Lists** | ✅ Yes | Owner or collaborator |
| **User Profiles** | ✅ Yes | Self or public profiles |
| **Place Search** | ❌ No | Rate limited |
| **Admin Operations** | ✅ Yes | Admin role required |

## ⚠️ Error Handling

### **✅ Standard Error Response Format - COMPLETED**
```json
{
  "error": "Error message description",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error context",
    "timestamp": "2025-06-10T12:00:00Z"
  }
}
```

### **✅ HTTP Status Codes - COMPLETED**
| Status Code | Meaning | Common Causes |
|-------------|---------|---------------|
| **200** | Success | Request completed successfully |
| **201** | Created | Resource created successfully |
| **400** | Bad Request | Invalid parameters or request format |
| **401** | Unauthorized | Missing or invalid authentication |
| **403** | Forbidden | Insufficient permissions |
| **404** | Not Found | Resource does not exist |
| **409** | Conflict | Duplicate resource or constraint violation |
| **429** | Too Many Requests | Rate limit exceeded |
| **500** | Internal Server Error | Server-side error occurred |

### **✅ Common Error Codes - COMPLETED**
```typescript
// Authentication Errors
"AUTH_REQUIRED"           // Authentication token required
"AUTH_INVALID"            // Invalid or expired token
"AUTH_INSUFFICIENT"       // Insufficient permissions

// Validation Errors
"VALIDATION_FAILED"       // Request validation failed
"MISSING_PARAMETER"       // Required parameter missing
"INVALID_FORMAT"          // Invalid parameter format

// Resource Errors
"RESOURCE_NOT_FOUND"      // Requested resource not found
"RESOURCE_CONFLICT"       // Resource already exists
"RESOURCE_LIMIT"          // Resource limit exceeded

// Database Errors
"DATABASE_ERROR"          // Database operation failed
"CONSTRAINT_VIOLATION"    // Database constraint violated
"PERMISSION_DENIED"       // Database permission denied
```

## 🚦 Rate Limiting

### **✅ Rate Limits by Endpoint - COMPLETED**
| Endpoint Category | Rate Limit | Window | Scope |
|-------------------|------------|--------|-------|
| **Place Search** | 100 requests | 1 minute | Per IP |
| **List Operations** | 200 requests | 1 minute | Per user |
| **User Operations** | 50 requests | 1 minute | Per user |
| **Admin Operations** | 20 requests | 1 minute | Per admin |

### **✅ Rate Limit Headers - COMPLETED**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1623456789
X-RateLimit-Window: 60
```

### **✅ Rate Limit Exceeded Response - COMPLETED**
```json
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": {
    "limit": 100,
    "window": 60,
    "reset_at": "2025-06-10T12:01:00Z"
  }
}
```

## 📊 Performance Optimization

### **✅ Caching Strategy - COMPLETED**
```http
# Public Lists (60 seconds)
Cache-Control: public, s-maxage=60, stale-while-revalidate=300

# Private Lists (30 seconds)
Cache-Control: private, max-age=30

# Place Search (5 minutes)
Cache-Control: public, s-maxage=300, stale-while-revalidate=600

# User Profiles (2 minutes)
Cache-Control: private, max-age=120
```

### **✅ Performance Headers - COMPLETED**
```http
X-Response-Time: 45ms        # Server processing time
X-Cache-Status: HIT          # Cache hit/miss status
X-Database-Time: 12ms        # Database query time
```

### **✅ Optimization Features - COMPLETED**
- **Parallel Processing**: Multiple database queries executed simultaneously
- **Connection Pooling**: Optimized database connection management
- **Query Optimization**: Indexed queries with sub-100ms response times
- **Response Compression**: Gzip compression for large responses

## 📁 API Endpoint Documentation

### 🗂️ **Core APIs**

#### **✅ Lists Management API - COMPLETED**
- **[Lists API Documentation](./lists.md)** - Complete CRUD operations for list management
- **Endpoints**: `/api/lists`, `/api/lists/[id]`, `/api/lists/[id]/places`
- **Features**: Public/private lists, place management, analytics tracking
- **Performance**: <100ms average response time

#### **✅ Places Integration API - COMPLETED**
- **[Places API Documentation](./places.md)** - Google Places integration and local data
- **Endpoints**: `/api/places/search`, `/api/places/details`, `/api/places/photos`
- **Features**: Search, details, photo optimization, rate limiting
- **Performance**: <200ms average response time

#### **✅ User Management API - COMPLETED**
- **[Users API Documentation](./users.md)** - Profile management and user operations
- **Endpoints**: `/api/users/[id]`, `/api/users/[id]/profile`, `/api/users/[id]/preferences`
- **Features**: Profile management, photo upload, privacy controls
- **Performance**: <50ms average response time

#### **✅ Authentication API - COMPLETED**
- **[Authentication API Documentation](./auth.md)** - OAuth and session management
- **Endpoints**: `/api/auth/*`, OAuth callbacks, session management
- **Features**: Google OAuth, email/password, session handling
- **Performance**: <300ms average response time

---

## 🔗 Related Documentation

### **🏗️ Architecture & Design**
- **[System Architecture](../architecture/overview.md)** - Overall system design and API architecture
- **[Database Schema](../database/README.md)** - Data model underlying the APIs
- **[Security Model](../security/README.md)** - Authentication and authorization patterns

### **🛠️ Development Resources**
- **[Component Integration](../components/README.md)** - Frontend API integration patterns
- **[Performance Optimization](../performance/README.md)** - API performance strategies
- **[Setup Guides](../setup/README.md)** - Environment configuration for API development

### **🔧 Troubleshooting & Support**
- **[API Troubleshooting](../troubleshooting/README.md)** - Common API issues and solutions
- **[Authentication Issues](../troubleshooting/auth.md)** - OAuth and session troubleshooting
- **[Performance Issues](../troubleshooting/performance.md)** - API performance debugging

## 🎯 Next Steps

### **For New Developers**
1. **[Lists API](./lists.md)** - Start with core list management functionality
2. **[Authentication API](./auth.md)** - Understand user authentication flow
3. **[Component Integration](../components/README.md)** - Learn frontend integration patterns

### **For Feature Development**
1. **[Database Functions](../database/functions/)** - Backend logic implementation
2. **[Security Policies](../security/README.md)** - Implementing secure endpoints
3. **[Performance Guidelines](../performance/utilities.md)** - API performance best practices

### **For API Integration**
1. **[Places API](./places.md)** - Google Places integration patterns
2. **[Users API](./users.md)** - User management and profile features
3. **[Troubleshooting](../troubleshooting/README.md)** - Common integration issues

---

*📍 **Parent Topic:** [API Documentation](./README.md) | **Documentation Hub:** [Main Index](../README.md)*
- **[Lists API](./lists.md)** - List management and discovery
  - Create, read, update, delete lists
  - Public list discovery and search
  - List sharing and collaboration
  - Place management within lists

- **[Places API](./places.md)** - Place search and management
  - Google Places API integration
  - Place search with location filtering
  - Place details and metadata
  - Place photo management

- **[Users API](./users.md)** - User profile management
  - User profile CRUD operations
  - Profile photo upload and management
  - User preferences and settings
  - User statistics and analytics

- **[Authentication API](./auth.md)** - Authentication and authorization
  - Google OAuth integration
  - Session management
  - Password reset and recovery
  - User registration and login

### 🔧 **System APIs**
- **[Admin API](./admin.md)** - Administrative operations
  - Platform statistics and analytics
  - User management and moderation
  - System health monitoring
  - Database maintenance operations

- **[Health API](./health.md)** - System health monitoring
  - Database health checks
  - Performance monitoring
  - Service status verification
  - Maintenance status reporting

## 🔄 Real-time Features

### **WebSocket Connections**
```typescript
// Subscribe to list changes
const subscription = supabase
  .channel('list-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'lists',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    // Handle real-time updates
    handleListUpdate(payload)
  })
  .subscribe()
```

### **Real-time Events**
- **List Updates**: Real-time list modifications
- **Place Additions**: Live place additions to lists
- **User Activity**: User presence and activity updates
- **System Notifications**: Important system announcements

## 🧪 Testing and Development

### **API Testing**
```bash
# Health check
curl https://placemarks.xyz/api/health/database

# Search places
curl "https://placemarks.xyz/api/places/search?query=coffee&city=San Francisco"

# Get public lists
curl https://placemarks.xyz/api/lists/public
```

### **Development Tools**
- **Supabase Dashboard**: Database query analysis and monitoring
- **Vercel Analytics**: API performance and usage metrics
- **MCP Integration**: Real-time database debugging with Cursor
- **Performance Monitoring**: Built-in response time tracking

### **Environment Variables**
```bash
# Required for API functionality
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key
NEXT_PUBLIC_APP_URL=https://placemarks.xyz
```

## 📈 API Analytics

### **Key Metrics**
- **Average Response Time**: 85ms across all endpoints
- **Success Rate**: 99.8% uptime and reliability
- **Cache Hit Rate**: 75% for public content
- **Database Performance**: Sub-100ms query times

### **Monitoring Dashboards**
- **Supabase Dashboard**: Database performance and query analysis
- **Vercel Analytics**: API endpoint usage and performance
- **Google Cloud Console**: Maps API usage and quotas

## 🔗 Related Documentation

- **[Database Documentation](../database/)** - Database schema and functions
- **[Architecture Overview](../architecture/)** - System design and patterns
- **[Setup Guides](../setup/)** - Development environment configuration
- **[Troubleshooting](../troubleshooting/)** - Common issues and solutions

---

*Last Updated: June 10, 2025* 