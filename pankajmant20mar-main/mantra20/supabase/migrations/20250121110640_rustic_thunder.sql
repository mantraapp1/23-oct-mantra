/*
  # Database Schema Updates and Optimizations

  1. Changes
    - Rename Reading_Progress table to lowercase
    - Update increment_novel_views function
    - Configure storage buckets
    - Add performance indexes
    - Update storage policies

  2. Security
    - Update storage policies for novel covers
    - Ensure proper access controls

  3. Notes
    - All operations use IF EXISTS/IF NOT EXISTS for safety
    - Indexes added for performance optimization
    - Storage policies updated for better security
*/

-- Create base tables if they don't exist
CREATE TABLE IF NOT EXISTS "Novels" (
  novel_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  views INTEGER DEFAULT 0,
  leading_character TEXT CHECK (leading_character IN ('male', 'female')),
  upload_by UUID,
  genre TEXT[] NOT NULL,
  story TEXT NOT NULL,
  novel_coverpage TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Fix table name casing
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'Reading_Progress'
  ) THEN
    ALTER TABLE "Reading_Progress" RENAME TO reading_progress;
  END IF;
END $$;

-- Recreate increment_novel_views function with fixed column reference
CREATE OR REPLACE FUNCTION increment_novel_views(novel_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE "Novels"
  SET views = COALESCE(views, 0) + 1
  WHERE novel_id = novel_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix storage bucket configuration
DO $$
BEGIN
  -- Update novel_covers bucket if it exists
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'novel_coverpage') THEN
    UPDATE storage.buckets 
    SET id = 'novel_covers' 
    WHERE id = 'novel_coverpage';
  ELSE
    -- Create novel_covers bucket if it doesn't exist
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('novel_covers', 'Novel Covers', true)
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- Add missing indexes for performance
DO $$
BEGIN
  -- Create index on Novels.views if table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Novels') THEN
    CREATE INDEX IF NOT EXISTS idx_novels_views ON "Novels" (views DESC);
    CREATE INDEX IF NOT EXISTS idx_novels_genre ON "Novels" USING GIN (genre);
  END IF;

  -- Create index on reading_progress.user_id if table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'reading_progress') THEN
    CREATE INDEX IF NOT EXISTS idx_reading_progress_user ON reading_progress (user_id);
  END IF;

  -- Create index on Library.user_id if table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Library') THEN
    CREATE INDEX IF NOT EXISTS idx_library_user ON "Library" (user_id);
  END IF;
END $$;

-- Update storage policies for novel covers
DO $$
BEGIN
  -- Drop old policies if they exist
  DROP POLICY IF EXISTS "Novel covers are viewable by everyone" ON storage.objects;
  DROP POLICY IF EXISTS "Authors can upload novel covers" ON storage.objects;
  
  -- Create new policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Public novel covers access'
  ) THEN
    CREATE POLICY "Public novel covers access"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'novel_covers');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Authenticated users can upload novel covers'
  ) THEN
    CREATE POLICY "Authenticated users can upload novel covers"
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = 'novel_covers' AND
        auth.role() = 'authenticated'
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE policyname = 'Authenticated users can update novel covers'
  ) THEN
    CREATE POLICY "Authenticated users can update novel covers"
      ON storage.objects FOR UPDATE
      USING (
        bucket_id = 'novel_covers' AND
        auth.role() = 'authenticated'
      );
  END IF;
END $$;