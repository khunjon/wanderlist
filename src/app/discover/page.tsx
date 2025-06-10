'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getPublicListsForDiscovery } from '@/lib/supabase/database';
import { useRouter } from 'next/navigation';
import { SortState } from '@/components/ui/SortControl';
import { trackListView as trackListViewGA } from '@/lib/analytics/gtag';
import { trackListView } from '@/lib/mixpanelClient';
import { DiscoverHeader, DiscoverGrid, DiscoverLoading, DiscoverEmptyState } from '@/components/discover';
import type { ListWithPlaceCountAndAuthor } from '@/components/discover/DiscoverGrid';
import { perf } from '@/lib/utils/performance';

// Sort options for discover page
const sortOptions = [
  { value: 'view_count', label: 'Most Popular', field: 'view_count', direction: 'desc' as const },
  { value: 'created_at_desc', label: 'Newest', field: 'created_at', direction: 'desc' as const },
  { value: 'created_at_asc', label: 'Oldest', field: 'created_at', direction: 'asc' as const },
  { value: 'name_asc', label: 'Name A-Z', field: 'name', direction: 'asc' as const },
  { value: 'name_desc', label: 'Name Z-A', field: 'name', direction: 'desc' as const },
];

export default function DiscoverPage() {
  const { user } = useAuth();
  const [allLists, setAllLists] = useState<ListWithPlaceCountAndAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortState, setSortState] = useState<SortState>({ field: 'view_count', direction: 'desc' });
  const [displayLists, setDisplayLists] = useState<ListWithPlaceCountAndAuthor[]>([]);
  const router = useRouter();

  // Performance monitoring for component lifecycle
  const componentTimer = useMemo(() => perf.component('DiscoverPage', 'mount'), []);
  
  useEffect(() => {
    componentTimer.start();
    return () => {
      componentTimer.end();
    };
  }, [componentTimer]);

  // Debounce search input with 300ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Update display lists whenever allLists, debouncedSearch, or sortState changes
  useEffect(() => {
    const processingTimer = perf.operation('discoverProcessing', { 
      totalLists: allLists.length, 
      hasSearch: !!debouncedSearch.trim(),
      sortField: sortState.field 
    });
    processingTimer.start();

    let filtered = allLists;

    // Apply search filter
    if (debouncedSearch.trim()) {
      const searchTerm = debouncedSearch.toLowerCase().trim();
      filtered = allLists.filter((list) => {
        // Search in list name
        const nameMatch = list.name.toLowerCase().includes(searchTerm);
        
        // Search in description
        const descriptionMatch = list.description?.toLowerCase().includes(searchTerm);
        
        // Search in city
        const cityMatch = list.city?.toLowerCase().includes(searchTerm);
        
        return nameMatch || descriptionMatch || cityMatch;
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
        case 'created_at':
          aValue = a.created_at ? new Date(a.created_at).getTime() : 0;
          bValue = b.created_at ? new Date(b.created_at).getTime() : 0;
          break;
        case 'view_count':
          aValue = a.view_count || 0;
          bValue = b.view_count || 0;
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
    processingTimer.end();
  }, [allLists, debouncedSearch, sortState]);

  // Fetch public lists
  useEffect(() => {
    const fetchLists = async () => {
      try {
        setLoading(true);
        
        // Performance monitoring for API call
        const fetchTimer = perf.api('/api/discover/lists', 'GET');
        fetchTimer.start();
        
        const lists = await getPublicListsForDiscovery(50, 0, undefined, undefined, 'view_count', 'desc');
        
        fetchTimer.end(200, JSON.stringify(lists).length);
        
        // Transform the data to match our expected type
        const transformTimer = perf.operation('dataTransformation', { listCount: lists.length });
        transformTimer.start();
        
        const transformedLists: ListWithPlaceCountAndAuthor[] = lists.map((list: any) => ({
          ...list,
          place_count: list.place_count || 0,
          author: list.users ? {
            display_name: list.users.display_name,
            avatar_url: list.users.photo_url
          } : undefined
        }));
        
        transformTimer.end();
        setAllLists(transformedLists);
      } catch (error) {
        console.error('Error fetching public lists:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLists();
  }, []);

  // Memoized search input change handler
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
  }, []);

  // Memoized clear search handler
  const handleClearSearch = useCallback(() => {
    setSearchInput('');
  }, []);

  // Memoized list click handler
  const handleListClick = useCallback((list: ListWithPlaceCountAndAuthor) => {
    // Track with Google Analytics
    trackListViewGA(list.name, list.id);
    
    // Track with Mixpanel
    trackListView({
      list_id: list.id,
      list_name: list.name,
      list_author: list.author?.display_name || 'Unknown',
      list_creation_date: list.created_at || new Date().toISOString(),
      place_count: list.place_count || 0,
      is_public: true
    });
    
    router.push(`/lists/${list.id}`);
  }, [router]);

  // Memoized sort change handler
  const handleSortChange = useCallback((newSort: SortState) => {
    setSortState(newSort);
  }, []);

  // Memoized search props object
  const searchProps = useMemo(() => ({
    value: searchInput,
    onChange: handleSearchChange,
    onClear: handleClearSearch
  }), [searchInput, handleSearchChange, handleClearSearch]);

  // Memoized sort props object
  const sortProps = useMemo(() => ({
    state: sortState,
    options: sortOptions,
    onChange: handleSortChange
  }), [sortState, handleSortChange]);

  return (
    <div className="min-h-screen bg-background">
      <DiscoverHeader
        search={searchProps}
        sort={sortProps}
        hasLists={displayLists.length > 0}
      />
      <main>
        {loading ? (
          <DiscoverLoading />
        ) : displayLists.length > 0 ? (
          <DiscoverGrid lists={displayLists} onListClick={handleListClick} />
        ) : (
          <DiscoverEmptyState />
        )}
      </main>
    </div>
  );
} 