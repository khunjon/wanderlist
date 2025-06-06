'use client';

import { useEffect, useState } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { useRouter } from 'next/navigation';
import { Line } from 'react-chartjs-2';
import { collection, getDocs, query, orderBy, limit, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

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
    createdAt: Date;
  }>;
  chartData: Array<{
    date: string;
    newUsers: number;
    newLists: number;
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
      
      // Fetch data directly from Firestore (client-side)
      console.log('Fetching admin stats...');
      
      // Get total user count
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const totalUsers = usersSnapshot.size;
      console.log('Total users:', totalUsers);

      // Get top lists by view count (handle case where viewCount might not exist)
      let topLists = [];
      let allListsData = [];
      try {
        const topListsQuery = query(
          collection(db, 'lists'),
          orderBy('viewCount', 'desc'),
          limit(10)
        );
        const topListsSnapshot = await getDocs(topListsQuery);
        topLists = topListsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || 'Untitled List',
            viewCount: data.viewCount || 0,
            userId: data.userId || 'Unknown',
            createdAt: data.createdAt?.toDate?.() || new Date(),
          };
        });
        
        // Also get all lists for total count and public/private breakdown
        const allListsSnapshot = await getDocs(collection(db, 'lists'));
        allListsData = allListsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            isPublic: data.isPublic || false,
            userId: data.userId || 'Unknown',
          };
        });
      } catch (orderError) {
        console.log('ViewCount field might not exist, fetching all lists...');
        const allListsSnapshot = await getDocs(collection(db, 'lists'));
        allListsData = allListsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || 'Untitled List',
            viewCount: data.viewCount || 0,
            userId: data.userId || 'Unknown',
            createdAt: data.createdAt?.toDate?.() || new Date(),
            isPublic: data.isPublic || false,
          };
        });
        
        // Sort by viewCount and take top 10
        topLists = allListsData
          .sort((a, b) => b.viewCount - a.viewCount)
          .slice(0, 10);
      }
      console.log('Top lists:', topLists.length);

      // Get data for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Get new users by day (last 30 days)
      let newUsersSnapshot;
      try {
        const newUsersQuery = query(
          collection(db, 'users'),
          where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo))
        );
        newUsersSnapshot = await getDocs(newUsersQuery);
      } catch (userError) {
        console.log('Error querying users by date, using all users...');
        newUsersSnapshot = await getDocs(collection(db, 'users'));
      }
      
      // Get new lists by day (last 30 days)
      let newListsSnapshot;
      try {
        const newListsQuery = query(
          collection(db, 'lists'),
          where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo))
        );
        newListsSnapshot = await getDocs(newListsQuery);
      } catch (listError) {
        console.log('Error querying lists by date, using all lists...');
        newListsSnapshot = await getDocs(collection(db, 'lists'));
      }

      // Process data for charts
      const usersByDay: { [key: string]: number } = {};
      const listsByDay: { [key: string]: number } = {};

      // Initialize all days with 0
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        usersByDay[dateKey] = 0;
        listsByDay[dateKey] = 0;
      }

      // Count new users by day
      newUsersSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate?.() || new Date();
        const dateKey = createdAt.toISOString().split('T')[0];
        if (usersByDay.hasOwnProperty(dateKey)) {
          usersByDay[dateKey]++;
        }
      });

      // Count new lists by day
      newListsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate?.() || new Date();
        const dateKey = createdAt.toISOString().split('T')[0];
        if (listsByDay.hasOwnProperty(dateKey)) {
          listsByDay[dateKey]++;
        }
      });

      // Convert to chart data format
      const chartData = Object.keys(usersByDay)
        .sort()
        .map(date => ({
          date,
          newUsers: usersByDay[date],
          newLists: listsByDay[date],
        }));

      const statsData = {
        totalUsers,
        totalLists: allListsData.length,
        publicLists: allListsData.filter(list => list.isPublic === true).length,
        privateLists: allListsData.filter(list => list.isPublic === false).length,
        topLists,
        chartData,
      };
      
      console.log('Stats loaded successfully:', statsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      setError(error instanceof Error ? error.message : 'Failed to load admin statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-300">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Error</h1>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={fetchAdminStats}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Prepare chart data with dark theme
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#e5e7eb', // gray-200
        },
      },
      title: {
        display: true,
        text: 'New Users and Lists (Last 30 Days)',
        color: '#f9fafb', // gray-50
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#9ca3af', // gray-400
        },
        grid: {
          color: '#374151', // gray-700
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: '#9ca3af', // gray-400
        },
        grid: {
          color: '#374151', // gray-700
        },
      },
    },
  };

  const chartDataConfig = stats ? {
    labels: stats.chartData.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: 'New Users',
        data: stats.chartData.map(item => item.newUsers),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
      },
      {
        label: 'New Lists',
        data: stats.chartData.map(item => item.newLists),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.1,
      },
    ],
  } : null;

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="mt-2 text-gray-300">Overview of platform statistics and top performing content</p>
        </div>

        {statsLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-300">Loading statistics...</p>
          </div>
        ) : stats ? (
          <div className="space-y-8">
            {/* Stats Overview */}
            <div className="space-y-6">
              {/* Row 1: Total Users, New Users (30d) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-700">
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-400 mb-1">Total Users</p>
                    <p className="text-xl font-semibold text-white">{stats.totalUsers.toLocaleString()}</p>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-700">
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-400 mb-1">New Users (30d)</p>
                    <p className="text-xl font-semibold text-white">
                      {stats.chartData.reduce((sum, item) => sum + item.newUsers, 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Row 2: Total Lists, New Lists */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-700">
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-400 mb-1">Total Lists</p>
                    <p className="text-xl font-semibold text-white">{stats.totalLists.toLocaleString()}</p>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-700">
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-400 mb-1">New Lists (30d)</p>
                    <p className="text-xl font-semibold text-white">
                      {stats.chartData.reduce((sum, item) => sum + item.newLists, 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Row 3: Public Lists, Private Lists */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-700">
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-400 mb-1">Public Lists</p>
                    <p className="text-xl font-semibold text-white">{stats.publicLists.toLocaleString()}</p>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-700">
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-400 mb-1">Private Lists</p>
                    <p className="text-xl font-semibold text-white">{stats.privateLists.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
              <h2 className="text-lg font-semibold text-white mb-4">Growth Trends</h2>
              {chartDataConfig && (
                <div className="h-96">
                  <Line options={chartOptions} data={chartDataConfig} />
                </div>
              )}
            </div>

            {/* Top Lists */}
            <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700">
              <div className="px-6 py-4 border-b border-gray-700">
                <h2 className="text-lg font-semibold text-white">Top Lists by Views</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        List Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Views
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        User ID
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {stats.topLists.map((list) => (
                      <tr key={list.id} className="hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">{list.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-300">{list.viewCount.toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-400">
                            {new Date(list.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-400 font-mono">{list.userId}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
} 