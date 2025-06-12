'use client';

import { useCallback, useEffect, useState } from 'react';
import { addCacheBusting, getCacheBustParam, createVersionedUrl } from '@/lib/utils/cache';

/**
 * Client-side cache management hook
 * Provides utilities for cache busting and version management
 */
export function useCache() {
  const [version, setVersion] = useState<string>('');

  // Initialize version on mount
  useEffect(() => {
    setVersion(Date.now().toString());
  }, []);

  /**
   * Generate a cache-busting URL
   */
  const bustCache = useCallback((url: string): string => {
    return addCacheBusting(url);
  }, []);

  /**
   * Create a versioned URL
   */
  const versionUrl = useCallback((url: string, customVersion?: string): string => {
    return createVersionedUrl(url, customVersion || version);
  }, [version]);

  /**
   * Force refresh by updating version
   */
  const forceRefresh = useCallback(() => {
    const newVersion = Date.now().toString();
    setVersion(newVersion);
    return newVersion;
  }, []);

  /**
   * Get current cache bust parameter
   */
  const getCacheBust = useCallback(() => {
    return getCacheBustParam();
  }, []);

  /**
   * Clear browser cache programmatically (limited support)
   */
  const clearCache = useCallback(async () => {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('Cache cleared successfully');
        return true;
      } catch (error) {
        console.error('Failed to clear cache:', error);
        return false;
      }
    }
    return false;
  }, []);

  /**
   * Force reload the page with cache busting
   */
  const hardReload = useCallback(() => {
    if (typeof window !== 'undefined') {
      // Force reload bypassing cache
      window.location.reload();
    }
  }, []);

  return {
    version,
    bustCache,
    versionUrl,
    forceRefresh,
    getCacheBust,
    clearCache,
    hardReload,
  };
}

/**
 * Hook for managing image cache busting
 * Useful for profile photos and dynamic images
 */
export function useImageCache() {
  const { bustCache, versionUrl, forceRefresh } = useCache();
  const [imageVersion, setImageVersion] = useState<string>('');

  useEffect(() => {
    setImageVersion(Date.now().toString());
  }, []);

  /**
   * Get cache-busted image URL
   */
  const getImageUrl = useCallback((src: string, forceRefresh?: boolean): string => {
    if (forceRefresh) {
      return bustCache(src);
    }
    return versionUrl(src, imageVersion);
  }, [bustCache, versionUrl, imageVersion]);

  /**
   * Refresh image cache
   */
  const refreshImage = useCallback(() => {
    const newVersion = forceRefresh();
    setImageVersion(newVersion);
    return newVersion;
  }, [forceRefresh]);

  return {
    getImageUrl,
    refreshImage,
    imageVersion,
  };
}

/**
 * Hook for API request cache management
 */
export function useApiCache() {
  const { bustCache } = useCache();

  /**
   * Create fetch options with cache busting headers
   */
  const createFetchOptions = useCallback((options: RequestInit = {}): RequestInit => {
    return {
      ...options,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        ...options.headers,
      },
    };
  }, []);

  /**
   * Fetch with cache busting
   */
  const fetchWithCacheBust = useCallback(async (
    url: string, 
    options: RequestInit = {}
  ): Promise<Response> => {
    const bustedUrl = bustCache(url);
    const fetchOptions = createFetchOptions(options);
    return fetch(bustedUrl, fetchOptions);
  }, [bustCache, createFetchOptions]);

  /**
   * JSON fetch with cache busting
   */
  const fetchJsonWithCacheBust = useCallback(async <T = any>(
    url: string, 
    options: RequestInit = {}
  ): Promise<T> => {
    const response = await fetchWithCacheBust(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }, [fetchWithCacheBust]);

  return {
    createFetchOptions,
    fetchWithCacheBust,
    fetchJsonWithCacheBust,
  };
}

/**
 * Hook for service worker cache management
 */
export function useServiceWorkerCache() {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('serviceWorker' in navigator && 'caches' in window);
  }, []);

  /**
   * Update service worker
   */
  const updateServiceWorker = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update service worker:', error);
      return false;
    }
  }, [isSupported]);

  /**
   * Clear service worker cache
   */
  const clearServiceWorkerCache = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      return true;
    } catch (error) {
      console.error('Failed to clear service worker cache:', error);
      return false;
    }
  }, [isSupported]);

  return {
    isSupported,
    updateServiceWorker,
    clearServiceWorkerCache,
  };
} 