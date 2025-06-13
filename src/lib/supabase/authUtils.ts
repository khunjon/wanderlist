import { supabase } from './client'
import type { Session, AuthError, User as SupabaseUser } from '@supabase/supabase-js'

// Auth debugging and logging utilities
export const authLogger = {
  // debug: (message: string, data?: any) => {
  //   if (process.env.NODE_ENV === 'development') {
  //     console.log(`[AUTH DEBUG] ${message}`, data || '')
  //   }
  // },
  // info: (message: string, data?: any) => {
  //   console.log(`[AUTH INFO] ${message}`, data || '')
  // },
  warn: (message: string, data?: any) => {
    console.warn(`[AUTH WARN] ${message}`, data || '')
  },
  error: (message: string, error?: any) => {
    console.error(`[AUTH ERROR] ${message}`, error || '')
  }
}

// Session validation utilities
export interface SessionValidationResult {
  isValid: boolean
  session: Session | null
  error?: AuthError | null
  needsRefresh?: boolean
  isExpired?: boolean
}

export async function validateSession(): Promise<SessionValidationResult> {
  try {
    // Use a shorter timeout for faster response
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    
    const { data, error } = await supabase.auth.getSession();
    clearTimeout(timeoutId);
    
    const session = data?.session;
    
    if (error) {
      authLogger.error('Session validation error:', error)
      return {
        isValid: false,
        session: null,
        error
      }
    }

    if (!session) {
      return {
        isValid: false,
        session: null
      }
    }

    // Check if session is expired
    const now = Math.floor(Date.now() / 1000)
    const expiresAt = session.expires_at
    
    // If expires_at is null/undefined, treat as invalid session
    if (!expiresAt || expiresAt <= 0) {
      authLogger.warn('Session has no expiration time, treating as invalid')
      return {
        isValid: false,
        session,
        isExpired: true,
        needsRefresh: true
      }
    }
    
    const isExpired = now >= expiresAt
    const needsRefresh = now >= (expiresAt - 300) // Refresh 5 minutes before expiry

    if (isExpired) {
      authLogger.warn('Session is expired')
      return {
        isValid: false,
        session,
        isExpired: true,
        needsRefresh: true
      }
    }

    return {
      isValid: true,
      session,
      needsRefresh
    }
  } catch (error) {
    // Handle abort error gracefully
    if (error instanceof Error && error.name === 'AbortError') {
      authLogger.warn('Session validation timed out')
      return {
        isValid: false,
        session: null,
        error: new Error('Session validation timeout') as AuthError
      }
    }
    
    authLogger.error('Session validation failed:', error)
    return {
      isValid: false,
      session: null,
      error: error as AuthError
    }
  }
}

// Token refresh with retry mechanism
export interface RefreshResult {
  success: boolean
  session: Session | null
  error?: AuthError | null
  retryCount?: number
}

export async function refreshSessionWithRetry(maxRetries = 3): Promise<RefreshResult> {
  let lastError: AuthError | null = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { data, error } = await supabase.auth.refreshSession()
      
      if (error) {
        lastError = error
        authLogger.warn(`Token refresh attempt ${attempt} failed:`, error)
        
        // Don't retry certain errors
        if (error.message?.includes('refresh_token_not_found') || 
            error.message?.includes('invalid_grant')) {
          authLogger.error('Non-retryable refresh error:', error)
          break
        }
        
        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
        continue
      }

      if (data.session) {
        return {
          success: true,
          session: data.session,
          retryCount: attempt
        }
      }
    } catch (error) {
      lastError = error as AuthError
      authLogger.error(`Token refresh attempt ${attempt} threw error:`, error)
    }
  }

  authLogger.error('All token refresh attempts failed:', lastError)
  return {
    success: false,
    session: null,
    error: lastError,
    retryCount: maxRetries
  }
}

// Session recovery utilities
export async function recoverSession(): Promise<SessionValidationResult> {
  
  // First, validate current session
  const validation = await validateSession()
  
  if (validation.isValid && !validation.needsRefresh) {
    return validation
  }

  // If session needs refresh or is expired, try to refresh
  if (validation.needsRefresh || validation.isExpired) {
    
    const refreshResult = await refreshSessionWithRetry()
    
    if (refreshResult.success && refreshResult.session) {
      return {
        isValid: true,
        session: refreshResult.session
      }
    }
  }

  // If all else fails, clear any stale session data
  authLogger.warn('Session recovery failed, clearing stale data')
  await clearStaleSessionData()
  
  return {
    isValid: false,
    session: null,
    error: validation.error
  }
}

// Clear stale session data
export async function clearStaleSessionData(): Promise<void> {
  try {
    
    // Clear localStorage auth data
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith('sb-') && key.includes('auth')) {
          localStorage.removeItem(key)
        }
      })
    }
    
    // Sign out to clear any server-side session
    await supabase.auth.signOut()
    
  } catch (error) {
    authLogger.error('Failed to clear stale session data:', error)
  }
}

