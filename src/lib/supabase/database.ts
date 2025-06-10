import { supabase } from './client'
import { 
  List, 
  Place, 
  ListPlace, 
  ListInsert, 
  PlaceInsert, 
  ListPlaceInsert,
  ListUpdate,
  PlaceUpdate,
  ListPlaceUpdate,
  GetUserListsWithCountsReturn
} from './client'

// Enhanced error handling
class DatabaseError extends Error {
  constructor(message: string, public code?: string, public details?: any) {
    super(message)
    this.name = 'DatabaseError'
  }
}

function handleDatabaseError(error: any, operation: string): never {
  console.error(`Database error in ${operation}:`, error)
  
  if (error.code === 'PGRST116') {
    throw new DatabaseError('Record not found', error.code, error)
  }
  
  if (error.code === '23505') {
    throw new DatabaseError('Duplicate record', error.code, error)
  }
  
  if (error.code === '23503') {
    throw new DatabaseError('Referenced record not found', error.code, error)
  }
  
  if (error.code === '42501') {
    throw new DatabaseError('Permission denied', error.code, error)
  }
  
  throw new DatabaseError(error.message || 'Database operation failed', error.code, error)
}

// =============================================
// ENHANCED USER LISTS OPERATIONS
// =============================================

export async function getUserLists(userId: string): Promise<List[]> {
  try {
    // Note: Ensure database has index on (user_id, updated_at) for optimal performance
    const { data, error } = await supabase
      .from('lists')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) {
      handleDatabaseError(error, 'getUserLists')
    }

    return data || []
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error, 'getUserLists')
  }
}

export async function getUserListsWithCounts(userId: string): Promise<GetUserListsWithCountsReturn[]> {
  try {
    const { data, error } = await supabase
      .rpc('get_user_lists_with_counts', { user_uuid: userId })

    if (error) {
      handleDatabaseError(error, 'getUserListsWithCounts')
    }

    return data || []
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error, 'getUserListsWithCounts')
  }
}

export async function getEnhancedUserLists(userId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .rpc('get_enhanced_user_lists', { user_uuid: userId })

    if (error) {
      handleDatabaseError(error, 'getEnhancedUserLists')
    }

    return data || []
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error, 'getEnhancedUserLists')
  }
}

// =============================================
// ENHANCED PUBLIC LISTS DISCOVERY
// =============================================

export async function getPublicLists(
  limit = 20, 
  offset = 0,
  category?: string,
  searchQuery?: string,
  sortBy: string = 'view_count',
  sortDirection: 'asc' | 'desc' = 'desc'
): Promise<List[]> {
  try {
    let queryBuilder = supabase
      .from('lists')
      .select(`
        *,
        users!inner(display_name, photo_url)
      `)
      .eq('is_public', true)

    if (category) {
      queryBuilder = queryBuilder.eq('category', category)
    }

    if (searchQuery) {
      queryBuilder = queryBuilder.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%`)
    }

    const { data, error } = await queryBuilder
      .order(sortBy, { ascending: sortDirection === 'asc' })
      .range(offset, offset + limit - 1)

    if (error) {
      handleDatabaseError(error, 'getPublicLists')
    }

    return data || []
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error, 'getPublicLists')
  }
}

export async function getPublicListsForDiscovery(
  limit = 20, 
  offset = 0,
  category?: string,
  searchQuery?: string,
  sortBy: string = 'view_count',
  sortDirection: 'asc' | 'desc' = 'desc'
): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .rpc('get_public_lists_for_discovery', {
        limit_count: limit,
        offset_count: offset,
        category_filter: category,
        search_query: searchQuery,
        sort_by: sortBy,
        sort_direction: sortDirection
      })

    if (error) {
      handleDatabaseError(error, 'getPublicListsForDiscovery')
    }

    return data || []
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error, 'getPublicListsForDiscovery')
  }
}

export async function getTrendingPublicLists(limit = 10): Promise<List[]> {
  try {
    const { data, error } = await supabase
      .from('lists')
      .select(`
        *,
        users!inner(display_name, photo_url)
      `)
      .eq('is_public', true)
      .order('view_count', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      handleDatabaseError(error, 'getTrendingPublicLists')
    }

    return data || []
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error, 'getTrendingPublicLists')
  }
}

export async function getFeaturedPublicLists(limit = 5): Promise<List[]> {
  try {
    const { data, error } = await supabase
      .from('lists')
      .select(`
        *,
        users!inner(display_name, photo_url)
      `)
      .eq('is_public', true)
      .eq('is_featured', true)
      .order('view_count', { ascending: false })
      .limit(limit)

    if (error) {
      handleDatabaseError(error, 'getFeaturedPublicLists')
    }

    return data || []
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error, 'getFeaturedPublicLists')
  }
}

export async function searchPublicListsAdvanced(
  query: string,
  limit = 20,
  offset = 0,
  category?: string
): Promise<List[]> {
  try {
    let queryBuilder = supabase
      .from('lists')
      .select(`
        *,
        users!inner(display_name, photo_url)
      `)
      .eq('is_public', true)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,city.ilike.%${query}%`)

    if (category) {
      queryBuilder = queryBuilder.eq('category', category)
    }

    const { data, error } = await queryBuilder
      .order('view_count', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      handleDatabaseError(error, 'searchPublicListsAdvanced')
    }

    return data || []
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error, 'searchPublicListsAdvanced')
  }
}

