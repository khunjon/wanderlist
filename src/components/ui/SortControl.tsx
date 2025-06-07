'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

export type SortOption = {
  value: string;
  label: string;
};

export type SortDirection = 'asc' | 'desc';

export type SortState = {
  field: string;
  direction: SortDirection;
};

interface SortControlProps {
  options: SortOption[];
  currentSort: SortState;
  onSortChange: (sort: SortState) => void;
  className?: string;
  listId?: string; // For localStorage persistence
}

// Custom hook for localStorage persistence
function useSortPreference(listId?: string, defaultSort?: SortState) {
  const getStorageKey = useCallback(() => {
    return listId ? `sort-preference-${listId}` : 'sort-preference-default';
  }, [listId]);

  const getSavedSort = useCallback((): SortState | null => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem(getStorageKey());
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, [getStorageKey]);

  const saveSortPreference = useCallback((sort: SortState) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(sort));
    } catch {
      // Silently fail if localStorage is not available
    }
  }, [getStorageKey]);

  return { getSavedSort, saveSortPreference };
}

// Custom hook for mobile detection
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
}

// Haptic feedback utility
const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    const patterns = {
      light: 50,
      medium: 100,
      heavy: 200
    };
    navigator.vibrate(patterns[type]);
  }
};

export default function SortControl({ 
  options, 
  currentSort, 
  onSortChange, 
  className = '',
  listId 
}: SortControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  
  const isMobile = useIsMobile();
  const { getSavedSort, saveSortPreference } = useSortPreference(listId, currentSort);

  // Initialize with saved preference
  useEffect(() => {
    const savedSort = getSavedSort();
    if (savedSort && (savedSort.field !== currentSort.field || savedSort.direction !== currentSort.direction)) {
      onSortChange(savedSort);
    }
  }, [getSavedSort, currentSort, onSortChange]);

  // Close dropdown when clicking outside (desktop only)
  useEffect(() => {
    if (isMobile) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobile]);

  // Handle escape key and prevent body scroll on mobile
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      
      // Prevent body scroll on mobile when modal is open
      if (isMobile) {
        document.body.style.overflow = 'hidden';
      }
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        if (isMobile) {
          document.body.style.overflow = '';
        }
      };
    }
  }, [isOpen, isMobile]);

  // Calculate dropdown position to prevent overflow (desktop only)
  const getDropdownPosition = () => {
    if (!buttonRef.current || isMobile) return 'right-0';
    
    const buttonRect = buttonRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const dropdownWidth = 224; // w-56 = 14rem = 224px
    
    // If dropdown would overflow on the right, position it to the left
    if (buttonRect.right + dropdownWidth > viewportWidth) {
      return 'left-0';
    }
    
    return 'right-0';
  };

  const [dropdownPosition, setDropdownPosition] = useState('right-0');

  useEffect(() => {
    if (isOpen && !isMobile) {
      setDropdownPosition(getDropdownPosition());
    }
  }, [isOpen, isMobile]);

  const handleOpen = () => {
    triggerHapticFeedback('light');
    setIsOpen(true);
    if (isMobile) {
      setIsAnimating(true);
    }
  };

  const handleClose = () => {
    if (isMobile) {
      setIsAnimating(false);
      // Wait for animation to complete before closing
      setTimeout(() => setIsOpen(false), 300);
    } else {
      setIsOpen(false);
    }
  };

  const handleSortChange = (field: string) => {
    triggerHapticFeedback('medium');
    
    let newSort: SortState;
    if (currentSort.field === field) {
      // Toggle direction if same field
      newSort = {
        field,
        direction: currentSort.direction === 'asc' ? 'desc' : 'asc'
      };
    } else {
      // Default to desc for new field
      newSort = {
        field,
        direction: 'desc'
      };
    }
    
    onSortChange(newSort);
    saveSortPreference(newSort);
    handleClose();
  };

  const handleDirectionToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHapticFeedback('light');
    
    const newSort: SortState = {
      field: currentSort.field,
      direction: currentSort.direction === 'asc' ? 'desc' : 'asc'
    };
    
    onSortChange(newSort);
    saveSortPreference(newSort);
  };

  const currentOption = options.find(option => option.value === currentSort.field);

  return (
    <>
      <div ref={dropdownRef} className={`relative inline-block text-left ${className}`}>
        <div>
          <button
            ref={buttonRef}
            type="button"
            className={`inline-flex justify-center items-center gap-x-2 rounded-md bg-gray-800 px-3 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${
              isMobile ? 'w-full min-h-[44px]' : 'min-w-0'
            }`}
            onClick={handleOpen}
            aria-expanded={isOpen}
            aria-haspopup="true"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
            <span className="truncate flex-1 text-left">{currentOption?.label || 'Sort'}</span>
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Direction toggle button */}
              <button
                onClick={handleDirectionToggle}
                className="p-1 rounded hover:bg-gray-600 transition-colors"
                aria-label={`Sort ${currentSort.direction === 'asc' ? 'ascending' : 'descending'}`}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-4 w-4 transition-transform duration-200 ${currentSort.direction === 'asc' ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {/* Dropdown indicator */}
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4" />
              </svg>
            </div>
          </button>
        </div>

        {/* Desktop Dropdown */}
        {isOpen && !isMobile && (
          <div className={`absolute z-10 mt-2 w-full sm:w-56 origin-top-right rounded-md bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none ${dropdownPosition}`}>
            <div className="py-1">
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSortChange(option.value)}
                  className={`flex w-full items-center justify-between px-4 py-3 text-sm hover:bg-gray-700 transition-colors min-h-[44px] ${
                    currentSort.field === option.value ? 'bg-gray-700 text-blue-300' : 'text-white'
                  }`}
                >
                  <span>{option.label}</span>
                  {currentSort.field === option.value && (
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${currentSort.direction === 'asc' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Sheet Modal */}
      {isOpen && isMobile && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div 
            className={`fixed inset-0 bg-black transition-opacity duration-300 ${
              isAnimating ? 'bg-opacity-50' : 'bg-opacity-0'
            }`}
            onClick={handleClose}
          />
          
          {/* Bottom Sheet */}
          <div 
            ref={modalRef}
            className={`fixed bottom-0 left-0 right-0 bg-gray-800 rounded-t-xl shadow-xl transform transition-transform duration-300 ease-out ${
              isAnimating ? 'translate-y-0' : 'translate-y-full'
            }`}
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-600 rounded-full" />
            </div>
            
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Sort Options</h3>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-full hover:bg-gray-700 transition-colors"
                  aria-label="Close"
                >
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Options */}
            <div className="py-2">
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSortChange(option.value)}
                  className={`flex w-full items-center justify-between px-4 py-4 text-base hover:bg-gray-700 transition-colors min-h-[44px] active:bg-gray-600 ${
                    currentSort.field === option.value ? 'bg-gray-700 text-blue-300' : 'text-white'
                  }`}
                >
                  <span className="font-medium">{option.label}</span>
                  <div className="flex items-center gap-2">
                    {currentSort.field === option.value && (
                      <>
                        <span className="text-xs text-gray-400 uppercase tracking-wide">
                          {currentSort.direction === 'asc' ? 'A-Z' : 'Z-A'}
                        </span>
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${currentSort.direction === 'asc' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </>
                    )}
                  </div>
                </button>
              ))}
            </div>
            
            {/* Direction Toggle Section */}
            <div className="px-4 py-3 border-t border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-white">Sort Direction</div>
                  <div className="text-xs text-gray-400">
                    Currently: {currentSort.direction === 'asc' ? 'Ascending (A-Z)' : 'Descending (Z-A)'}
                  </div>
                </div>
                <button
                  onClick={handleDirectionToggle}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors min-h-[44px]"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`h-5 w-5 transition-transform duration-200 ${currentSort.direction === 'asc' ? 'rotate-180' : ''}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                  <span className="text-sm font-medium text-white">Toggle</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 