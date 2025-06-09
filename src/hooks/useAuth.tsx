// src/hooks/useAuth.tsx - Migrated to Supabase
'use client';

import { useState, useEffect, createContext, useContext, ReactNode, Suspense } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase, User as AppUser, syncUserProfile, onAuthStateChange } from '@/lib/supabase';
import { User } from '@/types';
import { convertToLegacyUser } from '@/lib/supabase/typeUtils';
import { useRouter } from 'next/navigation';
import { AuthPerformance } from '@/lib/utils/performance';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
  supabaseUser: SupabaseUser | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  supabaseUser: null,
  signOut: async () => {},
  refreshProfile: async () => {},
});

// Use the centralized conversion function

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refreshProfile = async () => {
    if (supabaseUser) {
      try {
        const updatedProfile = await syncUserProfile(supabaseUser);
        const appUser = convertToLegacyUser(supabaseUser, updatedProfile);
        setUser(appUser);
      } catch (err) {
        console.error('Error refreshing profile:', err);
        setError(err as Error);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      console.error('Error signing out:', err);
      setError(err as Error);
    }
  };

  useEffect(() => {
    // Check if Supabase client is properly initialized
    if (!supabase) {
      console.error('❌ Supabase client not initialized');
      setError(new Error('Supabase client not initialized'));
      setLoading(false);
      return;
    }

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('🔍 Getting initial session...');
        
        console.log('📡 Calling supabase.auth.getSession()...');
        const { data: { session }, error } = await Promise.race([
          supabase.auth.getSession(),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('getSession timeout')), 2000)
          )
        ]);
        console.log('📡 getSession() completed');
        
        if (error) {
          console.error('❌ Error getting session:', error);
          throw error;
        }

        if (session?.user) {
          console.log('✅ Found existing session for:', session.user.email);
          console.log('👤 Setting supabase user...');
          setSupabaseUser(session.user);
          
          console.log('🔄 Syncing user profile...');
          const userProfile = await Promise.race([
            syncUserProfile(session.user),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('syncUserProfile timeout')), 3000)
            )
          ]);
          console.log('🔄 Profile sync completed');
          
          console.log('🔄 Converting to legacy user...');
          const appUser = convertToLegacyUser(session.user, userProfile);
          console.log('🔄 Conversion completed');
          
          console.log('👤 Setting app user...');
          setUser(appUser);
          console.log('👤 App user set');
        } else {
          console.log('ℹ️ No existing session found');
        }
      } catch (err) {
        console.error('❌ Error getting initial session:', err);
        // Don't set error for timeout - let auth state change handle it
        if (err instanceof Error && err.message === 'getSession timeout') {
          console.log('⏰ getSession timed out, relying on auth state change listener');
        } else {
          setError(err as Error);
        }
      } finally {
        console.log('✅ Initial session check complete, setting loading to false');
        setLoading(false);
      }
    };

    getInitialSession();

    // Safety timeout to prevent infinite loading state
    const loadingTimeout = setTimeout(() => {
      setLoading(currentLoading => {
        if (currentLoading) {
          console.warn('⚠️ Auth loading timeout - forcing loading to false');
          return false;
        }
        return currentLoading;
      });
    }, 5000); // Reduced to 5 seconds for faster debugging

    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      try {
        console.log('🔄 Auth state change:', event, session?.user?.email || 'no user');
        setError(null);
        setLoading(false); // Always set loading to false when auth state changes
        
        if (session?.user) {
          AuthPerformance.trackAuthRedirect();
          setSupabaseUser(session.user);
          const userProfile = await syncUserProfile(session.user);
          const appUser = convertToLegacyUser(session.user, userProfile);
          setUser(appUser);
          AuthPerformance.trackAuthComplete();
        } else {
          setSupabaseUser(null);
          setUser(null);
        }
      } catch (err) {
        console.error('❌ Error handling auth state change:', err);
        setError(err as Error);
      } finally {
        console.log('✅ Auth state change complete, setting loading to false');
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      supabaseUser, 
      loading, 
      error, 
      signOut: handleSignOut, 
      refreshProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

// Hook that provides Supabase authentication state
export function useAuthState() {
  const { supabaseUser, loading, error } = useAuth();
  return [supabaseUser, loading, error] as const;
}

// Hook for getting user profile
export function useUserProfile() {
  const { user, loading, error, refreshProfile } = useAuth();
  return { profile: user, loading, error, refreshProfile };
}

// Navigation wrapper that uses router
function NavigationHandler({ redirectUrl, isAuthenticated }: { redirectUrl: string, isAuthenticated: boolean }) {
  const router = useRouter();
  
  useEffect(() => {
    if (!isAuthenticated) {
      router.push(redirectUrl);
    }
  }, [isAuthenticated, redirectUrl, router]);
  
  return null;
}

export function useRequireAuth(redirectUrl = '/') {
  const { user, loading } = useAuth();
  
  const isAuthenticated = !loading && !!user;
  
  return { 
    user, 
    loading,
    NavigationHandler: () => (
      <Suspense fallback={null}>
        <NavigationHandler 
          redirectUrl={redirectUrl} 
          isAuthenticated={isAuthenticated} 
        />
      </Suspense>
    )
  };
}