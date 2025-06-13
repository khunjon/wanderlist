import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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
          <Button asChild>
            <Link href="/lists/new">
              Create New List
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
});

ListsEmptyState.displayName = 'ListsEmptyState';

export default ListsEmptyState; 