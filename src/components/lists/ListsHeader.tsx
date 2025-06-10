import React from 'react';
import Link from 'next/link';
import SortControl, { SortState, SortOption } from '@/components/ui/SortControl';

interface ListsHeaderProps {
  searchInput: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearSearch: () => void;
  sortState: SortState;
  onSortChange: (newSort: SortState) => void;
  sortOptions: SortOption[];
  loading: boolean;
  hasLists: boolean;
}

export default function ListsHeader({
  searchInput,
  onSearchChange,
  onClearSearch,
  sortState,
  onSortChange,
  sortOptions,
  loading,
  hasLists
}: ListsHeaderProps) {
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
                value={searchInput}
                onChange={onSearchChange}
                className="w-full px-4 py-2 rounded-md border-0 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
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
              listId="lists-page"
            />
          </div>
        </div>
      )}
    </>
  );
} 