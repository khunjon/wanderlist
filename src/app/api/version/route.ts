import { NextRequest } from 'next/server';
import { createNoCacheResponse } from '@/lib/utils/cache';
import { getCurrentVersion } from '@/lib/utils/version';

/**
 * Version API endpoint
 * Returns current server version information for client-side version checking
 */
export async function GET(request: NextRequest) {
  try {
    const versionInfo = getCurrentVersion();
    
    // Add server timestamp for additional verification
    const responseData = {
      ...versionInfo,
      serverTime: new Date().toISOString(),
      endpoint: '/api/version',
    };
    
    // Always return no-cache response for version checks
    return createNoCacheResponse(responseData);
  } catch (error) {
    console.error('Version API error:', error);
    
    // Return fallback version info
    const fallbackVersion = {
      version: 'unknown',
      buildTime: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      serverTime: new Date().toISOString(),
      endpoint: '/api/version',
      error: 'Failed to retrieve version info',
    };
    
    return createNoCacheResponse(fallbackVersion, 500);
  }
} 