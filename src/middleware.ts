import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { addStaticAssetHeaders, setCacheHeaders, CACHE_CONFIGS } from './lib/utils/cache';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Note: We cannot directly access Supabase auth in middleware
  // since it runs on the edge and requires browser/Node.js environment
  // We can use cookies or token approach instead
  
  // For demonstration purposes, this is a placeholder
  // In a real implementation, you would check for authentication tokens/cookies
  // and redirect accordingly
  
  // The actual redirection is handled in the home page component itself
  // This middleware is a placeholder for future server-side auth checks
  
  const response = NextResponse.next();
  const { pathname } = request.nextUrl;
  
  // Add cache control headers based on request type
  
  // Handle static assets
  if (pathname.startsWith('/_next/static/') || 
      pathname.startsWith('/static/') ||
      /\.(png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|eot)$/i.test(pathname)) {
    return addStaticAssetHeaders(response, pathname);
  }
  
  // Handle API routes - no caching
  if (pathname.startsWith('/api/')) {
    return setCacheHeaders(response, CACHE_CONFIGS.NO_CACHE, {
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'X-Content-Type-Options': 'nosniff',
    });
  }
  
  // Handle service worker files - no caching
  if (/\/(sw|service-worker|workbox-.*)\.(js|ts)$/i.test(pathname)) {
    return setCacheHeaders(response, CACHE_CONFIGS.NO_CACHE);
  }
  
  // Handle manifest file - short cache
  if (pathname === '/manifest.json') {
    return setCacheHeaders(response, CACHE_CONFIGS.SHORT_CACHE);
  }
  
  // Handle HTML pages (app shell) - no caching for mobile compatibility
  const acceptHeader = request.headers.get('accept') || '';
  if (acceptHeader.includes('text/html')) {
    return setCacheHeaders(response, CACHE_CONFIGS.NO_CACHE, {
      'X-Content-Type-Options': 'nosniff',
      // Additional mobile browser compatibility headers
      'Vary': 'Accept-Encoding, User-Agent',
    });
  }
  
  // Default response with basic security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  
  return response;
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    // Match all paths except those starting with:
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 