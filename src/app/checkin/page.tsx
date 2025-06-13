'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CheckinSearch, CheckinHistory } from '@/components/checkin';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export default function CheckinPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Function to refresh the history component
  const refreshHistory = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
                Check In
              </h1>
              <p className="text-gray-400">
                Search for places and check in to track your visits
              </p>
            </div>
            <Button
              onClick={refreshHistory}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh History
            </Button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Check-in Search */}
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Search & Check In
              </h2>
              <div className="bg-gray-900 rounded-lg p-4">
                <CheckinSearch 
                  supabase={supabase as any}
                  initialCity="Bangkok, Thailand" // Set Bangkok as default city
                />
              </div>
            </div>

            {/* Instructions Card - REMOVED */}
          </div>

          {/* Right Column - Check-in History */}
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Your Check-in History
              </h2>
              <div className="bg-gray-900 rounded-lg p-4">
                <CheckinHistory 
                  key={refreshKey} // Force re-render when refreshKey changes
                  supabase={supabase as any}
                  limit={15}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Debug Info (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 bg-gray-900 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-300 mb-3">
              🔧 Debug Info
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-400">User ID:</span>
                <p className="text-gray-200 font-mono text-xs break-all">
                  {user?.id || 'Not available'}
                </p>
              </div>
              <div>
                <span className="text-gray-400">Email:</span>
                <p className="text-gray-200">
                  {user?.email || 'Not available'}
                </p>
              </div>
              <div>
                <span className="text-gray-400">Environment:</span>
                <p className="text-gray-200">
                  Development Mode
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 