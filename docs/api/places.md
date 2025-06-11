# 🗺️ Places API

This document covers all API endpoints for place search, details retrieval, and place management, including Google Places API integration.

## 📋 Overview

The Places API provides comprehensive functionality for searching places using Google Places API, retrieving detailed place information, and managing place data within the Wanderlist platform.

### 🎯 **Key Features**
- **Google Places Integration**: Direct integration with Google Places API
- **Place Search**: Location-based search with filtering
- **Place Details**: Comprehensive place information retrieval
- **Photo Management**: Place photo handling and optimization
- **Caching Strategy**: Optimized response caching for performance
- **Rate Limiting**: Intelligent rate limiting to manage API costs

### 📊 **Performance Metrics**
| Operation | Avg Response Time | Cache Strategy | Rate Limit |
|-----------|-------------------|----------------|------------|
| **Place Search** | 180ms | 5min public cache | 100/min per IP |
| **Place Details** | 150ms | 10min public cache | 200/min per IP |
| **Place Photos** | 120ms | 1hr public cache | 500/min per IP |

## 🔗 Base Endpoints

### **Base URL Pattern**
```
/api/places/search      # Place search operations
/api/places/details     # Place detail retrieval
/api/places/photo       # Place photo operations
```

## 🔍 Place Search Endpoints

### **GET /api/places/search** - Search Places

Search for places using Google Places API with optional location filtering.

#### **Request**
```http
GET /api/places/search?query=coffee&city=San Francisco&limit=20
```

#### **Query Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | ✅ Yes | Search query (e.g., "coffee", "restaurant") |
| `city` | string | ❌ No | City context for search results |
| `latitude` | number | ❌ No | Latitude for location-based search |
| `longitude` | number | ❌ No | Longitude for location-based search |
| `radius` | number | ❌ No | Search radius in meters (default: 50000) |
| `type` | string | ❌ No | Place type filter (e.g., "restaurant", "cafe") |
| `limit` | number | ❌ No | Maximum results to return (default: 20, max: 60) |

#### **Response**
```json
{
  "places": [
    {
      "place_id": "ChIJN1t_tDeuEmsRUsoyG83frY4",
      "name": "Blue Bottle Coffee",
      "formatted_address": "66 Mint St, San Francisco, CA 94103, USA",
      "geometry": {
        "location": {
          "lat": 37.7749295,
          "lng": -122.4194155
        }
      },
      "rating": 4.5,
      "user_ratings_total": 1234,
      "price_level": 2,
      "types": [
        "cafe",
        "food",
        "point_of_interest",
        "establishment"
      ],
      "photos": [
        {
          "photo_reference": "ATtYBwI...",
          "height": 3024,
          "width": 4032,
          "html_attributions": ["<a href=\"...\">User Name</a>"]
        }
      ],
      "opening_hours": {
        "open_now": true,
        "weekday_text": [
          "Monday: 6:00 AM – 7:00 PM",
          "Tuesday: 6:00 AM – 7:00 PM",
          "Wednesday: 6:00 AM – 7:00 PM",
          "Thursday: 6:00 AM – 7:00 PM",
          "Friday: 6:00 AM – 7:00 PM",
          "Saturday: 7:00 AM – 7:00 PM",
          "Sunday: 7:00 AM – 7:00 PM"
        ]
      },
      "business_status": "OPERATIONAL"
    }
  ],
  "status": "OK",
  "next_page_token": "ATtYBwI...",
  "search_metadata": {
    "query": "coffee",
    "city": "San Francisco",
    "total_results": 45,
    "search_time_ms": 180
  }
}
```

#### **Response Headers**
```http
X-Response-Time: 180ms
Cache-Control: public, s-maxage=300, stale-while-revalidate=600
X-Rate-Limit-Remaining: 95
X-Google-API-Usage: 1
```

#### **Error Responses**
```json
// 400 - Missing required query parameter
{
  "error": "Query parameter is required",
  "code": "MISSING_PARAMETER",
  "details": {
    "parameter": "query",
    "message": "Search query cannot be empty"
  }
}

// 429 - Rate limit exceeded
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": {
    "limit": 100,
    "window": 60,
    "reset_at": "2025-06-10T12:01:00Z"
  }
}

// 500 - Google Places API error
{
  "error": "Failed to search places",
  "code": "EXTERNAL_API_ERROR",
  "details": {
    "provider": "google_places",
    "status": "OVER_QUERY_LIMIT"
  }
}
```

