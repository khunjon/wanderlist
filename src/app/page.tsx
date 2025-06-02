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
      <div className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-b from-blue-950 to-gray-900">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="space-y-3">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-white">
                Organize Your Favorite Places with Placemarks
              </h1>
              <p className="mx-auto max-w-[700px] text-gray-300 md:text-xl">
                Save, organize, and discover places better than Google Maps. Create beautiful lists
                of your favorite spots and easily share them with friends.
              </p>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <Link
                href="/signup"
                className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-8 text-sm font-medium text-white shadow transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-700"
              >
                Get Started
              </Link>
              <Link
                href="/login"
                className="inline-flex h-10 items-center justify-center rounded-md border border-gray-600 bg-gray-800 px-8 text-sm font-medium text-white shadow-sm transition-colors hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-400"
              >
                Log In
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full py-12 md:py-24 lg:py-32 bg-gray-900">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid gap-6 lg:grid-cols-3 lg:gap-12">
            <div className="space-y-3">
              <div className="inline-flex items-center justify-center rounded-md bg-blue-900 p-2 text-blue-200">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6"
                >
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white">Save Any Place</h3>
              <p className="text-gray-300">
                Search for any place on Google Maps and save it to your lists with a single click.
              </p>
            </div>
            <div className="space-y-3">
              <div className="inline-flex items-center justify-center rounded-md bg-blue-900 p-2 text-blue-200">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6"
                >
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="M3 9h18" />
                  <path d="M9 21V9" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white">Organize in Lists</h3>
              <p className="text-gray-300">
                Create custom lists for different categories like restaurants, cafes, hotels, or attractions.
              </p>
            </div>
            <div className="space-y-3">
              <div className="inline-flex items-center justify-center rounded-md bg-blue-900 p-2 text-blue-200">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6"
                >
                  <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                  <path d="M9 18c-4.51 2-5-2-7-2" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white">Share with Friends</h3>
              <p className="text-gray-300">
                Share your lists with friends and family so they can discover your favorite places.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
