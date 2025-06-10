-- Migration: Setup Avatars Storage Bucket and Policies
-- This migration creates the avatars bucket and sets up Row Level Security policies

-- Create the avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can upload their own avatars
CREATE POLICY "Users can upload own avatars" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND auth.role() = 'authenticated'
);

-- Policy: Users can view their own avatars
CREATE POLICY "Users can view own avatars" ON storage.objects
FOR SELECT USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can update their own avatars
CREATE POLICY "Users can update own avatars" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND auth.role() = 'authenticated'
);

-- Policy: Users can delete their own avatars
CREATE POLICY "Users can delete own avatars" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND auth.role() = 'authenticated'
);

-- Policy: Allow public access to avatars (for viewing profile photos)
-- This is needed because profile photos are displayed publicly
CREATE POLICY "Public avatar access" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- Create a function to clean up old avatars when a user is deleted
CREATE OR REPLACE FUNCTION cleanup_user_avatars()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete all avatar files for the deleted user
  DELETE FROM storage.objects 
  WHERE bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = OLD.id::text;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to cleanup avatars when user is deleted
DROP TRIGGER IF EXISTS cleanup_user_avatars_trigger ON auth.users;
CREATE TRIGGER cleanup_user_avatars_trigger
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION cleanup_user_avatars();

-- Create a function to get storage usage for monitoring
CREATE OR REPLACE FUNCTION get_user_storage_usage(user_uuid UUID)
RETURNS TABLE (
  total_files INTEGER,
  total_size_bytes BIGINT,
  total_size_mb NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_files,
    COALESCE(SUM((metadata->>'size')::BIGINT), 0) as total_size_bytes,
    ROUND(COALESCE(SUM((metadata->>'size')::BIGINT), 0) / 1048576.0, 2) as total_size_mb
  FROM storage.objects 
  WHERE bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = user_uuid::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to clean up old avatars (for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_avatars(days_old INTEGER DEFAULT 30)
RETURNS TABLE (
  deleted_count INTEGER,
  freed_bytes BIGINT
) AS $$
DECLARE
  total_deleted INTEGER := 0;
  total_freed BIGINT := 0;
  file_record RECORD;
BEGIN
  -- Find and delete avatar files older than specified days that are not current
  FOR file_record IN
    SELECT 
      o.name,
      o.bucket_id,
      (o.metadata->>'size')::BIGINT as file_size,
      (storage.foldername(o.name))[1] as user_id
    FROM storage.objects o
    WHERE o.bucket_id = 'avatars'
    AND o.created_at < NOW() - INTERVAL '1 day' * days_old
    AND NOT EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id::text = (storage.foldername(o.name))[1]
      AND u.photo_url LIKE '%' || o.name || '%'
    )
  LOOP
    -- Delete the file
    DELETE FROM storage.objects 
    WHERE bucket_id = file_record.bucket_id 
    AND name = file_record.name;
    
    total_deleted := total_deleted + 1;
    total_freed := total_freed + COALESCE(file_record.file_size, 0);
  END LOOP;

  RETURN QUERY SELECT total_deleted, total_freed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- Grant execute permissions on utility functions
GRANT EXECUTE ON FUNCTION get_user_storage_usage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_avatars(INTEGER) TO service_role; 