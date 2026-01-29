/*
  # Add Search Functionality

  1. Changes
    - Add full-text search capabilities to Novels table
    - Create search function for novels
    - Add indexes for performance

  2. Search Features
    - Search by title
    - Search by author
    - Search by story/synopsis
    - Search by genre
*/

-- Enable the pg_trgm extension for fuzzy text matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add a tsvector column for full-text search
ALTER TABLE "Novels" ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create a function to update the search vector
CREATE OR REPLACE FUNCTION novels_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.author, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.story, '')), 'C') ||
    setweight(to_tsvector('english', array_to_string(COALESCE(NEW.genre, ARRAY[]::text[]), ' ')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the search vector
DROP TRIGGER IF EXISTS novels_search_vector_trigger ON "Novels";
CREATE TRIGGER novels_search_vector_trigger
  BEFORE INSERT OR UPDATE ON "Novels"
  FOR EACH ROW
  EXECUTE FUNCTION novels_search_vector_update();

-- Update existing rows
UPDATE "Novels" SET search_vector = 
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(author, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(story, '')), 'C') ||
  setweight(to_tsvector('english', array_to_string(COALESCE(genre, ARRAY[]::text[]), ' ')), 'D');

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS novels_search_vector_idx ON "Novels" USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS novels_title_trgm_idx ON "Novels" USING GIN(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS novels_author_trgm_idx ON "Novels" USING GIN(author gin_trgm_ops);

-- Create a function to search novels
CREATE OR REPLACE FUNCTION search_novels(
  search_query text,
  genre_filter text[] DEFAULT NULL,
  page_number integer DEFAULT 1,
  page_size integer DEFAULT 10
) RETURNS TABLE (
  novel_id uuid,
  title text,
  author text,
  views integer,
  leading_character text,
  upload_by uuid,
  genre text[],
  story text,
  novel_coverpage text,
  language text,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  rank real
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_offset integer;
BEGIN
  v_offset := (page_number - 1) * page_size;
  
  RETURN QUERY
  SELECT 
    n.*,
    ts_rank(n.search_vector, websearch_to_tsquery('english', search_query)) as rank
  FROM "Novels" n
  WHERE 
    (search_query IS NULL OR n.search_vector @@ websearch_to_tsquery('english', search_query))
    AND (genre_filter IS NULL OR n.genre && genre_filter)
  ORDER BY 
    CASE 
      WHEN search_query IS NULL THEN n.views
      ELSE ts_rank(n.search_vector, websearch_to_tsquery('english', search_query))
    END DESC
  LIMIT page_size
  OFFSET v_offset;
END;
$$;