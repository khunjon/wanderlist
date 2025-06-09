// User type - Supabase schema
export interface User {
  // Primary identifier
  id: string;
  uid?: string; // Legacy Firebase compatibility
  
  // Email
  email: string;
  
  // Display name
  displayName: string;
  display_name?: string | null;
  
  // Timestamps
  createdAt: Date;
  created_at?: string | null;
  updated_at?: string | null;
  
  // Photo URL
  photo_url?: string | null;
  photoURL?: string | null; // Legacy Firebase compatibility
  
  // Admin status
  is_admin?: boolean | null;
  isAdmin?: boolean | null; // Legacy Firebase compatibility
  
  // Profile fields
  bio?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
}

// List type - Supabase schema
export interface List {
  id: string;
  
  // User ID
  user_id: string;
  userId?: string; // Legacy Firebase compatibility
  
  name: string;
  description: string | null;
  city?: string | null;
  tags?: string[] | null;
  
  // Public status
  is_public?: boolean | null;
  isPublic?: boolean | null; // Legacy Firebase compatibility
  
  // Timestamps
  createdAt?: Date;
  updatedAt?: Date;
  created_at?: string | null;
  updated_at?: string | null;
  
  // View count
  view_count?: number | null;
  viewCount?: number | null; // Legacy Firebase compatibility
}

// Place type
export interface Place {
  id: string;
  googlePlaceId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  rating: number;
  photoUrl: string;
  placeTypes: string[];
}

// Enhanced Place type with notes for list context
export interface PlaceWithNotes extends Place {
  notes?: string;
  listPlaceId: string; // ID of the ListPlace junction record
  addedAt: Date; // Date when place was added to the list
}

// ListPlace type (junction)
export interface ListPlace {
  id: string;
  listId: string;
  placeId: string;
  addedAt: Date;
  notes?: string;
}

// Google Maps API Types
export interface GooglePlace {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  types?: string[];
}

// Form Types
export interface ListFormData {
  name: string;
  description: string;
  city?: string;
  tags?: string;
  isPublic: boolean;
}

export interface AuthFormData {
  email: string;
  password: string;
}

export interface PlaceSearchFormData {
  query: string;
} 