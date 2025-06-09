-- Script to identify and clean up duplicate places by google_place_id
-- Run this in your Supabase SQL Editor to fix the "more than one row returned by a subquery" error

-- First, let's identify duplicate places
SELECT 
  google_place_id, 
  COUNT(*) as duplicate_count,
  array_agg(id) as place_ids,
  array_agg(created_at) as created_dates
FROM public.places 
GROUP BY google_place_id 
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Clean up duplicates by keeping the oldest record for each google_place_id
-- This will:
-- 1. Update any list_places references to point to the oldest place
-- 2. Delete the newer duplicate places

DO $$
DECLARE
  duplicate_record RECORD;
  place_to_keep UUID;
  place_to_delete UUID;
BEGIN
  -- Loop through each set of duplicates
  FOR duplicate_record IN 
    SELECT 
      google_place_id,
      array_agg(id ORDER BY created_at ASC) as place_ids
    FROM public.places 
    GROUP BY google_place_id 
    HAVING COUNT(*) > 1
  LOOP
    -- Keep the first (oldest) place
    place_to_keep := duplicate_record.place_ids[1];
    
    -- Process each duplicate to delete
    FOR i IN 2..array_length(duplicate_record.place_ids, 1) LOOP
      place_to_delete := duplicate_record.place_ids[i];
      
      -- Update any list_places that reference the duplicate to reference the keeper
      UPDATE public.list_places 
      SET place_id = place_to_keep 
      WHERE place_id = place_to_delete
      AND NOT EXISTS (
        SELECT 1 FROM public.list_places lp2 
        WHERE lp2.list_id = list_places.list_id 
        AND lp2.place_id = place_to_keep
      );
      
      -- Delete any list_places that would create duplicates after the update
      DELETE FROM public.list_places 
      WHERE place_id = place_to_delete;
      
      -- Delete the duplicate place
      DELETE FROM public.places WHERE id = place_to_delete;
      
      RAISE NOTICE 'Merged duplicate place % into %', place_to_delete, place_to_keep;
    END LOOP;
  END LOOP;
END $$;

-- Verify no duplicates remain
SELECT 
  google_place_id, 
  COUNT(*) as count
FROM public.places 
GROUP BY google_place_id 
HAVING COUNT(*) > 1;

-- If the above query returns no rows, the cleanup was successful 