import { User as SupabaseUser } from '@supabase/supabase-js';
import { User as AppUser, List as SupabaseList, Place as SupabasePlace } from '@/lib/supabase';
import { User as LegacyUser, List as LegacyList, Place as LegacyPlace } from '@/types';

/**
 * Converts Supabase user and profile data to legacy User format
 * Provides both naming conventions for backward compatibility
 */
export function convertToLegacyUser(supabaseUser: SupabaseUser, profile: AppUser): LegacyUser {
  return {
    // Both naming conventions for compatibility
    uid: supabaseUser.id,
    id: profile.id,
    email: supabaseUser.email!,
    displayName: profile.display_name || '',
    display_name: profile.display_name,
    createdAt: new Date(profile.created_at || supabaseUser.created_at),
    created_at: profile.created_at,
    updated_at: profile.updated_at,
    photoURL: profile.photo_url,
    photo_url: profile.photo_url,
    isAdmin: profile.is_admin,
    is_admin: profile.is_admin,
    bio: profile.bio,
    instagram: profile.instagram,
    tiktok: profile.tiktok,
  } as LegacyUser;
}

/**
 * Gets user ID from either naming convention
 */
export function getUserId(user: LegacyUser): string {
  return user.uid || user.id || '';
}

/**
 * Gets display name from either naming convention
 */
export function getDisplayName(user: LegacyUser): string {
  return user.displayName || user.display_name || '';
}

/**
 * Gets photo URL from either naming convention
 */
export function getPhotoURL(user: LegacyUser): string | null {
  return user.photoURL || user.photo_url || null;
}

/**
 * Gets admin status from either naming convention
 */
export function getIsAdmin(user: LegacyUser): boolean {
  return user.isAdmin || user.is_admin || false;
}

/**
 * Gets created date from either naming convention
 */
export function getCreatedAt(user: LegacyUser): Date {
  if (user.createdAt instanceof Date) {
    return user.createdAt;
  }
  return new Date(user.created_at || Date.now());
}

/**
 * Type guard to check if user has legacy properties
 */
export function hasLegacyProperties(user: any): user is LegacyUser {
  return user && (user.uid || user.displayName || user.photoURL || user.isAdmin !== undefined);
}

/**
 * Type guard to check if user has Supabase properties
 */
export function hasSupabaseProperties(user: any): user is AppUser {
  return user && (user.display_name !== undefined || user.photo_url !== undefined || user.is_admin !== undefined);
}

// List conversion utilities

/**
 * Converts Supabase list to legacy List format
 */
export function convertToLegacyList(supabaseList: SupabaseList): LegacyList {
  return {
    ...supabaseList,
    // Both naming conventions for compatibility
    userId: supabaseList.user_id,
    user_id: supabaseList.user_id,
    isPublic: supabaseList.is_public || false,
    is_public: supabaseList.is_public,
    createdAt: new Date(supabaseList.created_at || Date.now()),
    updatedAt: new Date(supabaseList.updated_at || Date.now()),
    created_at: supabaseList.created_at,
    updated_at: supabaseList.updated_at,
    viewCount: supabaseList.view_count || 0,
    view_count: supabaseList.view_count,
  } as LegacyList;
}

/**
 * Gets user ID from list (either naming convention)
 */
export function getListUserId(list: LegacyList): string {
  return list.userId || list.user_id || '';
}

/**
 * Gets public status from list (either naming convention)
 */
export function getListIsPublic(list: LegacyList): boolean {
  return list.isPublic || list.is_public || false;
}

/**
 * Gets view count from list (either naming convention)
 */
export function getListViewCount(list: LegacyList): number {
  return list.viewCount || list.view_count || 0;
}

/**
 * Converts legacy list data for Supabase insert
 */
export function convertToSupabaseListInsert(legacyData: any): any {
  return {
    user_id: legacyData.userId || legacyData.user_id,
    name: legacyData.name,
    description: legacyData.description,
    city: legacyData.city,
    tags: legacyData.tags,
    is_public: legacyData.isPublic || legacyData.is_public,
  };
}

// Place conversion utilities

/**
 * Converts legacy place data for Supabase insert
 */
export function convertToSupabasePlaceInsert(legacyData: any): any {
  return {
    google_place_id: legacyData.googlePlaceId || legacyData.google_place_id,
    name: legacyData.name,
    address: legacyData.address,
    latitude: legacyData.latitude,
    longitude: legacyData.longitude,
    rating: legacyData.rating,
    photo_url: legacyData.photoUrl || legacyData.photo_url,
    place_types: legacyData.placeTypes || legacyData.place_types,
  };
}

/**
 * Converts Supabase place to legacy Place format
 */
export function convertToLegacyPlace(supabasePlace: SupabasePlace): LegacyPlace {
  return {
    ...supabasePlace,
    // Both naming conventions for compatibility
    googlePlaceId: supabasePlace.google_place_id,
    google_place_id: supabasePlace.google_place_id,
    photoUrl: supabasePlace.photo_url || '',
    photo_url: supabasePlace.photo_url,
    placeTypes: supabasePlace.place_types || [],
    place_types: supabasePlace.place_types,
  } as LegacyPlace;
} 