'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getUserListsWithPlaceCounts } from '@/lib/supabase/database';
import { useRouter } from 'next/navigation';
import { trackListView as trackListViewGA } from '@/lib/analytics/gtag';
import { trackListView } from '@/lib/mixpanelClient';
import { SortState, SortOption } from '@/components/ui/SortControl';

// Import extracted components
import { 
  ListsHeader, 
  ListsGrid, 
  ListsEmptyState, 
  ListsLoading,
  type ListWithPlaceCount 
} from '@/components/lists';

const sortOptions: SortOption[] = [
  { value: 'updatedAt', label: 'Last Edited' },
  { value: 'name', label: 'Name' },
  { value: 'createdAt', label: 'Created Date' },
  { value: 'viewCount', label: 'Views' },
  { value: 'placeCount', label: 'Places' }, // New sort option for place count
];

// Simple cache for getUserListsWithPlaceCounts API calls
const listsCache = new Map<string, { data: ListWithPlaceCount[]; timestamp: number }>();
const CACHE_DURATION = 30 * 1000; // 30 seconds

export default function ListsPage() {
  const { user, loading: authLoading } = useAuth();
  const [allLists, setAllLists] = useState<ListWithPlaceCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortState, setSortState] = useState<SortState>({ field: 'updatedAt', direction: 'desc' });
  const [displayLists, setDisplayLists] = useState<ListWithPlaceCount[]>([]);
  const router = useRouter();

  // Debounce search input with 300ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Update display lists whenever allLists, debouncedSearch, or sortState changes
  useEffect(() => {
    let filtered = allLists;

    // Apply search filter
    if (debouncedSearch.trim()) {
      const searchTerm = debouncedSearch.toLowerCase().trim();
      filtered = allLists.filter((list) => {
        // Search in list name
        const nameMatch = list.name.toLowerCase().includes(searchTerm);
        
        // Search in tags
        const tagMatch = list.tags && list.tags.some(tag => 
          tag.toLowerCase().includes(searchTerm)
        );
        
        return nameMatch || tagMatch;
      });
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortState.field) {
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
        case 'placeCount':
          aValue = a.place_count || 0;
          bValue = b.place_count || 0;
          break;
        default:
          return 0;
      }

      if (sortState.direction === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setDisplayLists(sorted);
  }, [allLists, debouncedSearch, sortState]);

  // Simplified auth and data fetching logic - single useEffect
  useEffect(() => {
    // Handle authentication and data fetching in one place
    const handleAuthAndData = async () => {
      // If still loading auth, wait
      if (authLoading) {
        return;
      }

      // If no user after auth loading is complete, redirect to home
      if (!user) {
        router.push('/');
        return;
      }

      // User is authenticated, fetch their lists
      try {
        setLoading(true);
        
        // Check cache first
        const cacheKey = user.id;
        const cached = listsCache.get(cacheKey);
        const now = Date.now();
        
        if (cached && (now - cached.timestamp) < CACHE_DURATION) {
          // Use cached data
          setAllLists(cached.data);
          setLoading(false);
          return;
        }
        
        // Fetch fresh data
        const userLists = await getUserListsWithPlaceCounts(user.id);
        
        // Update cache
        listsCache.set(cacheKey, {
          data: userLists,
          timestamp: now
        });
        
        setAllLists(userLists);
      } catch (error) {
        console.error('Error fetching lists:', error);
      } finally {
        setLoading(false);
      }
    };

    handleAuthAndData();
  }, [user, authLoading, router]);

  // Memoized search input change handler
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
  }, []);

  // Memoized clear search handler
  const handleClearSearch = useCallback(() => {
    setSearchInput('');
  }, []);

  // Memoized list click handler
  const handleListClick = useCallback((list: ListWithPlaceCount) => {
    // Track with Google Analytics
    trackListViewGA(list.name, list.id);
    
    // Track with Mixpanel
    trackListView({
      list_id: list.id,
      list_name: list.name,
      list_author: user?.displayName || 'Unknown',
      list_creation_date: list.created_at || new Date().toISOString(),
      place_count: list.place_count,
      is_public: list.is_public || false
    });
    
    router.push(`/lists/${list.id}`);
  }, [user?.displayName, router]);

  // Memoized sort change handler
  const handleSortChange = useCallback((newSort: SortState) => {
    setSortState(newSort);
  }, []);

  // Memoized search props object
  const searchProps = useMemo(() => ({
    value: searchInput,
    onChange: handleSearchChange,
    onClear: handleClearSearch,
    disabled: loading
  }), [searchInput, handleSearchChange, handleClearSearch, loading]);

  // Memoized sort props object
  const sortProps = useMemo(() => ({
    state: sortState,
    options: sortOptions,
    onChange: handleSortChange
  }), [sortState, handleSortChange]);

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
      <ListsHeader
        search={searchProps}
        sort={sortProps}
        hasLists={displayLists.length > 0}
      />
      <main>
        {loading ? (
          <ListsLoading />
        ) : displayLists.length > 0 ? (
          <ListsGrid lists={displayLists} onListClick={handleListClick} />
        ) : (
          <ListsEmptyState />
        )}
      </main>
    </div>
  );
} 