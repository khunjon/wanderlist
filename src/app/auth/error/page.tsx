'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function AuthError() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const errorMessage = searchParams.get('message') || 'An authentication error occurred';
    setError(errorMessage);
  }, [searchParams]);

  const getErrorDetails = (errorMessage: string) => {
    if (errorMessage.includes('redirect_uri_mismatch')) {
      return {
        title: 'OAuth Configuration Error',
        description: 'There\'s a configuration issue with Google OAuth. Please contact support.',
        suggestion: 'This usually happens when the OAuth redirect URLs are not properly configured.'
      };
    }
    
    if (errorMessage.includes('access_denied')) {
      return {
        title: 'Access Denied',
        description: 'You denied access to your Google account.',
        suggestion: 'To sign in with Google, you need to allow access to your basic profile information.'
      };
    }
    
    if (errorMessage.includes('invalid_grant')) {
      return {
        title: 'Invalid Authorization',
        description: 'The authorization code has expired or is invalid.',
        suggestion: 'Please try signing in again.'
      };
    }
    
    return {
      title: 'Authentication Error',
      description: errorMessage,
      suggestion: 'Please try signing in again. If the problem persists, contact support.'
    };
  };

  const errorDetails = getErrorDetails(error);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-900">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-red-500">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-white">
            {errorDetails.title}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-300">
            {errorDetails.description}
          </p>
          {errorDetails.suggestion && (
            <p className="mt-4 text-center text-sm text-gray-400 bg-gray-800 p-3 rounded-md">
              💡 {errorDetails.suggestion}
            </p>
          )}
        </div>

        <div className="mt-8 space-y-4">
          <Link
            href="/login"
            className="group relative flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Try Again
          </Link>
          
          <Link
            href="/signup"
            className="group relative flex w-full justify-center rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-300 hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
          >
            Create New Account
          </Link>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Error details: {error}
          </p>
        </div>
      </div>
    </div>
  );
} 