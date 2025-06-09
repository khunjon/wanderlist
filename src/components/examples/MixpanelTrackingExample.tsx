'use client';

import { useMixpanel } from '@/hooks/useMixpanel';
import { useAuth } from '@/hooks/useAuth';

/**
 * Example component demonstrating Mixpanel tracking patterns
 * This shows how to track various user interactions in your app
 */
export default function MixpanelTrackingExample() {
  const { track, identify, setProperties } = useMixpanel();
  const { user } = useAuth();

  // Example: Track button clicks
  const handlePlaceAdded = (placeData: any) => {
    track('Place Added', {
      place_id: placeData.google_place_id,
      place_name: placeData.name,
      place_type: placeData.types?.[0],
      list_id: placeData.listId,
      source: 'search_results', // or 'manual_entry', 'import', etc.
      user_id: user?.id
    });
  };

  // Example: Track list creation
  const handleListCreated = (listData: any) => {
    track('List Created', {
      list_id: listData.id,
      list_name: listData.name,
      is_public: listData.is_public,
      city: listData.city,
      tags: listData.tags,
      user_id: user?.id
    });
  };

  // Example: Track search behavior
  const handleSearch = (searchTerm: string, filters: any) => {
    track('Search Performed', {
      search_term: searchTerm,
      filters_applied: Object.keys(filters).length,
      location: filters.location,
      place_type: filters.type,
      user_id: user?.id
    });
  };

  // Example: Track sharing
  const handleListShared = (listId: string, method: string) => {
    track('List Shared', {
      list_id: listId,
      share_method: method, // 'link', 'social', 'email'
      user_id: user?.id
    });
  };

  // Example: Track profile updates
  const handleProfileUpdated = (updatedFields: string[]) => {
    track('Profile Updated', {
      fields_updated: updatedFields,
      user_id: user?.id
    });

    // Update user properties in Mixpanel
    if (user) {
      setProperties({
        last_profile_update: new Date().toISOString(),
        profile_completion: calculateProfileCompletion(user)
      });
    }
  };

  // Example: Track feature usage
  const handleFeatureUsed = (featureName: string, context?: any) => {
    track('Feature Used', {
      feature_name: featureName,
      context: context,
      user_id: user?.id,
      timestamp: new Date().toISOString()
    });
  };

  // Helper function to calculate profile completion
  const calculateProfileCompletion = (user: any) => {
    const fields = ['displayName', 'bio', 'photo_url', 'instagram', 'tiktok'];
    const completedFields = fields.filter(field => user[field] && user[field].trim() !== '');
    return Math.round((completedFields.length / fields.length) * 100);
  };

  return (
    <div className="p-6 bg-gray-800 rounded-lg">
      <h3 className="text-lg font-semibold text-white mb-4">
        Mixpanel Tracking Examples
      </h3>
      
      <div className="space-y-4">
        <button
          onClick={() => handlePlaceAdded({
            google_place_id: 'example_place_123',
            name: 'Example Restaurant',
            types: ['restaurant'],
            listId: 'list_123'
          })}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Track: Add Place
        </button>

        <button
          onClick={() => handleListCreated({
            id: 'list_456',
            name: 'My Favorite Spots',
            is_public: true,
            city: 'San Francisco',
            tags: ['restaurants', 'cafes']
          })}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Track: Create List
        </button>

        <button
          onClick={() => handleSearch('pizza', { location: 'NYC', type: 'restaurant' })}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
        >
          Track: Search
        </button>

        <button
          onClick={() => handleListShared('list_123', 'link')}
          className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
        >
          Track: Share List
        </button>

        <button
          onClick={() => handleFeatureUsed('near_me_search', { radius: '5km' })}
          className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700"
        >
          Track: Feature Usage
        </button>
      </div>

      <div className="mt-6 p-4 bg-gray-700 rounded">
        <h4 className="text-sm font-medium text-gray-300 mb-2">
          Current User Properties:
        </h4>
        <pre className="text-xs text-gray-400 overflow-auto">
          {JSON.stringify({
            user_id: user?.id,
            email: user?.email,
            name: user?.displayName,
            is_admin: user?.is_admin,
            created_at: user?.created_at
          }, null, 2)}
        </pre>
      </div>
    </div>
  );
} 