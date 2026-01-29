/*
  # Fix reading progress and storage issues

  1. New Tables
    - Create reading_progress table
    - Add necessary constraints and indexes
  
  2. Storage
    - Fix storage bucket configuration
    - Update storage policies
*/

-- Create reading_progress table if it doesn't exist
CREATE TABLE IF NOT EXISTS reading_progress (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  novel_id UUID REFERENCES "Novels"(novel_id) ON DELETE CASCADE,
  chapter_id UUID,
  lastread_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (user_id, novel_id, chapter_id)
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_reading_progress_lastread 
ON reading_progress (lastread_at DESC);

-- Ensure storage buckets exist with correct configuration
DO $$
BEGIN
  -- Create profile_pictures bucket if it doesn't exist
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('profile_pictures', 'Profile Pictures', true)
  ON CONFLICT (id) DO NOTHING;

  -- Create novel_covers bucket if it doesn't exist
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('novel_covers', 'Novel Covers', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Update storage policies
DO $$
BEGIN
  -- Novel covers policies
  DROP POLICY IF EXISTS "Public novel covers access" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can upload novel covers" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can update novel covers" ON storage.objects;

  CREATE POLICY "Public novel covers access"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'novel_covers');

  CREATE POLICY "Authenticated users can upload novel covers"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'novel_covers' AND
      auth.role() = 'authenticated'
    );

  CREATE POLICY "Authenticated users can update novel covers"
    ON storage.objects FOR UPDATE
    USING (
      bucket_id = 'novel_covers' AND
      auth.role() = 'authenticated'
    );

  -- Profile pictures policies
  DROP POLICY IF EXISTS "Public profile pictures access" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can upload profile pictures" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can update profile pictures" ON storage.objects;

  CREATE POLICY "Public profile pictures access"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'profile_pictures');

  CREATE POLICY "Authenticated users can upload profile pictures"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'profile_pictures' AND
      auth.role() = 'authenticated'
    );

  CREATE POLICY "Authenticated users can update profile pictures"
    ON storage.objects FOR UPDATE
    USING (
      bucket_id = 'profile_pictures' AND
      auth.role() = 'authenticated'
    );
END $$;