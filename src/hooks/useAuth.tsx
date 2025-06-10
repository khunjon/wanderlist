// src/hooks/useAuth.tsx - Migrated to Supabase
'use client';

import { useState, useEffect, createContext, useContext, ReactNode, Suspense } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase, User as AppUser, syncUserProfile, onAuthStateChange } from '@/lib/supabase';
import { User } from '@/types';
import { convertToUser } from '@/lib/supabase/typeUtils';
import { useRouter } from 'next/navigation';
import { identifyUser, trackEvent, mixpanel } from '@/lib/mixpanelClient';
import { addCacheBuster } from '@/lib/utils/imageUtils';

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
        const appUser = convertToUser(supabaseUser, updatedProfile);
        // Apply cache busting to photo URL for immediate display updates
        if (appUser.photo_url) {
          appUser.photo_url = addCacheBuster(appUser.photo_url);
        }
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
      console.error('Supabase client not initialized');
      setError(new Error('Supabase client not initialized'));
      setLoading(false);
      return;
    }

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          throw error;
        }

        if (session?.user) {
          setSupabaseUser(session.user);
          
          const userProfile = await syncUserProfile(session.user);
          
          const appUser = convertToUser(session.user, userProfile);
          // Apply cache busting to photo URL for immediate display updates
          if (appUser.photo_url) {
            appUser.photo_url = addCacheBuster(appUser.photo_url);
          }
          setUser(appUser);

          // Identify user with Mixpanel
          identifyUser(session.user.id, {
            email: session.user.email,
            name: appUser.displayName,
            created_at: session.user.created_at,
            provider: session.user.app_metadata?.provider,
            is_admin: appUser.is_admin,
            photo_url: appUser.photo_url
          });
        }
      } catch (err) {
        console.error('Error getting initial session:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Safety timeout to prevent infinite loading state
    const loadingTimeout = setTimeout(() => {
      setLoading(currentLoading => {
        if (currentLoading) {
          console.warn('Auth loading timeout after 10 seconds - forcing loading to false');
          return false;
        }
        return currentLoading;
      });
    }, 10000); // Increased from 5 to 10 seconds

    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      try {
        setError(null);
        setLoading(false);
        
        if (session?.user) {
          setSupabaseUser(session.user);
          
          const userProfile = await syncUserProfile(session.user);
          
          const appUser = convertToUser(session.user, userProfile);
          // Apply cache busting to photo URL for immediate display updates
          if (appUser.photo_url) {
            appUser.photo_url = addCacheBuster(appUser.photo_url);
          }
          setUser(appUser);

          // Identify user with Mixpanel
          identifyUser(session.user.id, {
            email: session.user.email,
            name: appUser.displayName,
            created_at: session.user.created_at,
            provider: session.user.app_metadata?.provider,
            is_admin: appUser.is_admin,
            photo_url: appUser.photo_url
          });

          // Track login events (but not for new signups which are tracked separately)
          if (event === 'SIGNED_IN') {
            // Check if this is a new user by looking at created_at timestamp
            const userCreatedAt = new Date(session.user.created_at);
            const now = new Date();
            const timeDiff = now.getTime() - userCreatedAt.getTime();
            const isNewUser = timeDiff < 60000; // Less than 1 minute old = new signup

            if (!isNewUser) {
              // This is a returning user login
              trackEvent('User Logged In', {
                provider: session.user.app_metadata?.provider || 'email',
                user_id: session.user.id
              });
            } else if (session.user.app_metadata?.provider === 'google') {
              // This is a new Google OAuth signup
              trackEvent('User Signed Up', {
                provider: 'google',
                user_id: session.user.id
              });
            }
          } else if (event === 'TOKEN_REFRESHED') {
            // Don't track token refresh as a login event
          }
        } else {
          setSupabaseUser(null);
          setUser(null);
          
          // Track logout and reset Mixpanel user
          if (event === 'SIGNED_OUT') {
            trackEvent('User Logged Out');
            if (process.env.NEXT_PUBLIC_MIXPANEL_TOKEN) {
              mixpanel.reset();
            }
          }
        }
      } catch (err) {
        console.error('Error handling auth state change:', err);
        setError(err as Error);
      } finally {
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