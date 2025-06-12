import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}

if (!supabaseAnonKey) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Enhanced session persistence settings
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'sb-auth-token',
    // Debug mode for development
    debug: process.env.NODE_ENV === 'development'
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Export the types for use throughout the app
export type { Database } from '@/types/supabase'
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Type aliases for easier use
export type User = Tables<'users'>
export type List = Tables<'lists'>
export type Place = Tables<'places'>
export type ListPlace = Tables<'list_places'>

// Insert types
export type UserInsert = TablesInsert<'users'>
export type ListInsert = TablesInsert<'lists'>
export type PlaceInsert = TablesInsert<'places'>
export type ListPlaceInsert = TablesInsert<'list_places'>

// Update types
export type UserUpdate = TablesUpdate<'users'>
export type ListUpdate = TablesUpdate<'lists'>
export type PlaceUpdate = TablesUpdate<'places'>
export type ListPlaceUpdate = TablesUpdate<'list_places'>

// Database function types
export type GetUserListsWithCountsArgs = Database['public']['Functions']['get_user_lists_with_counts']['Args']
export type GetUserListsWithCountsReturn = Database['public']['Functions']['get_user_lists_with_counts']['Returns'][0] 