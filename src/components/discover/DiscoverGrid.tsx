import React, { useCallback } from 'react';
import { List } from '@/types';

// Memoized list item component to prevent unnecessary re-renders
interface DiscoverListItemProps {
  list: List;
  onListClick: (list: List) => void;
}

const DiscoverListItem = React.memo<DiscoverListItemProps>(({ list, onListClick }) => {
  const handleClick = useCallback(() => {
    onListClick(list);
  }, [list, onListClick]);

  return (
    <div
      onClick={handleClick}
      className="bg-gray-800 overflow-hidden shadow-lg rounded-xl hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 border border-gray-700 hover:border-gray-600"
    >
      <div className="px-4 py-4 sm:px-6 sm:py-6">
        <div className="flex justify-between items-start mb-2 sm:mb-3">
          <h3 className="text-lg sm:text-xl font-semibold text-white truncate pr-2">{list.name}</h3>
        </div>
        
        {/* Description - prominently displayed */}
        <p className="text-sm text-gray-300 line-clamp-2 mb-3 sm:mb-4 min-h-[2.5rem]">
          {list.description || 'No description'}
        </p>
        
        {/* Location if available */}
        {list.city && (
          <p className="text-sm text-blue-300 mb-2">📍 {list.city}</p>
        )}
        
        <div className="flex justify-between items-center text-xs text-gray-400">
          <div className="flex flex-col space-y-1">
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

DiscoverListItem.displayName = 'DiscoverListItem';

interface DiscoverGridProps {
  lists: List[];
  onListClick: (list: List) => void;
}

export default function DiscoverGrid({ lists, onListClick }: DiscoverGridProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-3 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {lists.map((list: List) => (
          <DiscoverListItem
            key={list.id}
            list={list}
            onListClick={onListClick}
          />
        ))}
      </div>
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-300">
          {lists.length} public {lists.length === 1 ? 'list' : 'lists'}
        </p>
      </div>
    </div>
  );
} 