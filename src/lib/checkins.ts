import { createClient } from '@supabase/supabase-js';
import { upsertPlace } from '@/lib/supabase/database';
import { GooglePlace } from '@/types';

// Types for the check-in function
export interface CreateCheckinParams {
  place_id: string;
  notes?: string;
  googlePlace?: GooglePlace; // Optional Google Place data for storing in database
}

export interface CheckinRecord {
  id: string;
  user_id: string;
  place_id: string;
  checked_in_at: string;
  notes: string;
  day_of_week: number;
  time_of_day: string;
  privacy_level: 'public' | 'private' | 'friends';
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at: string;
}

// Enhanced checkin record with place details
export interface CheckinWithPlace extends CheckinRecord {
  place?: {
    id: string;
    name: string;
    address: string;
    google_place_id: string;
    rating: number;
    photo_url: string;
    place_types: string[];
  };
}

export interface CreateCheckinResult {
  data: CheckinRecord | null;
  error: string | null;
}

export interface DeleteCheckinResult {
  success: boolean;
  error: string | null;
}

/**
 * Creates a new check-in record with minimal required input
 * Automatically handles user authentication and required field defaults
 * If googlePlace data is provided, stores the place in the places table for consistency
 */
export async function createCheckin(
  supabase: ReturnType<typeof createClient>,
  params: CreateCheckinParams
): Promise<CreateCheckinResult> {
  try {
    // Get current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        data: null,
        error: 'User not authenticated'
      };
    }

    let finalPlaceId = params.place_id;

    // If Google Place data is provided, store it in the places table
    if (params.googlePlace) {
      try {
        const placeData = {
          google_place_id: params.googlePlace.place_id,
          name: params.googlePlace.name,
          address: params.googlePlace.formatted_address,
          latitude: params.googlePlace.geometry.location.lat,
          longitude: params.googlePlace.geometry.location.lng,
          rating: params.googlePlace.rating || 0,
          photo_url: params.googlePlace.photos && params.googlePlace.photos.length > 0 
            ? `/api/places/photo?photoReference=${params.googlePlace.photos[0].photo_reference}&maxWidth=400`
            : '',
          place_types: params.googlePlace.types || [],
        };

        const createdPlace = await upsertPlace(placeData);
        finalPlaceId = createdPlace.id; // Use the database place ID instead of Google Place ID
      } catch (placeError) {
        console.warn('Failed to store place data, using Google Place ID:', placeError);
        // Continue with original place_id if place storage fails
      }
    }

    // Create timestamp for check-in
    const checkedInAt = new Date();
    const checkedInAtISO = checkedInAt.toISOString();

    // Auto-calculate time-based fields
    const dayOfWeek = checkedInAt.getDay(); // 0 = Sunday, 6 = Saturday
    const timeOfDay = checkedInAt.toTimeString().split(' ')[0]; // HH:MM:SS format

    // Insert check-in record
    const { data, error } = await supabase
      .from('checkins')
      .insert({
        user_id: user.id,
        place_id: finalPlaceId, // Use either database place ID or Google Place ID
        checked_in_at: checkedInAtISO,
        day_of_week: dayOfWeek,
        time_of_day: timeOfDay,
        notes: params.notes || '',
        privacy_level: 'private', // Default to private for MVP
        latitude: params.googlePlace?.geometry.location.lat || 0,
        longitude: params.googlePlace?.geometry.location.lng || 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating check-in:', error);
      return {
        data: null,
        error: error.message
      };
    }

    return {
      data: data as unknown as CheckinRecord,
      error: null
    };

  } catch (err) {
    console.error('Unexpected error creating check-in:', err);
    return {
      data: null,
      error: err instanceof Error ? err.message : 'An unexpected error occurred'
    };
  }
}

/**
 * Helper function to get user's recent check-ins with place details
 * Joins with places table to get place names and other details
 */
export async function getUserCheckins(
  supabase: ReturnType<typeof createClient>,
  limit: number = 10
): Promise<{ data: CheckinWithPlace[] | null; error: string | null }> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        data: null,
        error: 'User not authenticated'
      };
    }

    // First get the check-ins
    const { data: checkins, error: checkinsError } = await supabase
      .from('checkins')
      .select('*')
      .eq('user_id', user.id)
      .order('checked_in_at', { ascending: false })
      .limit(limit);

    if (checkinsError) {
      return {
        data: null,
        error: checkinsError.message
      };
    }

    if (!checkins || checkins.length === 0) {
      return {
        data: [],
        error: null
      };
    }

    // Get unique place IDs from check-ins
    const placeIds = [...new Set(checkins.map(c => c.place_id))];
    
    // Fetch place details for these IDs
    const { data: places, error: placesError } = await supabase
      .from('places')
      .select('id, name, address, google_place_id, rating, photo_url, place_types')
      .in('id', placeIds);

    if (placesError) {
      console.warn('Error fetching place details:', placesError);
      // Continue without place details if there's an error
    }

    // Create a map of place ID to place data for quick lookup
    const placesMap = new Map();
    if (places) {
      places.forEach(place => {
        placesMap.set(place.id, place);
      });
    }

    // Combine check-ins with place details
    const transformedData: CheckinWithPlace[] = checkins.map(checkin => ({
      ...(checkin as unknown as CheckinRecord),
      place: placesMap.get(checkin.place_id) || undefined
    }));

    return {
      data: transformedData,
      error: null
    };

  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'An unexpected error occurred'
    };
  }
}

/**
 * Deletes a check-in record
 * Only allows users to delete their own check-ins
 */
export async function deleteCheckin(
  supabase: ReturnType<typeof createClient>,
  checkinId: string
): Promise<DeleteCheckinResult> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    // First verify the check-in belongs to the current user
    const { data: checkin, error: fetchError } = await supabase
      .from('checkins')
      .select('user_id')
      .eq('id', checkinId)
      .single();

    if (fetchError) {
      return {
        success: false,
        error: 'Check-in not found'
      };
    }

    if (checkin.user_id !== user.id) {
      return {
        success: false,
        error: 'You can only delete your own check-ins'
      };
    }

    // Delete the check-in
    const { error: deleteError } = await supabase
      .from('checkins')
      .delete()
      .eq('id', checkinId)
      .eq('user_id', user.id); // Extra safety check

    if (deleteError) {
      return {
        success: false,
        error: deleteError.message
      };
    }

    return {
      success: true,
      error: null
    };

  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An unexpected error occurred'
    };
  }
} 