### **GET /api/places/search/nearby** - Nearby Places Search

Search for places near a specific location.

#### **Request**
```http
GET /api/places/search/nearby?latitude=37.7749&longitude=-122.4194&radius=1000&type=restaurant
```

#### **Query Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `latitude` | number | ✅ Yes | Latitude coordinate |
| `longitude` | number | ✅ Yes | Longitude coordinate |
| `radius` | number | ❌ No | Search radius in meters (default: 1000, max: 50000) |
| `type` | string | ❌ No | Place type filter |
| `keyword` | string | ❌ No | Keyword to match against place names |
| `min_rating` | number | ❌ No | Minimum rating filter (1-5) |
| `open_now` | boolean | ❌ No | Filter for currently open places |

#### **Response**
```json
{
  "places": [
    {
      "place_id": "ChIJN1t_tDeuEmsRUsoyG83frY4",
      "name": "Blue Bottle Coffee",
      "vicinity": "66 Mint St, San Francisco",
      "geometry": {
        "location": {
          "lat": 37.7749295,
          "lng": -122.4194155
        }
      },
      "rating": 4.5,
      "price_level": 2,
      "types": ["cafe", "food"],
      "opening_hours": {
        "open_now": true
      },
      "distance_meters": 150
    }
  ],
  "status": "OK"
}
```

## 📍 Place Details Endpoints

### **GET /api/places/details** - Get Place Details

Retrieve comprehensive details for a specific place.

#### **Request**
```http
GET /api/places/details?placeId=ChIJN1t_tDeuEmsRUsoyG83frY4&fields=all
```

#### **Query Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `placeId` | string | ✅ Yes | Google Places API place ID |
| `fields` | string | ❌ No | Comma-separated fields or "all" for all fields |
| `language` | string | ❌ No | Language code for localized results (default: "en") |

#### **Available Fields**
```typescript
// Basic fields (included by default)
"place_id", "name", "formatted_address", "geometry"

// Contact fields
"formatted_phone_number", "international_phone_number", "website"

// Atmosphere fields  
"rating", "user_ratings_total", "price_level", "reviews"

// Details fields
"opening_hours", "types", "business_status", "utc_offset"

// Photo fields
"photos"
```

#### **Response**
```json
{
  "place": {
    "place_id": "ChIJN1t_tDeuEmsRUsoyG83frY4",
    "name": "Blue Bottle Coffee",
    "formatted_address": "66 Mint St, San Francisco, CA 94103, USA",
    "formatted_phone_number": "(415) 495-3394",
    "international_phone_number": "+1 415-495-3394",
    "website": "https://bluebottlecoffee.com/",
    "geometry": {
      "location": {
        "lat": 37.7749295,
        "lng": -122.4194155
      },
      "viewport": {
        "northeast": {
          "lat": 37.7762784802915,
          "lng": -122.4180665197085
        },
        "southwest": {
          "lat": 37.7735805197085,
          "lng": -122.4207644802915
        }
      }
    },
    "rating": 4.5,
    "user_ratings_total": 1234,
    "price_level": 2,
    "types": [
      "cafe",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "opening_hours": {
      "open_now": true,
      "periods": [
        {
          "close": {
            "day": 0,
            "time": "1900"
          },
          "open": {
            "day": 0,
            "time": "0700"
          }
        }
      ],
      "weekday_text": [
        "Monday: 6:00 AM – 7:00 PM",
        "Tuesday: 6:00 AM – 7:00 PM",
        "Wednesday: 6:00 AM – 7:00 PM",
        "Thursday: 6:00 AM – 7:00 PM",
        "Friday: 6:00 AM – 7:00 PM",
        "Saturday: 7:00 AM – 7:00 PM",
        "Sunday: 7:00 AM – 7:00 PM"
      ]
    },
    "photos": [
      {
        "photo_reference": "ATtYBwI...",
        "height": 3024,
        "width": 4032,
        "html_attributions": ["<a href=\"...\">User Name</a>"]
      }
    ],
    "reviews": [
      {
        "author_name": "John Doe",
        "author_url": "https://www.google.com/maps/contrib/...",
        "language": "en",
        "profile_photo_url": "https://lh3.googleusercontent.com/...",
        "rating": 5,
        "relative_time_description": "2 weeks ago",
        "text": "Great coffee and atmosphere!",
        "time": 1623456789
      }
    ],
    "business_status": "OPERATIONAL",
    "utc_offset": -480
  },
  "status": "OK"
}
```

