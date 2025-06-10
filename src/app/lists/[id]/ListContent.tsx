'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getListById, getListPlaces, deleteList, updateList, updateListPlaceNotes, removePlaceFromList, incrementListViewCount } from '@/lib/supabase';
import { List, PlaceWithNotes, User } from '@/types';
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
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
          // Trigger Next.js 404 page
          notFound();
          return;
        }

        // Check if user has permission to view this list
        if (!listData.is_public && (!user || listData.user_id !== user.id)) {
          setError('You do not have permission to view this list');
          return;
        }

        setList(listData);

        // Set edit form values
        setEditName(listData.name);
        setEditTags(listData.tags?.join(', ') || '');
        setEditIsPublic(listData.is_public || false);

        // Fetch author profile first
        let authorData: User | null = null;
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
            authorData = transformedAuthor;
          }
        } catch (err) {
          console.error('Error fetching author profile:', err);
        }

        // Fetch places in the list first
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

        // Track list view and increment view count (after both author and places data are available)
        if (user) {
          // Track with Google Analytics
          trackListViewGA(listData.name, listData.id);
          
          // Track with Mixpanel - now with proper author information and place count
          trackListView({
            list_id: listData.id,
            list_name: listData.name,
            list_author: authorData?.displayName || authorData?.email || 'Unknown',
            list_creation_date: listData.created_at || new Date().toISOString(),
            is_public: listData.is_public || false,
            view_count: listData.view_count || 0,
            place_count: transformedPlaces.length
          });
          
          // Only increment view count if user is not the owner
          if (listData.user_id !== user.id) {
            await incrementListViewCount(id);
          }
        }
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

  // If list is null after loading, notFound() should have been called
  if (!list) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header - Mobile Optimized */}
      <header className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 shadow-lg">
        <div className="mx-auto max-w-7xl px-4 py-2 sm:py-3 sm:px-6 lg:px-8">
          {/* Top row with back button and action buttons */}
          <div className="flex items-center justify-between mb-2 sm:mb-1">
            <Link
              href="/lists"
              className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            
            {/* Action buttons - Mobile optimized */}
            {isOwner && (
              <div className="flex items-center space-x-2">
                {!isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 sm:w-auto sm:h-auto sm:px-3 sm:py-2 rounded-full sm:rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                      title="Edit list"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span className="hidden sm:inline text-sm font-medium">Edit</span>
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 sm:w-auto sm:h-auto sm:px-3 sm:py-2 rounded-full sm:rounded-md bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
                      title="Delete list"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span className="hidden sm:inline text-sm font-medium">
                        {deleting ? 'Deleting...' : 'Delete'}
                      </span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 sm:w-auto sm:h-auto sm:px-3 sm:py-2 rounded-full sm:rounded-md bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-50"
                      title="Save changes"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="hidden sm:inline text-sm font-medium">
                        {saving ? 'Saving...' : 'Save'}
                      </span>
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      disabled={saving}
                      className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 sm:w-auto sm:h-auto sm:px-3 sm:py-2 rounded-full sm:rounded-md bg-gray-600 hover:bg-gray-700 text-white transition-colors"
                      title="Cancel editing"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="hidden sm:inline text-sm font-medium">Cancel</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          
          {/* Title row with privacy indicator */}
          <div className="flex items-start justify-between mb-1">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white leading-tight truncate">
                  {list.name}
                </h1>
                {/* Private indicator - only show for private lists */}
                {!list.is_public && (
                  <div className="flex-shrink-0" title="Private list">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                )}
              </div>
              {list.description && (
                <p className="text-sm text-gray-300 leading-relaxed mt-1 line-clamp-2">
                  {list.description}
                </p>
              )}
            </div>
          </div>
          
          {/* Author info - integrated into header, de-emphasized */}
          {author && (
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              {author.photo_url && (
                <img
                  src={author.photo_url}
                  alt={author.displayName}
                  className="h-5 w-5 sm:h-6 sm:w-6 rounded-full"
                  key={author.photo_url}
                />
              )}
              <span>by {author.displayName}</span>
            </div>
          )}
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
        <div className="mx-auto max-w-7xl py-4 sm:py-6 px-4 sm:px-6 lg:px-8">

          {/* View Mode Controls */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
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
              </div>
              

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
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg font-medium text-white flex-1 min-w-0 pr-2">{place.name}</h3>
                          {place.rating > 0 && (
                            <div className="flex items-center flex-shrink-0">
                              <span className="text-yellow-400">★</span>
                              <span className="text-sm text-gray-300 ml-1">{place.rating}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-300 mb-2">{place.address}</p>
                        
                        {/* Notes Section */}
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Notes
                          </label>
                          {editingNotes[place.id] ? (
                            <div className="space-y-3">
                              <textarea
                                value={noteValues[place.id] || ''}
                                onChange={(e) => setNoteValues(prev => ({ ...prev, [place.id]: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                rows={3}
                                placeholder="Add your notes about this place..."
                                autoFocus
                              />
                              <div className="flex justify-between items-center">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleSaveNotes(place.id)}
                                    disabled={savingNotes[place.id]}
                                    className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    {savingNotes[place.id] ? 'Saving...' : 'Save'}
                                  </button>
                                  <button
                                    onClick={() => handleCancelEditNotes(place.id)}
                                    className="inline-flex items-center px-3 py-1.5 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Cancel
                                  </button>
                                </div>
                                
                                {/* Delete place option in edit mode */}
                                <button
                                  onClick={() => {
                                    if (window.confirm('Are you sure you want to remove this place from the list?')) {
                                      handleRemovePlace(place.id);
                                    }
                                  }}
                                  className="inline-flex items-center px-2 py-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-md transition-colors text-sm"
                                  title="Remove place from list"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Remove
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="relative group">
                              {isOwner ? (
                                <div
                                  onClick={() => handleEditNotes(place.id, place.notes || '')}
                                  className="text-sm text-gray-300 min-h-[3rem] p-3 bg-gray-700 rounded-md cursor-text hover:bg-gray-600 transition-colors border-2 border-transparent hover:border-gray-500 focus-within:border-blue-500"
                                  role="button"
                                  tabIndex={0}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault();
                                      handleEditNotes(place.id, place.notes || '');
                                    }
                                  }}
                                >
                                  {place.notes ? (
                                    <span className="whitespace-pre-wrap">{place.notes}</span>
                                  ) : (
                                    <span className="text-gray-400 italic">Click to add notes...</span>
                                  )}
                                  
                                  {/* Edit indicator */}
                                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-sm text-gray-300 min-h-[3rem] p-3 bg-gray-700 rounded-md">
                                  {place.notes ? (
                                    <span className="whitespace-pre-wrap">{place.notes}</span>
                                  ) : (
                                    <span className="text-gray-400 italic">No notes</span>
                                  )}
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
            </>
          )}

          {/* Bottom info section - location, stats, and tags */}
          <div className="mt-8 pt-6 border-t border-gray-700 space-y-6">
            {/* Location and stats */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
              {list.city && (
                <div className="flex items-center space-x-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{list.city}</span>
                </div>
              )}
              
              <div className="flex items-center space-x-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{places.length} {places.length === 1 ? 'place' : 'places'}</span>
              </div>
              
              {list.view_count !== undefined && (
                <div className="flex items-center space-x-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>{list.view_count} views</span>
                </div>
              )}
            </div>

            {/* Tags section */}
            {list.tags && list.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {list.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gray-700/50 text-gray-300 border border-gray-600 hover:bg-gray-700 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Floating Action Button for adding places */}
      {isOwner && (
        <FloatingActionButton 
          listId={list.id}
          listCity={list.city || undefined}
          onPlaceAdded={handlePlaceAdded} 
        />
      )}
    </div>
  );
} 