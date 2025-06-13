'use client';

import { useState, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
// signOut is now handled by the auth context
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import UserMenu from './UserMenu';

export default function Navbar() {
  const { user, loading, signOut, isInitializing, hasAttemptedAuth } = useAuth();
  const { isAdmin } = useAdmin();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  const closeMenu = () => setIsMenuOpen(false);

  // Redirect logged-in users from home page to their lists
  // But avoid redirecting if they just came from auth pages to prevent conflicts
  useEffect(() => {
    if (!loading && user && pathname === '/') {
      // Check if user came from auth pages - if so, don't redirect to avoid conflicts
      const referrer = document.referrer;
      const isFromAuthPage = referrer.includes('/login') || 
                            referrer.includes('/signup') || 
                            referrer.includes('/auth/callback');
      
      if (!isFromAuthPage) {
        // Redirect authenticated user from home to /lists
        const timeoutId = setTimeout(() => {
          router.push('/lists');
        }, 100);
        
        return () => clearTimeout(timeoutId);
      }
      // else: User came from auth page, skipping home redirect to avoid conflicts
    }
  }, [user, loading, pathname, router]);

  // Hide navbar on specific pages for focused experience
  const hideNavbar = pathname === '/lists/new' || 
                     (pathname?.startsWith('/lists/') && pathname !== '/lists');
  
  if (hideNavbar) {
    return null;
  }

  // Don't render navbar during initial auth check to prevent flash
  if (isInitializing || !hasAttemptedAuth) {
    return (
      <nav className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-white">
                Placemarks
              </Link>
            </div>
            {/* Skeleton for user menu */}
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gray-700 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  const handleSignOut = async () => {
    try {
      setIsMenuOpen(false);
      await signOut();
      // Navigate to home page after successful logout
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-white">
              Placemarks
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link href="/lists" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  My Lists
                </Link>
                <Link href="/discover" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Discover
                </Link>
                <Link href="/checkin" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Check In
                </Link>
                <UserMenu user={user} onSignOut={signOut} />
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login">
                  <Button variant="ghost" className="text-gray-300 hover:text-white">
                    Log In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 