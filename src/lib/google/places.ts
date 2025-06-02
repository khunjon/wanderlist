import axios from 'axios';
import { GooglePlace } from '@/types';

// Google Places API endpoints
const PLACES_API_BASE_URL = 'https://maps.googleapis.com/maps/api/place';
const PLACES_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

/**
 * Search for places by text query
 */
export const searchPlaces = async (query: string, city?: string): Promise<GooglePlace[]> => {
  try {
    // Proxy request through our own API to protect API key from client exposure
    const response = await axios.get('/api/places/search', {
      params: { query, city },
    });

    if (response.data && response.data.results) {
      return response.data.results;
    }

    return [];
  } catch (error) {
    console.error('Error searching places:', error);
    throw error;
  }
};

/**
 * Get details for a specific place by place_id
 */
export const getPlaceDetails = async (placeId: string): Promise<GooglePlace | null> => {
  try {
    // Proxy request through our own API to protect API key from client exposure
    const response = await axios.get('/api/places/details', {
      params: { placeId },
    });

    if (response.data && response.data.result) {
      return response.data.result;
    }

    return null;
  } catch (error) {
    console.error('Error getting place details:', error);
    throw error;
  }
};

/**
 * Get photo URL for a place
 */
export const getPlacePhotoUrl = (photoReference: string, maxWidth = 400): string => {
  return `/api/places/photo?photoReference=${photoReference}&maxWidth=${maxWidth}`;
};

/**
 * Server-side function to search places (only use in API routes)
 * This contains the actual API key, so it should only be used server-side
 */
export const searchPlacesServer = async (query: string, city?: string): Promise<any> => {
  try {
    const url = `${PLACES_API_BASE_URL}/textsearch/json`;
    
    // If city is provided, add it to the query for location context
    const searchQuery = city ? `${query} in ${city}` : query;
    
    const response = await axios.get(url, {
      params: {
        query: searchQuery,
        key: PLACES_API_KEY,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error searching places (server):', error);
    throw error;
  }
};

/**
 * Server-side function to get place details (only use in API routes)
 * This contains the actual API key, so it should only be used server-side
 */
export const getPlaceDetailsServer = async (placeId: string): Promise<any> => {
  try {
    const url = `${PLACES_API_BASE_URL}/details/json`;
    const response = await axios.get(url, {
      params: {
        place_id: placeId,
        key: PLACES_API_KEY,
        fields: 'name,place_id,formatted_address,geometry,rating,photos,types',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error getting place details (server):', error);
    throw error;
  }
};

/**
 * Server-side function to get place photo (only use in API routes)
 * This contains the actual API key, so it should only be used server-side
 */
export const getPlacePhotoServer = async (
  photoReference: string,
  maxWidth = 400
): Promise<any> => {
  try {
    const url = `${PLACES_API_BASE_URL}/photo`;
    const response = await axios.get(url, {
      params: {
        photoreference: photoReference,
        maxwidth: maxWidth,
        key: PLACES_API_KEY,
      },
      responseType: 'arraybuffer',
    });

    return response.data;
  } catch (error) {
    console.error('Error getting place photo (server):', error);
    throw error;
  }
}; 