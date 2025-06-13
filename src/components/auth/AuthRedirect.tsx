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
  }, []);

  useEffect(() => {
    if (user && !loading) {
      const timer = setTimeout(() => {
        try {
          window.location.replace(redirectTo);
        } catch (error) {
          console.error('[AUTH REDIRECT] Redirect failed:', error);
          window.location.href = redirectTo;
        }
      }, 1500);
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
          onClick={() => window.location.replace(redirectTo)}
          className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-500"
        >
          Click here if not redirected
        </button>
      </div>
    </div>
  );
} 