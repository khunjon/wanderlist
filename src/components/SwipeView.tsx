'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { PlaceWithNotes } from '@/types';

interface SwipeViewProps {
  places: PlaceWithNotes[];
  currentIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  isOwner: boolean;
  onEditNotes: (place: PlaceWithNotes) => void;
  onDeletePlace: (place: PlaceWithNotes) => void;
  editingPlaceId: string | null;
  editingNotes: string;
  setEditingNotes: (notes: string) => void;
  onSaveNotes: () => void;
  onCancelEdit: () => void;
  deletingPlaceId: string | null;
}

export default function SwipeView({
  places,
  currentIndex,
  onNext,
  onPrev,
  onClose,
  isOwner,
  onEditNotes,
  onDeletePlace,
  editingPlaceId,
  editingNotes,
  setEditingNotes,
  onSaveNotes,
  onCancelEdit,
  deletingPlaceId
}: SwipeViewProps) {
  const [showNotes, setShowNotes] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentPlace = places[currentIndex];
  const isEditingThisPlace = editingPlaceId === currentPlace?.listPlaceId;
  const isDeletingThisPlace = deletingPlaceId === currentPlace?.listPlaceId;

  // Minimum distance for a swipe
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      onNext();
    } else if (isRightSwipe) {
      onPrev();
    }
  };

  // Reset notes view when place changes
  useEffect(() => {
    setShowNotes(false);
  }, [currentIndex]);

  if (!currentPlace) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center">
      <div 
        ref={containerRef}
        className="relative w-full h-full max-w-md mx-auto bg-gray-900 overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Header with close button and progress */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4">
          <div className="flex items-center justify-between mb-2">
            <div 
              className="p-3 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-colors cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onClose();
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onClose();
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="text-white text-sm font-medium bg-black bg-opacity-50 px-3 py-1 rounded-full">
              {currentIndex + 1} / {places.length}
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-600 bg-opacity-50 rounded-full h-1">
            <div 
              className="bg-white h-1 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / places.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Main content */}
        <div className="relative w-full h-full">
          {/* Background image */}
          {currentPlace.photoUrl && (
            <div className="absolute inset-0">
              <Image
                src={currentPlace.photoUrl}
                alt={currentPlace.name}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
            </div>
          )}

          {/* Navigation areas */}
          <button
            onClick={onPrev}
            className="absolute left-0 top-0 w-1/3 h-full z-20 flex items-center justify-start pl-4 opacity-0 hover:opacity-100 transition-opacity"
            aria-label="Previous place"
          >
            <div className="p-2 rounded-full bg-black bg-opacity-50 text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
          </button>

          <button
            onClick={onNext}
            className="absolute right-0 top-0 w-1/3 h-full z-20 flex items-center justify-end pr-4 opacity-0 hover:opacity-100 transition-opacity"
            aria-label="Next place"
          >
            <div className="p-2 rounded-full bg-black bg-opacity-50 text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* Content overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="space-y-3">
              <h2 className="text-2xl font-bold">{currentPlace.name}</h2>
              
              {currentPlace.address && (
                <p className="text-gray-300 text-sm">{currentPlace.address}</p>
              )}

              {currentPlace.rating > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-semibold">{currentPlace.rating.toFixed(1)}</span>
                  <div className="flex">
                    {Array.from({ length: 5 }, (_, i) => (
                      <svg
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.floor(currentPlace.rating)
                            ? 'text-yellow-400'
                            : i < Math.ceil(currentPlace.rating) && i >= Math.floor(currentPlace.rating)
                            ? 'text-yellow-300'
                            : 'text-gray-500'
                        }`}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center space-x-3 pt-2">
                {/* Notes display - only show if notes exist */}
                {currentPlace.notes && (
                  <button
                    onClick={() => setShowNotes(!showNotes)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-colors ${
                      showNotes 
                        ? 'bg-blue-600 text-white'
                        : 'bg-black bg-opacity-50 text-gray-300 hover:text-white'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    <span className="text-sm">Notes</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Notes overlay */}
        {showNotes && (
          <div className="absolute inset-0 bg-black bg-opacity-90 z-30 flex items-end">
            <div className="w-full p-6 bg-gray-900 rounded-t-3xl max-h-2/3 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Notes</h3>
                <button
                  onClick={() => setShowNotes(false)}
                  className="p-2 rounded-full text-gray-400 hover:text-white transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {isEditingThisPlace ? (
                <div className="space-y-4">
                  <textarea
                    value={editingNotes}
                    onChange={(e) => setEditingNotes(e.target.value)}
                    className="w-full px-4 py-3 text-white bg-gray-800 border border-gray-600 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Add your notes about this place..."
                    rows={6}
                    autoFocus
                  />
                  <div className="flex space-x-3">
                    <button
                      onClick={onSaveNotes}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    >
                      Save Notes
                    </button>
                    <button
                      onClick={onCancelEdit}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gray-800 rounded-lg p-4">
                    <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                      {currentPlace.notes}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 