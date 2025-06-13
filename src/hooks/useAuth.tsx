// src/hooks/useAuth.tsx - Enhanced with session validation and error handling
'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User as SupabaseUser, AuthError } from '@supabase/supabase-js';
import { supabase, User as AppUser, syncUserProfile, onAuthStateChange } from '@/lib/supabase';
import { User } from '@/types';
import { convertToUser } from '@/lib/supabase/typeUtils';
import { identifyUser, trackEvent, mixpanel } from '@/lib/mixpanelClient';
import { addCacheBuster } from '@/lib/utils/imageUtils';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
  supabaseUser: SupabaseUser | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasAttemptedAuth: boolean;
  isInitializing: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  supabaseUser: null,
  signOut: async () => {},
  refreshProfile: async () => {},
  hasAttemptedAuth: false,
  isInitializing: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasAttemptedAuth, setHasAttemptedAuth] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const refreshProfile = async () => {
    if (supabaseUser) {
      try {
        const updatedProfile = await syncUserProfile(supabaseUser);
        const appUser = convertToUser(supabaseUser, updatedProfile);
        
        if (appUser.photo_url) {
          appUser.photo_url = addCacheBuster(appUser.photo_url);
        }
        setUser(appUser);
      } catch (err) {
        setError(err as Error);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      setError(err as Error);
    }
  };

  const initializeAuth = async () => {
    // console.log('[AUTH] Starting simplified initialization');
    setIsInitializing(true);

    try {
      // Simple timeout for auth check
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Auth check timeout')), 3000);
      });
      
      // console.log('[AUTH] Checking current user');
      
      const userPromise = supabase.auth.getUser();
      let userData: any;
      
      try {
        userData = await Promise.race([userPromise, timeoutPromise]);
      } catch (timeoutError) {
        // console.warn('[AUTH] Auth check timed out, assuming no user');
        setUser(null);
        setSupabaseUser(null);
        setHasAttemptedAuth(true);
        setLoading(false);
        setIsInitializing(false);
        return;
      }
      
      const user = userData?.data?.user;
      
      // console.log('[AUTH] Auth check result:', { 
      //   hasUser: !!user, 
      //   userError: userData?.error?.message
      // });
      
      setHasAttemptedAuth(true);
      
      if (user && !userData.error) {
        // console.log('[AUTH] User found, setting up user state');
        setSupabaseUser(user);
        
        try {
          const userProfile = await syncUserProfile(user);
          const appUser = convertToUser(user, userProfile);
          
          if (appUser.photo_url) {
            appUser.photo_url = addCacheBuster(appUser.photo_url);
          }
          setUser(appUser);

          // Identify user with Mixpanel
          identifyUser(user.id, {
            email: user.email,
            name: appUser.displayName,
            created_at: user.created_at,
            provider: user.app_metadata?.provider,
            is_admin: appUser.is_admin,
            photo_url: appUser.photo_url
          });
        } catch (profileError) {
          console.error('[AUTH] Error syncing user profile:', profileError);
          // Still set basic user even if profile sync fails
          setSupabaseUser(user);
          setUser({
            id: user.id,
            email: user.email || '',
            displayName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            photo_url: user.user_metadata?.avatar_url || null,
            is_admin: false,
            createdAt: new Date(user.created_at),
            created_at: user.created_at,
            updated_at: user.updated_at || user.created_at
          });
        }
      } else {
        // console.log('[AUTH] No authenticated user found');
        setUser(null);
        setSupabaseUser(null);
      }
    } catch (err) {
      console.error('[AUTH] Initialization failed:', err);
      setError(err as Error);
      setHasAttemptedAuth(true);
      setUser(null);
      setSupabaseUser(null);
    } finally {
      // console.log('[AUTH] Initialization complete');
      setLoading(false);
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    if (!supabase) {
      setError(new Error('Supabase client not initialized'));
      setLoading(false);
      setIsInitializing(false);
      setHasAttemptedAuth(true);
      return;
    }

    // Initialize auth
    initializeAuth();

    // Safety timeout
    const loadingTimeout = setTimeout(() => {
      // console.warn('[AUTH] Safety timeout reached');
      setLoading(false);
      setIsInitializing(false);
      if (!hasAttemptedAuth) {
        setHasAttemptedAuth(true);
      }
    }, 8000);

    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      try {
        setError(null);
        
        if (session?.user) {
          setSupabaseUser(session.user);
          
          const userProfile = await syncUserProfile(session.user);
          const appUser = convertToUser(session.user, userProfile);
          
          if (appUser.photo_url) {
            appUser.photo_url = addCacheBuster(appUser.photo_url);
          }
          setUser(appUser);

          // Track login events
          if (event === 'SIGNED_IN') {
            const userCreatedAt = new Date(session.user.created_at);
            const now = new Date();
            const timeDiff = now.getTime() - userCreatedAt.getTime();
            const isNewUser = timeDiff < 60000;

            if (!isNewUser) {
              trackEvent('User Logged In', {
                provider: session.user.app_metadata?.provider || 'email',
                user_id: session.user.id
              });
            } else if (session.user.app_metadata?.provider === 'google') {
              trackEvent('User Signed Up', {
                provider: 'google',
                user_id: session.user.id
              });
            }
          }
        } else {
          setSupabaseUser(null);
          setUser(null);
          
          if (event === 'SIGNED_OUT') {
            if (process.env.NEXT_PUBLIC_MIXPANEL_TOKEN) {
              mixpanel.reset();
            }
          }
        }
        
        if (!hasAttemptedAuth) {
          setHasAttemptedAuth(true);
        }
      } catch (err) {
        console.error('[AUTH] Auth state change error:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
        setIsInitializing(false);
      }
    });

    return () => {
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array - only run once

  return (
    <AuthContext.Provider value={{
      user,
      supabaseUser,
      loading,
      error,
      signOut: handleSignOut,
      refreshProfile,
      hasAttemptedAuth,
      isInitializing
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}