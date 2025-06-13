'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { createCheckin } from '@/lib/checkins';
import { searchPlaces as searchPlacesAPI } from '@/lib/google/places';
import { GooglePlace } from '@/types';
import { createClient } from '@supabase/supabase-js';
import { Search, MapPin, Loader2 } from 'lucide-react';

interface CheckinSearchProps {
  supabase: ReturnType<typeof createClient>;
  initialCity?: string; // Optional initial city value
}

export default function CheckinSearch({ supabase, initialCity = "Bangkok, Thailand" }: CheckinSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [places, setPlaces] = useState<GooglePlace[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [checkingInPlaceId, setCheckingInPlaceId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [city, setCity] = useState(initialCity);
  const { toast } = useToast();

  // Debounced search function using your existing Google Places implementation
  const performSearch = useCallback(
    async (query: string) => {
      if (!query.trim() || query.length < 3) {
        setPlaces([]);
        return;
      }

      setIsSearching(true);
      
      try {
        // Use your existing searchPlaces function which proxies through your API
        const results = await searchPlacesAPI(query, city);
        
        // Debug logging
        console.log('Search results:', results);
        console.log('Number of results:', results?.length || 0);
        
        // Limit to top 5 results for better UX
        setPlaces(results.slice(0, 5));
      } catch (error) {
        console.error('Error searching places:', error);
        toast({
          title: "Search Error",
          description: "Failed to search for places. Please try again.",
          variant: "destructive",
        });
        setPlaces([]);
      } finally {
        setIsSearching(false);
      }
    },
    [city, toast]
  );

  // Debounce search queries
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch]);

  const handleCheckin = async (place: GooglePlace) => {
    setCheckingInPlaceId(place.place_id);

    try {
      const result = await createCheckin(supabase, {
        place_id: place.place_id,
        notes: notes.trim() || undefined
      });

      if (result.error) {
        toast({
          title: "Check-in Failed",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Check-in Successful!",
          description: `Checked in to ${place.name}`,
        });
        
        // Clear the form after successful check-in
        setSearchQuery('');
        setPlaces([]);
        setNotes('');
      }
    } catch (error) {
      toast({
        title: "Check-in Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCheckingInPlaceId(null);
    }
  };

  const getPlaceTypeDisplay = (types?: string[]) => {
    if (!types || types.length === 0) return 'Place';
    
    // Filter and format place types for display
    const relevantTypes = types
      .filter(type => !type.includes('_'))
      .filter(type => type !== 'establishment' && type !== 'point_of_interest')
      .slice(0, 2);
    
    return relevantTypes.length > 0 
      ? relevantTypes.map(type => type.replace(/_/g, ' ')).join(', ')
      : 'Place';
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold">Check In to a Place</h2>
          <p className="text-sm text-gray-500 mt-1">
            Search for places to check in to
          </p>
        </div>
        
        {/* City Input */}
        <div className="space-y-2">
          <label htmlFor="city" className="text-sm font-medium text-gray-700">
            Search Location
          </label>
          <Input
            id="city"
            type="text"
            placeholder="Enter city or location..."
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full"
          />
        </div>
        
        {/* Search Input */}
        <div className="space-y-2">
          <label htmlFor="search" className="text-sm font-medium text-gray-700">
            Search for Places
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              id="search"
              type="text"
              placeholder="Search for places..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 animate-spin" />
            )}
          </div>
          {city && (
            <p className="text-xs text-gray-500">
              Searching in: <span className="font-medium">{city}</span>
            </p>
          )}
        </div>

        {/* Notes Input */}
        <div className="space-y-2">
          <label htmlFor="notes" className="text-sm font-medium text-gray-700">
            Notes (optional)
          </label>
          <Textarea
            id="notes"
            placeholder="Add a note about your visit..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="resize-none"
          />
        </div>
      </div>

      {/* Search Results */}
      {places.length > 0 && (
        <div className="space-y-4 border-t pt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Search Results</h3>
            <span className="text-sm text-gray-500">{places.length} result{places.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="space-y-3">
            {places.map((place) => (
              <Card key={place.place_id} className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div>
                        <h4 className="font-medium text-white truncate">
                          {place.name}
                        </h4>
                        <div className="flex items-center mt-1 text-sm text-gray-500">
                          <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="truncate">{place.formatted_address}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-400 capitalize">
                          {getPlaceTypeDisplay(place.types)}
                        </p>
                        {place.rating && (
                          <div className="flex items-center text-xs text-gray-500">
                            <span className="mr-1">⭐</span>
                            <span>{place.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => handleCheckin(place)}
                      disabled={checkingInPlaceId === place.place_id}
                      size="sm"
                      className="flex-shrink-0"
                    >
                      {checkingInPlaceId === place.place_id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Checking In...
                        </>
                      ) : (
                        'Check In'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No Results Message */}
      {searchQuery.length >= 3 && !isSearching && places.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              <p className="font-medium">No places found</p>
              <p className="text-sm mt-1">Try searching with different keywords.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Instructions */}
      {searchQuery.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-500">
              <Search className="h-8 w-8 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">Search for places to check in</p>
              <p className="text-sm mt-1">
                Type at least 3 characters to start searching for restaurants, cafes, attractions, and more.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 