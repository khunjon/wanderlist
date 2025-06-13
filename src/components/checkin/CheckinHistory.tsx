'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getUserCheckins, CheckinRecord } from '@/lib/checkins';
import { createClient } from '@supabase/supabase-js';

interface CheckinHistoryProps {
  supabase: ReturnType<typeof createClient>;
  limit?: number;
}

export default function CheckinHistory({ supabase, limit = 10 }: CheckinHistoryProps) {
  const [checkins, setCheckins] = useState<CheckinRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
                <div>
                  <h3 className="font-medium text-white">
                    {checkin.place_id}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Place ID (will show place name later)
                  </p>
                </div>
                <Badge variant="secondary" className="ml-4 shrink-0">
                  {formatDate(checkin.checked_in_at)}
                </Badge>
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