#### **Response Headers**
```http
X-Response-Time: 150ms
Cache-Control: public, s-maxage=600, stale-while-revalidate=1200
X-Google-API-Usage: 1
```

#### **Error Responses**
```json
// 400 - Missing place ID
{
  "error": "placeId parameter is required",
  "code": "MISSING_PARAMETER"
}

// 404 - Place not found
{
  "error": "Place not found",
  "code": "RESOURCE_NOT_FOUND",
  "details": {
    "place_id": "invalid_place_id",
    "google_status": "NOT_FOUND"
  }
}
```

## 📸 Place Photo Endpoints

### **GET /api/places/photo** - Get Place Photo

Retrieve optimized place photos from Google Places.

#### **Request**
```http
GET /api/places/photo?photo_reference=ATtYBwI...&max_width=800&max_height=600
```

#### **Query Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `photo_reference` | string | ✅ Yes | Google Places photo reference |
| `max_width` | number | ❌ No | Maximum width in pixels (default: 400, max: 1600) |
| `max_height` | number | ❌ No | Maximum height in pixels (default: 400, max: 1600) |

#### **Response**
```http
HTTP/1.1 302 Found
Location: https://lh3.googleusercontent.com/places/...
Cache-Control: public, max-age=3600
```

#### **Alternative JSON Response**
```json
{
  "photo_url": "https://lh3.googleusercontent.com/places/...",
  "width": 800,
  "height": 600,
  "html_attributions": ["<a href=\"...\">User Name</a>"]
}
```

### **GET /api/places/photos/[placeId]** - Get All Place Photos

Retrieve all available photos for a place.

#### **Request**
```http
GET /api/places/photos/ChIJN1t_tDeuEmsRUsoyG83frY4?max_width=400&limit=10
```

#### **Query Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `max_width` | number | ❌ No | Maximum width for all photos |
| `max_height` | number | ❌ No | Maximum height for all photos |
| `limit` | number | ❌ No | Maximum number of photos (default: 10, max: 20) |

#### **Response**
```json
{
  "photos": [
    {
      "photo_reference": "ATtYBwI...",
      "photo_url": "https://lh3.googleusercontent.com/places/...",
      "width": 400,
      "height": 300,
      "html_attributions": ["<a href=\"...\">User Name</a>"]
    }
  ],
  "total_photos": 15
}
```

## 🔄 Place Data Management

### **POST /api/places** - Create/Update Place

Create or update place data in the local database.

#### **Request**
```http
POST /api/places
Authorization: Bearer <token>
Content-Type: application/json

{
  "google_place_id": "ChIJN1t_tDeuEmsRUsoyG83frY4",
  "name": "Blue Bottle Coffee",
  "address": "66 Mint St, San Francisco, CA 94103",
  "latitude": 37.7749295,
  "longitude": -122.4194155,
  "rating": 4.5,
  "photo_url": "https://example.com/photo.jpg",
  "place_types": ["cafe", "food"],
  "phone": "(415) 495-3394",
  "website": "https://bluebottlecoffee.com/",
  "price_level": 2,
  "opening_hours": {
    "open_now": true,
    "weekday_text": ["Monday: 6:00 AM – 7:00 PM"]
  }
}
```

#### **Request Body Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `google_place_id` | string | ✅ Yes | Google Places API place ID |
| `name` | string | ✅ Yes | Place name |
| `address` | string | ✅ Yes | Formatted address |
| `latitude` | number | ✅ Yes | Latitude coordinate |
| `longitude` | number | ✅ Yes | Longitude coordinate |
| `rating` | number | ❌ No | Place rating (1-5) |
| `photo_url` | string | ❌ No | Primary photo URL |
| `place_types` | string[] | ❌ No | Array of place types |
| `phone` | string | ❌ No | Phone number |
| `website` | string | ❌ No | Website URL |
| `price_level` | number | ❌ No | Price level (0-4) |
| `opening_hours` | object | ❌ No | Opening hours data |

