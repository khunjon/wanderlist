import { createClient } from '@supabase/supabase-js';

// Types for the check-in function
export interface CreateCheckinParams {
  place_id: string;
  notes?: string;
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
        place_id: params.place_id,
        checked_in_at: checkedInAtISO,
        day_of_week: dayOfWeek,
        time_of_day: timeOfDay,
        notes: params.notes || '',
        privacy_level: 'private', // Default to private for MVP
        latitude: 0, // Placeholder - will be updated later
        longitude: 0, // Placeholder - will be updated later
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
 * Helper function to get user's recent check-ins
 * Useful for displaying check-in history
 */
export async function getUserCheckins(
  supabase: ReturnType<typeof createClient>,
  limit: number = 10
): Promise<{ data: CheckinRecord[] | null; error: string | null }> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        data: null,
        error: 'User not authenticated'
      };
    }

    const { data, error } = await supabase
      .from('checkins')
      .select('*')
      .eq('user_id', user.id)
      .order('checked_in_at', { ascending: false })
      .limit(limit);

    if (error) {
      return {
        data: null,
        error: error.message
      };
    }

    return {
      data: data as unknown as CheckinRecord[],
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