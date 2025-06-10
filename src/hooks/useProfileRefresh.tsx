'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ProfileRefreshContextType {
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const ProfileRefreshContext = createContext<ProfileRefreshContextType | undefined>(undefined);

export function ProfileRefreshProvider({ children }: { children: ReactNode }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return (
    <ProfileRefreshContext.Provider value={{ refreshTrigger, triggerRefresh }}>
      {children}
    </ProfileRefreshContext.Provider>
  );
}

export function useProfileRefresh() {
  const context = useContext(ProfileRefreshContext);
  if (context === undefined) {
    throw new Error('useProfileRefresh must be used within a ProfileRefreshProvider');
  }
  return context;
} 