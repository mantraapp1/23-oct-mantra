-- ============================================================================
-- FIX: Novel Chapter and Review Statistics
-- ============================================================================
-- This script fixes issues where:
-- 1. Novel chapter counts (total_chapters) are not updating or showing 0.
-- 2. Novel review counts (total_reviews) and ratings (average_rating) are not updating.
--
-- Why this happens:
-- The original trigger functions did not use `SECURITY DEFINER`, so when normal
-- users (readers or even authors without update RLS permissions in some contexts) 
-- inserted chapters or reviews, the database blocked the update to the `novels` table.
-- ============================================================================

-- 1. RECREATE FUNCTION FOR CHAPTER COUNT WITH SECURITY DEFINER
CREATE OR REPLACE FUNCTION update_novel_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE novels
    SET total_chapters = (SELECT COUNT(*) FROM chapters WHERE novel_id = NEW.novel_id),
        updated_at = NOW()
    WHERE id = NEW.novel_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE novels
    SET total_chapters = (SELECT COUNT(*) FROM chapters WHERE novel_id = OLD.novel_id),
        updated_at = NOW()
    WHERE id = OLD.novel_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger on chapters
DROP TRIGGER IF EXISTS update_novel_chapter_count ON chapters;
CREATE TRIGGER update_novel_chapter_count
AFTER INSERT OR DELETE ON chapters
FOR EACH ROW EXECUTE FUNCTION update_novel_stats();


-- 2. RECREATE FUNCTION FOR REVIEW STATS WITH SECURITY DEFINER & CORRECT DELETE LOGIC
CREATE OR REPLACE FUNCTION update_review_stats()
RETURNS TRIGGER AS $$
DECLARE
  target_novel_id UUID;
BEGIN
  -- Determine the novel_id affected
  IF TG_OP = 'DELETE' THEN
    target_novel_id := OLD.novel_id;
  ELSE
    target_novel_id := NEW.novel_id;
  END IF;

  UPDATE novels
  SET 
    total_reviews = (SELECT COUNT(*) FROM reviews WHERE novel_id = target_novel_id),
    average_rating = COALESCE((SELECT AVG(rating) FROM reviews WHERE novel_id = target_novel_id), 0.0),
    updated_at = NOW()
  WHERE id = target_novel_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger on reviews
DROP TRIGGER IF EXISTS update_novel_review_stats ON reviews;
CREATE TRIGGER update_novel_review_stats
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_review_stats();


-- 3. ONE-TIME RECALCULATION OF STATS FOR ALL NOVELS
UPDATE novels n
SET 
  total_chapters = (
    SELECT COUNT(*) FROM chapters c WHERE c.novel_id = n.id
  ),
  total_reviews = (
    SELECT COUNT(*) FROM reviews r WHERE r.novel_id = n.id
  ),
  average_rating = COALESCE(
    (SELECT AVG(rating) FROM reviews r WHERE r.novel_id = n.id), 
    0.0
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run this query in Supabase SQL Editor to verify the counts are correct:
-- SELECT id, title, total_chapters, total_reviews, average_rating FROM novels;
