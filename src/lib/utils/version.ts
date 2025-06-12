/**
 * Version management utilities for dynamic asset versioning
 * Handles runtime version checking and client-side operations
 */

export interface AppVersion {
  version: string;
  buildTime: string;
  gitHash?: string;
  environment: string;
}

/**
 * Get the current app version (runtime)
 */
export function getCurrentVersion(): AppVersion {
  // This will be replaced at build time with actual version info
  return {
    version: process.env.NEXT_PUBLIC_APP_VERSION || 'dev',
    buildTime: process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString(),
    gitHash: process.env.NEXT_PUBLIC_GIT_HASH,
    environment: process.env.NODE_ENV || 'development',
  };
}

/**
 * Create versioned URL for assets
 */
export function createVersionedAssetUrl(assetPath: string, version?: string): string {
  const currentVersion = version || getCurrentVersion().version;
  const separator = assetPath.includes('?') ? '&' : '?';
  return `${assetPath}${separator}v=${currentVersion}`;
}

/**
 * Create cache-busting URL with timestamp
 */
export function createCacheBustedUrl(url: string): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}cb=${Date.now()}`;
}

/**
 * Check if current version matches server version
 */
export async function checkVersionMatch(): Promise<{
  isLatest: boolean;
  currentVersion: string;
  latestVersion: string;
  shouldRefresh: boolean;
}> {
  try {
    const currentVersion = getCurrentVersion().version;
    
    // Fetch latest version from server
    const response = await fetch('/api/version', {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch version info');
    }
    
    const serverVersion: AppVersion = await response.json();
    const isLatest = currentVersion === serverVersion.version;
    
    return {
      isLatest,
      currentVersion,
      latestVersion: serverVersion.version,
      shouldRefresh: !isLatest,
    };
  } catch (error) {
    console.error('Version check failed:', error);
    return {
      isLatest: true, // Assume latest if check fails
      currentVersion: getCurrentVersion().version,
      latestVersion: getCurrentVersion().version,
      shouldRefresh: false,
    };
  }
}

/**
 * Force refresh the application
 */
export function forceAppRefresh(): void {
  if (typeof window !== 'undefined') {
    // Clear all caches first
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          caches.delete(cacheName);
        });
      });
    }
    
    // Force reload with cache bypass
    window.location.reload();
  }
}

/**
 * Get version query parameter for critical assets
 */
export function getVersionParam(): string {
  return `v=${getCurrentVersion().version}`;
}

/**
 * Create script tag with version parameter
 */
export function createVersionedScript(src: string, attributes: Record<string, string> = {}): string {
  const versionedSrc = createVersionedAssetUrl(src);
  const attrs = Object.entries(attributes)
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');
  
  return `<script src="${versionedSrc}" ${attrs}></script>`;
}

/**
 * Create link tag with version parameter
 */
export function createVersionedLink(href: string, attributes: Record<string, string> = {}): string {
  const versionedHref = createVersionedAssetUrl(href);
  const attrs = Object.entries(attributes)
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');
  
  return `<link href="${versionedHref}" ${attrs} />`;
}

/**
 * Version comparison utility
 */
export function compareVersions(version1: string, version2: string): number {
  // For git hashes, just compare strings
  if (version1 === version2) return 0;
  return version1 > version2 ? 1 : -1;
}

/**
 * Format version for display
 */
export function formatVersionForDisplay(version: AppVersion): string {
  const { version: v, buildTime, environment } = version;
  const date = new Date(buildTime).toLocaleDateString();
  const time = new Date(buildTime).toLocaleTimeString();
  
  if (environment === 'development') {
    return `Dev (${date} ${time})`;
  }
  
  return `${v} (${date})`;
}

/**
 * Get version info for debugging
 */
export function getVersionDebugInfo(): Record<string, any> {
  const version = getCurrentVersion();
  return {
    ...version,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : 'server',
  };
} 