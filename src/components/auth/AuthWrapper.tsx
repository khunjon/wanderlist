'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/hooks/useAuth';
import SessionRecovery from './SessionRecovery';
import AuthDebug from '@/components/debug/AuthDebug';

interface AuthWrapperProps {
  children: ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  return (
    <AuthProvider>
      {children}
      <SessionRecovery />
      <AuthDebug />
    </AuthProvider>
  );
} 