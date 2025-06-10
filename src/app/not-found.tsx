'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function NotFound() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Set document title for 404 tracking - MixpanelProvider detects "404" in title
    document.title = '404 - Page Not Found | Placemarks';

    // Check auth status directly with Supabase
    const checkAuthStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session?.user);
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsAuthenticated(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Don't render navigation until we know auth status
  if (!mounted || isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center px-4 py-10 bg-gray-800 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-4xl font-bold text-white mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-white mb-2">Page Not Found</h2>
          <p className="text-gray-300 mb-6">
            The page you are looking for doesn't exist or has been moved.
          </p>
          <div className="h-10 bg-gray-700 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  // Determine the appropriate back link based on auth status
  const backLink = isAuthenticated ? '/lists' : '/';
  const backText = isAuthenticated ? 'Back to Lists' : 'Go back home';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center px-4 py-10 bg-gray-800 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-4xl font-bold text-white mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-white mb-2">Page Not Found</h2>
        <p className="text-gray-300 mb-6">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link
          href={backLink}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {backText}
        </Link>
      </div>
    </div>
  );
} 