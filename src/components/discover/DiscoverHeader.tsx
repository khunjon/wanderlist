import React from 'react';
import SortControl, { SortState, SortOption } from '@/components/ui/SortControl';

interface DiscoverHeaderProps {
  searchInput: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearSearch: () => void;
  sortState: SortState;
  onSortChange: (newSort: SortState) => void;
  sortOptions: SortOption[];
  hasLists: boolean;
}

export default function DiscoverHeader({
  searchInput,
  onSearchChange,
  onClearSearch,
  sortState,
  onSortChange,
  sortOptions,
  hasLists
}: DiscoverHeaderProps) {
  return (
    <>
      <header className="bg-gray-900 shadow">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <h1 className="text-3xl font-bold tracking-tight text-white">Discover</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center relative">
                <input
                  type="text"
                  placeholder="Search public lists..."
                  value={searchInput}
                  onChange={onSearchChange}
                  className="w-full md:w-64 px-4 py-2 rounded-md border-0 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={onClearSearch}
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
      
      {/* Sort control - only show when there are lists */}
      {hasLists && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-3 sm:pt-6">
          <div className="mb-3 sm:mb-6">
            <SortControl
              options={sortOptions}
              currentSort={sortState}
              onSortChange={onSortChange}
              className="w-full sm:w-auto"
              listId="discover-page"
            />
          </div>
        </div>
      )}
    </>
  );
} 