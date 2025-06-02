// User type
export interface User {
  uid: string;
  email: string;
  displayName: string;
  createdAt: Date;
  photoURL?: string;
}

// List type
export interface List {
  id: string;
  userId: string;
  name: string;
  description: string;
  city?: string;
  tags?: string[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
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