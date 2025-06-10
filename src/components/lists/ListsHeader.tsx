import React from 'react';
import Link from 'next/link';
import SortControl, { SortState, SortOption } from '@/components/ui/SortControl';

// Optimized props interface - combine related state and reduce prop count
interface SearchProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  disabled?: boolean;
}

interface SortProps {
  state: SortState;
  options: SortOption[];
  onChange: (newSort: SortState) => void;
}

interface ListsHeaderProps {
  search: SearchProps;
  sort: SortProps;
  hasLists: boolean;
}

// Memoized component to prevent unnecessary re-renders
const ListsHeader = React.memo<ListsHeaderProps>(({ search, sort, hasLists }) => {
  // Internal handler to convert input event to string value
  const handleSearchInputChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    search.onChange(e.target.value);
  }, [search.onChange]);

  return (
    <>
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
                value={search.value}
                onChange={handleSearchInputChange}
                className="w-full px-4 py-2 rounded-md border-0 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={search.disabled}
              />
              {search.value && (
                <button
                  type="button"
                  onClick={search.onClear}
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
      
      {/* Sort control - only show when there are lists */}
      {hasLists && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-3 sm:pt-6">
          <div className="mb-3 sm:mb-6">
            <SortControl
              options={sort.options}
              currentSort={sort.state}
              onSortChange={sort.onChange}
              className="w-full sm:w-auto"
              listId="lists-page"
            />
          </div>
        </div>
      )}
    </>
  );
});

ListsHeader.displayName = 'ListsHeader';

export default ListsHeader;
export type { SearchProps, SortProps, ListsHeaderProps }; 