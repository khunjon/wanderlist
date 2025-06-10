'use client';

import { useState, useEffect, Suspense, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { searchPlaces } from '@/lib/google/places';
import { createPlace, addPlaceToList, getUserLists, getListById, upsertPlace } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { GooglePlace, List } from '@/types';
import { debounce } from 'lodash';

export default function SearchContent() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GooglePlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [selectedList, setSelectedList] = useState<List | null>(null);
  const [selectedListCity, setSelectedListCity] = useState<string | undefined>();
  const [loadingLists, setLoadingLists] = useState(true);
  const [addingToList, setAddingToList] = useState<Record<string, boolean>>({});
  const [addedToList, setAddedToList] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  
  // Get listId directly from search params
  const listIdFromUrl = searchParams.get('listId');
  
  const router = useRouter();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Memoized callback for handling list ID from URL - no longer needed
  // const handleListIdFromUrl = useCallback((listId: string | null) => {
  //   setListIdFromUrl(listId);
  // }, []);

  // Memoized debounced search function
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

  // Create memoized debounced version of the search function - removed for manual search only
  const debouncedSearch = useMemo(
    () => debounce((searchQuery: string, city?: string) => {
      performSearch(searchQuery, city);
    }, 300),
    [performSearch]
  );

  // Cleanup function to cancel debounced calls
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedSearch]);

  useEffect(() => {
    // Redirect if not authenticated
    if (!authLoading && !user) {
      router.push('/');
      return;
    }

    // Fetch list details if listId is provided
    const fetchListDetails = async () => {
      if (!user || !listIdFromUrl) {
        return;
      }
      
      try {
        setLoadingLists(true);
        
        // Get the specific list details
        const listDetails = await getListById(listIdFromUrl);
        
        if (listDetails) {
          setSelectedList(listDetails);
          setSelectedListId(listIdFromUrl);
          
          if (listDetails.city) {
            setSelectedListCity(listDetails.city);
          }
        } else {
          setError('List not found. Please go back and try again.');
        }
      } catch (err) {
        console.error('Error fetching list details:', err);
        setError('Failed to load list details. Please try again.');
      } finally {
        setLoadingLists(false);
      }
    };

    if (user) {
      fetchListDetails();
    }
  }, [user, authLoading, router, listIdFromUrl, searchParams]);

  // Memoized search handler
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
    await performSearch(query, selectedListCity);
  }, [query, selectedListCity, debouncedSearch, performSearch]);

  // Handle input change - removed auto-search
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    
    // Clear results if query is empty
    if (!newQuery.trim()) {
      setSearchResults([]);
      setSearchPerformed(false);
    }
  }, []);

  // Memoized add to list handler
  const handleAddToList = useCallback(async (place: GooglePlace) => {
    if (!selectedListId || !user) {
      setError('Please make sure you are logged in and have a valid list selected.');
      return;
    }
    
    // Set loading state for this specific place
    setAddingToList(prev => ({ ...prev, [place.place_id]: true }));
    
    try {
      // Clear any previous errors
      setError(null);
      
      // First create or get place in our database
      const placeData = {
        google_place_id: place.place_id,
        name: place.name,
        address: place.formatted_address,
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        rating: place.rating || 0,
        photo_url: place.photos && place.photos.length > 0 
          ? `/api/places/photo?photoReference=${place.photos[0].photo_reference}&maxWidth=400`
          : '',
        place_types: place.types || [],
      };
      
      // Add a timeout to detect hanging calls
      const createPlacePromise = upsertPlace(placeData);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('upsertPlace timeout after 10 seconds')), 10000)
      );
      
      const createdPlace = await Promise.race([createPlacePromise, timeoutPromise]) as any;
      
      // Then add it to the selected list
      const addToListPromise = addPlaceToList({
        list_id: selectedListId,
        place_id: createdPlace.id
      });
      const timeoutPromise2 = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('addPlaceToList timeout after 10 seconds')), 10000)
      );
      
      const listPlaceId = await Promise.race([addToListPromise, timeoutPromise2]) as string;
      
      // Mark as added and show success feedback
      setAddedToList(prev => ({ ...prev, [place.place_id]: true }));
      
      // Clear the added state after 3 seconds
      setTimeout(() => {
        setAddedToList(prev => ({ ...prev, [place.place_id]: false }));
      }, 3000);
      
    } catch (err) {
      console.error('Error adding place to list:', err);
      
      // Show specific error message
      let errorMessage = 'Failed to add place to list. Please try again.';
      
      if (err instanceof Error) {
        if (err.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please check your internet connection and try again.';
        } else if (err.message.includes('permission')) {
          errorMessage = 'Permission denied. Please check that you own this list and your account is properly configured.';
        } else if (err.message.includes('authenticated')) {
          errorMessage = 'You must be logged in to add places to lists. Please refresh the page and try again.';
        } else if (err.message.includes('not found')) {
          errorMessage = 'The list was not found. Please refresh the page and try again.';
        } else if (err.message.includes('network') || err.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else {
          errorMessage = `Error: ${err.message}`;
        }
      }
      
      setError(errorMessage);
    } finally {
      // Clear loading state for this place
      setAddingToList(prev => ({ ...prev, [place.place_id]: false }));
    }
  }, [selectedListId, user]);

  // Memoized filtered and sorted search results
  const processedSearchResults = useMemo(() => {
    if (!searchResults.length) return [];
    
    // You can add filtering logic here if needed
    // For now, just return the results as-is since they come pre-filtered from the API
    return searchResults;
  }, [searchResults]);

  if (authLoading || loadingLists) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header - Mobile Optimized */}
      <header className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 shadow-lg">
        <div className="mx-auto max-w-7xl px-4 py-2 sm:py-3 sm:px-6 lg:px-8">
          {/* Top row with back button */}
          <div className="flex items-center mb-3">
            {selectedList && (
              <Link
                href={`/lists/${selectedList.id}`}
                className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors mr-3"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
            )}
            
            {/* Title and List info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white leading-tight">
                Add Places
              </h1>
              {selectedList && (
                <div className="flex items-center space-x-2 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span className="text-sm sm:text-base font-medium text-blue-300 truncate">{selectedList.name}</span>
                </div>
              )}
              {selectedListCity && (
                <p className="text-xs sm:text-sm text-gray-400 mt-1">
                  Searching in {selectedListCity}
                </p>
              )}
            </div>
          </div>
          
          {/* Search bar - integrated into header */}
          <form onSubmit={handleSearch}>
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  name="search"
                  id="search"
                  className="block w-full rounded-lg bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 h-11 px-4 pr-10"
                  style={{ fontSize: '16px' }} // Prevents iOS zoom
                  placeholder={selectedListCity ? `Search in ${selectedListCity}...` : "Search restaurants, cafes, attractions..."}
                  value={query}
                  onChange={handleInputChange}
                  disabled={loading}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="flex items-center justify-center w-11 h-11 sm:w-auto sm:h-auto sm:px-4 sm:py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span className="hidden sm:inline text-sm font-medium">Search</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </header>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900 border-l-4 border-red-600 p-4 mx-auto max-w-7xl">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main>
        <div className="mx-auto max-w-7xl py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-white">Searching for places...</p>
            </div>
          )}

          {/* Empty State */}
          {searchPerformed && !loading && processedSearchResults.length === 0 && (
            <div className="text-center py-12">
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-white">No places found</h3>
              <p className="mt-2 text-gray-300">Try searching with different keywords or check your spelling.</p>
            </div>
          )}

          {/* Initial State */}
          {!searchPerformed && !loading && (
            <div className="text-center py-12">
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-white">Search for places to add</h3>
              <p className="mt-2 text-gray-300">Find restaurants, cafes, attractions, and more to add to your list.</p>
            </div>
          )}

          {/* Search Results */}
          {processedSearchResults.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium text-white">
                  Found {processedSearchResults.length} {processedSearchResults.length === 1 ? 'place' : 'places'}
                </h2>
              </div>
              
              <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {processedSearchResults.map((place) => (
                  <div
                    key={place.place_id}
                    className="bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-700 hover:border-gray-600 transition-colors"
                  >
                    {/* Place Image Placeholder */}
                    <div className="h-32 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    
                    {/* Place Content */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-medium text-white flex-1 min-w-0 pr-2 leading-tight">{place.name}</h3>
                        {place.rating && (
                          <div className="flex items-center flex-shrink-0">
                            <span className="text-yellow-400">★</span>
                            <span className="text-sm text-gray-300 ml-1">{place.rating}</span>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-300 mb-3 line-clamp-2">{place.formatted_address}</p>
                      
                      {/* Place Types */}
                      {place.types && place.types.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {place.types.slice(0, 2).map((type, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-900/50 text-blue-200 border border-blue-800"
                            >
                              {type.replace(/_/g, ' ')}
                            </span>
                          ))}
                          {place.types.length > 2 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-700 text-gray-300">
                              +{place.types.length - 2} more
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Add Button */}
                      <button
                        onClick={() => handleAddToList(place)}
                        disabled={
                          addingToList[place.place_id] ||
                          addedToList[place.place_id] ||
                          !selectedListId ||
                          !user
                        }
                        className={`w-full inline-flex justify-center items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                          addedToList[place.place_id]
                            ? 'text-white bg-green-600 hover:bg-green-700 border border-green-500'
                            : 'text-white bg-blue-600 hover:bg-blue-700 border border-blue-500 disabled:bg-gray-600 disabled:border-gray-600 disabled:cursor-not-allowed'
                        }`}
                      >
                        {addingToList[place.place_id] ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Adding...
                          </>
                        ) : addedToList[place.place_id] ? (
                          <>
                            <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Added to List!
                          </>
                        ) : (
                          <>
                            <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Add to List
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 