'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase, User, AuthState, syncUserProfile, onAuthStateChange } from '@/lib/supabase'

interface AuthContextType extends AuthState {
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)

  const refreshProfile = async () => {
    if (user) {
      try {
        const updatedProfile = await syncUserProfile(user)
        setProfile(updatedProfile)
      } catch (err) {
        console.error('Error refreshing profile:', err)
        setError(err)
      }
    }
  }

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (err) {
      console.error('Error signing out:', err)
      setError(err)
    }
  }

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        const session = data?.session;
        if (error) throw error

        if (session?.user) {
          setUser(session.user)
          const userProfile = await syncUserProfile(session.user)
          setProfile(userProfile)
        }
      } catch (err) {
        console.error('Error getting initial session:', err)
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      try {
        setError(null)
        
        if (session?.user) {
          setUser(session.user)
          const userProfile = await syncUserProfile(session.user)
          setProfile(userProfile)
        } else {
          setUser(null)
          setProfile(null)
        }
      } catch (err) {
        console.error('Error handling auth state change:', err)
        setError(err)
      } finally {
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const value: AuthContextType = {
    user,
    profile,
    loading,
    error,
    signOut: handleSignOut,
    refreshProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Simplified hook that returns Supabase auth state
export function useAuthState() {
  const { user, loading, error } = useAuth()
  return [user, loading, error] as const
}

// Hook for getting user profile
export function useUserProfile() {
  const { profile, loading, error, refreshProfile } = useAuth()
  return { profile, loading, error, refreshProfile }
} 