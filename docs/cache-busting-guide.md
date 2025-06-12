# Cache Busting Implementation Guide

This guide explains the comprehensive cache busting system implemented in your Next.js application, designed for optimal mobile browser compatibility and aggressive cache prevention for the app shell.

## Overview

The cache busting system consists of three main components:

1. **Next.js Configuration** (`next.config.js`) - Server-side cache headers
2. **Middleware** (`src/middleware.ts`) - Request-level cache control
3. **Utility Functions** (`src/lib/utils/cache.ts`) - Programmatic cache management
4. **React Hooks** (`src/hooks/useCache.tsx`) - Client-side cache utilities

## Configuration Details

### 1. Next.js Configuration

The `next.config.js` file includes comprehensive cache headers:

#### App Shell (HTML/JS/CSS) - No Caching
- **HTML files**: `no-cache, no-store, must-revalidate, max-age=0`
- **JavaScript bundles**: `no-cache, no-store, must-revalidate, max-age=0`
- **CSS files**: `no-cache, no-store, must-revalidate, max-age=0`

#### Static Assets - Controlled Caching
- **Images/Fonts**: `public, max-age=86400` (1 day)
- **Versioned Media**: `public, max-age=31536000, immutable` (1 year)

#### API Routes - No Caching
- **All API endpoints**: `no-cache, no-store, must-revalidate, max-age=0`
- **Security headers**: `X-Frame-Options`, `X-XSS-Protection`, `X-Content-Type-Options`

#### Service Workers - No Caching
- **Service worker files**: `no-cache, no-store, must-revalidate, max-age=0`
- **Workbox files**: `no-cache, no-store, must-revalidate, max-age=0`

### 2. Mobile Browser Compatibility

Special headers for mobile browsers:
- `Pragma: no-cache` - Legacy HTTP/1.0 compatibility
- `Expires: 0` - Explicit expiration for older browsers
- `X-Content-Type-Options: nosniff` - Prevent MIME type sniffing
- `Vary: Accept-Encoding, User-Agent` - Proper mobile caching

## Usage Examples

### API Routes

Use the cache utilities in your API routes:

```typescript
import { createNoCacheResponse, createStaticResponse } from '@/lib/utils/cache';

// For dynamic API responses (default)
export async function GET() {
  const data = await fetchDynamicData();
  return createNoCacheResponse(data);
}

// For semi-static API responses (5 minutes cache)
export async function GET() {
  const data = await fetchSemiStaticData();
  return createStaticResponse(data, 'SHORT_CACHE');
}

// For error responses
export async function GET() {
  try {
    const data = await fetchData();
    return createNoCacheResponse(data);
  } catch (error) {
    return createNoCacheResponse({ error: 'Failed to fetch' }, 500);
  }
}
```

### Client-Side Components

Use the React hooks for client-side cache management:

```typescript
import { useCache, useImageCache, useApiCache } from '@/hooks/useCache';

function MyComponent() {
  const { bustCache, forceRefresh, clearCache } = useCache();
  const { getImageUrl, refreshImage } = useImageCache();
  const { fetchWithCacheBust } = useApiCache();

  // Cache-bust a URL
  const handleRefresh = () => {
    const newUrl = bustCache('/api/data');
    // Use newUrl for fetch
  };

  // Cache-bust images (useful for profile photos)
  const profileImageUrl = getImageUrl(user.profilePhoto, true);

  // API calls with cache busting
  const fetchData = async () => {
    const response = await fetchWithCacheBust('/api/user-data');
    return response.json();
  };

  return (
    <div>
      <img src={profileImageUrl} alt="Profile" />
      <button onClick={handleRefresh}>Refresh Data</button>
      <button onClick={clearCache}>Clear Cache</button>
    </div>
  );
}
```

### Image Cache Busting

For dynamic images that need cache busting (like profile photos):

```typescript
import { useImageCache } from '@/hooks/useCache';

function ProfilePhoto({ src, alt }) {
  const { getImageUrl, refreshImage } = useImageCache();
  
  // Get cache-busted image URL
  const imageUrl = getImageUrl(src);
  
  // Force refresh image cache
  const handleImageUpdate = () => {
    refreshImage();
  };

  return (
    <div>
      <img src={imageUrl} alt={alt} />
      <button onClick={handleImageUpdate}>Refresh Image</button>
    </div>
  );
}
```

## Cache Configuration Options

The system provides predefined cache configurations:

