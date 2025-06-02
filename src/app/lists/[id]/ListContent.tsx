'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getList, getPlacesInList, deleteList, updateList, updatePlaceNotes, removePlaceFromListById } from '@/lib/firebase/firestore';
import { List, PlaceWithNotes, User } from '@/types';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getUserProfile } from '@/lib/firebase/user';

interface ListContentProps {
  id: string;
}

export default function ListContent({ id }: ListContentProps) {
  const { user, loading: authLoading } = useAuth();
  const [list, setList] = useState<List | null>(null);
  const [places, setPlaces] = useState<PlaceWithNotes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editIsPublic, setEditIsPublic] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [author, setAuthor] = useState<User | null>(null);
  const [editingPlaceId, setEditingPlaceId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState('');
  const [deletingPlaceId, setDeletingPlaceId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Redirect if not authenticated
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    const fetchListAndPlaces = async () => {
      try {
        setLoading(true);
        // Fetch list details
        const listData = await getList(id);
        
        if (!listData) {
          setError('List not found');
          setLoading(false);
          return;
        }

        // Check if user has permission to view this list
        if (listData.userId !== user?.uid && !listData.isPublic) {
          setError('You do not have permission to view this list');
          setLoading(false);
          return;
        }

        setList(listData);
        setEditName(listData.name);
        setEditTags(listData.tags?.join(', ') || '');
        setEditIsPublic(listData.isPublic);
        
        // Fetch author information
        try {
          const authorData = await getUserProfile(listData.userId);
          setAuthor(authorData);
        } catch (err) {
          console.error('Error fetching author data:', err);
        }
        
        // Fetch places in this list
        const placesData = await getPlacesInList(id);
        setPlaces(placesData);
      } catch (err) {
        console.error('Error fetching list data:', err);
        setError('An error occurred while loading the list. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchListAndPlaces();
    }
  }, [id, user, authLoading, router]);

  const handleEditList = async () => {
    if (!list || !user || user.uid !== list.userId) return;
    
    setUpdateLoading(true);
    try {
      // Process tags
      const tagArray = editTags
        .split(',')
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0);
      
      await updateList(id, {
        name: editName.trim(),
        tags: tagArray,
        isPublic: editIsPublic,
      });
      
      // Update local state
      setList({
        ...list,
        name: editName.trim(),
        tags: tagArray,
        isPublic: editIsPublic,
      });
      
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating list:', err);
      alert('Failed to update list. Please try again.');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDeleteList = async () => {
    if (!list || !user || user.uid !== list.userId) return;
    
    if (window.confirm('Are you sure you want to delete this list? This action cannot be undone.')) {
      setIsDeleting(true);
      try {
        await deleteList(id);
        // Make sure we set state before navigation
        setIsDeleting(false);
        // Navigate after the state update
        setTimeout(() => {
          router.push('/lists');
        }, 100);
      } catch (err) {
        console.error('Error deleting list:', err);
        setIsDeleting(false);
        alert('Failed to delete list. Please try again.');
      }
    }
  };

  const handleEditPlaceNotes = (place: PlaceWithNotes) => {
    setEditingPlaceId(place.listPlaceId);
    setEditingNotes(place.notes || '');
  };

  const handleSavePlaceNotes = async () => {
    if (!editingPlaceId) return;
    
    try {
      await updatePlaceNotes(editingPlaceId, editingNotes);
      
      // Update local state
      setPlaces(places.map(place => 
        place.listPlaceId === editingPlaceId 
          ? { ...place, notes: editingNotes.trim() || undefined }
          : place
      ));
      
      setEditingPlaceId(null);
      setEditingNotes('');
    } catch (err) {
      console.error('Error updating place notes:', err);
      alert('Failed to update notes. Please try again.');
    }
  };

  const handleCancelEditNotes = () => {
    setEditingPlaceId(null);
    setEditingNotes('');
  };

  const handleDeletePlace = async (place: PlaceWithNotes) => {
    if (!user || user.uid !== list?.userId) return;
    
    if (window.confirm(`Are you sure you want to remove "${place.name}" from this list?`)) {
      setDeletingPlaceId(place.listPlaceId);
      try {
        await removePlaceFromListById(place.listPlaceId);
        
        // Update local state
        setPlaces(places.filter(p => p.listPlaceId !== place.listPlaceId));
      } catch (err) {
        console.error('Error removing place from list:', err);
        alert('Failed to remove place. Please try again.');
      } finally {
        setDeletingPlaceId(null);
      }
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-white">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="bg-gray-800 p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-white">Error</h3>
            <p className="mt-1 text-sm text-gray-300">{error}</p>
            <div className="mt-6">
              <Link
                href="/lists"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back to My Lists
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!list) {
    return null;
  }

  const isOwner = user?.uid === list.userId;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gray-900 shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="listName" className="block text-sm font-medium text-white">
                  List Name
                </label>
                <input
                  type="text"
                  id="listName"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3"
                  disabled={updateLoading}
                />
              </div>
              <div>
                <label htmlFor="listTags" className="block text-sm font-medium text-white">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  id="listTags"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3"
                  placeholder="food, travel, shopping"
                  disabled={updateLoading}
                />
              </div>
              <div className="flex items-start">
                <div className="flex h-5 items-center">
                  <input
                    id="isPublic"
                    name="isPublic"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                    checked={editIsPublic}
                    onChange={(e) => setEditIsPublic(e.target.checked)}
                    disabled={updateLoading}
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
              <div className="flex space-x-3">
                <button
                  onClick={handleEditList}
                  disabled={updateLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                >
                  {updateLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  disabled={updateLoading}
                  className="inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteList}
                  disabled={isDeleting || updateLoading}
                  className="inline-flex items-center px-4 py-2 border border-red-600 text-sm font-medium rounded-md text-white bg-red-700 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {isDeleting ? 'Deleting...' : 'Delete List'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">{list.name}</h1>
                <p className="mt-1 text-sm text-gray-300">{list.description}</p>
                {list.city && <p className="text-sm text-blue-300">Location: {list.city}</p>}
                <div className="mt-2 flex flex-wrap gap-2">
                  <span 
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${
                      list.isPublic 
                        ? 'bg-green-900 text-green-200' 
                        : 'bg-purple-900 text-purple-200'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {list.isPublic ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      )}
                    </svg>
                    {list.isPublic ? 'Public' : 'Private'}
                  </span>
                  {list.tags && list.tags.length > 0 && (
                    list.tags.map((tag) => (
                      <span 
                        key={tag} 
                        className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-900 text-blue-200"
                      >
                        {tag}
                      </span>
                    ))
                  )}
                </div>
                {!isEditing && (
                  <div className="mt-2 flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-700">
                        {author?.photoURL ? (
                          <Image
                            src={author.photoURL}
                            alt={author.displayName || 'Author'}
                            className="h-full w-full object-cover"
                            width={32}
                            height={32}
                          />
                        ) : (
                          <svg
                            className="h-full w-full text-gray-500"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="ml-2 text-sm text-gray-300">
                      Created by {author?.displayName || 'Unknown User'}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex space-x-3">
                {isOwner && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center px-3 py-2 border border-gray-600 text-sm font-medium rounded-md text-white bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                  </div>
                )}
                <Link
                  href={`/search?listId=${list.id}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg
                    className="-ml-1 mr-2 h-5 w-5"
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
                  Add Places
                </Link>
                <Link
                  href="/lists"
                  className="inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-700"
                >
                  Back
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>
      <main>
        <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          {places.length > 0 ? (
            <>
              <div className="flex justify-end mb-4">
                <div className="inline-flex rounded-md shadow-sm" role="group">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`px-4 py-2 text-sm font-medium rounded-l-md focus:z-10 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                      viewMode === 'grid'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-white hover:bg-gray-700'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('map')}
                    className={`px-4 py-2 text-sm font-medium rounded-r-md focus:z-10 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                      viewMode === 'map'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-white hover:bg-gray-700'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {places.map((place) => {
                    const isOwner = user && list && user.uid === list.userId;
                    const isEditingThisPlace = editingPlaceId === place.listPlaceId;
                    const isDeletingThisPlace = deletingPlaceId === place.listPlaceId;
                    
                    return (
                      <div
                        key={place.id}
                        className="bg-gray-800 overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-300"
                      >
                        {place.photoUrl && (
                          <div className="relative h-48 w-full">
                            <Image
                              src={place.photoUrl}
                              alt={place.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="px-4 py-5 sm:p-6">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-medium text-white truncate flex-1">{place.name}</h3>
                            {isOwner && (
                              <div className="flex space-x-1 ml-2">
                                <button
                                  onClick={() => handleEditPlaceNotes(place)}
                                  className="p-1 text-gray-400 hover:text-white transition-colors"
                                  title="Edit notes"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDeletePlace(place)}
                                  disabled={isDeletingThisPlace}
                                  className="p-1 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
                                  title="Remove from list"
                                >
                                  {isDeletingThisPlace ? (
                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                  ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                          
                          <p className="mt-1 text-sm text-gray-300 line-clamp-2">{place.address}</p>
                          
                          {place.rating > 0 && (
                            <div className="mt-2 flex items-center">
                              <span className="text-sm font-medium text-white">{place.rating.toFixed(1)}</span>
                              <div className="ml-1 flex">
                                {Array.from({ length: 5 }, (_, i) => (
                                  <svg
                                    key={i}
                                    className={`h-5 w-5 ${
                                      i < Math.floor(place.rating)
                                        ? 'text-yellow-400'
                                        : i < Math.ceil(place.rating) && i >= Math.floor(place.rating)
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
                          
                          {/* Notes section */}
                          <div className="mt-4">
                            {isEditingThisPlace ? (
                              <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-300">
                                  Your notes:
                                </label>
                                <textarea
                                  value={editingNotes}
                                  onChange={(e) => setEditingNotes(e.target.value)}
                                  className="w-full px-3 py-2 text-sm bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="Add your notes about this place..."
                                  rows={3}
                                />
                                <div className="flex space-x-2">
                                  <button
                                    onClick={handleSavePlaceNotes}
                                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={handleCancelEditNotes}
                                    className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                {place.notes && (
                                  <div className="bg-gray-700 rounded-md p-3">
                                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{place.notes}</p>
                                  </div>
                                )}
                                {!place.notes && isOwner && (
                                  <button
                                    onClick={() => handleEditPlaceNotes(place)}
                                    className="text-sm text-gray-400 hover:text-white transition-colors"
                                  >
                                    + Add notes
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-gray-800 rounded-lg shadow overflow-hidden">
                  <div className="h-[600px] w-full flex items-center justify-center">
                    {/* Map view is temporarily disabled */}
                    <div className="text-white text-center">
                      <p className="text-xl mb-2">Map View</p>
                      <p className="text-gray-400">Map visualization is temporarily unavailable.</p>
                    </div>
                  </div>
                </div>
              )}
            </>
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-white">No places</h3>
              <p className="mt-1 text-sm text-gray-300">Get started by adding places to your list.</p>
              <div className="mt-6">
                <Link
                  href={`/search?listId=${list.id}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg
                    className="-ml-1 mr-2 h-5 w-5"
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
                  Add Places
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 