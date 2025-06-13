'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/hooks/useAuth';
import SessionRecovery from './SessionRecovery';
import AuthDebug from '@/components/debug/AuthDebug';
import AuthLoadingState from './AuthLoadingState';
import { useAuth } from '@/hooks/useAuth';

interface AuthWrapperProps {
  children: ReactNode;
}

function AuthContent({ children }: { children: ReactNode }) {
  const { isInitializing, hasAttemptedAuth } = useAuth();

  return (
    <AuthLoadingState 
      isInitializing={isInitializing} 
      hasAttemptedAuth={hasAttemptedAuth}
    >
      {children}
      <SessionRecovery />
      <AuthDebug />
    </AuthLoadingState>
  );
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  return (
    <AuthProvider>
      <AuthContent>
        {children}
      </AuthContent>
    </AuthProvider>
  );
} 