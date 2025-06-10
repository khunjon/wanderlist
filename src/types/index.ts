// User type - Clean Supabase schema
export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: Date;
  photo_url?: string | null;
  is_admin?: boolean | null;
  bio?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

// List type - Clean Supabase schema
export interface List {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  city?: string | null;
  tags?: string[] | null;
  is_public?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
  view_count?: number | null;
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