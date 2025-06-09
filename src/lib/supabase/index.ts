// Main Supabase client exports (client-side only)
export { supabase } from './client'
export * from './client'

// Auth functions (client-side)
export {
  signUp,
  signIn,
  signInWithGoogle,
  signOut,
  getCurrentUser,
  getCurrentSession,
  createUserProfile,
  updateUserProfile,
  updateUserProfileLegacy,
  uploadProfilePhoto,
  updateProfilePhoto,
  deleteProfilePhoto,
  validateProfileCompleteness,
  updateUserActivity,
  resetPassword,
  updatePassword,
  onAuthStateChange,
  isUserAdmin,
  syncUserProfile,
  getEnhancedUserProfile
} from './auth'

// Export auth types
export type { AuthState } from './auth'

// Database functions (client-side)
export {
  getUserLists,
  getPublicLists,
  getListById,
  createList,
  updateList,
  deleteList,
  getListPlaces,
  addPlaceToList,
  removePlaceFromList,
  updateListPlaceNotes,
  getPlaceByGoogleId,
  createPlace,
  updatePlace,
  upsertPlace,
  searchLists,
  searchUserLists,
  getListStats,
  incrementListViewCount,
  toggleListLike,
  isPlaceInList,
  getUserProfile
} from './database'

// Re-export types for convenience
export type { Database } from '@/types/supabase'

// Note: Server-side functions are exported separately from './server'
// Import directly from './server' for server components 