```typescript
import { CACHE_CONFIGS } from '@/lib/utils/cache';

// Available configurations:
CACHE_CONFIGS.NO_CACHE        // No caching (default for API routes)
CACHE_CONFIGS.SHORT_CACHE     // 5 minutes cache
CACHE_CONFIGS.MEDIUM_CACHE    // 1 hour cache
CACHE_CONFIGS.LONG_CACHE      // 1 day cache
CACHE_CONFIGS.IMMUTABLE_CACHE // 1 year cache (for versioned assets)
CACHE_CONFIGS.PRIVATE_CACHE   // 5 minutes private cache
```

## Advanced Features

### Custom Cache Options

Create custom cache configurations:

```typescript
import { createCachedResponse } from '@/lib/utils/cache';

export async function GET() {
  const data = await fetchData();
  
  return createCachedResponse(data, {
    public: true,
    maxAge: 1800, // 30 minutes
    staleWhileRevalidate: 300, // 5 minutes stale
    mustRevalidate: true
  });
}
```

### Service Worker Cache Management

For applications with service workers:

```typescript
import { useServiceWorkerCache } from '@/hooks/useCache';

function CacheManager() {
  const { updateServiceWorker, clearServiceWorkerCache, isSupported } = useServiceWorkerCache();

  const handleUpdateSW = async () => {
    const updated = await updateServiceWorker();
    if (updated) {
      console.log('Service worker updated');
    }
  };

  const handleClearSWCache = async () => {
    const cleared = await clearServiceWorkerCache();
    if (cleared) {
      console.log('Service worker cache cleared');
    }
  };

  if (!isSupported) {
    return <div>Service workers not supported</div>;
  }

  return (
    <div>
      <button onClick={handleUpdateSW}>Update Service Worker</button>
      <button onClick={handleClearSWCache}>Clear SW Cache</button>
    </div>
  );
}
```

## Testing Cache Headers

### Development Testing

1. **Browser DevTools**: Check Network tab for cache headers
2. **cURL Testing**:
   ```bash
   curl -I http://localhost:3000/api/health/database
   curl -I http://localhost:3000/
   curl -I http://localhost:3000/_next/static/css/app.css
   ```

### Production Testing

1. **Vercel Headers**: Check response headers in production
2. **Mobile Testing**: Test on actual mobile devices
3. **Cache Validation**: Verify ETags and cache behavior

## Mobile Browser Specific Considerations

### iOS Safari
- Aggressive caching behavior requires explicit `no-store`
- `Pragma: no-cache` needed for HTTP/1.0 compatibility
- Private browsing mode has different cache behavior

### Android Chrome
- Respects standard cache headers
- Service worker cache integration
- Background sync considerations

### Mobile WebViews
- App-specific cache policies may override headers
- Limited cache control in embedded contexts
- Requires explicit cache busting for dynamic content

## Performance Impact

### Benefits
- **Faster Updates**: Users get latest app version immediately
- **Reduced Support Issues**: No stale cache problems
- **Better UX**: Consistent behavior across devices

### Considerations
- **Increased Server Load**: More requests due to no caching
- **Bandwidth Usage**: No cache means more data transfer
- **CDN Efficiency**: Static assets still cached appropriately

## Troubleshooting

### Common Issues

1. **Stale Content**: Check if cache headers are properly set
2. **Mobile Cache Issues**: Verify mobile-specific headers
3. **API Cache Problems**: Ensure API routes use cache utilities
4. **Image Cache Issues**: Use `useImageCache` hook for dynamic images

### Debug Commands

```bash
# Check cache headers
curl -I https://your-domain.com/api/endpoint

# Test mobile user agent
curl -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)" -I https://your-domain.com/

# Verify no-cache headers
curl -H "Cache-Control: no-cache" -I https://your-domain.com/api/endpoint
```

## Best Practices

1. **API Routes**: Always use `createNoCacheResponse()` for dynamic data
2. **Static Assets**: Let Next.js handle with proper versioning
3. **Images**: Use `useImageCache` for user-uploaded content
4. **Service Workers**: Implement proper update mechanisms
5. **Testing**: Test on real mobile devices regularly
6. **Monitoring**: Monitor cache hit rates and performance metrics

## Migration from Existing Code

To migrate existing API routes:

```typescript
// Before
export async function GET() {
  return NextResponse.json(data);
}

// After
import { createNoCacheResponse } from '@/lib/utils/cache';

export async function GET() {
  return createNoCacheResponse(data);
}
```

This ensures consistent cache control across your entire application. 