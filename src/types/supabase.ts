export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      list_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      list_collaborators: {
        Row: {
          accepted_at: string | null
          id: string
          invited_at: string | null
          invited_by: string | null
          is_active: boolean | null
          list_id: string
          permissions: Json | null
          role: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          list_id: string
          permissions?: Json | null
          role?: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          list_id?: string
          permissions?: Json | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "list_collaborators_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_collaborators_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_collaborators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      list_comments: {
        Row: {
          content: string
          created_at: string | null
          edited_at: string | null
          id: string
          is_edited: boolean | null
          like_count: number | null
          list_id: string
          parent_comment_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          like_count?: number | null
          list_id: string
          parent_comment_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          like_count?: number | null
          list_id?: string
          parent_comment_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "list_comments_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "list_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      list_likes: {
        Row: {
          created_at: string | null
          id: string
          list_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          list_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          list_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "list_likes_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      list_places: {
        Row: {
          added_at: string | null
          id: string
          is_visited: boolean | null
          list_id: string
          metadata: Json | null
          notes: string | null
          order_index: number | null
          place_id: string
          tags: string[] | null
          updated_at: string | null
          user_photos: Json | null
          user_rating: number | null
          visited_at: string | null
        }
        Insert: {
          added_at?: string | null
          id?: string
          is_visited?: boolean | null
          list_id: string
          metadata?: Json | null
          notes?: string | null
          order_index?: number | null
          place_id: string
          tags?: string[] | null
          updated_at?: string | null
          user_photos?: Json | null
          user_rating?: number | null
          visited_at?: string | null
        }
        Update: {
          added_at?: string | null
          id?: string
          is_visited?: boolean | null
          list_id?: string
          metadata?: Json | null
          notes?: string | null
          order_index?: number | null
          place_id?: string
          tags?: string[] | null
          updated_at?: string | null
          user_photos?: Json | null
          user_rating?: number | null
          visited_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "list_places_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_places_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      list_shares: {
        Row: {
          created_at: string | null
          id: string
          ip_address: unknown | null
          list_id: string
          platform: string | null
          share_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          list_id: string
          platform?: string | null
          share_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          list_id?: string
          platform?: string | null
          share_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "list_shares_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_shares_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      lists: {
        Row: {
          category: string | null
          city: string | null
          created_at: string | null
          description: string | null
          difficulty_level: number | null
          estimated_duration_hours: number | null
          featured_image_url: string | null
          id: string
          is_featured: boolean | null
          is_public: boolean | null
          last_activity_at: string | null
          like_count: number | null
          metadata: Json | null
          name: string
          share_count: number | null
          slug: string | null
          tags: string[] | null
          updated_at: string | null
          user_id: string
          view_count: number | null
        }
        Insert: {
          category?: string | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: number | null
          estimated_duration_hours?: number | null
          featured_image_url?: string | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          last_activity_at?: string | null
          like_count?: number | null
          metadata?: Json | null
          name: string
          share_count?: number | null
          slug?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
          view_count?: number | null
        }
        Update: {
          category?: string | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          difficulty_level?: number | null
          estimated_duration_hours?: number | null
          featured_image_url?: string | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          last_activity_at?: string | null
          like_count?: number | null
          metadata?: Json | null
          name?: string
          share_count?: number | null
          slug?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      places: {
        Row: {
          address: string
          business_status: string | null
          created_at: string | null
          google_place_id: string
          id: string
          latitude: number
          longitude: number
          metadata: Json | null
          name: string
          opening_hours: Json | null
          permanently_closed: boolean | null
          phone_number: string | null
          photo_url: string | null
          photos: Json | null
          place_types: string[] | null
          price_level: number | null
          rating: number | null
          reviews_count: number | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          address: string
          business_status?: string | null
          created_at?: string | null
          google_place_id: string
          id?: string
          latitude: number
          longitude: number
          metadata?: Json | null
          name: string
          opening_hours?: Json | null
          permanently_closed?: boolean | null
          phone_number?: string | null
          photo_url?: string | null
          photos?: Json | null
          place_types?: string[] | null
          price_level?: number | null
          rating?: number | null
          reviews_count?: number | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          address?: string
          business_status?: string | null
          created_at?: string | null
          google_place_id?: string
          id?: string
          latitude?: number
          longitude?: number
          metadata?: Json | null
          name?: string
          opening_hours?: Json | null
          permanently_closed?: boolean | null
          phone_number?: string | null
          photo_url?: string | null
          photos?: Json | null
          place_types?: string[] | null
          price_level?: number | null
          rating?: number | null
          reviews_count?: number | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      rls_audit_log: {
        Row: {
          attempted_record_id: string | null
          created_at: string | null
          id: string
          operation: string
          policy_violated: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          attempted_record_id?: string | null
          created_at?: string | null
          id?: string
          operation: string
          policy_violated?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          attempted_record_id?: string | null
          created_at?: string | null
          id?: string
          operation?: string
          policy_violated?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          bio: string | null
          created_at: string | null
          display_name: string | null
          email: string
          email_notifications: boolean | null
          id: string
          instagram: string | null
          is_admin: boolean | null
          language_preference: string | null
          last_active_at: string | null
          metadata: Json | null
          photo_url: string | null
          preferences: Json | null
          profile_completed: boolean | null
          profile_visibility: string | null
          push_notifications: boolean | null
          social_links: Json | null
          tiktok: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          email: string
          email_notifications?: boolean | null
          id: string
          instagram?: string | null
          is_admin?: boolean | null
          language_preference?: string | null
          last_active_at?: string | null
          metadata?: Json | null
          photo_url?: string | null
          preferences?: Json | null
          profile_completed?: boolean | null
          profile_visibility?: string | null
          push_notifications?: boolean | null
          social_links?: Json | null
          tiktok?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string
          email_notifications?: boolean | null
          id?: string
          instagram?: string | null
          is_admin?: boolean | null
          language_preference?: string | null
          last_active_at?: string | null
          metadata?: Json | null
          photo_url?: string | null
          preferences?: Json | null
          profile_completed?: boolean | null
          profile_visibility?: string | null
          push_notifications?: boolean | null
          social_links?: Json | null
          tiktok?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      user_profiles_public: {
        Row: {
          bio: string | null
          created_at: string | null
          display_name: string | null
          id: string | null
          instagram_username: string | null
          last_active_at: string | null
          other_social_links: Json | null
          photo_url: string | null
          profile_completed: boolean | null
          tiktok_username: string | null
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          created_at: string | null
          display_name: string | null
          engagement_score: number | null
          id: string | null
          last_active_at: string | null
          last_list_update: string | null
          photo_url: string | null
          private_lists: number | null
          profile_completed: boolean | null
          profile_visibility: string | null
          public_lists: number | null
          total_lists: number | null
          total_views: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_enhanced_user_profile: {
        Args: { user_uuid: string }
        Returns: {
          id: string
          email: string
          display_name: string
          photo_url: string
          bio: string
          instagram: string
          tiktok: string
          created_at: string
          updated_at: string
          last_active_at: string
          is_admin: boolean
          profile_visibility: string
          profile_completed: boolean
          timezone: string
          language_preference: string
          email_notifications: boolean
          push_notifications: boolean
          social_links: Json
          preferences: Json
          metadata: Json
          total_lists: number
          public_lists: number
          private_lists: number
          total_views: number
          engagement_score: number
        }[]
      }
      get_enhanced_user_lists: {
        Args: { user_uuid: string }
        Returns: {
          id: string
          name: string
          description: string
          city: string
          tags: string[]
          category: string
          is_public: boolean
          is_featured: boolean
          difficulty_level: number
          estimated_duration_hours: number
          featured_image_url: string
          slug: string
          created_at: string
          updated_at: string
          last_activity_at: string
          view_count: number
          like_count: number
          share_count: number
          place_count: number
          author_name: string
          author_photo_url: string
        }[]
      }
      get_public_lists_for_discovery: {
        Args: {
          limit_count?: number
          offset_count?: number
          category_filter?: string
          search_query?: string
          sort_by?: string
          sort_direction?: string
        }
        Returns: {
          id: string
          name: string
          description: string
          city: string
          tags: string[]
          category: string
          difficulty_level: number
          estimated_duration_hours: number
          featured_image_url: string
          slug: string
          created_at: string
          updated_at: string
          last_activity_at: string
          view_count: number
          like_count: number
          share_count: number
          place_count: number
          author_id: string
          author_name: string
          author_photo_url: string
          is_liked_by_user: boolean
        }[]
      }
      get_list_with_places: {
        Args: { list_uuid: string }
        Returns: {
          list_id: string
          list_name: string
          list_description: string
          list_city: string
          list_tags: string[]
          list_category: string
          list_is_public: boolean
          list_is_featured: boolean
          list_difficulty_level: number
          list_estimated_duration_hours: number
          list_featured_image_url: string
          list_slug: string
          list_created_at: string
          list_updated_at: string
          list_last_activity_at: string
          list_view_count: number
          list_like_count: number
          list_share_count: number
          list_user_id: string
          author_name: string
          author_photo_url: string
          place_id: string
          place_google_id: string
          place_name: string
          place_address: string
          place_latitude: number
          place_longitude: number
          place_rating: number
          place_photo_url: string
          place_types: string[]
          place_phone_number: string
          place_website_url: string
          place_price_level: number
          place_opening_hours: Json
          place_business_status: string
          list_place_id: string
          list_place_notes: string
          list_place_added_at: string
          list_place_order_index: number
          list_place_is_visited: boolean
          list_place_visited_at: string
          list_place_user_rating: number
          list_place_user_photos: Json
          list_place_tags: string[]
        }[]
      }
      search_places_enhanced: {
        Args: {
          search_query: string
          limit_count?: number
          latitude_center?: number
          longitude_center?: number
          radius_km?: number
        }
        Returns: {
          id: string
          google_place_id: string
          name: string
          address: string
          latitude: number
          longitude: number
          rating: number
          photo_url: string
          place_types: string[]
          phone_number: string
          website_url: string
          price_level: number
          business_status: string
          distance_km: number
        }[]
      }
      get_list_statistics: {
        Args: { list_uuid: string }
        Returns: {
          total_places: number
          visited_places: number
          average_rating: number
          total_likes: number
          total_shares: number
          total_comments: number
          categories_covered: string[]
          price_levels: number[]
        }[]
      }
      toggle_list_like: {
        Args: { list_uuid: string; user_uuid: string }
        Returns: boolean
      }
      upsert_place_enhanced: {
        Args: {
          google_id: string
          place_name: string
          place_address: string
          place_latitude: number
          place_longitude: number
          place_rating?: number
          place_photo_url?: string
          place_types?: string[]
          place_phone?: string
          place_website?: string
          place_price_level?: number
          place_opening_hours?: Json
          place_reviews_count?: number
          place_photos?: Json
          place_business_status?: string
        }
        Returns: string
      }
      can_view_profile: {
        Args: { profile_user_id: string; viewer_id?: string }
        Returns: boolean
      }
      get_user_lists_with_counts: {
        Args: { user_uuid: string }
        Returns: {
          id: string
          name: string
          description: string
          city: string
          tags: string[]
          is_public: boolean
          created_at: string
          updated_at: string
          view_count: number
          place_count: number
        }[]
      }
      increment_list_view_count: {
        Args: { list_uuid: string }
        Returns: undefined
      }
      is_admin_user: {
        Args: { user_id?: string }
        Returns: boolean
      }
      is_profile_public: {
        Args: { profile_user_id: string }
        Returns: boolean
      }
      add_place_to_list_optimized: {
        Args: {
          p_list_id: string
          p_place_id: string
          p_notes?: string
          p_order_index?: number
          p_tags?: string[]
          p_user_id?: string
        }
        Returns: {
          success: boolean
          message: string
          list_place_id: string
          place_data: Json
          list_data: Json
        }[]
      }
      remove_place_from_list_optimized: {
        Args: { p_list_id: string; p_place_id: string; p_user_id?: string }
        Returns: {
          success: boolean
          message: string
          removed_count: number
        }[]
      }
      check_table_bloat: {
        Args: {}
        Returns: {
          table_name: string
          live_rows: number
          dead_rows: number
          dead_row_percentage: number
          total_size: string
          maintenance_status: string
        }[]
      }
      get_urgent_maintenance_tables: {
        Args: {}
        Returns: {
          table_name: string
          dead_row_percentage: number
          recommended_action: string
          priority: string
        }[]
      }
      get_autovacuum_settings: {
        Args: {}
        Returns: {
          setting_name: string
          current_value: string
          unit: string
          description: string
        }[]
      }
      log_maintenance_operation: {
        Args: {
          p_operation_type: string
          p_table_name?: string
          p_duration_ms?: number
          p_dead_rows_before?: number
          p_dead_rows_after?: number
          p_status?: string
          p_notes?: string
        }
        Returns: undefined
      }
      analyze_index_usage: {
        Args: {}
        Returns: {
          table_name: string
          index_name: string
          index_size: string
          usage_category: string
          scan_count: number
          tuples_read: number
          tuples_fetched: number
          avg_tuples_per_scan: number
          efficiency_ratio: number
          recommendation: string
          priority: string
        }[]
      }
      get_unused_indexes: {
        Args: {}
        Returns: {
          table_name: string
          index_name: string
          index_size: string
          index_definition: string
          space_wasted: string
          drop_command: string
        }[]
      }
      suggest_missing_indexes: {
        Args: {}
        Returns: {
          table_name: string
          suggested_columns: string
          reason: string
          create_command: string
          priority: string
        }[]
      }
      get_index_size_summary: {
        Args: {}
        Returns: {
          table_name: string
          total_indexes: number
          total_index_size: string
          unused_indexes: number
          unused_index_size: string
          efficiency_score: number
        }[]
      }
      record_index_usage_snapshot: {
        Args: {}
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Enhanced type definitions for the new schema
export type EnhancedList = Database['public']['Tables']['lists']['Row'] & {
  place_count?: number
  author_name?: string
  author_photo_url?: string
  is_liked_by_user?: boolean
}

export type EnhancedPlace = Database['public']['Tables']['places']['Row']

export type EnhancedListPlace = Database['public']['Tables']['list_places']['Row']

export type ListCategory = Database['public']['Tables']['list_categories']['Row']

export type ListLike = Database['public']['Tables']['list_likes']['Row']

export type ListShare = Database['public']['Tables']['list_shares']['Row']

export type ListCollaborator = Database['public']['Tables']['list_collaborators']['Row']

export type ListComment = Database['public']['Tables']['list_comments']['Row']

// Function return types
export type EnhancedUserList = Database['public']['Functions']['get_enhanced_user_lists']['Returns'][0]

export type PublicListForDiscovery = Database['public']['Functions']['get_public_lists_for_discovery']['Returns'][0]

export type ListWithPlaces = Database['public']['Functions']['get_list_with_places']['Returns'][0]

export type EnhancedPlaceSearch = Database['public']['Functions']['search_places_enhanced']['Returns'][0]

export type ListStatistics = Database['public']['Functions']['get_list_statistics']['Returns'][0]

// Insert types
export type ListInsert = Database['public']['Tables']['lists']['Insert']
export type PlaceInsert = Database['public']['Tables']['places']['Insert']
export type ListPlaceInsert = Database['public']['Tables']['list_places']['Insert']
export type ListLikeInsert = Database['public']['Tables']['list_likes']['Insert']
export type ListShareInsert = Database['public']['Tables']['list_shares']['Insert']

// Update types
export type ListUpdate = Database['public']['Tables']['lists']['Update']
export type PlaceUpdate = Database['public']['Tables']['places']['Update']
export type ListPlaceUpdate = Database['public']['Tables']['list_places']['Update']

// Legacy compatibility types (for existing code)
export type List = EnhancedList
export type Place = EnhancedPlace
export type PlaceWithNotes = EnhancedListPlace & EnhancedPlace & {
  listPlaceId: string
  addedAt: Date
  notes: string
}

// User types from enhanced user profiles
export type EnhancedUserProfile = Database['public']['Tables']['users']['Row']
export type UserProfileInsert = Database['public']['Tables']['users']['Insert']
export type UserProfileUpdate = Database['public']['Tables']['users']['Update']

// Social links and preferences types
export interface SocialLinks {
  instagram?: string
  tiktok?: string
  twitter?: string
  linkedin?: string
  website?: string
  [key: string]: string | undefined
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system'
  notifications?: {
    email?: boolean
    push?: boolean
    marketing?: boolean
  }
  privacy?: {
    profile_visibility?: 'public' | 'private' | 'friends'
    show_activity?: boolean
    show_lists?: boolean
  }
  [key: string]: any
}

export interface UserMetadata {
  onboarding_completed?: boolean
  last_login?: string
  login_count?: number
  referral_source?: string
  [key: string]: any
}

// Typed user profile with proper interfaces
export interface TypedUserProfile extends Omit<EnhancedUserProfile, 'social_links' | 'preferences' | 'metadata'> {
  social_links: SocialLinks | null
  preferences: UserPreferences | null
  metadata: UserMetadata | null
}

// View types
export type UserProfilePublic = Database['public']['Views']['user_profiles_public']['Row']
export type UserStats = Database['public']['Views']['user_stats']['Row']

// Enhanced Place and List relationship interfaces for optimized many-to-many operations
export interface PlaceOrderUpdate {
  place_id: string;
  order_index: number;
}

export interface BulkPlaceAdd {
  place_id: string;
  notes?: string;
  tags?: string[];
}

export interface PlaceVisitData {
  visited_at: string;
  user_rating?: number;
  has_photos: boolean;
  has_notes: boolean;
}

export interface ListCompletionStats {
  total_places: number;
  visited_places: number;
  completion_percentage: number;
  average_rating: number;
  places_by_rating: {
    '5_star': number;
    '4_star': number;
    '3_star': number;
    '2_star': number;
    '1_star': number;
    'unrated': number;
  };
  recent_visits: number;
  estimated_time_remaining?: number;
}

export interface PlaceInsights {
  place_id: string;
  total_lists: number;
  public_lists: number;
  total_visits: number;
  average_user_rating: number;
  rating_distribution: {
    '5_star': number;
    '4_star': number;
    '3_star': number;
    '2_star': number;
    '1_star': number;
  };
  popular_tags: string[];
  recent_activity: {
    recent_adds: number;
    recent_visits: number;
    last_added: string;
    last_visited: string;
  };
  list_categories: string[];
}

export interface PopularPlace {
  place_id: string;
  place_name: string;
  place_address: string;
  place_rating: number;
  place_photo_url: string;
  place_types: string[];
  place_phone_number: string;
  place_website_url: string;
  place_price_level: number;
  total_lists: number;
  total_visits: number;
  average_user_rating: number;
  recent_adds: number;
  popularity_score: number;
}

export interface SimilarPlace {
  place_id: string;
  place_name: string;
  place_address: string;
  place_rating: number;
  place_photo_url: string;
  place_types: string[];
  shared_lists: number;
  similarity_score: number;
}

// Enhanced Add-to-List operation types
export interface AddPlaceToListParams {
  list_id: string;
  place_id: string;
  notes?: string;
  order_index?: number;
  tags?: string[];
  user_id?: string;
}

export interface AddPlaceToListResponse {
  success: boolean;
  message: string;
  list_place_id: string;
  place_data: EnhancedPlace;
  list_data: EnhancedList;
}

export interface RemovePlaceFromListParams {
  list_id: string;
  place_id: string;
  user_id?: string;
}

export interface RemovePlaceFromListResponse {
  success: boolean;
  message: string;
  removed_count: number;
}

export interface BulkAddPlacesToListParams {
  list_id: string;
  places: BulkPlaceAdd[];
  user_id?: string;
}

export interface BulkAddPlacesToListResponse {
  success: boolean;
  message: string;
  added_count: number;
  skipped_count: number;
  errors: Array<{
    place_id: string;
    error: string;
  }>;
}

export interface ReorderPlacesParams {
  list_id: string;
  place_orders: PlaceOrderUpdate[];
  user_id?: string;
}

export interface ReorderPlacesResponse {
  success: boolean;
  message: string;
  updated_count: number;
}

export interface MarkPlaceVisitedParams {
  list_id: string;
  place_id: string;
  user_rating?: number;
  visit_notes?: string;
  user_photos?: any;
  user_id?: string;
}

export interface MarkPlaceVisitedResponse {
  success: boolean;
  message: string;
  visit_data: PlaceVisitData;
}

// Enhanced query parameters for optimized list-place operations
export interface GetPlacesInListParams {
  list_id: string;
  user_id?: string;
  include_visited?: boolean;
  sort_by?: 'order_index' | 'name' | 'rating' | 'added_at' | 'user_rating' | 'visited_at';
  sort_direction?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface GetPopularPlacesParams {
  limit?: number;
  category_filter?: string;
  min_lists?: number;
  time_period?: string; // PostgreSQL interval format
}

export interface FindSimilarPlacesParams {
  place_id: string;
  limit?: number;
  min_shared_lists?: number;
}

// Enhanced place data with list context
export interface PlaceInList {
  list_place_id: string;
  place_id: string;
  place_name: string;
  place_address: string;
  place_latitude: number;
  place_longitude: number;
  place_rating: number;
  place_photo_url: string;
  place_types: string[];
  place_phone_number: string;
  place_website_url: string;
  place_price_level: number;
  place_opening_hours: any;
  place_business_status: string;
  notes: string;
  added_at: string;
  order_index: number;
  is_visited: boolean;
  visited_at: string;
  user_rating: number;
  user_photos: any;
  tags: string[];
  updated_at: string;
}

// Index monitoring types
export type IndexUsageAnalysis = Database['public']['Functions']['analyze_index_usage']['Returns'][0]
export type UnusedIndex = Database['public']['Functions']['get_unused_indexes']['Returns'][0]
export type MissingIndexSuggestion = Database['public']['Functions']['suggest_missing_indexes']['Returns'][0]
export type IndexSizeSummary = Database['public']['Functions']['get_index_size_summary']['Returns'][0]

export interface IndexMonitoringReport {
  summary: {
    total_indexes: number;
    unused_indexes: number;
    total_size: string;
    wasted_space: string;
    overall_efficiency: number;
  };
  high_priority_issues: IndexUsageAnalysis[];
  unused_indexes: UnusedIndex[];
  missing_indexes: MissingIndexSuggestion[];
  size_summary: IndexSizeSummary[];
  recommendations: string[];
}

export interface IndexPerformanceMetrics {
  table_name: string;
  index_name: string;
  usage_trend: 'increasing' | 'decreasing' | 'stable' | 'unused';
  efficiency_score: number;
  scan_frequency: number;
  size_impact: 'low' | 'medium' | 'high';
  recommendation: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface IndexOptimizationSuggestion {
  type: 'drop' | 'create' | 'modify' | 'monitor';
  table_name: string;
  index_name?: string;
  reason: string;
  impact: string;
  sql_command: string;
  estimated_benefit: string;
  risk_level: 'low' | 'medium' | 'high';
}
