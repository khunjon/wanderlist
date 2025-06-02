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
      <div className="w-full py-16 md:py-28 lg:py-36 bg-gradient-to-b from-blue-950 to-gray-900">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="space-y-4 max-w-3xl">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl text-white">
                Never lose track of great places again
              </h1>
              <p className="mx-auto max-w-[800px] text-gray-300 md:text-xl lg:text-2xl">
                Organize your favorite spots, restaurants, and discoveries in lists that actually make sense
              </p>
              <p className="mx-auto max-w-[700px] text-gray-400 md:text-lg mt-4">
                Turn your scattered bookmarks into organized collections. Whether it's that perfect coffee shop, 
                the restaurant you've been meaning to try, or your weekend adventure spots – keep them all in one 
                place that's actually easy to use.
              </p>
            </div>
            <Link
              href="/signup"
              className="inline-flex h-12 items-center justify-center rounded-md bg-blue-600 px-8 text-base font-medium text-white shadow transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-700"
            >
              Start Organizing Your Places
            </Link>
          </div>
        </div>
      </div>

      {/* Problem/Solution Section */}
      <div className="w-full py-16 md:py-24 lg:py-32 bg-gray-900">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid gap-12 md:grid-cols-2 lg:gap-16">
            <div className="space-y-5">
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
                  <path d="M9.879 14.121L12 12"></path>
                  <path d="M21.071 13.172a3 3 0 0 0-.415-4.243L15.414 3.686a1 1 0 0 0-1.414 0l-2.829 2.829a1 1 0 0 0-.293.707v5.172a3 3 0 0 0 3 3h5.172a.997.997 0 0 0 .707-.293l1.414-1.414"></path>
                  <path d="M7.757 16.243l-1.414 1.414a1 1 0 0 1-1.414 0l-2.829-2.829a1 1 0 0 1 0-1.414l5.243-5.243a1 1 0 0 1 1.414 0l2.829 2.829a1 1 0 0 1 0 1.414l-3.829 3.829"></path>
                  <path d="M6 16v2a4 4 0 0 0 4 4h8"></path>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white">The Problem</h3>
              <p className="text-gray-300 text-lg">
                We all save places when we're out exploring, but finding them later? That's the hard part. 
                Buried in apps, scattered across platforms, with no real way to organize what matters to you.
              </p>
            </div>
            <div className="space-y-5">
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
                  <path d="M12 2v20"></path>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white">The Solution</h3>
              <p className="text-gray-300 text-lg">
                Placemarks gives you the simple, organized place management you've always wanted. 
                Create custom lists, add personal notes, and actually find what you're looking for.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="w-full py-16 md:py-24 bg-gradient-to-t from-blue-950 to-gray-900">
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
              <p className="text-sm text-gray-400 mt-3">
                No credit card required. Works with any device.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
