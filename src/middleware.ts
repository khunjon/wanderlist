import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { addStaticAssetHeaders, setCacheHeaders, CACHE_CONFIGS } from './lib/utils/cache';
import { createServerClient } from '@supabase/ssr';

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const { pathname } = request.nextUrl;
  
  // Skip auth checks for auth-related routes to prevent redirect loops
  if (pathname.startsWith('/auth/') || 
      pathname.startsWith('/login') || 
      pathname.startsWith('/signup')) {
    return response;
  }
  
  // Handle auth session refresh for authenticated routes
  if (pathname.startsWith('/lists') || 
      pathname.startsWith('/profile') || 
      pathname.startsWith('/admin')) {
    
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

      // Attempt to refresh the session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.warn('Middleware session check error:', error);
      }
      
      // If no session and trying to access protected route, redirect to login
      // But add a small delay check to handle OAuth callback timing issues
      if (!session && (pathname.startsWith('/lists') || pathname.startsWith('/profile') || pathname.startsWith('/admin'))) {
        // Check if this might be coming from an OAuth callback by looking for recent auth activity
        const hasRecentAuthActivity = request.headers.get('referer')?.includes('/auth/callback') ||
                                     request.headers.get('referer')?.includes('/login') ||
                                     request.cookies.get('sb-auth-token') ||
                                     request.cookies.get('sb-refresh-token');
        
        // If there's recent auth activity, let the client handle the redirect to avoid loops
        if (hasRecentAuthActivity) {
          console.log('[MIDDLEWARE] Detected recent auth activity, allowing client-side auth handling for:', pathname);
          return response;
        }
        
        console.log('[MIDDLEWARE] No session found, redirecting to login for:', pathname);
        const redirectUrl = new URL('/login', request.url);
        redirectUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(redirectUrl);
      }
      
      // If we have a session, log success
      if (session) {
        console.log('[MIDDLEWARE] Session found for user:', session.user.id, 'accessing:', pathname);
      }
      
      // Add session info to response headers for debugging
      if (session) {
        response.headers.set('X-Auth-Status', 'authenticated');
        response.headers.set('X-User-ID', session.user.id);
      } else {
        response.headers.set('X-Auth-Status', 'unauthenticated');
      }
      
    } catch (error) {
      console.error('Middleware auth error:', error);
      // Don't block the request on auth errors, let the client handle it
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