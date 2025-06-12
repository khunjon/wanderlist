'use client';

import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { validateSession, authLogger } from '@/lib/supabase/authUtils';

export default function AuthDebug() {
  const { user, loading, error, supabaseUser, sessionRecovered, retryAuth } = useAuth();
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  useEffect(() => {
    const checkSession = async () => {
      try {
        const validation = await validateSession();
        setSessionInfo(validation);
        setLastRefresh(new Date());
      } catch (err) {
        authLogger.error('Session check failed in debug component:', err);
      }
    };

    checkSession();
    
    // Refresh session info every 30 seconds
    const interval = setInterval(checkSession, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleRetry = async () => {
    try {
      await retryAuth();
    } catch (err) {
      authLogger.error('Manual retry failed:', err);
    }
  };

  const getStatusColor = () => {
    if (loading) return 'bg-yellow-800';
    if (error) return 'bg-red-800';
    if (user) return 'bg-green-800';
    return 'bg-gray-800';
  };

  const getSessionStatus = () => {
    if (!sessionInfo) return 'Unknown';
    if (sessionInfo.isValid) return 'Valid';
    if (sessionInfo.isExpired) return 'Expired';
    if (sessionInfo.needsRefresh) return 'Needs Refresh';
    return 'Invalid';
  };

  return (
    <div className={`fixed bottom-4 right-4 ${getStatusColor()} text-white p-3 rounded-lg shadow-lg max-w-sm text-xs z-50 transition-all duration-200`}>
      <div 
        className="cursor-pointer flex justify-between items-center"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="font-bold">Auth Debug</h3>
        <span className="text-xs">{isExpanded ? '▼' : '▶'}</span>
      </div>
      
      {isExpanded && (
        <div className="mt-2 space-y-1">
          <div className="border-t border-gray-600 pt-2">
            <div><strong>Status:</strong> {loading ? 'Loading' : user ? 'Authenticated' : 'Not Authenticated'}</div>
            <div><strong>User ID:</strong> {user?.id || 'None'}</div>
            <div><strong>Email:</strong> {user?.email || supabaseUser?.email || 'None'}</div>
            <div><strong>Session Recovered:</strong> {sessionRecovered ? 'Yes' : 'No'}</div>
          </div>
          
          <div className="border-t border-gray-600 pt-2">
            <div><strong>Session Status:</strong> {getSessionStatus()}</div>
            {sessionInfo?.session && (
              <>
                <div><strong>Expires:</strong> {new Date((sessionInfo.session.expires_at || 0) * 1000).toLocaleTimeString()}</div>
                <div><strong>Provider:</strong> {sessionInfo.session.user?.app_metadata?.provider || 'email'}</div>
              </>
            )}
            <div><strong>Last Check:</strong> {lastRefresh?.toLocaleTimeString() || 'Never'}</div>
          </div>
          
          {error && (
            <div className="border-t border-gray-600 pt-2">
              <div><strong>Error:</strong> {error.message}</div>
              <button 
                onClick={handleRetry}
                className="mt-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
              >
                Retry Auth
              </button>
            </div>
          )}
          
          <div className="border-t border-gray-600 pt-2">
            <div><strong>Supabase URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing'}</div>
            <div><strong>Supabase Key:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'}</div>
          </div>
          
          <div className="border-t border-gray-600 pt-2">
            <div><strong>Local Storage Keys:</strong></div>
            <div className="text-xs text-gray-300">
              {typeof window !== 'undefined' ? 
                Object.keys(localStorage)
                  .filter(key => key.startsWith('sb-'))
                  .map(key => key.substring(0, 20) + '...')
                  .join(', ') || 'None'
                : 'N/A'
              }
            </div>
          </div>
          
          <div className="text-xs text-gray-400 mt-2">
            Updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  );
} 