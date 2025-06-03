'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to lists page if user is logged in
    if (!loading && user) {
      router.push('/lists');
    }
  }, [user, loading, router]);

  // If loading, show a loading spinner
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-white">Loading...</p>
        </div>
      </div>
    );
  }

  // Only show the landing page if the user is not logged in
  return (
    <main className="flex min-h-screen flex-col items-center justify-between bg-background text-foreground">
      {/* Hero Section */}
      <div className="w-full py-12 md:py-20 lg:py-28 bg-gradient-to-b from-blue-950 to-gray-900">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="space-y-4 max-w-3xl">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl text-white">
                Never lose track of great places again
              </h1>
              <p className="mx-auto max-w-[600px] text-gray-300 md:text-xl lg:text-2xl">
                Organize your favorite spots in lists that actually make sense.
              </p>
            </div>
            <div className="flex flex-col items-center gap-4">
              <Link
                href="/signup"
                className="inline-flex h-12 items-center justify-center rounded-md bg-blue-600 px-8 text-base font-medium text-white shadow transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-700"
              >
                Start Here
              </Link>
              <Link
                href="/discover"
                className="text-sm text-blue-400 hover:text-blue-300 underline"
              >
                Discover Public Lists
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="w-full py-12 md:py-16 lg:py-20 bg-gray-900">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Finally, a place for all your places 🗺️
            </h2>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Stop losing track of amazing spots. Whether it's that perfect brunch place or your secret hiking trail.
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3 lg:gap-12">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-2xl">
                📍
              </div>
              <h3 className="text-xl font-bold text-white">Save Anywhere</h3>
              <p className="text-gray-300">
                Found an amazing coffee shop? Save it instantly. No more screenshots or forgotten bookmarks.
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl flex items-center justify-center text-2xl">
                📝
              </div>
              <h3 className="text-xl font-bold text-white">Organize Your Way</h3>
              <p className="text-gray-300">
                Create lists that make sense to you. "Date Night Spots", "Weekend Adventures", "Must Try Food" - whatever works.
              </p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center text-2xl">
                🎯
              </div>
              <h3 className="text-xl font-bold text-white">Actually Find Them</h3>
              <p className="text-gray-300">
                When you're ready to explore, your places are right there. No digging through apps or trying to remember where you saved something.
              </p>
            </div>
          </div>
          
          <div className="mt-16 text-center">
            <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-2xl p-8 max-w-3xl mx-auto">
              <h3 className="text-xl font-bold text-white mb-4">
                "I used to screenshot everything and never find it again. Now I actually visit the places I save!" 
              </h3>
              <p className="text-blue-300">— Sarah, early user</p>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="w-full py-12 md:py-16 bg-gradient-to-t from-blue-950 to-gray-900">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="space-y-3 max-w-2xl">
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                Ready to get organized?
              </h2>
              <p className="text-gray-300 text-lg">
                Join early users who are finally making sense of their saved places.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <Link
                href="/signup"
                className="inline-flex h-12 items-center justify-center rounded-md bg-blue-600 px-8 text-base font-medium text-white shadow transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-700 w-full md:w-auto"
              >
                Get Started Free
              </Link>
              <div className="flex flex-col sm:flex-row items-center gap-3 mt-4">
                <p className="text-sm text-gray-400">
                  No credit card required. Works with any device.
                </p>
                <span className="text-gray-500 hidden sm:inline">•</span>
                <Link
                  href="/discover"
                  className="text-sm text-blue-400 hover:text-blue-300 underline"
                >
                  Browse public lists first
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
