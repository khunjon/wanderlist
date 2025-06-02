'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createList } from '@/lib/firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { event } from '@/lib/analytics/gtag';

export default function NewListPage() {
  const { user, loading: authLoading } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [tags, setTags] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Redirect if not authenticated
  if (!authLoading && !user) {
    router.push('/login');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!name.trim()) {
      setError('List name is required');
      setLoading(false);
      return;
    }

    try {
      if (!user) {
        throw new Error('You must be logged in to create a list');
      }

      // Process tags - split by comma, trim whitespace, convert to lowercase, and remove empty tags
      const tagArray = tags
        .split(',')
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0);

      const listData = {
        userId: user.uid,
        name: name.trim(),
        description: description.trim(),
        city: city.trim(),
        tags: tagArray,
        isPublic,
      };

      const listId = await createList(listData);
      
      // Track list creation event
      event({
        action: 'list_create',
        category: 'Lists',
        label: name.trim(),
      });
      
      router.push(`/lists/${listId}`);
    } catch (err) {
      console.error('Error creating list:', err);
      setError('An error occurred while creating your list. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gray-900 shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold tracking-tight text-white">Create New List</h1>
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-700"
            >
              Cancel
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

            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-white">
                    List Name
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="name"
                      id="name"
                      className="block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3"
                      placeholder="My Favorite Restaurants"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-white">
                    City
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="city"
                      id="city"
                      className="block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3"
                      placeholder="San Francisco, CA"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-300">
                    Specify a city or area to limit your place searches.
                  </p>
                </div>

                <div>
                  <label htmlFor="tags" className="block text-sm font-medium text-white">
                    Tags
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="tags"
                      id="tags"
                      className="block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm h-10 px-3"
                      placeholder="food, travel, shopping"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-300">
                    Comma-separated tags to categorize your list.
                  </p>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-white">
                    Description
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      className="block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2"
                      placeholder="A collection of my favorite places to eat around town."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-300">
                    Brief description of what this list is about.
                  </p>
                </div>

                <div className="flex items-start">
                  <div className="flex h-5 items-center">
                    <input
                      id="isPublic"
                      name="isPublic"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      disabled={loading}
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

                <div className="flex justify-end">
                  <Link
                    href="/dashboard"
                    className="rounded-md border border-gray-600 bg-gray-800 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={loading}
                    className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
                  >
                    {loading ? 'Creating...' : 'Create List'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
} 