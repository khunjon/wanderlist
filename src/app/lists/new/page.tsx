'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { createList } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trackListCreate as trackListCreateGA } from '@/lib/analytics/gtag';
import { trackListCreate } from '@/lib/mixpanelClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TagInput } from '@/components/ui/tag-input';

export default function NewListPage() {
  const { user, loading: authLoading } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Redirect if not authenticated
  if (!authLoading && !user) {
    router.push('/');
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

      const listData = {
        user_id: user.id,
        name: name.trim(),
        description: description.trim(),
        city: city.trim(),
        tags: tags,
        is_public: isPublic,
      };

      const newList = await createList(listData);
      const listId = newList.id;
      
      // Track list creation event with Google Analytics
      trackListCreateGA(name.trim(), listId);
      
      // Track list creation event with Mixpanel
      trackListCreate({
        list_id: listId,
        list_name: name.trim(),
        list_author: user.displayName || user.email || 'Unknown',
        list_creation_date: new Date().toISOString(),
        is_public: isPublic,
        city: city.trim(),
        tags: tags,
        description: description.trim()
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
      {/* Simplified header without main navbar */}
      <header className="bg-gray-900 shadow">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:py-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" asChild className="mr-4">
              <Link href="/lists">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </Link>
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Create New List</h1>
          </div>
        </div>
      </header>
      <main>
        <div className="mx-auto max-w-7xl py-4 px-4 sm:py-6 sm:px-6 lg:px-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">New List Details</CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-6 bg-red-900 border-l-4 border-red-600 p-4 rounded">
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

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-white">
                    List Name *
                  </label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="My Favorite Restaurants"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    required
                    className="bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium text-white">
                    Description
                  </label>
                  <Textarea
                    id="description"
                    rows={3}
                    placeholder="A collection of my favorite places to eat around town."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={loading}
                    className="bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="city" className="text-sm font-medium text-white">
                    City
                  </label>
                  <Input
                    id="city"
                    type="text"
                    placeholder="San Francisco, CA"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={loading}
                    className="bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-400">
                    Help narrow down place searches by specifying a city
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="tags" className="text-sm font-medium text-white">
                    Tags
                  </label>
                  <TagInput
                    value={tags}
                    onChange={setTags}
                    placeholder="food, travel, shopping"
                    disabled={loading}
                    className="bg-gray-700 border-gray-600 text-white focus-within:border-blue-500 focus-within:ring-blue-500"
                  />
                  <p className="text-xs text-gray-400">
                    Press Enter or comma to add tags. Click × to remove them.
                  </p>
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <Switch
                    id="isPublic"
                    checked={isPublic}
                    onCheckedChange={setIsPublic}
                    disabled={loading}
                  />
                  <div className="space-y-1">
                    <label htmlFor="isPublic" className="text-sm font-medium text-white">
                      Public List
                    </label>
                    <p className="text-xs text-gray-400">
                      If enabled, this list will be discoverable by other users.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-700">
                  <Button variant="outline" asChild disabled={loading}>
                    <Link href="/lists">
                      Cancel
                    </Link>
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create List'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
} 