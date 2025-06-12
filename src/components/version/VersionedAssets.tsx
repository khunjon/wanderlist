'use client';

import { useEffect } from 'react';
import { createVersionedAssetUrl, getCurrentVersion } from '@/lib/utils/version';

interface VersionedScriptProps {
  src: string;
  async?: boolean;
  defer?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Component that loads JavaScript with version parameters
 */
export function VersionedScript({ 
  src, 
  async = false, 
  defer = false, 
  onLoad, 
  onError 
}: VersionedScriptProps) {
  useEffect(() => {
    const versionedSrc = createVersionedAssetUrl(src);
    
    // Check if script is already loaded
    const existingScript = document.querySelector(`script[src*="${src}"]`);
    if (existingScript) {
      return;
    }
    
    const script = document.createElement('script');
    script.src = versionedSrc;
    script.async = async;
    script.defer = defer;
    
    if (onLoad) {
      script.onload = onLoad;
    }
    
    if (onError) {
      script.onerror = onError;
    }
    
    document.head.appendChild(script);
    
    return () => {
      // Cleanup on unmount
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [src, async, defer, onLoad, onError]);
  
  return null;
}

interface VersionedStyleProps {
  href: string;
  media?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Component that loads CSS with version parameters
 */
export function VersionedStyle({ 
  href, 
  media = 'all', 
  onLoad, 
  onError 
}: VersionedStyleProps) {
  useEffect(() => {
    const versionedHref = createVersionedAssetUrl(href);
    
    // Check if stylesheet is already loaded
    const existingLink = document.querySelector(`link[href*="${href}"]`);
    if (existingLink) {
      return;
    }
    
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = versionedHref;
    link.media = media;
    
    if (onLoad) {
      link.onload = onLoad;
    }
    
    if (onError) {
      link.onerror = onError;
    }
    
    document.head.appendChild(link);
    
    return () => {
      // Cleanup on unmount
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
    };
  }, [href, media, onLoad, onError]);
  
  return null;
}

/**
 * Hook for creating versioned URLs
 */
export function useVersionedUrl(url: string): string {
  return createVersionedAssetUrl(url);
}

/**
 * Component that preloads critical assets with versioning
 */
export function VersionedPreloader({ assets }: { assets: Array<{ href: string; as: string; type?: string }> }) {
  useEffect(() => {
    assets.forEach(asset => {
      const versionedHref = createVersionedAssetUrl(asset.href);
      
      // Check if preload link already exists
      const existingPreload = document.querySelector(`link[href*="${asset.href}"][rel="preload"]`);
      if (existingPreload) {
        return;
      }
      
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = versionedHref;
      link.as = asset.as;
      
      if (asset.type) {
        link.type = asset.type;
      }
      
      document.head.appendChild(link);
    });
  }, [assets]);
  
  return null;
}

/**
 * Component that adds version meta tag to document head
 */
export function VersionMeta() {
  useEffect(() => {
    const version = getCurrentVersion();
    
    // Remove existing version meta tag
    const existingMeta = document.querySelector('meta[name="app-version"]');
    if (existingMeta) {
      existingMeta.remove();
    }
    
    // Add new version meta tag
    const meta = document.createElement('meta');
    meta.name = 'app-version';
    meta.content = version.version;
    document.head.appendChild(meta);
    
    // Also add build time meta
    const existingBuildMeta = document.querySelector('meta[name="build-time"]');
    if (existingBuildMeta) {
      existingBuildMeta.remove();
    }
    
    const buildMeta = document.createElement('meta');
    buildMeta.name = 'build-time';
    buildMeta.content = version.buildTime;
    document.head.appendChild(buildMeta);
    
  }, []);
  
  return null;
}

/**
 * Component that handles cache busting for dynamic imports
 */
export function VersionedDynamicImport({ 
  children, 
  fallback = <div>Loading...</div> 
}: { 
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <div data-version={getCurrentVersion().version}>
      {children}
    </div>
  );
}

/**
 * Higher-order component that adds version awareness to any component
 */
export function withVersioning<T extends object>(
  Component: React.ComponentType<T>
) {
  return function VersionedComponent(props: T) {
    const version = getCurrentVersion().version;
    
    return (
      <div data-app-version={version}>
        <Component {...props} />
      </div>
    );
  };
}

/**
 * Component that forces refresh when version changes
 */
export function VersionWatcher() {
  useEffect(() => {
    const currentVersion = getCurrentVersion().version;
    
    // Store version in sessionStorage to detect changes
    const storedVersion = sessionStorage.getItem('app-version');
    
    if (storedVersion && storedVersion !== currentVersion) {
      console.log('🔄 Version change detected, refreshing...');
      window.location.reload();
    } else {
      sessionStorage.setItem('app-version', currentVersion);
    }
  }, []);
  
  return null;
} 