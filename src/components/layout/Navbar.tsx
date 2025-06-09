'use client';

import { useState, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
// signOut is now handled by the auth context
import { useRouter, usePathname } from 'next/navigation';

export default function Navbar() {
  const { user, loading, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  const closeMenu = () => setIsMenuOpen(false);

  // Redirect logged-in users from home page to their lists
  useEffect(() => {
    if (!loading && user && pathname === '/') {
      // Add a small delay to ensure auth state is fully settled
      const timeoutId = setTimeout(() => {
        router.push('/lists');
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [user, loading, pathname, router]);

  // Hide navbar on specific pages for focused experience
  const hideNavbar = pathname === '/lists/new' || 
                     (pathname?.startsWith('/lists/') && pathname !== '/lists');
  
  if (hideNavbar) {
    return null;
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
    <nav className="bg-gray-900 hidden md:block">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <h1 className="text-xl font-bold text-white">Placemarks</h1>
            </Link>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {user && (
                  <Link
                    href="/lists"
                    className="rounded-md px-3 py-2 text-sm font-medium text-white hover:bg-gray-700"
                  >
                    My Lists
                  </Link>
                )}
                <Link
                  href="/discover"
                  className="rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  Discover
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="rounded-md px-3 py-2 text-sm font-medium text-yellow-300 hover:bg-gray-700 hover:text-yellow-200"
                  >
                    Admin
                  </Link>
                )}
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              {user ? (
                <div className="relative ml-3">
                  <div>
                    <button
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                      className="flex max-w-xs items-center rounded-full bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
                    >
                      <span className="sr-only">Open user menu</span>
                      <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-700 relative">
                        {user.photo_url ? (
                          <img
                            src={user.photo_url}
                            alt={user.displayName || 'User'}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              // Hide broken image and show fallback
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : null}
                        {/* Default avatar - always present as fallback */}
                        <div className={`absolute inset-0 flex items-center justify-center ${user.photo_url ? 'hidden' : ''}`}>
                          <svg
                            className="h-full w-full text-gray-500"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        </div>
                      </div>
                    </button>
                  </div>
                  {isMenuOpen && (
                    <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div className="px-4 py-2 text-sm text-gray-300">
                        {user.displayName || user.email}
                      </div>
                      <div className="py-1">
                        <Link
                          href="/profile"
                          className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Your Profile
                        </Link>
                        {isAdmin && (
                          <Link
                            href="/admin"
                            className="block px-4 py-2 text-sm text-yellow-300 hover:bg-gray-700"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            Admin Panel
                          </Link>
                        )}
                        <button
                          onClick={handleSignOut}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    href="/login"
                    className="rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/signup"
                    className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center rounded-md bg-gray-800 p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <svg
                className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <>
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden transition-opacity duration-200 ease-in-out"
            onClick={() => setIsMenuOpen(false)}
          />
          
          {/* Mobile menu content */}
          <div className="relative z-50 md:hidden bg-gray-800 border-t border-gray-600 shadow-lg transform transition-all duration-200 ease-in-out">
            <div className="space-y-1 px-2 pb-3 pt-2 sm:px-3">
              {user && (
                <Link
                  href="/lists"
                  className="block rounded-md px-3 py-2 text-base font-medium text-white hover:bg-gray-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  My Lists
                </Link>
              )}
              <Link
                href="/discover"
                className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                Discover
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="block rounded-md px-3 py-2 text-base font-medium text-yellow-300 hover:bg-gray-700 hover:text-yellow-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Admin
                </Link>
              )}
            </div>
            {user ? (
              <div className="border-t border-gray-700 pb-3 pt-4">
                <div className="flex items-center px-5">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-700 relative">
                      {user.photo_url ? (
                        <img
                          src={user.photo_url}
                          alt={user.displayName || 'User'}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            // Hide broken image and show fallback
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : null}
                      {/* Default avatar - always present as fallback */}
                      <div className={`absolute inset-0 flex items-center justify-center ${user.photo_url ? 'hidden' : ''}`}>
                        <svg
                          className="h-full w-full text-gray-500"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-white">{user.displayName || 'User'}</div>
                    <div className="text-sm font-medium text-gray-400">{user.email}</div>
                  </div>
                </div>
                <div className="mt-3 space-y-1 px-2">
                  <Link
                    href="/profile"
                    className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Your Profile
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="block rounded-md px-3 py-2 text-base font-medium text-yellow-300 hover:bg-gray-700 hover:text-yellow-200"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Admin Panel
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div className="border-t border-gray-700 pb-3 pt-4">
                <div className="space-y-1 px-2">
                  <Link
                    href="/login"
                    className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Log In
                  </Link>
                  <Link
                    href="/signup"
                    className="block rounded-md bg-blue-600 px-3 py-2 text-base font-medium text-white hover:bg-blue-500"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </nav>
  );
} 