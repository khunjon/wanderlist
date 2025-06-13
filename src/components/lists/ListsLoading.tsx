import React from 'react';

// Memoized loading component to prevent unnecessary re-renders
const ListsLoading = React.memo(() => {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-3 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-gray-800 overflow-hidden shadow-lg rounded-xl border border-gray-700">
            <div className="px-4 py-4 sm:px-6 sm:py-6">
              <div className="animate-pulse">
                <div className="mb-2 sm:mb-3">
                  <div className="h-6 bg-gray-700 rounded w-3/4"></div>
                </div>
                <div className="space-y-2 mb-3 sm:mb-4">
                  <div className="h-4 bg-gray-700 rounded w-full"></div>
                  <div className="h-4 bg-gray-700 rounded w-2/3"></div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <div className="h-3 bg-gray-700 rounded w-24"></div>
                    <div className="h-3 bg-gray-700 rounded w-20"></div>
                  </div>
                  <div className="h-3 bg-gray-700 rounded w-16"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

ListsLoading.displayName = 'ListsLoading';

export default ListsLoading; 