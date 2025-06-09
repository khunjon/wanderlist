'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { getPublicLists } from '@/lib/supabase/database';
import { List } from '@/types';
import { useRouter } from 'next/navigation';
import { trackListView } from '@/lib/analytics/gtag';
import SortControl, { SortState, SortOption } from '@/components/ui/SortControl';

const sortOptions: SortOption[] = [
  { value: 'updatedAt', label: 'Last Edited' },
  { value: 'name', label: 'Name' },
  { value: 'createdAt', label: 'Created Date' },
  { value: 'viewCount', label: 'Views' },
];

export default function DiscoverPage() {
  const { user, loading: authLoading } = useAuth();
  const [allLists, setAllLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(true);
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

  // Fetch public lists
  const fetchLists = useCallback(async () => {
    try {
      setLoading(true);
      // Use enhanced getPublicLists with better sorting and pagination
      const publicLists = await getPublicLists(50, 0, undefined, undefined, 'view_count', 'desc');
      setAllLists(publicLists);
    } catch (error) {
      console.error('Error fetching public lists:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Don't redirect unauthenticated users - they can view public lists
    // Authentication will be required for future features like liking/favoriting
    
    // Fetch public lists regardless of authentication status
    fetchLists();
  }, [fetchLists]);

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
    trackListView(list.name, list.id);
    router.push(`/lists/${list.id}`);
  }, [router]);

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

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gray-900 shadow">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <h1 className="text-3xl font-bold tracking-tight text-white">Discover</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center relative">
                <input
                  type="text"
                  placeholder="Search public lists..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full md:w-64 px-4 py-2 rounded-md border-0 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        </div>
      </header>
      <main>
        <div className="mx-auto max-w-7xl py-3 sm:py-6 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-white">Loading public lists...</p>
            </div>
          ) : sortedLists.length > 0 ? (
            <>
              <div className="mb-3 sm:mb-6">
                <SortControl
                  options={sortOptions}
                  currentSort={sortState}
                  onSortChange={handleSortChange}
                  className="w-full sm:w-auto"
                  listId="discover-page"
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
                      </div>
                      
                      {/* Description - prominently displayed */}
                      <p className="text-sm text-gray-300 line-clamp-2 mb-3 sm:mb-4 min-h-[2.5rem]">
                        {list.description || 'No description'}
                      </p>
                      
                      {/* Location if available */}
                      {list.city && (
                        <p className="text-sm text-blue-300 mb-2">📍 {list.city}</p>
                      )}
                      
                      <div className="flex justify-between items-center text-xs text-gray-400">
                        <div className="flex flex-col space-y-1">
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
                  {sortedLists.length} public {sortedLists.length === 1 ? 'list' : 'lists'}
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
              <h3 className="mt-2 text-sm font-medium text-white">No public lists</h3>
              <p className="mt-1 text-sm text-gray-300">Be the first to create a public list!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 