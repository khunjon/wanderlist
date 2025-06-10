'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { getUserLists } from '@/lib/supabase/database';
import { List } from '@/types';
import { useRouter } from 'next/navigation';
import { trackListView as trackListViewGA } from '@/lib/analytics/gtag';
import { trackListView } from '@/lib/mixpanelClient';
import SortControl, { SortState, SortOption } from '@/components/ui/SortControl';


const sortOptions: SortOption[] = [
  { value: 'updatedAt', label: 'Last Edited' },
  { value: 'name', label: 'Name' },
  { value: 'createdAt', label: 'Created Date' },
  { value: 'viewCount', label: 'Views' },
];

export default function ListsPage() {
  const { user, loading: authLoading } = useAuth();
  const [allLists, setAllLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortState, setSortState] = useState<SortState>({ field: 'updatedAt', direction: 'desc' });
  const router = useRouter();

  // Memoized sort function
  const sortLists = useCallback((listsToSort: List[], sort: SortState) => {
    const sorted = [...listsToSort].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sort.field) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'createdAt':
          aValue = a.created_at ? new Date(a.created_at).getTime() : 0;
          bValue = b.created_at ? new Date(b.created_at).getTime() : 0;
          break;
        case 'updatedAt':
          aValue = a.updated_at ? new Date(a.updated_at).getTime() : 0;
          bValue = b.updated_at ? new Date(b.updated_at).getTime() : 0;
          break;
        case 'viewCount':
          aValue = a.view_count || 0;
          bValue = b.view_count || 0;
          break;
        default:
          return 0;
      }

      if (sort.direction === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return sorted;
  }, []);

  // Memoized filter function
  const filterLists = useCallback((listsToFilter: List[], query: string) => {
    if (!query.trim()) {
      return listsToFilter;
    }

    const searchTerm = query.toLowerCase().trim();
    return listsToFilter.filter((list) => {
      // Search in list name
      const nameMatch = list.name.toLowerCase().includes(searchTerm);
      
      // Search in tags
      const tagMatch = list.tags && list.tags.some(tag => 
        tag.toLowerCase().includes(searchTerm)
      );
      
      return nameMatch || tagMatch;
    });
  }, []);

  // Memoized filtered lists
  const filteredLists = useMemo(() => {
    return filterLists(allLists, searchQuery);
  }, [allLists, searchQuery, filterLists]);

  // Memoized sorted lists
  const sortedLists = useMemo(() => {
    return sortLists(filteredLists, sortState);
  }, [filteredLists, sortState, sortLists]);

  // Fetch user's lists
  const fetchLists = useCallback(async () => {
    if (!user || hasFetched) return;
    
    try {
      setLoading(true);
      setHasFetched(true);
      const userLists = await getUserLists(user.id);
      setAllLists(userLists);
    } catch (error) {
      console.error('Error fetching lists:', error);
      setHasFetched(false); // Reset on error so it can be retried
    } finally {
      setLoading(false);
    }
  }, [user, hasFetched]);

  useEffect(() => {
    // Redirect if not authenticated
    if (!authLoading && !user) {
      router.push('/');
      return;
    }

    // Fetch lists when user is available and we haven't fetched yet
    if (user && !authLoading && !hasFetched) {
      // Use setTimeout to defer the expensive operation
      const timeoutId = setTimeout(() => {
        fetchLists();
      }, 0);
      
      return () => clearTimeout(timeoutId);
    }
  }, [user, authLoading, router, fetchLists, hasFetched]);

  // Reset fetch flag when user changes
  useEffect(() => {
    if (user) {
      setHasFetched(false);
    }
  }, [user?.id]); // Only reset when user ID changes

  // Memoized search input change handler
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  // Memoized clear search handler
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  // Memoized list click handler
  const handleListClick = useCallback((list: List) => {
    // Track with Google Analytics
    trackListViewGA(list.name, list.id);
    
    // Track with Mixpanel
    trackListView({
      list_id: list.id,
      list_name: list.name,
      list_author: user?.displayName || user?.email || 'Unknown',
      list_creation_date: list.created_at || new Date().toISOString(),
      is_public: list.is_public || false,
      view_count: list.view_count || 0
    });
    
    router.push(`/lists/${list.id}`);
  }, [router, user]);

  // Memoized sort change handler
  const handleSortChange = useCallback((newSort: SortState) => {
    setSortState(newSort);
  }, []);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-white">Loading...</p>
        </div>
      </div>
    );
  }

  // Show page structure immediately, even while lists are loading
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gray-900 shadow">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col space-y-4">
            {/* Header row with title and New List button */}
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold tracking-tight text-white">My Lists</h1>
              <Link
                href="/lists/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                New List
              </Link>
            </div>
            
            {/* Search bar - full width */}
            <div className="flex items-center relative">
              <input
                type="text"
                placeholder="Search my lists..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full px-4 py-2 rounded-md border-0 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 text-gray-400 hover:text-white"
                  aria-label="Clear search"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
      <main>
        <div className="mx-auto max-w-7xl py-3 sm:py-6 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-white">Loading lists...</p>
            </div>
          ) : sortedLists.length > 0 ? (
            <>
              <div className="mb-3 sm:mb-6">
                <SortControl
                  options={sortOptions}
                  currentSort={sortState}
                  onSortChange={handleSortChange}
                  className="w-full sm:w-auto"
                  listId="lists-page"
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {sortedLists.map((list) => (
                  <div
                    key={list.id}
                    onClick={() => handleListClick(list)}
                    className="bg-gray-800 overflow-hidden shadow-lg rounded-xl hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 border border-gray-700 hover:border-gray-600"
                  >
                    <div className="px-4 py-4 sm:px-6 sm:py-6">
                      <div className="flex justify-between items-start mb-2 sm:mb-3">
                        <h3 className="text-lg sm:text-xl font-semibold text-white truncate pr-2">{list.name}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                          list.is_public 
                            ? 'bg-green-900 text-green-200' 
                            : 'bg-purple-900 text-purple-200'
                        }`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {list.is_public ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            )}
                          </svg>
                          {list.is_public ? 'Public' : 'Private'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 line-clamp-2 mb-3 sm:mb-4 min-h-[2.5rem]">
                        {list.description || 'No description'}
                      </p>
                      <div className="flex justify-between items-center text-xs text-gray-400">
                        <div className="flex flex-col space-y-1">
                          <span>Last updated: {list.updated_at ? new Date(list.updated_at).toLocaleDateString() : 'Unknown'}</span>
                        </div>
                        {list.view_count !== undefined && (
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>{list.view_count} views</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 text-center">
                <p className="text-sm text-gray-300">
                  {sortedLists.length} {sortedLists.length === 1 ? 'list' : 'lists'}
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-12 bg-gray-800 shadow rounded-lg">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-white">No lists</h3>
              <p className="mt-1 text-sm text-gray-300">Get started by creating your first list.</p>
              <div className="mt-6">
                <Link
                  href="/lists/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg
                    className="-ml-1 mr-2 h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  New List
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 