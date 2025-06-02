'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { searchPlaces } from '@/lib/google/places';
import { createPlace, addPlaceToList, getUserLists } from '@/lib/firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { GooglePlace, List } from '@/types';

export default function SearchContent() {
  const { user, loading: authLoading } = useAuth();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GooglePlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [userLists, setUserLists] = useState<List[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);
  const [addingToList, setAddingToList] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const listIdFromUrl = searchParams.get('listId');

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
        } else if (lists.length > 0) {
          setSelectedListId(lists[0].id);
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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    setSearchPerformed(true);
    
    try {
      const results = await searchPlaces(query);
      setSearchResults(results);
    } catch (err) {
      console.error('Error searching places:', err);
      setError('Failed to search places. Please try again.');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToList = async (place: GooglePlace) => {
    if (!selectedListId || !user) return;
    
    // Set loading state for this specific place
    setAddingToList(prev => ({ ...prev, [place.place_id]: true }));
    
    try {
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
      await addPlaceToList(selectedListId, placeId);
      
      // Show success feedback
      alert(`Added ${place.name} to your list!`);
    } catch (err) {
      console.error('Error adding place to list:', err);
      setError('Failed to add place to list. Please try again.');
    } finally {
      // Clear loading state for this place
      setAddingToList(prev => ({ ...prev, [place.place_id]: false }));
    }
  };

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
      <header className="bg-gray-900 shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold tracking-tight text-white">Search Places</h1>
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-700"
            >
              Back to Dashboard
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
                  <input
                    type="text"
                    name="search"
                    id="search"
                    className="block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3"
                    placeholder="Search for restaurants, cafes, attractions..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading || !query.trim()}
                    className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
                  >
                    {loading ? 'Searching...' : 'Search'}
                  </button>
                </div>
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
                  onChange={(e) => setSelectedListId(e.target.value)}
                  disabled={userLists.length === 0}
                >
                  {userLists.length > 0 ? (
                    userLists.map((list) => (
                      <option key={list.id} value={list.id}>
                        {list.name}
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
          </div>

          {searchPerformed && (
            <div className="mt-8">
              <h2 className="text-lg font-medium text-white mb-4">Search Results</h2>
              
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-4 text-white">Searching for places...</p>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {searchResults.map((place) => (
                    <div
                      key={place.place_id}
                      className="bg-gray-800 overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-300"
                    >
                      {place.photos && place.photos.length > 0 && (
                        <div className="relative h-48 w-full bg-gray-700">
                          <img
                            src={`/api/places/photo?photoReference=${place.photos[0].photo_reference}&maxWidth=400`}
                            alt={place.name}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      )}
                      <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg font-medium text-white truncate">{place.name}</h3>
                        <p className="mt-1 text-sm text-gray-300 line-clamp-2">
                          {place.formatted_address}
                        </p>
                        {place.rating && (
                          <div className="mt-2 flex items-center">
                            <span className="text-sm font-medium text-white">
                              {place.rating.toFixed(1)}
                            </span>
                            <div className="ml-1 flex">
                              {Array.from({ length: 5 }, (_, i) => (
                                <svg
                                  key={i}
                                  className={`h-5 w-5 ${
                                    i < Math.floor(place.rating || 0)
                                      ? 'text-yellow-400'
                                      : i < Math.ceil(place.rating || 0) && i >= Math.floor(place.rating || 0)
                                      ? 'text-yellow-300'
                                      : 'text-gray-500'
                                  }`}
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                  aria-hidden="true"
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
              ) : (
                <div className="text-center py-12 bg-gray-800 shadow rounded-lg">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-white">No places found</h3>
                  <p className="mt-1 text-sm text-gray-300">
                    Try searching with different keywords or locations.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 