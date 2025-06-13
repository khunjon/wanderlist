'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface AuthLoadingStateProps {
  isInitializing: boolean;
  hasAttemptedAuth: boolean;
  children: React.ReactNode;
}

export default function AuthLoadingState({ 
  isInitializing, 
  hasAttemptedAuth, 
  children 
}: AuthLoadingStateProps) {
  const [showContent, setShowContent] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    if (!isInitializing && hasAttemptedAuth) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setShowContent(true);
        // Trigger fade-in animation
        requestAnimationFrame(() => {
          setFadeIn(true);
        });
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isInitializing, hasAttemptedAuth]);

  if (isInitializing || !hasAttemptedAuth) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md mx-auto px-4">
          {/* Logo/Brand Area */}
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-blue-600 rounded-2xl flex items-center justify-center">
              <div className="w-8 h-8 bg-white rounded-lg"></div>
            </div>
            <h1 className="text-2xl font-bold text-white">Placemarks</h1>
          </div>

          {/* Loading Spinner */}
          <div className="flex items-center justify-center space-x-3">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            <span className="text-gray-300 text-lg">Loading your places...</span>
          </div>

          {/* Skeleton Content */}
          <div className="space-y-4 mt-8">
            <div className="animate-pulse space-y-3">
              {/* Skeleton for navigation */}
              <div className="h-4 bg-gray-700 rounded w-3/4 mx-auto"></div>
              <div className="h-4 bg-gray-700 rounded w-1/2 mx-auto"></div>
              
              {/* Skeleton for content cards */}
              <div className="grid grid-cols-1 gap-4 mt-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gray-800 rounded-lg p-4 space-y-3">
                    <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="w-full bg-gray-700 rounded-full h-1 mt-8">
            <div className="bg-blue-500 h-1 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`transition-opacity duration-500 ease-in-out ${
        fadeIn ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {showContent && children}
    </div>
  );
} 