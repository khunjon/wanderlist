'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { searchPlaces } from '@/lib/google/places';
import { createPlace, addPlaceToList } from '@/lib/firebase/firestore';
import { GooglePlace } from '@/types';
import { debounce } from 'lodash';

interface FloatingActionButtonProps {
  listId?: string;
  listCity?: string;
  onPlaceAdded?: () => void;
}

export default function FloatingActionButton({ 
  listId, 
  listCity, 
  onPlaceAdded 
}: FloatingActionButtonProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GooglePlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [addingToList, setAddingToList] = useState<Record<string, boolean>>({});
  const [addedToList, setAddedToList] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  
  const router = useRouter();
  const lastScrollY = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Set mounted state for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle scroll visibility
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        // Scrolling down - hide FAB
        setIsVisible(false);
      } else {
        // Scrolling up - show FAB
        setIsVisible(true);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Search functionality
  const performSearch = useCallback(async (searchQuery: string, city?: string) => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchPerformed(false);
      return;
    }

    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);
    setSearchPerformed(true);
    
    try {
      const results = await searchPlaces(searchQuery, city);
      // Only update results if the request wasn't aborted
      if (!abortControllerRef.current.signal.aborted) {
        setSearchResults(results);
      }
    } catch (err) {
      // Only handle error if the request wasn't aborted
      if (!abortControllerRef.current.signal.aborted) {
        console.error('Error searching places:', err);
        setError('Failed to search places. Please try again.');
        setSearchResults([]);
      }
    } finally {
      // Only update loading state if the request wasn't aborted
      if (!abortControllerRef.current.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((searchQuery: string, city?: string) => {
      performSearch(searchQuery, city);
    }, 300),
    [performSearch]
  );

  // Handle search form submission
  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) return;

    // Cancel any pending debounced search
    debouncedSearch.cancel();
    
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Perform immediate search for form submission
    await performSearch(query, listCity);
  }, [query, listCity, debouncedSearch, performSearch]);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    
    // Clear results if query is empty
    if (!newQuery.trim()) {
      setSearchResults([]);
      setSearchPerformed(false);
    }
  }, []);

  // Add place to list
  const handleAddToList = useCallback(async (place: GooglePlace) => {
    if (!listId) {
      setError('No list selected.');
      return;
    }
    
    // Set loading state for this specific place
    setAddingToList(prev => ({ ...prev, [place.place_id]: true }));
    
    try {
      // Clear any previous errors
      setError(null);
      
      // First create or get place in our database
      const placeData = {
        googlePlaceId: place.place_id,
        name: place.name,
        address: place.formatted_address,
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        rating: place.rating || 0,
        photoUrl: place.photos && place.photos.length > 0 
          ? `/api/places/photo?photoReference=${place.photos[0].photo_reference}&maxWidth=400`
          : '',
        placeTypes: place.types || [],
      };
      
      const placeId = await createPlace(placeData);
      await addPlaceToList(listId, placeId);
      
      // Mark as added and show success feedback
      setAddedToList(prev => ({ ...prev, [place.place_id]: true }));
      
      // Trigger haptic feedback
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(50);
      }
      
      // Clear the added state after 3 seconds
      setTimeout(() => {
        setAddedToList(prev => ({ ...prev, [place.place_id]: false }));
      }, 3000);

      // Call callback if provided
      if (onPlaceAdded) {
        onPlaceAdded();
      }
      
    } catch (err) {
      console.error('Error adding place to list:', err);
      setError('Failed to add place to list. Please try again.');
    } finally {
      // Clear loading state for this place
      setAddingToList(prev => ({ ...prev, [place.place_id]: false }));
    }
  }, [listId, onPlaceAdded]);

  // Handle FAB click
  const handleFABClick = useCallback(() => {
    // Trigger haptic feedback
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }

    // If we have a listId, show modal for mobile, otherwise navigate to search
    if (listId && typeof window !== 'undefined' && window.innerWidth < 768) {
      setShowModal(true);
    } else {
      // Navigate to search page
      const searchUrl = listId ? `/search?listId=${listId}` : '/search';
      router.push(searchUrl);
    }
  }, [listId, router]);

  // Close modal
  const closeModal = useCallback(() => {
    setShowModal(false);
    setQuery('');
    setSearchResults([]);
    setSearchPerformed(false);
    setError(null);
    
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (showModal && inputRef.current) {
      // Small delay to ensure modal is fully rendered
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showModal]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showModal) {
        closeModal();
      }
    };

    if (showModal) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showModal, closeModal]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedSearch]);

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={handleFABClick}
        className={`fixed bottom-6 right-6 z-40 inline-flex items-center justify-center w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'
        }`}
        title="Add places"
        aria-label="Add places"
      >
        <svg
          className="w-6 h-6"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Mobile Search Modal */}
      {showModal && mounted && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={closeModal}
            />
            
            <div className="relative transform overflow-hidden rounded-lg bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 w-full max-w-sm z-[70]">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">
                  Add Places
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-white"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mb-4 bg-red-900 border-l-4 border-red-600 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-red-500"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-300">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Search Form */}
              <form onSubmit={handleSearch} className="mb-4">
                <div className="flex rounded-md shadow-sm">
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    placeholder={listCity ? `Search in ${listCity}...` : "Search for places..."}
                    className="block w-full rounded-l-md bg-gray-700 border border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none sm:text-sm h-10 px-3"
                    disabled={loading}
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={loading || !query.trim()}
                    className="inline-flex justify-center rounded-r-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
                  >
                    {loading ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </form>

              {/* Search Results */}
              <div className="max-h-96 overflow-y-auto">
                {loading && (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2 text-white text-sm">Searching...</p>
                  </div>
                )}

                {searchPerformed && !loading && searchResults.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-white text-sm">No places found. Try a different search term.</p>
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="space-y-3">
                    {searchResults.map((place) => (
                      <div
                        key={place.place_id}
                        className="bg-gray-700 rounded-lg p-3"
                      >
                        <h4 className="text-white font-medium text-sm truncate">{place.name}</h4>
                        <p className="text-gray-300 text-xs mt-1 truncate">{place.formatted_address}</p>
                        
                        {place.rating && (
                          <div className="mt-2 flex items-center">
                            <div className="flex items-center">
                              {Array.from({ length: 5 }, (_, i) => (
                                <svg
                                  key={i}
                                  className={`h-3 w-3 ${
                                    i < Math.floor(place.rating || 0)
                                      ? 'text-yellow-400'
                                      : 'text-gray-400'
                                  }`}
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              ))}
                            </div>
                            <span className="ml-1 text-xs text-gray-300">
                              {place.rating}
                            </span>
                          </div>
                        )}

                        <button
                          onClick={() => handleAddToList(place)}
                          disabled={
                            addingToList[place.place_id] ||
                            addedToList[place.place_id]
                          }
                          className={`mt-3 w-full inline-flex justify-center items-center px-3 py-2 border border-transparent text-xs font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                            addedToList[place.place_id]
                              ? 'text-white bg-green-600 hover:bg-green-700 focus:ring-green-500'
                              : 'text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 disabled:bg-blue-300'
                          }`}
                        >
                          {addingToList[place.place_id] ? (
                            <>
                              <svg
                                className="animate-spin -ml-1 mr-2 h-3 w-3 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              Adding...
                            </>
                          ) : addedToList[place.place_id] ? (
                            <>
                              <svg
                                className="-ml-1 mr-2 h-4 w-4"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Added!
                            </>
                          ) : (
                            <>
                              <svg
                                className="-ml-1 mr-2 h-4 w-4"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              Add to List
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
} 