'use client';

import { useAuth } from './useAuth';

export function useAdmin() {
  const { user, loading } = useAuth();
  
  const isAdmin = !loading && user?.isAdmin === true;
  
  return {
    isAdmin,
    user,
    loading,
  };
} 