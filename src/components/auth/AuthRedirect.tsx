'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface AuthRedirectProps {
  redirectTo: string;
  message?: string;
}

export default function AuthRedirect({ redirectTo, message = 'Redirecting...' }: AuthRedirectProps) {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (user && !loading) {
      console.log('[AUTH REDIRECT] Force redirecting to:', redirectTo);
      
      // Try multiple redirect methods
      const redirect = () => {
        try {
          // Method 1: window.location.href (most reliable)
          window.location.href = redirectTo;
        } catch (error) {
          console.error('[AUTH REDIRECT] window.location.href failed:', error);
          
          // Method 2: window.location.replace (fallback)
          try {
            window.location.replace(redirectTo);
          } catch (error2) {
            console.error('[AUTH REDIRECT] window.location.replace failed:', error2);
            
            // Method 3: Manual page reload with new URL
            window.history.pushState({}, '', redirectTo);
            window.location.reload();
          }
        }
      };

      // Immediate redirect
      redirect();
      
      // Backup redirect after 1 second
      const timer = setTimeout(redirect, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [user, loading, redirectTo]);

  if (!user || loading) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-white text-sm">{message}</p>
        <p className="text-gray-400 text-xs mt-2">Taking you to {redirectTo}</p>
        <button
          onClick={() => window.location.href = redirectTo}
          className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-500"
        >
          Click here if not redirected
        </button>
      </div>
    </div>
  );
} 