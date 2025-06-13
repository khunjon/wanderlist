'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface AuthLoadingStateProps {
  isInitializing: boolean;
  hasAttemptedAuth: boolean;
  children: React.ReactNode;
}

// Pages that don't require authentication and should load immediately
const PUBLIC_PAGES = [
  '/',
  '/discover',
  '/login',
  '/signup',
  '/auth/callback',
  '/auth/error',
  '/not-found'
];

// Pages that require authentication and should show loading
const PROTECTED_PAGES = [
  '/lists',
  '/profile',
  '/search',
  '/checkin',
  '/admin',
  '/dashboard'
];

function shouldShowAuthLoading(pathname: string): boolean {
  // Always show loading for protected pages
  if (PROTECTED_PAGES.some(page => pathname.startsWith(page))) {
    return true;
  }
  
  // Never show loading for public pages
  if (PUBLIC_PAGES.includes(pathname)) {
    return false;
  }
  
  // For dynamic routes, check patterns
  if (pathname.startsWith('/lists/') && pathname !== '/lists') {
    return true; // Individual list pages need auth to check permissions
  }
  
  // Default to not showing loading for unknown pages
  return false;
}

export default function AuthLoadingState({ 
  isInitializing, 
  hasAttemptedAuth, 
  children 
}: AuthLoadingStateProps) {
  const pathname = usePathname();
  const [showContent, setShowContent] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');

  const needsAuthLoading = shouldShowAuthLoading(pathname);

  // Debug logging
  useEffect(() => {
    const info = `isInitializing: ${isInitializing}, hasAttemptedAuth: ${hasAttemptedAuth}, needsAuthLoading: ${needsAuthLoading}, pathname: ${pathname}`;
    setDebugInfo(info);
    // console.log('[AuthLoadingState]', info);
  }, [isInitializing, hasAttemptedAuth, needsAuthLoading, pathname]);

  // For public pages, show content immediately
  useEffect(() => {
    if (!needsAuthLoading) {
      setShowContent(true);
      setFadeIn(true);
    }
  }, [needsAuthLoading]);

  // Fallback timeout to prevent infinite loading (only for protected pages)
  useEffect(() => {
    if (!needsAuthLoading) return;

    const fallbackTimeout = setTimeout(() => {
      if (isInitializing || !hasAttemptedAuth) {
        // console.warn('[AuthLoadingState] Fallback timeout reached, forcing content display');
        setShowContent(true);
        setFadeIn(true);
      }
    }, 8000);

    return () => clearTimeout(fallbackTimeout);
  }, [isInitializing, hasAttemptedAuth, needsAuthLoading]);

  // Show content when auth is ready (only for protected pages)
  useEffect(() => {
    if (!needsAuthLoading) return;

    if (!isInitializing && hasAttemptedAuth) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setShowContent(true);
        // Trigger fade-in animation
        requestAnimationFrame(() => {
          setFadeIn(true);
        });
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isInitializing, hasAttemptedAuth, needsAuthLoading]);

  // Show loading screen only for protected pages that need auth
  if (needsAuthLoading && (isInitializing || !hasAttemptedAuth) && !showContent) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md mx-auto px-4">
          {/* Logo/Brand Area */}
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-blue-600 rounded-2xl flex items-center justify-center">
              <div className="w-8 h-8 bg-white rounded-lg"></div>
            </div>
            <h1 className="text-2xl font-bold text-white">Placemarks</h1>
          </div>

          {/* Loading Spinner */}
          <div className="flex items-center justify-center space-x-3">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            <span className="text-gray-300 text-lg">Loading your places...</span>
          </div>

          {/* Skeleton Content */}
          <div className="space-y-4 mt-8">
            <div className="animate-pulse space-y-3">
              {/* Skeleton for navigation */}
              <div className="h-4 bg-gray-700 rounded w-3/4 mx-auto"></div>
              <div className="h-4 bg-gray-700 rounded w-1/2 mx-auto"></div>
              
              {/* Skeleton for content cards */}
              <div className="grid grid-cols-1 gap-4 mt-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gray-800 rounded-lg p-4 space-y-3">
                    <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="w-full bg-gray-700 rounded-full h-1 mt-8">
            <div className="bg-blue-500 h-1 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>

          {/* Debug info in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-500 mt-4 p-2 bg-gray-800 rounded">
              Debug: {debugInfo}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`transition-opacity duration-500 ease-in-out ${
        fadeIn ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {children}
    </div>
  );
} 