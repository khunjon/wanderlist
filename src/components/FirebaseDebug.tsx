'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase/config';

export default function FirebaseDebug() {
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    if (auth?.app?.options) {
      setConfig({
        apiKey: auth.app.options.apiKey?.substring(0, 10) + '...',
        authDomain: auth.app.options.authDomain,
        projectId: auth.app.options.projectId,
        currentDomain: typeof window !== 'undefined' ? window.location.hostname : 'N/A',
      });
    }
  }, []);

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">Firebase Debug</h3>
      {config ? (
        <div className="space-y-1">
          <div><strong>API Key:</strong> {config.apiKey}</div>
          <div><strong>Auth Domain:</strong> {config.authDomain}</div>
          <div><strong>Project ID:</strong> {config.projectId}</div>
          <div><strong>Current Domain:</strong> {config.currentDomain}</div>
          <div className="mt-2 text-yellow-300">
            {config.authDomain !== config.currentDomain && (
              <div>⚠️ Auth domain mismatch!</div>
            )}
          </div>
        </div>
      ) : (
        <div>Loading Firebase config...</div>
      )}
    </div>
  );
} 