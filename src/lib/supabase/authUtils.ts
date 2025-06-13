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
    authLogger.debug('Validating current session...')
    
    const { data, error } = await supabase.auth.getSession();
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
      authLogger.debug('No active session found')
      return {
        isValid: false,
        session: null
      }
    }

    // Check if session is expired
    const now = Math.floor(Date.now() / 1000)
    const expiresAt = session.expires_at || 0
    const isExpired = now >= expiresAt
    const needsRefresh = now >= (expiresAt - 300) // Refresh 5 minutes before expiry

    authLogger.debug('Session validation result:', {
      userId: session.user?.id,
      expiresAt: new Date(expiresAt * 1000).toISOString(),
      isExpired,
      needsRefresh,
      timeUntilExpiry: expiresAt - now
    })

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
      authLogger.debug(`Attempting token refresh (attempt ${attempt}/${maxRetries})`)
      
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
          authLogger.debug(`Waiting ${delay}ms before retry...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
        continue
      }

      if (data.session) {
        authLogger.info('Token refresh successful', {
          userId: data.session.user?.id,
          expiresAt: new Date((data.session.expires_at || 0) * 1000).toISOString()
        })
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
  authLogger.info('Attempting session recovery...')
  
  // First, validate current session
  const validation = await validateSession()
  
  if (validation.isValid && !validation.needsRefresh) {
    authLogger.debug('Session is valid, no recovery needed')
    return validation
  }

  // If session needs refresh or is expired, try to refresh
  if (validation.needsRefresh || validation.isExpired) {
    authLogger.debug('Session needs refresh, attempting recovery...')
    
    const refreshResult = await refreshSessionWithRetry()
    
    if (refreshResult.success && refreshResult.session) {
      authLogger.info('Session recovery successful')
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
    authLogger.debug('Clearing stale session data...')
    
    // Clear localStorage auth data
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith('sb-') && key.includes('auth')) {
          localStorage.removeItem(key)
          authLogger.debug(`Cleared localStorage key: ${key}`)
        }
      })
    }
    
    // Sign out to clear any server-side session
    await supabase.auth.signOut()
    
    authLogger.debug('Stale session data cleared')
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

    authLogger.debug('Starting session monitor', { intervalMs })
    
    this.checkInterval = setInterval(async () => {
      try {
        const validation = await validateSession()
        
        if (!validation.isValid && validation.isExpired) {
          authLogger.warn('Session monitor detected expired session')
          this.onSessionExpired?.()
        } else if (validation.needsRefresh) {
          authLogger.debug('Session monitor triggering refresh')
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
      authLogger.debug('Session monitor stopped')
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
  authLogger.info('Performing startup session validation...')
  
  try {
    // First attempt: validate current session
    let validation = await validateSession()
    let recovered = false
    
    // If session is invalid or expired, attempt recovery
    if (!validation.isValid || validation.isExpired) {
      authLogger.debug('Initial session invalid, attempting recovery...')
      validation = await recoverSession()
      recovered = validation.isValid
    }
    
    const result = {
      isAuthenticated: validation.isValid,
      user: validation.session?.user || null,
      session: validation.session,
      recovered
    }
    
    authLogger.info('Startup session validation complete:', {
      isAuthenticated: result.isAuthenticated,
      userId: result.user?.id,
      recovered
    })
    
    return result
  } catch (error) {
    authLogger.error('Startup session validation failed:', error)
    return {
      isAuthenticated: false,
      user: null,
      session: null,
      recovered: false
    }
  }
} 