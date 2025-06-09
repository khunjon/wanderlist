'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getListById, getListPlaces, deleteList, updateList, updateListPlaceNotes, removePlaceFromList, incrementListViewCount } from '@/lib/supabase';
import { List, PlaceWithNotes, User } from '@/types';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getUserProfile } from '@/lib/supabase';
import MapView from '@/components/maps/MapView';
import { trackListView as trackListViewGA } from '@/lib/analytics/gtag';
import { trackListView } from '@/lib/mixpanelClient';
import SortControl, { SortState, SortOption } from '@/components/ui/SortControl';
import SwipeView from '@/components/SwipeView';
import FloatingActionButton from '@/components/ui/FloatingActionButton';

const placeSortOptions: SortOption[] = [
  { value: 'addedAt', label: 'Date Added' },
  { value: 'name', label: 'Name' },
  { value: 'rating', label: 'Rating' },
];

interface ListContentProps {
  id: string;
}

export default function ListContent({ id }: ListContentProps) {
  const { user, loading: authLoading } = useAuth();
  const [list, setList] = useState<List | null>(null);
  const [places, setPlaces] = useState<PlaceWithNotes[]>([]);
  const [author, setAuthor] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editIsPublic, setEditIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [placeSortState, setPlaceSortState] = useState<SortState>({ field: 'addedAt', direction: 'desc' });
  const [viewMode, setViewMode] = useState<'grid' | 'map' | 'swipe'>('grid');
  const [editingNotes, setEditingNotes] = useState<Record<string, boolean>>({});
  const [noteValues, setNoteValues] = useState<Record<string, string>>({});
  const [savingNotes, setSavingNotes] = useState<Record<string, boolean>>({});
  const router = useRouter();

  // Memoized sort function for places
  const sortPlaces = useCallback((placesToSort: PlaceWithNotes[], sort: SortState) => {
    const sorted = [...placesToSort].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sort.field) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'rating':
          aValue = a.rating || 0;
          bValue = b.rating || 0;
          break;
        case 'addedAt':
          aValue = a.addedAt.getTime();
          bValue = b.addedAt.getTime();
          break;
        default:
          return 0;
      }

      if (sort.direction === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return sorted;
  }, []);

  // Memoized sorted places array
  const sortedPlaces = useMemo(() => {
    return sortPlaces(places, placeSortState);
  }, [places, placeSortState, sortPlaces]);

  // Memoized check if user is owner
  const isOwner = useMemo(() => {
    return user?.id === list?.user_id;
  }, [user?.id, list?.user_id]);

  // Callback to refresh places when a new place is added
  const handlePlaceAdded = useCallback(async () => {
    if (!id) return;
    try {
      const placesData = await getListPlaces(id);
      // Transform the data to match PlaceWithNotes interface
      const transformedPlaces: PlaceWithNotes[] = placesData.map(item => ({
        // Map Supabase place properties to expected interface
        id: item.places.id,
        googlePlaceId: item.places.google_place_id,
        name: item.places.name,
        address: item.places.address,
        latitude: item.places.latitude,
        longitude: item.places.longitude,
        rating: item.places.rating || 0,
        photoUrl: item.places.photo_url || '',
        placeTypes: item.places.place_types || [],
        // Map list place properties
        listPlaceId: item.id,
        addedAt: new Date(item.added_at || ''),
        notes: item.notes || ''
      }));
      setPlaces(transformedPlaces);
    } catch (err) {
      console.error('Error refreshing places:', err);
    }
  }, [id]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch list data
        const listData = await getListById(id);
        if (!listData) {
          setError('List not found');
          return;
        }

        // Check if user has permission to view this list
        if (!listData.is_public && (!user || listData.user_id !== user.id)) {
          setError('You do not have permission to view this list');
          return;
        }

        setList(listData);

        // Track list view and increment view count
        if (user) {
          // Track with Google Analytics
          trackListViewGA(listData.name, listData.id);
          
          // Track with Mixpanel
          trackListView({
            list_id: listData.id,
            list_name: listData.name,
            list_author: author?.displayName || author?.email || 'Unknown',
            list_creation_date: listData.created_at || new Date().toISOString(),
            is_public: listData.is_public || false,
            view_count: listData.view_count || 0,
            place_count: places.length
          });
          
          // Only increment view count if user is not the owner
          if (listData.user_id !== user.id) {
            await incrementListViewCount(id);
          }
        }

        // Set edit form values
        setEditName(listData.name);
        setEditTags(listData.tags?.join(', ') || '');
        setEditIsPublic(listData.is_public || false);

        // Fetch author profile
        try {
          const authorProfile = await getUserProfile(listData.user_id);
          // Transform to match User interface
          if (authorProfile) {
            const transformedAuthor: User = {
              id: authorProfile.id,
              email: authorProfile.email,
              displayName: authorProfile.display_name || '',
              photo_url: authorProfile.photo_url || '',
              createdAt: new Date(authorProfile.created_at || ''),
              created_at: authorProfile.created_at,
              updated_at: authorProfile.updated_at,
              is_admin: authorProfile.is_admin || false,
              bio: authorProfile.bio || '',
              instagram: authorProfile.instagram || '',
              tiktok: authorProfile.tiktok || ''
            };
            setAuthor(transformedAuthor);
          }
        } catch (err) {
          console.error('Error fetching author profile:', err);
        }

        // Fetch places in the list
        const placesData = await getListPlaces(id);
        // Transform the data to match PlaceWithNotes interface
        const transformedPlaces: PlaceWithNotes[] = placesData.map(item => ({
          // Map Supabase place properties to expected interface
          id: item.places.id,
          googlePlaceId: item.places.google_place_id,
          name: item.places.name,
          address: item.places.address,
          latitude: item.places.latitude,
          longitude: item.places.longitude,
          rating: item.places.rating || 0,
          photoUrl: item.places.photo_url || '',
          placeTypes: item.places.place_types || [],
          // Map list place properties
          listPlaceId: item.id,
          addedAt: new Date(item.added_at || ''),
          notes: item.notes || ''
        }));
        setPlaces(transformedPlaces);
      } catch (err) {
        console.error('Error fetching list:', err);
        setError('Failed to load list. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if we have the ID and either no user requirement or user is loaded
    if (id && (!authLoading || user)) {
      fetchData();
    }
  }, [id, user, authLoading]);

  // Memoized save handler
  const handleSave = useCallback(async () => {
    if (!list || !user) return;

    try {
      setSaving(true);
      setError(null);

      const tags = editTags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      await updateList(list.id, {
        name: editName,
        tags,
        is_public: editIsPublic,
      });

      // Update local state
      setList(prev => prev ? {
        ...prev,
        name: editName,
        tags,
        is_public: editIsPublic,
      } : null);

      setIsEditing(false);
    } catch (err) {
      console.error('Error updating list:', err);
      setError('Failed to update list. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [list, user, editName, editTags, editIsPublic]);

  // Memoized delete handler
  const handleDelete = useCallback(async () => {
    if (!list || !user) return;

    const confirmed = window.confirm('Are you sure you want to delete this list? This action cannot be undone.');
    if (!confirmed) return;

    try {
      setDeleting(true);
      setError(null);

      await deleteList(list.id);
      router.push('/lists');
    } catch (err) {
      console.error('Error deleting list:', err);
      setError('Failed to delete list. Please try again.');
    } finally {
      setDeleting(false);
    }
  }, [list, user, router]);

  const handleSortChange = useCallback((newSort: SortState) => {
    setPlaceSortState(newSort);
  }, []);

  const handleEditNotes = useCallback((placeId: string, currentNotes: string) => {
    setEditingNotes(prev => ({ ...prev, [placeId]: true }));
    setNoteValues(prev => ({ ...prev, [placeId]: currentNotes }));
  }, []);

  const handleSaveNotes = useCallback(async (placeId: string) => {
    if (!list) return;

    try {
      setSavingNotes(prev => ({ ...prev, [placeId]: true }));
      
      const newNotes = noteValues[placeId] || '';
      await updateListPlaceNotes(list.id, placeId, newNotes);
      
      // Update local state
      setPlaces(prev => prev.map(place => 
        place.id === placeId 
          ? { ...place, notes: newNotes }
          : place
      ));
      
      setEditingNotes(prev => ({ ...prev, [placeId]: false }));
    } catch (err) {
      console.error('Error updating notes:', err);
      setError('Failed to update notes. Please try again.');
    } finally {
      setSavingNotes(prev => ({ ...prev, [placeId]: false }));
    }
  }, [list, noteValues]);

  const handleCancelEditNotes = useCallback((placeId: string) => {
    setEditingNotes(prev => ({ ...prev, [placeId]: false }));
    setNoteValues(prev => ({ ...prev, [placeId]: '' }));
  }, []);

  const handleRemovePlace = useCallback(async (placeId: string) => {
    if (!list) return;

    const confirmed = window.confirm('Are you sure you want to remove this place from the list?');
    if (!confirmed) return;

    try {
      await removePlaceFromList(list.id, placeId);
      
      // Update local state
      setPlaces(prev => prev.filter(place => place.id !== placeId));
    } catch (err) {
      console.error('Error removing place:', err);
      setError('Failed to remove place. Please try again.');
    }
  }, [list]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-white">Loading list...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Error</h1>
          <p className="text-gray-300 mb-4">{error}</p>
          <Link
            href="/lists"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Lists
          </Link>
        </div>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">List Not Found</h1>
          <p className="text-gray-300 mb-4">The list you're looking for doesn't exist or has been deleted.</p>
          <Link
            href="/lists"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to Lists
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gray-900 shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/lists"
                className="text-gray-300 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">{list.name}</h1>
                {list.description && (
                  <p className="mt-1 text-gray-300">{list.description}</p>
                )}
              </div>
            </div>
            
            {isOwner && (
              <div className="flex items-center space-x-2">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Edit
                  </button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      disabled={saving}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-300 bg-transparent hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Edit Form */}
      {isEditing && (
        <div className="bg-gray-800 border-b border-gray-700">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-white">
                  List Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-white">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  id="tags"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="food, travel, favorites"
                />
              </div>
              <div className="flex items-start">
                <div className="flex h-5 items-center">
                  <input
                    id="isPublic"
                    type="checkbox"
                    checked={editIsPublic}
                    onChange={(e) => setEditIsPublic(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="isPublic" className="font-medium text-white">
                    Public List
                  </label>
                  <p className="text-gray-300">
                    If checked, this list will be discoverable by other users.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
        <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          {/* List Info */}
          <div className="bg-gray-800 shadow rounded-lg mb-6 p-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center space-x-4 mb-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    list.is_public 
                      ? 'bg-green-900 text-green-200' 
                      : 'bg-purple-900 text-purple-200'
                  }`}>
                    {list.is_public ? 'Public' : 'Private'}
                  </span>
                  {list.city && (
                    <span className="text-sm text-blue-300">📍 {list.city}</span>
                  )}
                </div>
                
                {list.tags && list.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {list.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-700 text-gray-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                
                {author && (
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    {author.photo_url && (
                      <img
                        src={author.photo_url}
                        alt={author.displayName}
                        className="h-6 w-6 rounded-full"
                      />
                    )}
                    <span>Created by {author.displayName}</span>
                  </div>
                )}
              </div>
              
              <div className="text-right text-sm text-gray-400">
                <div>{places.length} {places.length === 1 ? 'place' : 'places'}</div>
                {list.view_count !== undefined && (
                  <div>{list.view_count} views</div>
                )}
              </div>
            </div>
          </div>

          {/* View Mode Controls */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <div className="flex rounded-md shadow-sm">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2 text-sm font-medium rounded-l-md border ${
                    viewMode === 'grid'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-4 py-2 text-sm font-medium rounded-r-md border ${
                    viewMode === 'map'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                  }`}
                >
                  Map
                </button>
                {/* Temporarily disabled SwipeView due to interface mismatch
                <button
                  onClick={() => setViewMode('swipe')}
                  className={`px-4 py-2 text-sm font-medium rounded-r-md border ${
                    viewMode === 'swipe'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
                  }`}
                >
                  Swipe
                </button>
                */}
              </div>
              
              {isOwner && (
                <Link
                  href={`/search?listId=${list.id}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Add Places
                </Link>
              )}
            </div>

            {viewMode === 'grid' && places.length > 0 && (
              <SortControl
                options={placeSortOptions}
                currentSort={placeSortState}
                onSortChange={handleSortChange}
                listId={`list-${list.id}`}
              />
            )}
          </div>

          {/* Content based on view mode */}
          {places.length === 0 ? (
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
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-white">No places yet</h3>
              <p className="mt-1 text-sm text-gray-300">Get started by adding some places to this list.</p>
              {isOwner && (
                <div className="mt-6">
                  <Link
                    href={`/search?listId=${list.id}`}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Add Places
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <>
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {sortedPlaces.map((place) => (
                    <div
                      key={place.id}
                      className="bg-gray-800 shadow rounded-lg overflow-hidden"
                    >
                      {/* Place Image */}
                      {place.photoUrl && (
                        <div className="h-48 bg-gray-700">
                          <img
                            src={place.photoUrl}
                            alt={place.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      {/* Place Content */}
                      <div className="p-4">
                        <h3 className="text-lg font-medium text-white mb-2">{place.name}</h3>
                        <p className="text-sm text-gray-300 mb-2">{place.address}</p>
                        
                        {place.rating > 0 && (
                          <div className="flex items-center mb-2">
                            <span className="text-yellow-400">★</span>
                            <span className="text-sm text-gray-300 ml-1">{place.rating}</span>
                          </div>
                        )}
                        
                        {/* Notes Section */}
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Notes
                          </label>
                          {editingNotes[place.id] ? (
                            <div className="space-y-2">
                              <textarea
                                value={noteValues[place.id] || ''}
                                onChange={(e) => setNoteValues(prev => ({ ...prev, [place.id]: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows={3}
                                placeholder="Add your notes about this place..."
                              />
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleSaveNotes(place.id)}
                                  disabled={savingNotes[place.id]}
                                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                                >
                                  {savingNotes[place.id] ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                  onClick={() => handleCancelEditNotes(place.id)}
                                  className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <p className="text-sm text-gray-300 min-h-[3rem] p-2 bg-gray-700 rounded">
                                {place.notes || 'No notes yet'}
                              </p>
                              {isOwner && (
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleEditNotes(place.id, place.notes || '')}
                                    className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                                  >
                                    Edit Notes
                                  </button>
                                  <button
                                    onClick={() => handleRemovePlace(place.id)}
                                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                                  >
                                    Remove
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {viewMode === 'map' && (
                <div className="h-96 rounded-lg overflow-hidden">
                  <MapView places={sortedPlaces} />
                </div>
              )}

              {/* Temporarily disabled SwipeView due to interface mismatch
              {viewMode === 'swipe' && (
                <SwipeView
                  places={sortedPlaces}
                  onClose={() => setViewMode('grid')}
                  isOwner={isOwner}
                  onEditNotes={handleEditNotes}
                  onSaveNotes={handleSaveNotes}
                  onCancelEditNotes={handleCancelEditNotes}
                  onNotesChange={(placeId, value) => setNoteValues(prev => ({ ...prev, [placeId]: value }))}
                  onRemove={handleRemovePlace}
                  editingNotes={editingNotes}
                  noteValues={noteValues}
                  savingNotes={savingNotes}
                />
              )}
              */}
            </>
          )}
        </div>
      </main>

      {/* Floating Action Button for adding places */}
      {isOwner && places.length > 0 && (
        <FloatingActionButton onPlaceAdded={handlePlaceAdded} />
      )}
    </div>
  );
} 