-- Fix RLS policies for lists table to prevent timeouts
-- This addresses the hanging issue when loading public lists

-- Drop existing problematic policies
DROP POLICY IF EXISTS "lists_basic_select" ON lists;
DROP POLICY IF EXISTS "Users can view their own lists" ON lists;
DROP POLICY IF EXISTS "Public lists are viewable by everyone" ON lists;
DROP POLICY IF EXISTS "Users can view lists they collaborate on" ON lists;

-- Create a simple, efficient RLS policy for SELECT operations
CREATE POLICY "lists_select_policy" ON lists
FOR SELECT TO public
USING (
  -- Public lists are always accessible
  is_public = true 
  OR 
  -- Authenticated users can see their own lists
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
);

-- Ensure RLS is enabled
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;

-- Create optimized policies for other operations
CREATE POLICY "lists_insert_policy" ON lists
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "lists_update_policy" ON lists
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "lists_delete_policy" ON lists
FOR DELETE TO authenticated
USING (auth.uid() = user_id); 