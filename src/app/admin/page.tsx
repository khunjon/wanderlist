'use client';

import { useEffect, useState } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface AdminStats {
  totalUsers: number;
  totalLists: number;
  publicLists: number;
  privateLists: number;
  topLists: Array<{
    id: string;
    name: string;
    viewCount: number;
    userId: string;
    createdAt: string;
  }>;
}

export default function AdminPage() {
  const { isAdmin, user, loading } = useAdmin();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/');
      return;
    }

    if (isAdmin && user) {
      fetchAdminStats();
    }
  }, [isAdmin, user, loading, router]);

  const fetchAdminStats = async () => {
    try {
      setStatsLoading(true);
      setError(null);
      
      // Get total user count
      const { count: totalUsers, error: usersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      if (usersError) throw usersError;

      // Get total lists count and public/private breakdown
      const { data: allLists, error: listsError } = await supabase
        .from('lists')
        .select('id, name, is_public, view_count, user_id, created_at')
        .order('view_count', { ascending: false });
      
      if (listsError) throw listsError;

      const totalLists = allLists?.length || 0;
      const publicLists = allLists?.filter(list => list.is_public).length || 0;
      const privateLists = totalLists - publicLists;

      // Get top 10 lists by view count
      const topLists = (allLists || [])
        .slice(0, 10)
        .map(list => ({
          id: list.id,
          name: list.name,
          viewCount: list.view_count || 0,
          userId: list.user_id,
          createdAt: list.created_at || new Date().toISOString(),
        }));

      setStats({
        totalUsers: totalUsers || 0,
        totalLists,
        publicLists,
        privateLists,
        topLists,
      });
    } catch (err) {
      console.error('Error fetching admin stats:', err);
      setError('Failed to load admin statistics. Please try again.');
    } finally {
      setStatsLoading(false);
    }
  };

  if (loading || statsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-white">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-300">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gray-900 shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-white">Admin Dashboard</h1>
        </div>
      </header>
      
      <main>
        <div className="mx-auto max-w-7xl py-6 px-4 sm:px-6 lg:px-8">
          {error && (
            <div className="mb-6 bg-red-900 border-l-4 border-red-600 p-4 rounded-r-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              </div>
            </div>
          )}

          {stats && (
            <div className="space-y-6">
              {/* Overview Stats */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div className="bg-gray-800 overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-400 truncate">Total Users</dt>
                          <dd className="text-lg font-medium text-white">{stats.totalUsers}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-400 truncate">Total Lists</dt>
                          <dd className="text-lg font-medium text-white">{stats.totalLists}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-400 truncate">Public Lists</dt>
                          <dd className="text-lg font-medium text-white">{stats.publicLists}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-400 truncate">Private Lists</dt>
                          <dd className="text-lg font-medium text-white">{stats.privateLists}</dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Lists */}
              <div className="bg-gray-800 shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-white mb-4">Top Lists by Views</h3>
                  <div className="overflow-hidden">
                    <table className="min-w-full">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Views</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Created</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {stats.topLists.map((list) => (
                          <tr key={list.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{list.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{list.viewCount}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {new Date(list.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Database Info */}
              <div className="bg-gray-800 shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-white mb-4">Database Information</h3>
                  <div className="text-sm text-gray-300 space-y-2">
                    <p><strong>Database:</strong> Supabase (PostgreSQL)</p>
                    <p><strong>Authentication:</strong> Supabase Auth</p>
                    <p><strong>Storage:</strong> Supabase Storage</p>
                    <p><strong>Real-time:</strong> Enabled</p>
                    <p><strong>Backend:</strong> ✅ Supabase (PostgreSQL, Auth, Storage, Real-time)</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 