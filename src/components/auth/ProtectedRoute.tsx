'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import AuthLoadingState from './AuthLoadingState';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export default function ProtectedRoute({ 
  children, 
  requireAuth = true, 
  redirectTo = '/login',
  fallback 
}: ProtectedRouteProps) {
  const { user, loading, isInitializing, hasAttemptedAuth } = useAuth();
  const router = useRouter();
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    // Don't make routing decisions until auth has been attempted
    if (!hasAttemptedAuth || isInitializing) {
      return;
    }

    const isAuthenticated = !!user;

    if (requireAuth && !isAuthenticated) {
      // User needs to be authenticated but isn't
      router.push(redirectTo);
      return;
    }

    if (!requireAuth && isAuthenticated) {
      // User shouldn't be authenticated but is (e.g., login page when already logged in)
      router.push('/lists');
      return;
    }

    // All checks passed, render the content
    setShouldRender(true);
  }, [user, loading, isInitializing, hasAttemptedAuth, requireAuth, redirectTo, router]);

  // Show loading state during auth initialization
  if (isInitializing || !hasAttemptedAuth) {
    return (
      <AuthLoadingState 
        isInitializing={isInitializing} 
        hasAttemptedAuth={hasAttemptedAuth}
      >
        {children}
      </AuthLoadingState>
    );
  }

  // Show loading state while making routing decisions
  if (!shouldRender) {
    return fallback || (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return <>{children}</>;
} 