import { NextResponse } from 'next/server';

/**
 * Cache control utility functions for Next.js API routes and responses
 * Provides consistent cache busting and control across the application
 */

export interface CacheOptions {
  maxAge?: number;
  sMaxAge?: number;
  staleWhileRevalidate?: number;
  mustRevalidate?: boolean;
  noCache?: boolean;
  noStore?: boolean;
  public?: boolean;
  private?: boolean;
  immutable?: boolean;
}

/**
 * Generate cache control header value from options
 */
export function generateCacheControl(options: CacheOptions): string {
  const directives: string[] = [];

  if (options.noCache) directives.push('no-cache');
  if (options.noStore) directives.push('no-store');
  if (options.mustRevalidate) directives.push('must-revalidate');
  if (options.public) directives.push('public');
  if (options.private) directives.push('private');
  if (options.immutable) directives.push('immutable');
  
  if (options.maxAge !== undefined) directives.push(`max-age=${options.maxAge}`);
  if (options.sMaxAge !== undefined) directives.push(`s-maxage=${options.sMaxAge}`);
  if (options.staleWhileRevalidate !== undefined) {
    directives.push(`stale-while-revalidate=${options.staleWhileRevalidate}`);
  }

  return directives.join(', ');
}

/**
 * Predefined cache control configurations
 */
export const CACHE_CONFIGS = {
  // No caching - for dynamic API responses and app shell
  NO_CACHE: {
    noCache: true,
    noStore: true,
    mustRevalidate: true,
    maxAge: 0,
  } as CacheOptions,

  // Short cache - for semi-dynamic content (5 minutes)
  SHORT_CACHE: {
    public: true,
    maxAge: 300,
    staleWhileRevalidate: 60,
  } as CacheOptions,

  // Medium cache - for stable content (1 hour)
  MEDIUM_CACHE: {
    public: true,
    maxAge: 3600,
    staleWhileRevalidate: 300,
  } as CacheOptions,

  // Long cache - for static assets (1 day)
  LONG_CACHE: {
    public: true,
    maxAge: 86400,
    staleWhileRevalidate: 3600,
  } as CacheOptions,

  // Immutable cache - for versioned assets (1 year)
  IMMUTABLE_CACHE: {
    public: true,
    maxAge: 31536000,
    immutable: true,
  } as CacheOptions,

  // Private cache - for user-specific content (5 minutes)
  PRIVATE_CACHE: {
    private: true,
    maxAge: 300,
    mustRevalidate: true,
  } as CacheOptions,
} as const;

/**
 * Set cache control headers on a NextResponse
 */
export function setCacheHeaders(
  response: NextResponse,
  options: CacheOptions,
  additionalHeaders?: Record<string, string>
): NextResponse {
  const cacheControl = generateCacheControl(options);
  
  response.headers.set('Cache-Control', cacheControl);
  
  // Add mobile browser compatibility headers for no-cache scenarios
  if (options.noCache || options.noStore) {
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }
  
  // Add ETag for better cache validation
  if (!options.noCache && !options.noStore) {
    const etag = `"${Date.now()}-${Math.random().toString(36).substr(2, 9)}"`;
    response.headers.set('ETag', etag);
  }
  
  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Add any additional headers
  if (additionalHeaders) {
    Object.entries(additionalHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }
  
  return response;
}

/**
 * Create a NextResponse with cache control headers
 */
export function createCachedResponse(
  data: any,
  options: CacheOptions,
  status: number = 200,
  additionalHeaders?: Record<string, string>
): NextResponse {
  const response = NextResponse.json(data, { status });
  return setCacheHeaders(response, options, additionalHeaders);
}

/**
 * Create a no-cache response for API routes
 */
export function createNoCacheResponse(
  data: any,
  status: number = 200,
  additionalHeaders?: Record<string, string>
): NextResponse {
  return createCachedResponse(data, CACHE_CONFIGS.NO_CACHE, status, {
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    ...additionalHeaders,
  });
}

/**
 * Create a cached response for static-like API data
 */
export function createStaticResponse(
  data: any,
  cacheType: keyof typeof CACHE_CONFIGS = 'MEDIUM_CACHE',
  status: number = 200,
  additionalHeaders?: Record<string, string>
): NextResponse {
  return createCachedResponse(data, CACHE_CONFIGS[cacheType], status, additionalHeaders);
}

/**
 * Generate cache-busting query parameter
 */
export function getCacheBustParam(): string {
  return `cb=${Date.now()}`;
}

/**
 * Add cache-busting parameter to URL
 */
export function addCacheBusting(url: string): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${getCacheBustParam()}`;
}

/**
 * Check if request should bypass cache based on headers
 */
export function shouldBypassCache(request: Request): boolean {
  const cacheControl = request.headers.get('cache-control');
  const pragma = request.headers.get('pragma');
  
  return (
    cacheControl?.includes('no-cache') ||
    cacheControl?.includes('max-age=0') ||
    pragma === 'no-cache'
  );
}

/**
 * Get cache key for request
 */
export function getCacheKey(request: Request, additionalKeys: string[] = []): string {
  const url = new URL(request.url);
  const baseKey = `${request.method}:${url.pathname}${url.search}`;
  
  if (additionalKeys.length > 0) {
    return `${baseKey}:${additionalKeys.join(':')}`;
  }
  
  return baseKey;
}

/**
 * Middleware helper to add cache headers to static assets
 */
export function addStaticAssetHeaders(response: NextResponse, pathname: string): NextResponse {
  // Images, fonts, and other media
  if (/\.(png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|eot)$/i.test(pathname)) {
    return setCacheHeaders(response, CACHE_CONFIGS.LONG_CACHE);
  }
  
  // JavaScript and CSS files (prevent caching for app shell)
  if (/\.(js|css)$/i.test(pathname) && pathname.includes('/_next/static/')) {
    return setCacheHeaders(response, CACHE_CONFIGS.NO_CACHE);
  }
  
  // Service worker files
  if (/\/(sw|service-worker|workbox-.*)\.(js|ts)$/i.test(pathname)) {
    return setCacheHeaders(response, CACHE_CONFIGS.NO_CACHE);
  }
  
  return response;
}

/**
 * Generate version hash for cache busting
 */
export function generateVersionHash(): string {
  // In production, you might want to use build time or git commit hash
  return process.env.NODE_ENV === 'production' 
    ? process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) || Date.now().toString()
    : Date.now().toString();
}

/**
 * Create versioned asset URL
 */
export function createVersionedUrl(baseUrl: string, version?: string): string {
  const versionParam = version || generateVersionHash();
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}v=${versionParam}`;
} 