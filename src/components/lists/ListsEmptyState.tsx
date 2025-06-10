import React from 'react';
import Link from 'next/link';

// Memoized empty state component to prevent unnecessary re-renders
const ListsEmptyState = React.memo(() => {
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
            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-white">No lists</h3>
        <p className="mt-1 text-sm text-gray-300">Get started by creating a new list.</p>
        <div className="mt-6">
          <Link
            href="/lists/new"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Create New List
          </Link>
        </div>
      </div>
    </div>
  );
});

ListsEmptyState.displayName = 'ListsEmptyState';

export default ListsEmptyState; 