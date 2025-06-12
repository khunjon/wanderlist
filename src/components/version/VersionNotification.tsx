'use client';

import { useState, useEffect } from 'react';
import { useVersionCheck, useManualRefresh } from '@/hooks/useVersionCheck';

interface VersionNotificationProps {
  autoCheck?: boolean;
  checkInterval?: number;
  position?: 'top' | 'bottom';
  showVersionInfo?: boolean;
}

export default function VersionNotification({
  autoCheck = true,
  checkInterval = 5 * 60 * 1000, // 5 minutes
  position = 'top',
  showVersionInfo = false,
}: VersionNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  
  const { refreshWithConfirmation, isRefreshing } = useManualRefresh();
  
  const {
    isLatest,
    currentVersion,
    latestVersion,
    shouldRefresh,
    isChecking,
    error,
  } = useVersionCheck({
    checkInterval: autoCheck ? checkInterval : undefined,
    autoRefresh: false,
    showNotifications: true,
    onVersionMismatch: () => {
      if (!isDismissed) {
        setIsVisible(true);
      }
    },
  });

  // Show notification when version mismatch is detected
  useEffect(() => {
    if (shouldRefresh && !isDismissed) {
      setIsVisible(true);
    }
  }, [shouldRefresh, isDismissed]);

  const handleRefresh = () => {
    refreshWithConfirmation(
      `Update available (${latestVersion}). Refresh now to get the latest features and fixes?`
    );
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    
    // Reset dismissal after 10 minutes
    setTimeout(() => {
      setIsDismissed(false);
    }, 10 * 60 * 1000);
  };

  if (!isVisible || isLatest || error) {
    return null;
  }

  const positionClasses = position === 'top' 
    ? 'top-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md'
    : 'bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md';

  return (
    <div className={`fixed z-50 ${positionClasses}`}>
      <div className="bg-blue-600 text-white rounded-lg shadow-lg p-4 border border-blue-500">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-200"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium">
                  Update Available
                </h3>
                <p className="text-sm text-blue-100 mt-1">
                  A new version is available with the latest features and fixes.
                </p>
                {showVersionInfo && (
                  <p className="text-xs text-blue-200 mt-1">
                    Current: {currentVersion} → Latest: {latestVersion}
                  </p>
                )}
              </div>
            </div>
            
            <div className="mt-3 flex space-x-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRefreshing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-blue-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Refreshing...
                  </>
                ) : (
                  'Refresh Now'
                )}
              </button>
              
              <button
                onClick={handleDismiss}
                className="inline-flex items-center px-3 py-1.5 border border-blue-300 text-xs font-medium rounded text-blue-100 bg-transparent hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Later
              </button>
            </div>
          </div>
          
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={handleDismiss}
              className="inline-flex text-blue-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <span className="sr-only">Close</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact version notification for mobile
 */
export function CompactVersionNotification() {
  return (
    <VersionNotification
      position="bottom"
      showVersionInfo={false}
      checkInterval={3 * 60 * 1000} // Check every 3 minutes on mobile
    />
  );
}

/**
 * Version info display component
 */
export function VersionInfo({ className = '' }: { className?: string }) {
  const [version, setVersion] = useState<string>('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show version info in development or when explicitly requested
    if (process.env.NODE_ENV === 'development') {
      import('@/lib/utils/version').then(({ getCurrentVersion, formatVersionForDisplay }) => {
        const versionInfo = getCurrentVersion();
        setVersion(formatVersionForDisplay(versionInfo));
        setIsVisible(true);
      });
    }
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`text-xs text-gray-500 ${className}`}>
      v{version}
    </div>
  );
} 