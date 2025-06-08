'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { PlaceWithNotes } from '@/types';

interface SwipeableCardProps {
  children: React.ReactNode;
  place: PlaceWithNotes;
  onDelete: (place: PlaceWithNotes) => void;
  isOwner: boolean;
  isDeleting?: boolean;
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

// Helper function to check if an element or its parents are interactive
const isInteractiveElement = (element: HTMLElement): boolean => {
  // Check the element itself and traverse up the DOM tree
  let currentElement: HTMLElement | null = element;
  
  while (currentElement) {
    const tagName = currentElement.tagName.toLowerCase();
    
    // Check for form elements
    if (['textarea', 'input', 'button', 'select', 'option'].includes(tagName)) {
      return true;
    }
    
    // Check for elements with contenteditable
    if (currentElement.contentEditable === 'true') {
      return true;
    }
    
    // Check for clickable elements
    if (currentElement.onclick || 
        currentElement.getAttribute('role') === 'button' ||
        currentElement.getAttribute('role') === 'textbox') {
      return true;
    }
    
    // Check for elements with cursor pointer (likely clickable)
    const computedStyle = window.getComputedStyle(currentElement);
    if (computedStyle.cursor === 'pointer' || computedStyle.cursor === 'text') {
      return true;
    }
    
    // Check for specific classes that indicate interactive content
    const className = currentElement.className;
    if (typeof className === 'string' && 
        (className.includes('cursor-pointer') || 
         className.includes('cursor-text') ||
         className.includes('focus:') ||
         className.includes('hover:bg-') ||
         className.includes('transition-colors'))) {
      return true;
    }
    
    // Move up to parent element
    currentElement = currentElement.parentElement;
  }
  
  return false;
};

export default function SwipeableCard({ 
  children, 
  place, 
  onDelete, 
  isOwner, 
  isDeleting = false 
}: SwipeableCardProps) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showDeleteButton, setShowDeleteButton] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const currentXRef = useRef<number>(0);

  // Constants for swipe behavior
  const SWIPE_THRESHOLD = 80; // Minimum distance to trigger delete button
  const DELETE_THRESHOLD = 150; // Distance to auto-trigger delete
  const MAX_SWIPE = 200; // Maximum swipe distance

  // Reset swipe state
  const resetSwipe = useCallback(() => {
    setSwipeOffset(0);
    setIsDragging(false);
    setShowDeleteButton(false);
  }, []);

  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isOwner || isDeleting) return;
    
    // Enhanced check for interactive elements
    const target = e.target as HTMLElement;
    if (isInteractiveElement(target)) {
      return;
    }
    
    const touch = e.touches[0];
    startXRef.current = touch.clientX;
    currentXRef.current = touch.clientX;
    setIsDragging(true);
    
    // Prevent scrolling while swiping
    e.preventDefault();
  }, [isOwner, isDeleting]);

  // Handle touch move
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !isOwner || isDeleting) return;
    
    const touch = e.touches[0];
    currentXRef.current = touch.clientX;
    const deltaX = startXRef.current - currentXRef.current;
    
    // Only allow left swipe (positive deltaX)
    if (deltaX > 0) {
      const clampedOffset = Math.min(deltaX, MAX_SWIPE);
      setSwipeOffset(clampedOffset);
      
      // Show delete button when threshold is reached
      if (clampedOffset >= SWIPE_THRESHOLD && !showDeleteButton) {
        setShowDeleteButton(true);
        triggerHapticFeedback('medium');
      } else if (clampedOffset < SWIPE_THRESHOLD && showDeleteButton) {
        setShowDeleteButton(false);
      }
    } else {
      setSwipeOffset(0);
      setShowDeleteButton(false);
    }
    
    e.preventDefault();
  }, [isDragging, isOwner, isDeleting, showDeleteButton]);

  // Handle touch end
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !isOwner || isDeleting) return;
    
    const deltaX = startXRef.current - currentXRef.current;
    
    if (deltaX >= DELETE_THRESHOLD) {
      // Auto-trigger delete if swiped far enough
      triggerHapticFeedback('heavy');
      setShowConfirmation(true);
    } else if (deltaX >= SWIPE_THRESHOLD) {
      // Keep delete button visible
      setSwipeOffset(SWIPE_THRESHOLD);
      triggerHapticFeedback('light');
    } else {
      // Reset to original position
      resetSwipe();
    }
    
    setIsDragging(false);
    e.preventDefault();
  }, [isDragging, isOwner, isDeleting, resetSwipe]);

  // Handle mouse events for desktop
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isOwner || isDeleting) return;
    
    // Enhanced check for interactive elements
    const target = e.target as HTMLElement;
    if (isInteractiveElement(target)) {
      return;
    }
    
    startXRef.current = e.clientX;
    currentXRef.current = e.clientX;
    setIsDragging(true);
    
    e.preventDefault();
  }, [isOwner, isDeleting]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !isOwner || isDeleting) return;
    
    currentXRef.current = e.clientX;
    const deltaX = startXRef.current - currentXRef.current;
    
    if (deltaX > 0) {
      const clampedOffset = Math.min(deltaX, MAX_SWIPE);
      setSwipeOffset(clampedOffset);
      
      if (clampedOffset >= SWIPE_THRESHOLD && !showDeleteButton) {
        setShowDeleteButton(true);
        triggerHapticFeedback('medium');
      } else if (clampedOffset < SWIPE_THRESHOLD && showDeleteButton) {
        setShowDeleteButton(false);
      }
    } else {
      setSwipeOffset(0);
      setShowDeleteButton(false);
    }
  }, [isDragging, isOwner, isDeleting, showDeleteButton]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging || !isOwner || isDeleting) return;
    
    const deltaX = startXRef.current - currentXRef.current;
    
    if (deltaX >= DELETE_THRESHOLD) {
      triggerHapticFeedback('heavy');
      setShowConfirmation(true);
    } else if (deltaX >= SWIPE_THRESHOLD) {
      setSwipeOffset(SWIPE_THRESHOLD);
      triggerHapticFeedback('light');
    } else {
      resetSwipe();
    }
    
    setIsDragging(false);
  }, [isDragging, isOwner, isDeleting, resetSwipe]);

  // Add mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Handle delete confirmation
  const handleDeleteConfirm = useCallback(() => {
    triggerHapticFeedback('heavy');
    onDelete(place);
    setShowConfirmation(false);
    resetSwipe();
  }, [onDelete, place, resetSwipe]);

  const handleDeleteCancel = useCallback(() => {
    setShowConfirmation(false);
    resetSwipe();
  }, [resetSwipe]);

  // Handle click outside to reset swipe
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
      if (swipeOffset > 0 || showDeleteButton) {
        resetSwipe();
      }
    }
  }, [swipeOffset, showDeleteButton, resetSwipe]);

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [handleClickOutside]);

  // Reset swipe when isDeleting changes
  useEffect(() => {
    if (isDeleting) {
      resetSwipe();
    }
  }, [isDeleting, resetSwipe]);

  if (!isOwner) {
    // If not owner, render children without swipe functionality
    return <div>{children}</div>;
  }

  return (
    <>
      <div
        ref={cardRef}
        className="relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        style={{ touchAction: 'pan-y' }} // Allow vertical scrolling but prevent horizontal
      >
        {/* Red background that shows during swipe */}
        <button
          className={`absolute inset-0 bg-red-600 flex items-center justify-end pr-4 transition-opacity duration-200 ${
            swipeOffset > 0 ? 'opacity-100' : 'opacity-0'
          } ${swipeOffset >= SWIPE_THRESHOLD ? 'cursor-pointer hover:bg-red-700' : 'cursor-default'}`}
          onClick={swipeOffset >= SWIPE_THRESHOLD ? () => setShowConfirmation(true) : undefined}
          disabled={swipeOffset < SWIPE_THRESHOLD}
          aria-label="Delete place"
        >
          <div className="flex items-center space-x-2 text-white pointer-events-none">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            <span className="font-medium">Delete</span>
          </div>
        </button>

        {/* Card content */}
        <div
          className={`relative bg-gray-800 transition-transform duration-200 ease-out ${
            isDragging ? 'transition-none' : ''
          }`}
          style={{
            transform: `translateX(-${swipeOffset}px)`,
          }}
        >
          {children}
        </div>


      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-sm w-full">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                Remove Place
              </h3>
              <p className="text-sm text-gray-300 mb-6">
                Are you sure you want to remove "{place.name}" from this list? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleDeleteCancel}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 