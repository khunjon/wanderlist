import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Database types (will be auto-generated later with Supabase CLI)
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          display_name: string;
          photo_url: string;
          created_at: string;
          updated_at: string;
          is_admin: boolean;
          bio: string;
          instagram: string;
          tiktok: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string;
          photo_url?: string;
          created_at?: string;
          updated_at?: string;
          is_admin?: boolean;
          bio?: string;
          instagram?: string;
          tiktok?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string;
          photo_url?: string;
          created_at?: string;
          updated_at?: string;
          is_admin?: boolean;
          bio?: string;
          instagram?: string;
          tiktok?: string;
        };
      };
      lists: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string;
          city: string;
          tags: string[];
          is_public: boolean;
          created_at: string;
          updated_at: string;
          view_count: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string;
          city?: string;
          tags?: string[];
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
          view_count?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string;
          city?: string;
          tags?: string[];
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
          view_count?: number;
        };
      };
      places: {
        Row: {
          id: string;
          google_place_id: string;
          name: string;
          address: string;
          latitude: number;
          longitude: number;
          rating: number;
          photo_url: string;
          place_types: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          google_place_id: string;
          name: string;
          address: string;
          latitude: number;
          longitude: number;
          rating?: number;
          photo_url?: string;
          place_types?: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          google_place_id?: string;
          name?: string;
          address?: string;
          latitude?: number;
          longitude?: number;
          rating?: number;
          photo_url?: string;
          place_types?: string[];
          created_at?: string;
        };
      };
      list_places: {
        Row: {
          id: string;
          list_id: string;
          place_id: string;
          added_at: string;
          notes: string;
        };
        Insert: {
          id?: string;
          list_id: string;
          place_id: string;
          added_at?: string;
          notes?: string;
        };
        Update: {
          id?: string;
          list_id?: string;
          place_id?: string;
          added_at?: string;
          notes?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_user_lists_with_counts: {
        Args: {
          user_uuid: string;
        };
        Returns: {
          id: string;
          name: string;
          description: string;
          city: string;
          tags: string[];
          is_public: boolean;
          created_at: string;
          updated_at: string;
          view_count: number;
          place_count: number;
        }[];
      };
      increment_list_view_count: {
        Args: {
          list_uuid: string;
        };
        Returns: void;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
};

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// Typed Supabase client
export type TypedSupabaseClient = typeof supabase; 