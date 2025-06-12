'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { checkVersionMatch, forceAppRefresh, getCurrentVersion, formatVersionForDisplay } from '@/lib/utils/version';
import type { AppVersion } from '@/lib/utils/version';

export interface VersionCheckState {
  isChecking: boolean;
  isLatest: boolean;
  currentVersion: string;
  latestVersion: string;
  shouldRefresh: boolean;
  lastChecked: Date | null;
  error: string | null;
}

export interface VersionCheckOptions {
  checkInterval?: number; // in milliseconds
  autoRefresh?: boolean;
  showNotifications?: boolean;
  onVersionMismatch?: (state: VersionCheckState) => void;
  onRefreshRequired?: () => void;
}

/**
 * Hook for automatic version checking and refresh management
 */
export function useVersionCheck(options: VersionCheckOptions = {}) {
  const {
    checkInterval = 15 * 60 * 1000, // 15 minutes default - more conservative
    autoRefresh = false,
    showNotifications = true,
    onVersionMismatch,
    onRefreshRequired,
  } = options;

  const [state, setState] = useState<VersionCheckState>({
    isChecking: false,
    isLatest: true,
    currentVersion: getCurrentVersion().version,
    latestVersion: getCurrentVersion().version,
    shouldRefresh: false,
    lastChecked: null,
    error: null,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasNotifiedRef = useRef(false);
  const lastCheckTimeRef = useRef<number>(0);
  const errorCountRef = useRef<number>(0);

  /**
   * Perform version check with rate limiting
   */
  const checkVersion = useCallback(async () => {
    // Rate limiting: don't check more than once per minute
    const now = Date.now();
    const minInterval = 60 * 1000; // 1 minute minimum
    
    if (now - lastCheckTimeRef.current < minInterval) {
      console.log('⏳ Version check rate limited');
      return null;
    }

    // Exponential backoff on errors
    if (errorCountRef.current > 0) {
      const backoffDelay = Math.min(1000 * Math.pow(2, errorCountRef.current), 30000); // Max 30 seconds
      if (now - lastCheckTimeRef.current < backoffDelay) {
        console.log(`⏳ Version check backing off for ${backoffDelay}ms`);
        return null;
      }
    }

    lastCheckTimeRef.current = now;
    setState(prev => ({ ...prev, isChecking: true, error: null }));

    try {
      const result = await checkVersionMatch();
      
      // Reset error count on success
      errorCountRef.current = 0;
      
      setState(prev => ({
        ...prev,
        isChecking: false,
        isLatest: result.isLatest,
        currentVersion: result.currentVersion,
        latestVersion: result.latestVersion,
        shouldRefresh: result.shouldRefresh,
        lastChecked: new Date(),
        error: null,
      }));

      // Handle version mismatch
      if (result.shouldRefresh) {
        if (!hasNotifiedRef.current) {
          hasNotifiedRef.current = true;
          
          if (onVersionMismatch) {
            onVersionMismatch({
              ...state,
              isLatest: result.isLatest,
              currentVersion: result.currentVersion,
              latestVersion: result.latestVersion,
              shouldRefresh: result.shouldRefresh,
              lastChecked: new Date(),
            });
          }

          if (showNotifications && typeof window !== 'undefined') {
            console.log('🔄 New app version available:', result.latestVersion);
          }

          if (autoRefresh) {
            setTimeout(() => {
              forceAppRefresh();
            }, 2000); // Give user 2 seconds to see the notification
          } else if (onRefreshRequired) {
            onRefreshRequired();
          }
        }
      } else {
        hasNotifiedRef.current = false;
      }

      return result;
    } catch (error) {
      // Increment error count for backoff
      errorCountRef.current = Math.min(errorCountRef.current + 1, 5);
      
      const errorMessage = error instanceof Error ? error.message : 'Version check failed';
      
      setState(prev => ({
        ...prev,
        isChecking: false,
        error: errorMessage,
        lastChecked: new Date(),
      }));

      console.error('Version check error (attempt', errorCountRef.current, '):', error);
      
      // Stop checking after too many errors
      if (errorCountRef.current >= 5) {
        console.warn('🚫 Version checking disabled due to repeated errors');
        stopChecking();
      }
      
      return null;
    }
  }, [autoRefresh, onVersionMismatch, onRefreshRequired, showNotifications, state]);

  /**
   * Force refresh the application
   */
  const refresh = useCallback(() => {
    forceAppRefresh();
  }, []);

  /**
   * Start automatic version checking
   */
  const startChecking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Initial check
    checkVersion();

    // Set up interval
    intervalRef.current = setInterval(checkVersion, checkInterval);
  }, [checkVersion, checkInterval]);

  /**
   * Stop automatic version checking
   */
  const stopChecking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /**
   * Reset notification state
   */
  const resetNotification = useCallback(() => {
    hasNotifiedRef.current = false;
  }, []);

  // Start checking on mount, stop on unmount
  useEffect(() => {
    startChecking();
    return stopChecking;
  }, [startChecking, stopChecking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    ...state,
    checkVersion,
    refresh,
    startChecking,
    stopChecking,
    resetNotification,
  };
}

/**
 * Hook for displaying version information
 */
export function useVersionDisplay() {
  const [version, setVersion] = useState<AppVersion | null>(null);

  useEffect(() => {
    setVersion(getCurrentVersion());
  }, []);

  const displayVersion = version ? formatVersionForDisplay(version) : 'Loading...';
  const shortVersion = version?.version || 'unknown';

  return {
    version,
    displayVersion,
    shortVersion,
  };
}

/**
 * Hook for manual refresh with confirmation
 */
export function useManualRefresh() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshWithConfirmation = useCallback((message?: string) => {
    const confirmMessage = message || 'A new version is available. Refresh now?';
    
    if (typeof window !== 'undefined' && window.confirm(confirmMessage)) {
      setIsRefreshing(true);
      forceAppRefresh();
    }
  }, []);

  const refreshImmediately = useCallback(() => {
    setIsRefreshing(true);
    forceAppRefresh();
  }, []);

  return {
    isRefreshing,
    refreshWithConfirmation,
    refreshImmediately,
  };
}

/**
 * Hook for version-aware navigation
 * Checks version before important navigation actions
 */
export function useVersionAwareNavigation() {
  const checkBeforeNavigation = useCallback(async (callback: () => void) => {
    try {
      const result = await checkVersionMatch();
      
      if (result.shouldRefresh) {
        const shouldRefresh = window.confirm(
          'A new version is available. Refresh before continuing?'
        );
        
        if (shouldRefresh) {
          forceAppRefresh();
          return;
        }
      }
      
      callback();
    } catch (error) {
      console.error('Version check failed during navigation:', error);
      // Continue with navigation if version check fails
      callback();
    }
  }, []);

  return {
    checkBeforeNavigation,
  };
} 