'use client';

import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

interface SessionRecoveryProps {
  onRecovered?: () => void;
  onFailed?: () => void;
}

export default function SessionRecovery({ onRecovered, onFailed }: SessionRecoveryProps) {
  const { error, loading } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Don't show if no error or if loading
  if (!error || loading) {
    return null;
  }

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      window.location.reload();
    } catch (err) {
      console.error('Page refresh failed:', err);
      onFailed?.();
    }
  };

  const handleSignIn = () => {
    window.location.href = '/login';
  };

  const isSessionError = error.message?.toLowerCase().includes('session') || 
                        error.message?.toLowerCase().includes('token') ||
                        error.message?.toLowerCase().includes('expired');

  const message = isSessionError 
    ? 'Your session has expired. Please refresh the page or log in again.'
    : 'There was a problem with your authentication. Please try again or log in.'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            {isSessionError ? (
              <svg className="h-8 w-8 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            ) : (
              <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">
              {isSessionError ? 'Session Expired' : 'Authentication Error'}
            </h3>
          </div>
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            {message}
          </p>
          
          <div className="mt-3 p-3 bg-gray-50 rounded">
            <p className="text-xs text-gray-500 font-mono">
              {error.message}
            </p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            {isRefreshing ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Refreshing...
              </span>
            ) : (
              'Refresh Page'
            )}
          </button>
          
          <button
            onClick={handleSignIn}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Log In Again
          </button>
        </div>
      </div>
    </div>
  );
} 