// =============================================
// ENHANCED LIST OPERATIONS
// =============================================

export async function getListById(listId: string): Promise<List | null> {
  console.log('🔍 getListById starting for:', listId);
  
  try {
    // Add a reasonable timeout to prevent infinite hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        console.log('⏰ Query timeout after 30 seconds for:', listId);
        reject(new Error('Query timeout'));
      }, 30000); // 30 seconds - much more reasonable
    });

    // First, get the list data without user join to avoid RLS issues
    console.log('📡 Starting list query for:', listId);
    const queryPromise = supabase
      .from('lists')
      .select('*')
      .eq('id', listId)
      .single();

    const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;
    console.log('📊 List query completed for:', listId, 'Success:', !!data, 'Error:', !!error);

    if (error && error.code === 'PGRST116') {
      console.log('📭 List not found (PGRST116):', listId);
      return null; // List not found
    }

    if (error) {
      console.error('❌ List query error:', error);
      handleDatabaseError(error, 'getListById')
    }

    // If we found a list, fetch the user data separately
    if (data) {
      console.log('✅ List found, fetching user data for user_id:', data.user_id);
      try {
        const { data: userData } = await supabase
          .from('users')
          .select('display_name, photo_url')
          .eq('id', data.user_id)
          .single();
        
        if (userData) {
          (data as any).users = userData;
          console.log('👤 User data attached:', userData.display_name);
        } else {
          console.log('👤 No user data found for:', data.user_id);
        }
      } catch (userError) {
        // If user fetch fails, continue without user data
        console.warn('⚠️ Failed to fetch user data for list:', userError);
      }
    }

    console.log('🏁 getListById completed for:', listId);
    return data;
  } catch (error) {
    console.error('💥 Exception in getListById:', error);
    if (error instanceof DatabaseError) throw error
    if (error instanceof Error && error.message === 'Query timeout') {
      console.error('⏰ getListById timed out for:', listId);
      return null; // Treat timeout as "not found"
    }
    handleDatabaseError(error, 'getListById')
  }
}

export async function getListWithPlaces(listId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .rpc('get_list_with_places', { list_uuid: listId })

    if (error) {
      handleDatabaseError(error, 'getListWithPlaces')
    }

    return data || []
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error, 'getListWithPlaces')
  }
}

export async function createList(list: ListInsert): Promise<List> {
  try {
    const { data, error } = await supabase
      .from('lists')
      .insert(list)
      .select()

    if (error) {
      handleDatabaseError(error, 'createList')
    }

    if (!data || data.length === 0) {
      throw new DatabaseError('No data returned from insert operation', 'INSERT_FAILED')
    }
    return data[0]
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error, 'createList')
  }
}

export async function updateList(listId: string, updates: ListUpdate): Promise<List> {
  try {
    const { data, error } = await supabase
      .from('lists')
      .update(updates)
      .eq('id', listId)
      .select()

    if (error) {
      handleDatabaseError(error, 'updateList')
    }

    if (!data || data.length === 0) {
      throw new DatabaseError('No data returned from update operation', 'UPDATE_FAILED')
    }
    return data[0]
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error, 'updateList')
  }
}

export async function deleteList(listId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('lists')
      .delete()
      .eq('id', listId)

    if (error) {
      handleDatabaseError(error, 'deleteList')
    }
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error, 'deleteList')
  }
}

export async function incrementListViewCount(listId: string): Promise<void> {
  try {
    const { error } = await supabase
      .rpc('increment_list_view_count', { list_uuid: listId })

    if (error) {
      handleDatabaseError(error, 'incrementListViewCount')
    }
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error, 'incrementListViewCount')
  }
}

export async function toggleListLike(listId: string, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .rpc('toggle_list_like', { list_uuid: listId, user_uuid: userId })

    if (error) {
      handleDatabaseError(error, 'toggleListLike')
    }

    return data || false
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error, 'toggleListLike')
  }
}

// =============================================
// ENHANCED PLACES OPERATIONS
// =============================================

