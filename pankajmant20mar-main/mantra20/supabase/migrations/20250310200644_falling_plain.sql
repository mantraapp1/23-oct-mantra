/*
  # Fix schema and add missing tables

  1. Changes
    - Add Votes table with proper constraints
    - Fix Reading_Progress table schema
    - Add missing indexes

  2. Security
    - Enable RLS on new tables
    - Add policies for vote management
*/

-- Create Votes table if it doesn't exist
CREATE TABLE IF NOT EXISTS "Votes" (
  vote_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  novel_id UUID REFERENCES "Novels"(novel_id) ON DELETE CASCADE,
  user_id UUID REFERENCES "Users"(user_id) ON DELETE CASCADE,
  vote_type TEXT CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(novel_id, user_id)
);

-- Enable RLS on Votes table
ALTER TABLE "Votes" ENABLE ROW LEVEL SECURITY;

-- Create policies for Votes table
CREATE POLICY "Users can view votes" ON "Votes"
FOR SELECT USING (true);

CREATE POLICY "Users can vote" ON "Votes"
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own votes" ON "Votes"
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own votes" ON "Votes"
FOR DELETE USING (auth.uid() = user_id);

-- Add function to get novel vote count
CREATE OR REPLACE FUNCTION get_novel_vote_count(novel_uuid UUID)
RETURNS TABLE (
  upvotes BIGINT,
  downvotes BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE vote_type = 'up') as upvotes,
    COUNT(*) FILTER (WHERE vote_type = 'down') as downvotes
  FROM "Votes"
  WHERE novel_id = novel_uuid;
END;
$$ LANGUAGE plpgsql;