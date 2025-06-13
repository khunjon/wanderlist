import React, { useCallback } from 'react';
import { List } from '@/types';
import { perf } from '@/lib/utils/performance';

// Enhanced List type with place count
type ListWithPlaceCount = List & { place_count: number };

// Memoized list item component to prevent unnecessary re-renders
interface ListItemProps {
  list: ListWithPlaceCount;
  onListClick: (list: ListWithPlaceCount) => void;
}

const ListItem = React.memo<ListItemProps>(({ list, onListClick }) => {
  const handleClick = useCallback(() => {
    onListClick(list);
  }, [list, onListClick]);

  return (
    <div
      onClick={handleClick}
      className="bg-gray-800 overflow-hidden shadow-lg rounded-xl hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 border border-gray-700 hover:border-gray-600"
    >
      <div className="px-4 py-4 sm:px-6 sm:py-6">
        {/* Title row - gets full width */}
        <div className="mb-2 sm:mb-3">
          <h3 className="text-lg sm:text-xl font-semibold text-white">{list.name}</h3>
        </div>
        {/* Description with optional privacy indicator */}
        <div className="flex items-start mb-3 sm:mb-4">
          {!list.is_public && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-purple-400 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          )}
          <p className="text-sm text-gray-300 line-clamp-2 min-h-[2.5rem]">
            {list.description || 'No description'}
          </p>
        </div>
        <div className="flex justify-between items-center text-xs text-gray-400">
          <div className="flex flex-col space-y-1">
            <span>Last updated: {list.updated_at ? new Date(list.updated_at).toLocaleDateString() : 'Unknown'}</span>
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {list.place_count} {list.place_count === 1 ? 'place' : 'places'}
            </span>
          </div>
          {list.view_count !== undefined && (
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>{list.view_count} views</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ListItem.displayName = 'ListItem';

interface ListsGridProps {
  lists: ListWithPlaceCount[];
  onListClick: (list: ListWithPlaceCount) => void;
}

// Memoized grid component to prevent unnecessary re-renders
const ListsGrid = React.memo<ListsGridProps>(({ lists, onListClick }) => {
  // Performance monitoring for grid renders
  const renderTimer = React.useMemo(() => perf.component('ListsGrid', 'update'), []);
  
  React.useEffect(() => {
    renderTimer.start();
    return () => {
      renderTimer.end();
    };
  });

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-3 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {lists.map((list: ListWithPlaceCount) => (
          <ListItem
            key={list.id}
            list={list}
            onListClick={onListClick}
          />
        ))}
      </div>
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-300">
          {lists.length} {lists.length === 1 ? 'list' : 'lists'}
        </p>
      </div>
    </div>
  );
});

ListsGrid.displayName = 'ListsGrid';

export default ListsGrid;

// Export the type for use in other components
export type { ListWithPlaceCount }; 