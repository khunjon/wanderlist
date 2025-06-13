// src/hooks/useAuth.tsx - Enhanced with session validation and error handling
'use client';

import { useState, useEffect, createContext, useContext, ReactNode, Suspense, useCallback, useRef } from 'react';
import { User as SupabaseUser, AuthError } from '@supabase/supabase-js';
import { supabase, User as AppUser, syncUserProfile, onAuthStateChange } from '@/lib/supabase';
import { User } from '@/types';
import { convertToUser } from '@/lib/supabase/typeUtils';
import { useRouter } from 'next/navigation';
import { identifyUser, trackEvent, mixpanel } from '@/lib/mixpanelClient';
import { addCacheBuster } from '@/lib/utils/imageUtils';
import { 
  validateSessionOnStartup, 
  refreshSessionWithRetry, 
  classifyAuthError, 
  SessionMonitor,
  clearStaleSessionData 
} from '@/lib/supabase/authUtils';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
  supabaseUser: SupabaseUser | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  retryAuth: () => Promise<void>;
  sessionRecovered: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  supabaseUser: null,
  signOut: async () => {},
  refreshProfile: async () => {},
  retryAuth: async () => {},
  sessionRecovered: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [sessionRecovered, setSessionRecovered] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  // Refs to prevent multiple simultaneous operations
  const initializingRef = useRef(false);
  const sessionMonitorRef = useRef<SessionMonitor | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshProfile = useCallback(async () => {
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
        setError(err as Error);
      }
    }
  }, [supabaseUser]);

  const handleSignOut = useCallback(async () => {
    try {
      // Stop session monitoring
      if (sessionMonitorRef.current) {
        sessionMonitorRef.current.stop();
        sessionMonitorRef.current = null;
      }
      
      // Clear retry timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
    } catch (err) {
      setError(err as Error);
    }
  }, []);

  const retryAuth = useCallback(async () => {
    if (retryCount >= 3) {
      await clearStaleSessionData();
      setError(new Error('Authentication failed after multiple attempts. Please sign in again.'));
      return;
    }

    setRetryCount(prev => prev + 1);
    setError(null);
    
    // Retry with exponential backoff
    const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
    retryTimeoutRef.current = setTimeout(async () => {
      try {
        const refreshResult = await refreshSessionWithRetry();
        if (!refreshResult.success) {
          throw refreshResult.error || new Error('Session refresh failed');
        }
      } catch (err) {
        setError(err as Error);
      }
    }, delay);
  }, [retryCount]);

  const handleAuthError = useCallback(async (authError: AuthError | Error, context: string) => {
    const classification = classifyAuthError(authError);
    
    if (classification.shouldSignOut) {
      await clearStaleSessionData();
      setUser(null);
      setSupabaseUser(null);
    }
    
    if (classification.isRetryable && retryCount < 3) {
      await retryAuth();
    } else {
      setError(authError as Error);
    }
  }, [retryAuth, retryCount]);

  const initializeAuth = useCallback(async () => {
    if (initializingRef.current) {
      return;
    }

    initializingRef.current = true;

    try {
      // Perform startup session validation
      const startupResult = await validateSessionOnStartup();
      
      setSessionRecovered(startupResult.recovered);
      
      if (startupResult.isAuthenticated && startupResult.user) {
        setSupabaseUser(startupResult.user);
        
        // Sync user profile
        const userProfile = await syncUserProfile(startupResult.user);
        const appUser = convertToUser(startupResult.user, userProfile);
        
        // Apply cache busting to photo URL
        if (appUser.photo_url) {
          appUser.photo_url = addCacheBuster(appUser.photo_url);
        }
        setUser(appUser);

        // Identify user with Mixpanel
        identifyUser(startupResult.user.id, {
          email: startupResult.user.email,
          name: appUser.displayName,
          created_at: startupResult.user.created_at,
          provider: startupResult.user.app_metadata?.provider,
          is_admin: appUser.is_admin,
          photo_url: appUser.photo_url
        });

        // Start session monitoring
        sessionMonitorRef.current = new SessionMonitor({
          onSessionExpired: async () => {
            await handleAuthError(new Error('Session expired'), 'session monitor');
          },
          onSessionRefreshed: (session) => {
            setError(null);
            setRetryCount(0);
          },
          onError: (error) => {
            handleAuthError(error, 'session monitor');
          }
        });
        sessionMonitorRef.current.start();
        
        // Reset retry count on successful auth
        setRetryCount(0);
      } else {
      }
    } catch (err) {
      await handleAuthError(err as Error, 'initialization');
    } finally {
      setLoading(false);
      initializingRef.current = false;
    }
  }, [handleAuthError]);

  useEffect(() => {
    // Check if Supabase client is properly initialized
    if (!supabase) {
      setError(new Error('Supabase client not initialized'));
      setLoading(false);
      return;
    }

    let isInitialized = false;

    // Initialize authentication
    const initAuth = async () => {
      await initializeAuth();
      isInitialized = true;
    };
    
    initAuth();

    // Safety timeout to prevent infinite loading state - but only if auth hasn't initialized
    const loadingTimeout = setTimeout(() => {
      if (!isInitialized) {
        console.warn('[AUTH] Initialization timeout reached, setting loading to false');
        setLoading(false);
      }
    }, 15000);

    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      try {
        setError(null);
        setLoading(false);
        
        if (session?.user) {
          setSupabaseUser(session.user);
          
          const userProfile = await syncUserProfile(session.user);
          const appUser = convertToUser(session.user, userProfile);
          
          // Apply cache busting to photo URL
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
            setRetryCount(0); // Reset retry count on successful refresh
          }
          
          // Start session monitoring if not already running
          if (!sessionMonitorRef.current) {
            sessionMonitorRef.current = new SessionMonitor({
              onSessionExpired: async () => {
                await handleAuthError(new Error('Session expired'), 'session monitor');
              },
              onSessionRefreshed: (refreshedSession) => {
                setError(null);
                setRetryCount(0);
              },
              onError: (error) => {
                handleAuthError(error, 'session monitor');
              }
            });
            sessionMonitorRef.current.start();
          }
        } else {
          setSupabaseUser(null);
          setUser(null);
          
          // Stop session monitoring
          if (sessionMonitorRef.current) {
            sessionMonitorRef.current.stop();
            sessionMonitorRef.current = null;
          }
          
          // Track logout and reset Mixpanel user
          if (event === 'SIGNED_OUT') {
            if (process.env.NEXT_PUBLIC_MIXPANEL_TOKEN) {
              mixpanel.reset();
            }
          }
        }
      } catch (err) {
        await handleAuthError(err as Error, 'auth state change');
      } finally {
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
      
      // Cleanup session monitor
      if (sessionMonitorRef.current) {
        sessionMonitorRef.current.stop();
        sessionMonitorRef.current = null;
      }
      
      // Clear retry timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [initializeAuth, handleAuthError]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      supabaseUser, 
      loading, 
      error, 
      signOut: handleSignOut, 
      refreshProfile,
      retryAuth,
      sessionRecovered
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