export async function getPlaceByGoogleId(googlePlaceId: string): Promise<Place | null> {
  try {
    const { data, error } = await supabase
      .from('places')
      .select('*')
      .eq('google_place_id', googlePlaceId)
      .limit(1)

    if (error) {
      handleDatabaseError(error, 'getPlaceByGoogleId')
    }

    // Return the first result if any exist, otherwise null
    return data && data.length > 0 ? data[0] : null
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error, 'getPlaceByGoogleId')
  }
}

export async function createPlace(place: PlaceInsert): Promise<Place> {
  try {
    const { data, error } = await supabase
      .from('places')
      .insert({
        ...place,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()

    if (error) {
      handleDatabaseError(error, 'createPlace')
    }

    if (!data || data.length === 0) {
      throw new DatabaseError('No data returned from insert operation', 'INSERT_FAILED')
    }
    return data[0]
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error, 'createPlace')
  }
}

export async function updatePlace(placeId: string, updates: PlaceUpdate): Promise<Place> {
  try {
    const { data, error } = await supabase
      .from('places')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', placeId)
      .select()

    if (error) {
      handleDatabaseError(error, 'updatePlace')
    }

    if (!data || data.length === 0) {
      throw new DatabaseError('No data returned from update operation', 'UPDATE_FAILED')
    }
    return data[0]
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error, 'updatePlace')
  }
}

export async function upsertPlace(place: PlaceInsert): Promise<Place> {
  try {
    // First try to find existing place by Google Place ID
    const existingPlace = await getPlaceByGoogleId(place.google_place_id)
    
    if (existingPlace) {
      // If place exists, just return it without updating
      // This avoids potential issues with updating existing places
      return existingPlace
    } else {
      // Create new place
      return await createPlace(place)
    }
  } catch (error) {
    // If there's an error (like duplicate key), try to get the existing place again
    if (error instanceof Error && error.message.includes('duplicate')) {
      const existingPlace = await getPlaceByGoogleId(place.google_place_id)
      if (existingPlace) {
        return existingPlace
      }
    }
    throw error
  }
}

export async function upsertPlaceEnhanced(
  googleId: string,
  placeName: string,
  placeAddress: string,
  placeLatitude: number,
  placeLongitude: number,
  placeRating?: number,
  placePhotoUrl?: string,
  placeTypes?: string[],
  placePhone?: string,
  placeWebsite?: string,
  placePriceLevel?: number,
  placeOpeningHours?: any,
  placeReviewsCount?: number,
  placePhotos?: any,
  placeBusinessStatus?: string
): Promise<string> {
  try {
    const { data, error } = await supabase
      .rpc('upsert_place_enhanced', {
        google_id: googleId,
        place_name: placeName,
        place_address: placeAddress,
        place_latitude: placeLatitude,
        place_longitude: placeLongitude,
        place_rating: placeRating,
        place_photo_url: placePhotoUrl,
        place_types: placeTypes,
        place_phone: placePhone,
        place_website: placeWebsite,
        place_price_level: placePriceLevel,
        place_opening_hours: placeOpeningHours,
        place_reviews_count: placeReviewsCount,
        place_photos: placePhotos,
        place_business_status: placeBusinessStatus
      })

    if (error) {
      handleDatabaseError(error, 'upsertPlaceEnhanced')
    }

    return data
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error, 'upsertPlaceEnhanced')
  }
}

export async function searchPlacesEnhanced(
  searchQuery: string,
  limit = 20,
  latitudeCenter?: number,
  longitudeCenter?: number,
  radiusKm = 50
): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .rpc('search_places_enhanced', {
        search_query: searchQuery,
        limit_count: limit,
        latitude_center: latitudeCenter,
        longitude_center: longitudeCenter,
        radius_km: radiusKm
      })

    if (error) {
      handleDatabaseError(error, 'searchPlacesEnhanced')
    }

    return data || []
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error, 'searchPlacesEnhanced')
  }
}

// =============================================
// LIST-PLACE OPERATIONS
// =============================================

export async function getListPlaces(listId: string): Promise<(ListPlace & { places: Place })[]> {
  try {
    const { data, error } = await supabase
      .from('list_places')
      .select(`
        *,
        places(*)
      `)
      .eq('list_id', listId)
      .order('order_index', { ascending: true })

    if (error) {
      handleDatabaseError(error, 'getListPlaces')
    }

    return data || []
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error, 'getListPlaces')
  }
}