// Auth error classification
export function classifyAuthError(error: AuthError | Error): {
  type: 'network' | 'auth' | 'session' | 'unknown'
  isRetryable: boolean
  shouldSignOut: boolean
} {
  const message = error.message?.toLowerCase() || ''
  
  // Network errors - retryable
  if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
    return { type: 'network', isRetryable: true, shouldSignOut: false }
  }
  
  // Session/token errors - may need sign out
  if (message.includes('refresh_token_not_found') || 
      message.includes('invalid_grant') ||
      message.includes('jwt') ||
      message.includes('token')) {
    return { type: 'session', isRetryable: false, shouldSignOut: true }
  }
  
  // Auth errors - usually not retryable
  if (message.includes('invalid_credentials') || 
      message.includes('unauthorized') ||
      message.includes('forbidden')) {
    return { type: 'auth', isRetryable: false, shouldSignOut: true }
  }
  
  // Unknown errors - try once
  return { type: 'unknown', isRetryable: true, shouldSignOut: false }
}

// Session monitoring utilities
export class SessionMonitor {
  private checkInterval: ReturnType<typeof setInterval> | null = null
  private onSessionExpired?: () => void
  private onSessionRefreshed?: (session: Session) => void
  private onError?: (error: AuthError) => void

  constructor(options?: {
    onSessionExpired?: () => void
    onSessionRefreshed?: (session: Session) => void
    onError?: (error: AuthError) => void
  }) {
    this.onSessionExpired = options?.onSessionExpired
    this.onSessionRefreshed = options?.onSessionRefreshed
    this.onError = options?.onError
  }

  start(intervalMs = 60000): void { // Check every minute
    if (this.checkInterval) {
      this.stop()
    }
    
    this.checkInterval = setInterval(async () => {
      try {
        const validation = await validateSession()
        
        if (!validation.isValid && validation.isExpired) {
          authLogger.warn('Session monitor detected expired session')
          this.onSessionExpired?.()
        } else if (validation.needsRefresh) {
          const refreshResult = await refreshSessionWithRetry()
          
          if (refreshResult.success && refreshResult.session) {
            this.onSessionRefreshed?.(refreshResult.session)
          } else if (refreshResult.error) {
            this.onError?.(refreshResult.error)
          }
        }
      } catch (error) {
        authLogger.error('Session monitor error:', error)
        this.onError?.(error as AuthError)
      }
    }, intervalMs)
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }
}

// Startup session validation
export async function validateSessionOnStartup(): Promise<{
  isAuthenticated: boolean
  user: SupabaseUser | null
  session: Session | null
  recovered: boolean
}> {
  
  try {
    // Use Promise.race to ensure we don't wait too long
    const validationPromise = validateSession();
    const timeoutPromise = new Promise<SessionValidationResult>((_, reject) => {
      setTimeout(() => reject(new Error('Startup validation timeout')), 5000);
    });
    
    // First attempt: validate current session with timeout
    let validation: SessionValidationResult;
    try {
      validation = await Promise.race([validationPromise, timeoutPromise]);
    } catch (timeoutError) {
      authLogger.warn('Startup validation timed out, trying fallback');
      // If validation times out, try direct getUser call
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (!userError && userData.user) {
          return {
            isAuthenticated: true,
            user: userData.user,
            session: null, // We don't have session but have user
            recovered: false
          };
        }
      } catch (fallbackError) {
        authLogger.error('Fallback getUser failed:', fallbackError);
      }
      
      return {
        isAuthenticated: false,
        user: null,
        session: null,
        recovered: false
      };
    }
    
    let recovered = false;
    
    // If session is invalid or expired, attempt recovery
    if (!validation.isValid || validation.isExpired) {
      authLogger.warn('Initial session validation failed, attempting recovery');
      validation = await recoverSession();
      recovered = validation.isValid;
    }
    
    // If session validation still fails, try getUser() as a fallback
    if (!validation.isValid) {
      authLogger.warn('Session recovery failed, trying getUser() fallback');
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (!userError && userData.user) {
          // User exists but session might be stale, try to refresh
          const refreshResult = await refreshSessionWithRetry(1);
          
          if (refreshResult.success && refreshResult.session) {
            authLogger.warn('Successfully recovered session via getUser() + refresh');
            return {
              isAuthenticated: true,
              user: refreshResult.session.user,
              session: refreshResult.session,
              recovered: true
            };
          }
        }
      } catch (fallbackError) {
        authLogger.error('getUser() fallback failed:', fallbackError);
      }
    }
    
    const result = {
      isAuthenticated: validation.isValid,
      user: validation.session?.user || null,
      session: validation.session,
      recovered
    };
    
    authLogger.warn('Startup validation result:', {
      isAuthenticated: result.isAuthenticated,
      hasUser: !!result.user,
      hasSession: !!result.session,
      recovered: result.recovered
    });
    
    return result;
  } catch (error) {
    authLogger.error('Startup session validation failed:', error);
    return {
      isAuthenticated: false,
      user: null,
      session: null,
      recovered: false
    };
  }
} 