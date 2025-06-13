'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { getUserCheckins, deleteCheckin, CheckinWithPlace } from '@/lib/checkins';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@supabase/supabase-js';
import { Trash2, Loader2 } from 'lucide-react';

interface CheckinHistoryProps {
  supabase: ReturnType<typeof createClient>;
  limit?: number;
}

export default function CheckinHistory({ supabase, limit = 10 }: CheckinHistoryProps) {
  const [checkins, setCheckins] = useState<CheckinWithPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    async function fetchCheckins() {
      setLoading(true);
      setError(null);

      const result = await getUserCheckins(supabase, limit);

      if (result.error) {
        setError(result.error);
      } else {
        setCheckins(result.data || []);
      }

      setLoading(false);
    }

    fetchCheckins();
  }, [supabase, limit]);

  const handleDelete = async (checkinId: string) => {
    // Add to deleting set
    setDeletingIds(prev => new Set(prev).add(checkinId));

    try {
      const result = await deleteCheckin(supabase, checkinId);

      if (result.success) {
        // Remove from local state
        setCheckins(prev => prev.filter(checkin => checkin.id !== checkinId));
        
        toast({
          title: "Check-in deleted",
          description: "The check-in has been successfully removed.",
          variant: "success",
        });
      } else {
        toast({
          title: "Delete failed",
          description: result.error || "Failed to delete check-in.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      // Remove from deleting set
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(checkinId);
        return newSet;
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const shortenAddress = (address: string) => {
    if (!address) return '';
    
    // Split address by commas and remove empty parts
    const parts = address.split(',').map(part => part.trim()).filter(part => part);
    
    // Remove the last part if it looks like a country (common country names or codes)
    const countryPatterns = /^(Thailand|United States|USA|US|UK|United Kingdom|Canada|Australia|Singapore|Malaysia|Japan|South Korea|China|India|Germany|France|Italy|Spain|Netherlands|Belgium|Sweden|Norway|Denmark|Finland|Switzerland|Austria|TH|SG|MY|JP|KR|CN|IN|DE|FR|IT|ES|NL|BE|SE|NO|DK|FI|CH|AT)$/i;
    if (parts.length > 1 && countryPatterns.test(parts[parts.length - 1])) {
      parts.pop();
    }
    
    // Remove zip codes (patterns like 12345, 12345-6789, A1B 2C3, etc.)
    const zipCodePatterns = /^\d{5}(-\d{4})?$|^\d{4,6}$|^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/;
    const filteredParts = parts.filter(part => !zipCodePatterns.test(part.trim()));
    
    // Take first 3-4 parts to keep address reasonable length
    const maxParts = 4;
    const finalParts = filteredParts.slice(0, maxParts);
    
    return finalParts.join(', ');
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="bg-gray-900 rounded-lg p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-full mb-2" />
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-400/30 rounded-lg p-4">
        <div className="text-red-400">
          <p className="font-medium">Error loading check-ins</p>
          <p className="text-sm text-red-300 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (checkins.length === 0) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 text-center">
        <div className="text-gray-400">
          <p className="font-medium">No check-ins yet</p>
          <p className="text-sm mt-1">Your check-ins will appear here once you start checking in to places.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {checkins.map((checkin) => (
          <div key={checkin.id} className="bg-gray-900 rounded-lg p-3 hover:bg-gray-800 transition-colors">
            {/* Main content */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-white text-sm sm:text-base truncate">
                  {checkin.place?.name || checkin.place_id}
                </h3>
                <p className="text-xs sm:text-sm text-gray-400 mt-0.5 line-clamp-1">
                  {shortenAddress(checkin.place?.address || '') || 'Place details not available'}
                </p>
                
                {/* Place details row */}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-3">
                    {checkin.place && checkin.place.rating && checkin.place.rating > 0 && (
                      <div className="flex items-center text-xs text-gray-500">
                        <span className="mr-1">⭐</span>
                        <span>{checkin.place.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Timestamp */}
                  <span className="text-xs text-gray-500 shrink-0">
                    {formatDate(checkin.checked_in_at)}
                  </span>
                </div>
              </div>
              
              {/* Delete button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(checkin.id)}
                disabled={deletingIds.has(checkin.id)}
                className="text-red-400 hover:text-red-300 hover:bg-red-900/20 border-red-400/30 shrink-0 h-8 w-8 p-0"
              >
                {deletingIds.has(checkin.id) ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
              </Button>
            </div>
            
            {/* Notes */}
            {checkin.notes && (
              <div className="mt-3 pt-3 border-t border-gray-700">
                <p className="text-sm text-gray-300">{checkin.notes}</p>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {checkins.length === limit && (
        <div className="text-center pt-3">
          <p className="text-xs text-gray-500">
            Showing {limit} most recent check-ins
          </p>
        </div>
      )}
    </div>
  );
} 