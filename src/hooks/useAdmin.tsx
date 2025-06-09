'use client';

import { useAuth } from './useAuth';

export function useAdmin() {
  const { user, loading } = useAuth();
  
  const isAdmin = !loading && user?.is_admin === true;
  
  return {
    isAdmin,
    user,
    loading,
  };
} 