export async function addPlaceToList(listPlace: ListPlaceInsert): Promise<ListPlace> {
  try {
    const { data, error } = await supabase
      .from('list_places')
      .insert({
        ...listPlace,
        added_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()

    if (error) {
      handleDatabaseError(error, 'addPlaceToList')
    }

    // Return the first inserted record
    if (!data || data.length === 0) {
      throw new DatabaseError('No data returned from insert operation', 'INSERT_FAILED')
    }
    return data[0]
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error, 'addPlaceToList')
  }
}

export async function addPlaceToListOptimized(
  listId: string,
  placeId: string,
  userId: string,
  notes?: string,
  orderIndex?: number,
  tags?: string[]
): Promise<any> {
  try {
    const { data, error } = await supabase
      .rpc('add_place_to_list_optimized', {
        p_list_id: listId,
        p_place_id: placeId,
        p_user_id: userId,
        p_notes: notes,
        p_order_index: orderIndex,
        p_tags: tags
      })

    if (error) {
      handleDatabaseError(error, 'addPlaceToListOptimized')
    }

    return data
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error, 'addPlaceToListOptimized')
  }
}

export async function removePlaceFromList(listId: string, placeId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('list_places')
      .delete()
      .eq('list_id', listId)
      .eq('place_id', placeId)

    if (error) {
      handleDatabaseError(error, 'removePlaceFromList')
    }
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error, 'removePlaceFromList')
  }
}

export async function removePlaceFromListOptimized(
  listId: string,
  placeId: string,
  userId: string
): Promise<any> {
  try {
    const { data, error } = await supabase
      .rpc('remove_place_from_list_optimized', {
        p_list_id: listId,
        p_place_id: placeId,
        p_user_id: userId
      })

    if (error) {
      handleDatabaseError(error, 'removePlaceFromListOptimized')
    }

    return data
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error, 'removePlaceFromListOptimized')
  }
}

export async function updateListPlaceNotes(
  listId: string, 
  placeId: string, 
  notes: string
): Promise<ListPlace> {
  try {
    const { data, error } = await supabase
      .from('list_places')
      .update({ 
        notes,
        updated_at: new Date().toISOString()
      })
      .eq('list_id', listId)
      .eq('place_id', placeId)
      .select()

    if (error) {
      handleDatabaseError(error, 'updateListPlaceNotes')
    }

    if (!data || data.length === 0) {
      throw new DatabaseError('No data returned from update operation', 'UPDATE_FAILED')
    }
    return data[0]
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error, 'updateListPlaceNotes')
  }
}

export async function isPlaceInList(listId: string, placeId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('list_places')
      .select('id')
      .eq('list_id', listId)
      .eq('place_id', placeId)
      .limit(1)

    if (error) {
      handleDatabaseError(error, 'isPlaceInList')
    }

    return data && data.length > 0
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error, 'isPlaceInList')
  }
}

// =============================================
// ANALYTICS AND STATISTICS
// =============================================

export async function getListStats(listId: string) {
  try {
    const { data: listData, error: listError } = await supabase
      .from('lists')
      .select('view_count')
      .eq('id', listId)
      .limit(1)

    if (listError) {
      handleDatabaseError(listError, 'getListStats')
    }

    const { count: placeCount, error: countError } = await supabase
      .from('list_places')
      .select('*', { count: 'exact', head: true })
      .eq('list_id', listId)

    if (countError) {
      handleDatabaseError(countError, 'getListStats')
    }

    const viewCount = listData && listData.length > 0 ? listData[0].view_count || 0 : 0

    return {
      viewCount,
      placeCount: placeCount || 0,
    }
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error, 'getListStats')
  }
}

export async function getListStatistics(listId: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .rpc('get_list_statistics', { list_uuid: listId })

    if (error) {
      handleDatabaseError(error, 'getListStatistics')
    }

    return data
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error, 'getListStatistics')
  }
}

// =============================================
// SEARCH OPERATIONS
// =============================================

export async function searchLists(query: string, limit = 10): Promise<List[]> {
  try {
    const { data, error } = await supabase
      .from('lists')
      .select(`
        *,
        users!inner(display_name, photo_url)
      `)
      .eq('is_public', true)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,city.ilike.%${query}%`)
      .order('view_count', { ascending: false })
      .limit(limit)

    if (error) {
      handleDatabaseError(error, 'searchLists')
    }

    return data || []
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error, 'searchLists')
  }
}

export async function searchUserLists(userId: string, query: string, limit = 10): Promise<List[]> {
  try {
    const { data, error } = await supabase
      .from('lists')
      .select('*')
      .eq('user_id', userId)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,city.ilike.%${query}%`)
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (error) {
      handleDatabaseError(error, 'searchUserLists')
    }

    return data || []
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error, 'searchUserLists')
  }
}

// =============================================
// USER PROFILE OPERATIONS
// =============================================

export async function getUserProfile(userId: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .limit(1)

    if (error) {
      handleDatabaseError(error, 'getUserProfile')
    }

    return data && data.length > 0 ? data[0] : null
  } catch (error) {
    if (error instanceof DatabaseError) throw error
    handleDatabaseError(error, 'getUserProfile')
  }
}

// Export the error class for use in components
export { DatabaseError } 