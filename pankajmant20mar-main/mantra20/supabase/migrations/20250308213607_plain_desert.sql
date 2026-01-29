/*
  # Fix Reading Progress Table Structure

  1. Changes
    - Drop and recreate Reading_Progress table with correct structure
    - Add missing relationships and constraints
*/

-- Drop existing table
DROP TABLE IF EXISTS "Reading_Progress";

-- Recreate table with correct structure
CREATE TABLE "Reading_Progress" (
  user_id UUID REFERENCES "Users"(user_id) ON DELETE CASCADE,
  novel_id UUID REFERENCES "Novels"(novel_id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES "Chapters"(chapter_id) ON DELETE CASCADE,
  chapter_number INTEGER NOT NULL,
  lastread_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (user_id, novel_id, chapter_id)
);

-- Enable RLS
ALTER TABLE "Reading_Progress" ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Users can view own reading progress" ON "Reading_Progress"
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create reading progress" ON "Reading_Progress"
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update reading progress" ON "Reading_Progress"
FOR UPDATE USING (auth.uid() = user_id);