'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getPublicLists } from '@/lib/supabase/database';
import { List } from '@/types';
import { useRouter } from 'next/navigation';
import { trackListView as trackListViewGA } from '@/lib/analytics/gtag';
import { trackListView } from '@/lib/mixpanelClient';
import { SortState, SortOption } from '@/components/ui/SortControl';

// Import extracted components
import { 
  DiscoverHeader, 
  DiscoverGrid, 
  DiscoverEmptyState, 
  DiscoverLoading 
} from '@/components/discover';

const sortOptions: SortOption[] = [
  { value: 'updatedAt', label: 'Last Edited' },
  { value: 'name', label: 'Name' },
  { value: 'createdAt', label: 'Created Date' },
  { value: 'viewCount', label: 'Views' },
];

export default function DiscoverPage() {
  const { user } = useAuth();
  const [allLists, setAllLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortState, setSortState] = useState<SortState>({ field: 'updatedAt', direction: 'desc' });
  const [displayLists, setDisplayLists] = useState<List[]>([]);
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

  // Simplified data fetching - no auth checks needed for public lists
  useEffect(() => {
    const fetchPublicLists = async () => {
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
    };

    // Fetch public lists immediately - no auth required
    fetchPublicLists();
  }, []); // Empty dependency array since this doesn't depend on auth

  // Memoized search input change handler
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  }, []);

  // Memoized clear search handler
  const handleClearSearch = useCallback(() => {
    setSearchInput('');
  }, []);

  // Memoized list click handler
  const handleListClick = useCallback((list: List) => {
    // Track with Google Analytics
    trackListViewGA(list.name, list.id);
    
    // Track with Mixpanel
    trackListView({
      list_id: list.id,
      list_name: list.name,
      list_author: (list as any).users?.display_name || 'Unknown',
      list_creation_date: list.created_at || new Date().toISOString(),
      is_public: list.is_public || false,
      view_count: list.view_count || 0,
      place_count: 0 // Place count not available on overview page
    });
    
    router.push(`/lists/${list.id}`);
  }, [router]);

  // Memoized sort change handler
  const handleSortChange = useCallback((newSort: SortState) => {
    setSortState(newSort);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <DiscoverHeader
        searchInput={searchInput}
        onSearchChange={handleSearchChange}
        onClearSearch={handleClearSearch}
        sortState={sortState}
        onSortChange={handleSortChange}
        sortOptions={sortOptions}
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