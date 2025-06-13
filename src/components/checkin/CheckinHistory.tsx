'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { getUserCheckins, deleteCheckin, CheckinRecord } from '@/lib/checkins';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@supabase/supabase-js';
import { Trash2, Loader2 } from 'lucide-react';

interface CheckinHistoryProps {
  supabase: ReturnType<typeof createClient>;
  limit?: number;
}

export default function CheckinHistory({ supabase, limit = 10 }: CheckinHistoryProps) {
  const [checkins, setCheckins] = useState<CheckinRecord[]>([]);
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

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Check-in History</h2>
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-6 w-24" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Check-in History</h2>
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="text-red-400">
              <p className="font-medium">Error loading check-ins</p>
              <p className="text-sm text-red-300 mt-1">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (checkins.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Check-in History</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-gray-400">
              <p className="font-medium">No check-ins yet</p>
              <p className="text-sm mt-1">Your check-ins will appear here once you start checking in to places.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Check-in History</h2>
      <div className="space-y-3">
        {checkins.map((checkin) => (
          <Card key={checkin.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white">
                    {checkin.place_id}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Place ID (will show place name later)
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4 shrink-0">
                  <Badge variant="secondary">
                    {formatDate(checkin.checked_in_at)}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(checkin.id)}
                    disabled={deletingIds.has(checkin.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20 border-red-400/30"
                  >
                    {deletingIds.has(checkin.id) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            {checkin.notes && (
              <CardContent className="pt-0">
                <div className="bg-gray-800 rounded-md p-3">
                  <p className="text-sm text-gray-300">{checkin.notes}</p>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
      {checkins.length === limit && (
        <div className="text-center pt-4">
          <p className="text-sm text-gray-400">
            Showing {limit} most recent check-ins
          </p>
        </div>
      )}
    </div>
  );
} 