#### **Response**
```json
{
  "id": "internal-place-uuid",
  "google_place_id": "ChIJN1t_tDeuEmsRUsoyG83frY4",
  "name": "Blue Bottle Coffee",
  "address": "66 Mint St, San Francisco, CA 94103",
  "latitude": 37.7749295,
  "longitude": -122.4194155,
  "rating": 4.5,
  "photo_url": "https://example.com/photo.jpg",
  "place_types": ["cafe", "food"],
  "created_at": "2025-06-10T16:00:00Z",
  "updated_at": "2025-06-10T16:00:00Z"
}
```

### **GET /api/places/[id]** - Get Local Place Data

Retrieve place data from the local database.

#### **Request**
```http
GET /api/places/internal-place-uuid
```

#### **Response**
```json
{
  "id": "internal-place-uuid",
  "google_place_id": "ChIJN1t_tDeuEmsRUsoyG83frY4",
  "name": "Blue Bottle Coffee",
  "address": "66 Mint St, San Francisco, CA 94103",
  "latitude": 37.7749295,
  "longitude": -122.4194155,
  "rating": 4.5,
  "photo_url": "https://example.com/photo.jpg",
  "place_types": ["cafe", "food"],
  "phone": "(415) 495-3394",
  "website": "https://bluebottlecoffee.com/",
  "price_level": 2,
  "created_at": "2025-06-01T10:00:00Z",
  "updated_at": "2025-06-10T16:00:00Z"
}
```

## 🚦 Rate Limiting & Quotas

### **Rate Limits**
| Endpoint | Rate Limit | Window | Scope |
|----------|------------|--------|-------|
| **Place Search** | 100 requests | 1 minute | Per IP address |
| **Place Details** | 200 requests | 1 minute | Per IP address |
| **Place Photos** | 500 requests | 1 minute | Per IP address |

### **Google Places API Quotas**
- **Search Requests**: 1000 per day (free tier)
- **Details Requests**: 1000 per day (free tier)
- **Photo Requests**: Unlimited (but rate limited)

### **Cost Optimization**
- **Aggressive Caching**: 5-10 minute cache for search results
- **Field Selection**: Only request needed fields for details
- **Batch Processing**: Group multiple requests when possible
- **Fallback Handling**: Graceful degradation when quotas exceeded

## 📊 Performance Optimization

### **Caching Strategy**
```http
# Place Search Results (5 minutes)
Cache-Control: public, s-maxage=300, stale-while-revalidate=600

# Place Details (10 minutes)
Cache-Control: public, s-maxage=600, stale-while-revalidate=1200

# Place Photos (1 hour)
Cache-Control: public, max-age=3600, stale-while-revalidate=7200
```

### **Response Optimization**
- **Parallel Processing**: Multiple API calls executed simultaneously
- **Response Compression**: Gzip compression for large responses
- **Image Optimization**: Automatic photo resizing and compression
- **CDN Integration**: Photo delivery via CDN when possible

### **Error Handling**
```typescript
// Graceful fallback for API failures
try {
  const places = await searchPlacesGoogle(query)
  return places
} catch (error) {
  if (error.status === 'OVER_QUERY_LIMIT') {
    // Return cached results or local data
    return await searchPlacesLocal(query)
  }
  throw error
}
```

## 🔗 Integration Examples

### **Frontend Integration**
```typescript
// Search places with error handling
async function searchPlaces(query: string, city?: string) {
  try {
    const response = await fetch(`/api/places/search?query=${encodeURIComponent(query)}&city=${city}`)
    
    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`)
    }
    
    const data = await response.json()
    return data.places
  } catch (error) {
    console.error('Place search error:', error)
    return []
  }
}

// Get place details with caching
async function getPlaceDetails(placeId: string) {
  const response = await fetch(`/api/places/details?placeId=${placeId}&fields=all`)
  return response.json()
}
```

### **Real-time Updates**
```typescript
// Subscribe to place updates
const subscription = supabase
  .channel('place-updates')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'places'
  }, (payload) => {
    handlePlaceUpdate(payload)
  })
  .subscribe()
```

## 🔗 Related Documentation

- **[Lists API](./lists.md)** - List management and place associations
- **[Google Places API](https://developers.google.com/maps/documentation/places/web-service)** - Official Google documentation
- **[Database Schema](../database/schema.sql)** - Place data structure
- **[Performance Optimization](../performance/)** - Caching and optimization strategies

---

*Last Updated: June 10, 2025* 