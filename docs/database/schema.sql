-- Supabase Database Schema Setup for Placemarks
-- Run this in your Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- TABLES
-- =============================================

-- Create users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT DEFAULT '',
  photo_url TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_admin BOOLEAN DEFAULT FALSE,
  bio TEXT DEFAULT '' CHECK (LENGTH(bio) <= 500),
  instagram TEXT DEFAULT '' CHECK (LENGTH(instagram) <= 30),
  tiktok TEXT DEFAULT '' CHECK (LENGTH(tiktok) <= 24),
  CONSTRAINT valid_instagram CHECK (instagram ~ '^[a-zA-Z0-9._]*$'),
  CONSTRAINT valid_tiktok CHECK (tiktok ~ '^[a-zA-Z0-9._]*$')
);

-- Create lists table
CREATE TABLE public.lists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL CHECK (LENGTH(name) > 0),
  description TEXT DEFAULT '',
  city TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  view_count INTEGER DEFAULT 0
);

-- Create places table
CREATE TABLE public.places (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  google_place_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  rating DECIMAL(2, 1) DEFAULT 0,
  photo_url TEXT DEFAULT '',
  place_types TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create list_places junction table
CREATE TABLE public.list_places (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  list_id UUID REFERENCES public.lists(id) ON DELETE CASCADE NOT NULL,
  place_id UUID REFERENCES public.places(id) ON DELETE CASCADE NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT DEFAULT '',
  UNIQUE(list_id, place_id)
);

-- =============================================
-- INDEXES
-- =============================================

-- Lists table indexes
CREATE INDEX idx_lists_user_id ON public.lists(user_id);
CREATE INDEX idx_lists_is_public ON public.lists(is_public);
CREATE INDEX idx_lists_created_at ON public.lists(created_at DESC);
CREATE INDEX idx_lists_view_count ON public.lists(view_count DESC);

-- Places table indexes
CREATE INDEX idx_places_google_place_id ON public.places(google_place_id);
CREATE INDEX idx_places_location ON public.places(latitude, longitude);

-- List_places table indexes
CREATE INDEX idx_list_places_list_id ON public.list_places(list_id);
CREATE INDEX idx_list_places_place_id ON public.list_places(place_id);
CREATE INDEX idx_list_places_added_at ON public.list_places(added_at DESC);

-- =============================================
-- TRIGGERS
-- =============================================

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON public.users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lists_updated_at 
  BEFORE UPDATE ON public.lists 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_places ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES - USERS TABLE
-- =============================================

-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Allow reading user profiles for public list authors (for discovery)
CREATE POLICY "Public profiles readable" ON public.users
  FOR SELECT USING (true);

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Enable insert for new user registration
CREATE POLICY "Enable insert for authenticated users" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- =============================================
-- RLS POLICIES - LISTS TABLE
-- =============================================

-- Users can create lists
CREATE POLICY "Users can create lists" ON public.lists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can read their own lists
CREATE POLICY "Users can read own lists" ON public.lists
  FOR SELECT USING (auth.uid() = user_id);

-- Anyone can read public lists (for discovery)
CREATE POLICY "Public lists are readable" ON public.lists
  FOR SELECT USING (is_public = true);

-- Users can update their own lists
CREATE POLICY "Users can update own lists" ON public.lists
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own lists
CREATE POLICY "Users can delete own lists" ON public.lists
  FOR DELETE USING (auth.uid() = user_id);

-- Admins can read all lists
CREATE POLICY "Admins can read all lists" ON public.lists
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- =============================================
-- RLS POLICIES - PLACES TABLE
-- =============================================

-- Anyone can read places (they're public data)
CREATE POLICY "Places are readable" ON public.places
  FOR SELECT USING (true);

-- Authenticated users can create places
CREATE POLICY "Authenticated users can create places" ON public.places
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================
-- RLS POLICIES - LIST_PLACES TABLE
-- =============================================

-- Users can add places to their own lists
CREATE POLICY "Users can add places to own lists" ON public.list_places
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lists 
      WHERE id = list_id AND user_id = auth.uid()
    )
  );

-- Users can read places from their own lists
CREATE POLICY "Users can read own list places" ON public.list_places
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.lists 
      WHERE id = list_id AND user_id = auth.uid()
    )
  );

-- Anyone can read places from public lists
CREATE POLICY "Public list places are readable" ON public.list_places
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.lists 
      WHERE id = list_id AND is_public = true
    )
  );

-- Users can update places in their own lists
CREATE POLICY "Users can update own list places" ON public.list_places
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.lists 
      WHERE id = list_id AND user_id = auth.uid()
    )
  );

-- Users can delete places from their own lists
CREATE POLICY "Users can delete own list places" ON public.list_places
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.lists 
      WHERE id = list_id AND user_id = auth.uid()
    )
  );

-- Admins can read all list places
CREATE POLICY "Admins can read all list places" ON public.list_places
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to get user lists with place counts
CREATE OR REPLACE FUNCTION get_user_lists_with_counts(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  city TEXT,
  tags TEXT[],
  is_public BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  view_count INTEGER,
  place_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.name,
    l.description,
    l.city,
    l.tags,
    l.is_public,
    l.created_at,
    l.updated_at,
    l.view_count,
    COALESCE(lp.place_count, 0) as place_count
  FROM public.lists l
  LEFT JOIN (
    SELECT list_id, COUNT(*) as place_count
    FROM public.list_places
    GROUP BY list_id
  ) lp ON l.id = lp.list_id
  WHERE l.user_id = user_uuid
  ORDER BY l.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment list view count
CREATE OR REPLACE FUNCTION increment_list_view_count(list_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.lists 
  SET view_count = view_count + 1 
  WHERE id = list_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- STORAGE POLICIES (Run after creating profile-photos bucket)
-- =============================================

-- Note: Create the 'profile-photos' bucket in Supabase Storage first, then run these policies

-- Allow users to upload their own profile photos
-- CREATE POLICY "Users can upload own profile photos" ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'profile-photos' AND 
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

-- Allow users to update their own profile photos
-- CREATE POLICY "Users can update own profile photos" ON storage.objects
--   FOR UPDATE USING (
--     bucket_id = 'profile-photos' AND 
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

-- Allow users to delete their own profile photos
-- CREATE POLICY "Users can delete own profile photos" ON storage.objects
--   FOR DELETE USING (
--     bucket_id = 'profile-photos' AND 
--     auth.uid()::text = (storage.foldername(name))[1]
--   );

-- Allow everyone to view profile photos
-- CREATE POLICY "Profile photos are publicly viewable" ON storage.objects
--   FOR SELECT USING (bucket_id = 'profile-photos');

-- =============================================
-- SETUP COMPLETE
-- =============================================

-- Your Supabase database is now ready!
-- Next steps:
-- 1. Create the 'profile-photos' storage bucket
-- 2. Uncomment and run the storage policies above
-- 3. Update your application code to use Supabase
-- 4. Test the migration thoroughly 