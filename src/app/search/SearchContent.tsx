'use client';

import { useState, useEffect, Suspense, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { searchPlaces } from '@/lib/google/places';
import { createPlace, addPlaceToList, getUserLists, getList } from '@/lib/firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { GooglePlace, List } from '@/types';
import { debounce } from 'lodash';

// Separate component to handle search params
function SearchParamsHandler({ 
  onListIdFound 
}: { 
  onListIdFound: (listId: string | null) => void 
}) {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const listIdFromUrl = searchParams.get('listId');
    onListIdFound(listIdFromUrl);
  }, [searchParams, onListIdFound]);

  return null;
}

export default function SearchContent() {
  const { user, loading: authLoading } = useAuth();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GooglePlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [userLists, setUserLists] = useState<List[]>([]);
  const [selectedListCity, setSelectedListCity] = useState<string | undefined>();
  const [loadingLists, setLoadingLists] = useState(true);
  const [addingToList, setAddingToList] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [listIdFromUrl, setListIdFromUrl] = useState<string | null>(null);
  
  const router = useRouter();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Memoized callback for handling list ID from URL
  const handleListIdFromUrl = useCallback((listId: string | null) => {
    setListIdFromUrl(listId);
  }, []);

  // Memoized debounced search function
  const performDebouncedSearch = useCallback(async (searchQuery: string, city?: string) => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchPerformed(false);
      setIsTyping(false);
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
    setIsTyping(false);
    
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

  // Create memoized debounced version of the search function
  const debouncedSearch = useMemo(
    () => debounce((searchQuery: string, city?: string) => {
      performDebouncedSearch(searchQuery, city);
    }, 300),
    [performDebouncedSearch]
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
      router.push('/login');
      return;
    }

    // Fetch user's lists
    const fetchUserLists = async () => {
      if (!user) return;
      
      try {
        setLoadingLists(true);
        const lists = await getUserLists(user.uid);
        setUserLists(lists);
        
        // If listId is provided in URL, set it as selected list
        if (listIdFromUrl) {
          setSelectedListId(listIdFromUrl);
          
          // Get the city for the selected list
          const selectedList = lists.find(list => list.id === listIdFromUrl);
          if (selectedList && selectedList.city) {
            setSelectedListCity(selectedList.city);
          } else if (listIdFromUrl) {
            // If list not found in user lists, fetch it directly
            const listDetails = await getList(listIdFromUrl);
            if (listDetails && listDetails.city) {
              setSelectedListCity(listDetails.city);
            }
          }
        } else if (lists.length > 0) {
          setSelectedListId(lists[0].id);
          if (lists[0].city) {
            setSelectedListCity(lists[0].city);
          }
        }
      } catch (err) {
        console.error('Error fetching user lists:', err);
        setError('Failed to load your lists. Please try again.');
      } finally {
        setLoadingLists(false);
      }
    };

    if (user) {
      fetchUserLists();
    }
  }, [user, authLoading, router, listIdFromUrl]);

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
    setIsTyping(false);
    await performDebouncedSearch(query, selectedListCity);
  }, [query, selectedListCity, debouncedSearch, performDebouncedSearch]);

  // Handle input change with debounced search
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    
    if (newQuery.trim()) {
      setIsTyping(true);
      debouncedSearch(newQuery, selectedListCity);
    } else {
      setIsTyping(false);
      debouncedSearch.cancel();
      setSearchResults([]);
      setSearchPerformed(false);
    }
  }, [selectedListCity, debouncedSearch]);

  const handleListChange = useCallback(async (listId: string) => {
    setSelectedListId(listId);
    
    // Update the city when list changes
    const selectedList = userLists.find(list => list.id === listId);
    const newCity = selectedList?.city;
    
    if (newCity !== selectedListCity) {
      setSelectedListCity(newCity);
      
      // If there's an active search query, re-run the search with the new city
      if (query.trim()) {
        setIsTyping(true);
        debouncedSearch(query, newCity);
      }
    }
  }, [userLists, selectedListCity, query, debouncedSearch]);

  // Memoized add to list handler
  const handleAddToList = useCallback(async (place: GooglePlace) => {
    if (!selectedListId || !user) {
      setError('Please select a list and make sure you are logged in.');
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
      
      // Then add it to the selected list
      const listPlaceId = await addPlaceToList(selectedListId, placeId);
      
      // Show success feedback
      alert(`Added ${place.name} to your list!`);
    } catch (err) {
      console.error('Error adding place to list:', err);
      
      // Show specific error message
      let errorMessage = 'Failed to add place to list. Please try again.';
      
      if (err instanceof Error) {
        if (err.message.includes('permission')) {
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
      <Suspense fallback={null}>
        <SearchParamsHandler onListIdFound={handleListIdFromUrl} />
      </Suspense>
      
      <header className="bg-gray-900 shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold tracking-tight text-white">Search Places</h1>
            <Link
              href="/lists"
              className="inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-700"
            >
              Back to My Lists
            </Link>
          </div>
        </div>
      </header>
      <main>
        <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          <div className="bg-gray-800 px-4 py-5 shadow sm:rounded-lg sm:p-6">
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

            <form onSubmit={handleSearch} className="space-y-6">
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-white">
                  Search for places
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      name="search"
                      id="search"
                      className="block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3 pr-10"
                      placeholder={selectedListCity ? `Search in ${selectedListCity}...` : "Search for restaurants, cafes, attractions..."}
                      value={query}
                      onChange={handleInputChange}
                      disabled={loading && !isTyping}
                    />
                    {isTyping && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <svg
                          className="animate-spin h-4 w-4 text-blue-400"
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
                      </div>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !query.trim()}
                    className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
                  >
                    {loading && !isTyping ? 'Searching...' : 'Search'}
                  </button>
                </div>
                {selectedListCity && (
                  <p className="mt-2 text-sm text-blue-300">
                    Searching in: {selectedListCity}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="list" className="block text-sm font-medium text-white">
                  Select list to add places to
                </label>
                <select
                  id="list"
                  name="list"
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm h-10"
                  value={selectedListId || ''}
                  onChange={(e) => handleListChange(e.target.value)}
                  disabled={userLists.length === 0}
                >
                  {userLists.length > 0 ? (
                    userLists.map((list) => (
                      <option key={list.id} value={list.id}>
                        {list.name}{list.city ? ` (${list.city})` : ''}
                      </option>
                    ))
                  ) : (
                    <option value="">No lists available</option>
                  )}
                </select>
                {userLists.length === 0 && (
                  <p className="mt-2 text-sm text-red-400">
                    You need to create a list first.{' '}
                    <Link href="/lists/new" className="font-medium text-blue-400 hover:text-blue-300">
                      Create a list
                    </Link>
                  </p>
                )}
              </div>
            </form>

            {/* Search Results */}
            {loading && !isTyping && (
              <div className="mt-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-white">Searching...</p>
              </div>
            )}

            {searchPerformed && !loading && processedSearchResults.length === 0 && (
              <div className="mt-8 text-center">
                <p className="text-white">No places found. Try a different search term.</p>
              </div>
            )}

            {processedSearchResults.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-medium text-white mb-4">
                  Search Results ({processedSearchResults.length})
                </h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {processedSearchResults.map((place) => (
                    <div
                      key={place.place_id}
                      className="bg-gray-700 overflow-hidden shadow rounded-lg"
                    >
                      <div className="px-4 py-5 sm:p-6">
                        <h4 className="text-lg font-medium text-white truncate">{place.name}</h4>
                        <p className="mt-1 text-sm text-gray-300">{place.formatted_address}</p>
                        {place.rating && (
                          <div className="mt-2 flex items-center">
                            <div className="flex items-center">
                              {Array.from({ length: 5 }, (_, i) => (
                                <svg
                                  key={i}
                                  className={`h-4 w-4 ${
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
                            <span className="ml-2 text-sm text-gray-300">
                              {place.rating}
                            </span>
                          </div>
                        )}
                        {place.types && place.types.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {place.types.slice(0, 3).map((type, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900 text-blue-200"
                              >
                                {type.replace(/_/g, ' ')}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="mt-5">
                          <button
                            onClick={() => handleAddToList(place)}
                            disabled={
                              addingToList[place.place_id] ||
                              !selectedListId ||
                              userLists.length === 0
                            }
                            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                          >
                            {addingToList[place.place_id] ? (
                              <>
                                <svg
                                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                            ) : (
                              <>
                                <svg
                                  className="-ml-1 mr-2 h-5 w-5"
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                  aria-hidden="true"
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
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 