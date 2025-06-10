import React from 'react';

// Memoized empty state component to prevent unnecessary re-renders
const DiscoverEmptyState = React.memo(() => {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-white">No public lists found</h3>
        <p className="mt-1 text-sm text-gray-300">
          Try adjusting your search or check back later for new lists.
        </p>
      </div>
    </div>
  );
});

DiscoverEmptyState.displayName = 'DiscoverEmptyState';

export default DiscoverEmptyState; 