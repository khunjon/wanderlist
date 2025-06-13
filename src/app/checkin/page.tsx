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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-1">
                Check In
              </h1>
              <p className="text-gray-400 text-sm sm:text-base">
                Search for places and check in to track your visits
              </p>
            </div>
            <Button
              onClick={refreshHistory}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 shrink-0"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {/* Main Content - Single Column */}
        <div className="space-y-6">
          {/* Check-in Search */}
          <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">
              Search & Check In
            </h2>
            <CheckinSearch 
              supabase={supabase as any}
              initialCity="Bangkok, Thailand"
            />
          </div>

          {/* Check-in History */}
          <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">
              Your Check-in History
            </h2>
            <CheckinHistory 
              key={refreshKey}
              supabase={supabase as any}
              limit={15}
            />
          </div>
        </div>

        {/* Debug Info (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 bg-gray-900 rounded-lg p-4 sm:p-6">
            <h3 className="text-lg font-medium text-gray-300 mb-3">
              🔧 Debug Info
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
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