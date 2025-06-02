'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { User } from '@/types';
import { convertFirebaseUserToUser } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser: FirebaseUser | null) => {
        setLoading(true);
        try {
          if (firebaseUser) {
            // Convert Firebase user to our User type
            const appUser = convertFirebaseUserToUser(firebaseUser);
            setUser(appUser);
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error('Error in auth state changed:', error);
          setError(error as Error);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error('Auth observer error:', error);
        setError(error);
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function useRequireAuth(redirectUrl = '/login') {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push(redirectUrl);
    }
  }, [user, loading, router, redirectUrl]);

  return { user, loading };
}