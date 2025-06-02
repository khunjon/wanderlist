'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/hooks/useAuth';

interface AuthWrapperProps {
  children: ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  return <AuthProvider>{children}</AuthProvider>;
} 