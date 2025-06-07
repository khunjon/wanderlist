'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase/config';
import { clearAuthCache } from '@/lib/firebase/auth';

export default function FirebaseDebug() {
  const [config, setConfig] = useState<any>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (auth?.app?.options) {
      setConfig({
        apiKey: auth.app.options.apiKey?.substring(0, 10) + '...',
        authDomain: auth.app.options.authDomain,
        projectId: auth.app.options.projectId,
        currentDomain: typeof window !== 'undefined' ? window.location.hostname : 'N/A',
        envVars: {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'Set' : 'Missing',
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? 'Set' : 'Missing',
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? 'Set' : 'Missing',
        }
      });
    }
  }, []);

  const handleClearCache = async () => {
    setIsClearing(true);
    setMessage('');
    
    try {
      await clearAuthCache();
      setMessage('✅ Firebase auth cache cleared! Please refresh the page.');
    } catch (error) {
      setMessage('❌ Error clearing cache. Check console for details.');
      console.error('Cache clear error:', error);
    } finally {
      setIsClearing(false);
    }
  };

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-gray-800 border border-gray-600 rounded-lg p-4 shadow-lg max-w-sm">
      <h3 className="text-white text-sm font-semibold mb-2">🔧 Debug Tools</h3>
      
      <button
        onClick={handleClearCache}
        disabled={isClearing}
        className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-xs px-3 py-2 rounded mb-2"
      >
        {isClearing ? 'Clearing...' : 'Clear Auth Cache'}
      </button>
      
      {message && (
        <p className="text-xs text-gray-300 mt-2">{message}</p>
      )}
      
      <details className="mt-2">
        <summary className="text-xs text-gray-400 cursor-pointer">Cache Info</summary>
        <div className="text-xs text-gray-400 mt-1">
          <p>Auth Domain: {process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}</p>
          <p>Project ID: {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}</p>
        </div>
      </details>
      
      <h3 className="font-bold mt-4 mb-2">🔥 Firebase Debug</h3>
      {config ? (
        <div className="space-y-1">
          <div><strong>API Key:</strong> {config.apiKey}</div>
          <div><strong>Auth Domain:</strong> {config.authDomain}</div>
          <div><strong>Project ID:</strong> {config.projectId}</div>
          <div><strong>Current Domain:</strong> {config.currentDomain}</div>
          
          <div className="mt-2 pt-2 border-t border-gray-600">
            <div className="text-xs font-semibold mb-1">Environment Variables:</div>
            <div>API Key: {config.envVars.apiKey}</div>
            <div>Auth Domain: {config.envVars.authDomain}</div>
            <div>Project ID: {config.envVars.projectId}</div>
          </div>
          
          <div className="mt-2 text-yellow-300">
            {config.authDomain !== config.currentDomain && (
              <div>⚠️ Auth domain mismatch!</div>
            )}
            {config.projectId === 'unknown' && (
              <div>⚠️ Project ID not loaded!</div>
            )}
          </div>
        </div>
      ) : (
        <div>Loading Firebase config...</div>
      )}
    </div>
  );
} 