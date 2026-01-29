/*
  # Add Reviews, Votes, and Comments Tables

  1. New Tables
    - `Reviews`
      - `review_id` (uuid, primary key)
      - `novel_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `content` (text)
      - `rating` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `Votes`
      - `vote_id` (uuid, primary key)
      - `novel_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `vote_type` (text, 'up' or 'down')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `Comments`
      - `comment_id` (uuid, primary key)
      - `chapter_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `content` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users
*/

-- Create Reviews table
CREATE TABLE IF NOT EXISTS "Reviews" (
  review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  novel_id UUID REFERENCES "Novels"(novel_id) ON DELETE CASCADE,
  user_id UUID REFERENCES "Users"(user_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ,
  UNIQUE(novel_id, user_id)
);

-- Create Votes table
CREATE TABLE IF NOT EXISTS "Votes" (
  vote_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  novel_id UUID REFERENCES "Novels"(novel_id) ON DELETE CASCADE,
  user_id UUID REFERENCES "Users"(user_id) ON DELETE CASCADE,
  vote_type TEXT CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ,
  UNIQUE(novel_id, user_id)
);

-- Create Comments table
CREATE TABLE IF NOT EXISTS "Comments" (
  comment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID REFERENCES "Chapters"(chapter_id) ON DELETE CASCADE,
  user_id UUID REFERENCES "Users"(user_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE "Reviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Votes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Comments" ENABLE ROW LEVEL SECURITY;

-- Reviews Policies
CREATE POLICY "Reviews are viewable by everyone"
  ON "Reviews" FOR SELECT
  USING (true);

CREATE POLICY "Users can create reviews"
  ON "Reviews" FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON "Reviews" FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
  ON "Reviews" FOR DELETE
  USING (auth.uid() = user_id);

-- Votes Policies
CREATE POLICY "Votes are viewable by everyone"
  ON "Votes" FOR SELECT
  USING (true);

CREATE POLICY "Users can create votes"
  ON "Votes" FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own votes"
  ON "Votes" FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own votes"
  ON "Votes" FOR DELETE
  USING (auth.uid() = user_id);

-- Comments Policies
CREATE POLICY "Comments are viewable by everyone"
  ON "Comments" FOR SELECT
  USING (true);

CREATE POLICY "Users can create comments"
  ON "Comments" FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON "Comments" FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON "Comments" FOR DELETE
  USING (auth.uid() = user_id);

-- Function to get novel vote count
CREATE OR REPLACE FUNCTION get_novel_vote_count(novel_uuid UUID)
RETURNS TABLE (upvotes BIGINT, downvotes BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE vote_type = 'up') as upvotes,
    COUNT(*) FILTER (WHERE vote_type = 'down') as downvotes
  FROM "Votes"
  WHERE novel_id = novel_uuid;
END;
$$ LANGUAGE plpgsql;