import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { addStaticAssetHeaders, setCacheHeaders, CACHE_CONFIGS } from './lib/utils/cache';
import { createServerClient } from '@supabase/ssr';

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const { pathname } = request.nextUrl;
  
  // Handle auth token refresh for all routes (except static assets)
  if (!pathname.startsWith('/_next/') && 
      !pathname.startsWith('/static/') &&
      !/\.(png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|eot)$/i.test(pathname)) {
    
    try {
      // Create a Supabase client configured to use cookies
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll().map(cookie => ({
                name: cookie.name,
                value: cookie.value
              }));
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) => {
                response.cookies.set(name, value, options);
              });
            },
          },
        }
      );

      // This automatically refreshes the session if needed
      await supabase.auth.getUser();
      
    } catch (error) {
      console.error('Middleware auth error:', error);
      // Don't block the request on auth errors
    }
  }
  
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