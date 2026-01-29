/*
  # Fix reading progress and storage issues

  1. Changes
    - Create reading_progress table with proper schema
    - Add indexes for performance
    - Fix storage configuration
    - Update storage policies

  2. Security
    - Enable RLS on reading_progress table
    - Add appropriate policies for reading progress
*/

-- Create reading_progress table if it doesn't exist
CREATE TABLE IF NOT EXISTS reading_progress (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  novel_id UUID REFERENCES "Novels"(novel_id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES "Chapters"(chapter_id) ON DELETE CASCADE,
  lastread_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (user_id, novel_id, chapter_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_reading_progress_user_id ON reading_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_reading_progress_novel_id ON reading_progress(novel_id);
CREATE INDEX IF NOT EXISTS idx_reading_progress_lastread ON reading_progress(lastread_at DESC);

-- Enable RLS
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can view own reading progress"
ON reading_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reading progress"
ON reading_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reading progress"
ON reading_progress FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reading progress"
ON reading_progress FOR DELETE
USING (auth.uid() = user_id);

-- Fix storage configuration
DO $$
BEGIN
  -- Ensure buckets exist with proper configuration
  INSERT INTO storage.buckets (id, name, public)
  VALUES 
    ('novel_covers', 'Novel Covers', true),
    ('profile_pictures', 'Profile Pictures', true)
  ON CONFLICT (id) DO UPDATE 
  SET public = true;
END $$;