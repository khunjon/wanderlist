import { User as SupabaseUser } from '@supabase/supabase-js';
import { User as AppUser } from '@/lib/supabase';
import { User } from '@/types';
import { addCacheBuster } from '@/lib/utils/imageUtils';

/**
 * Converts Supabase user and profile data to clean User format
 */
export function convertToUser(supabaseUser: SupabaseUser, profile: AppUser): User {
  const photoUrl = addCacheBuster(profile.photo_url);
  
  return {
    id: profile.id,
    email: supabaseUser.email!,
    displayName: profile.display_name || '',
    createdAt: new Date(profile.created_at || supabaseUser.created_at),
    photo_url: photoUrl,
    is_admin: profile.is_admin,
    bio: profile.bio,
    instagram: profile.instagram,
    tiktok: profile.tiktok,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
  };
} 