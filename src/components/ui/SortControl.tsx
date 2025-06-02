'use client';

import { useState, useRef, useEffect } from 'react';

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
}

export default function SortControl({ options, currentSort, onSortChange, className = '' }: SortControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Calculate dropdown position to prevent overflow
  const getDropdownPosition = () => {
    if (!buttonRef.current) return 'right-0';
    
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
    if (isOpen) {
      setDropdownPosition(getDropdownPosition());
    }
  }, [isOpen]);

  const handleSortChange = (field: string) => {
    if (currentSort.field === field) {
      // Toggle direction if same field
      onSortChange({
        field,
        direction: currentSort.direction === 'asc' ? 'desc' : 'asc'
      });
    } else {
      // Default to desc for new field
      onSortChange({
        field,
        direction: 'desc'
      });
    }
    setIsOpen(false);
  };

  const currentOption = options.find(option => option.value === currentSort.field);

  return (
    <div ref={dropdownRef} className={`relative inline-block text-left ${className}`}>
      <div>
        <button
          ref={buttonRef}
          type="button"
          className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-gray-800 px-3 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
          </svg>
          <span className="hidden sm:inline">Sort by {currentOption?.label}</span>
          <span className="sm:hidden">Sort</span>
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${currentSort.direction === 'asc' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className={`absolute z-10 mt-2 w-56 origin-top-right rounded-md bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none ${dropdownPosition}`}>
          <div className="py-1">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSortChange(option.value)}
                className={`flex w-full items-center justify-between px-4 py-2 text-sm hover:bg-gray-700 transition-colors ${
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
  );
} 