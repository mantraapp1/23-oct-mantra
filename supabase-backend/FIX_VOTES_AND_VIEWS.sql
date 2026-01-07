-- ============================================================================
-- FIX: Vote Counts and View Tracking
-- ============================================================================
-- This file adds missing triggers and functions to properly track:
-- 1. Novel vote counts (total_votes)
-- 2. Chapter view counts
-- 3. Novel view counts
-- ============================================================================

-- ============================================================================
-- 1. NOVEL VOTES TRIGGER
-- ============================================================================

-- Function to update novel total_votes when a vote is added/removed
CREATE OR REPLACE FUNCTION update_novel_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment vote count
    UPDATE novels
    SET total_votes = total_votes + 1,
        updated_at = NOW()
    WHERE id = NEW.novel_id;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement vote count
    UPDATE novels
    SET total_votes = GREATEST(total_votes - 1, 0),
        updated_at = NOW()
    WHERE id = OLD.novel_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_novel_vote_count ON novel_votes;

-- Create trigger for novel_votes table
CREATE TRIGGER trigger_update_novel_vote_count
AFTER INSERT OR DELETE ON novel_votes
FOR EACH ROW
EXECUTE FUNCTION update_novel_vote_count();

-- ============================================================================
-- 2. CHAPTER VIEWS RPC FUNCTION
-- ============================================================================

-- Function to increment chapter views (called from app)
CREATE OR REPLACE FUNCTION increment_chapter_views(chapter_id_param UUID)
RETURNS void AS $$
DECLARE
  novel_id_var UUID;
BEGIN
  -- Increment chapter views
  UPDATE chapters
  SET views = views + 1,
      updated_at = NOW()
  WHERE id = chapter_id_param
  RETURNING novel_id INTO novel_id_var;
  
  -- Also increment novel total_views
  IF novel_id_var IS NOT NULL THEN
    UPDATE novels
    SET total_views = total_views + 1,
        updated_at = NOW()
    WHERE id = novel_id_var;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. NOVEL VIEWS RPC FUNCTION
-- ============================================================================

-- Function to increment novel views (called from app)
CREATE OR REPLACE FUNCTION increment_novel_views(novel_id_param UUID)
RETURNS void AS $$
BEGIN
  UPDATE novels
  SET total_views = total_views + 1,
      updated_at = NOW()
  WHERE id = novel_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. COMMENT REACTIONS TRIGGER
-- ============================================================================

-- Function to update comment likes/dislikes count
CREATE OR REPLACE FUNCTION update_comment_reaction_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment like or dislike count
    IF NEW.reaction_type = 'like' THEN
      UPDATE comments
      SET likes = likes + 1
      WHERE id = NEW.comment_id;
    ELSIF NEW.reaction_type = 'dislike' THEN
      UPDATE comments
      SET dislikes = dislikes + 1
      WHERE id = NEW.comment_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle reaction type change
    IF OLD.reaction_type = 'like' AND NEW.reaction_type = 'dislike' THEN
      UPDATE comments
      SET likes = GREATEST(likes - 1, 0),
          dislikes = dislikes + 1
      WHERE id = NEW.comment_id;
    ELSIF OLD.reaction_type = 'dislike' AND NEW.reaction_type = 'like' THEN
      UPDATE comments
      SET dislikes = GREATEST(dislikes - 1, 0),
          likes = likes + 1
      WHERE id = NEW.comment_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement like or dislike count
    IF OLD.reaction_type = 'like' THEN
      UPDATE comments
      SET likes = GREATEST(likes - 1, 0)
      WHERE id = OLD.comment_id;
    ELSIF OLD.reaction_type = 'dislike' THEN
      UPDATE comments
      SET dislikes = GREATEST(dislikes - 1, 0)
      WHERE id = OLD.comment_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_comment_reaction_count ON comment_reactions;

-- Create trigger for comment_reactions table
CREATE TRIGGER trigger_update_comment_reaction_count
AFTER INSERT OR UPDATE OR DELETE ON comment_reactions
FOR EACH ROW
EXECUTE FUNCTION update_comment_reaction_count();

-- ============================================================================
-- 5. REVIEW REACTIONS TRIGGER
-- ============================================================================

-- Function to update review likes/dislikes count
CREATE OR REPLACE FUNCTION update_review_reaction_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment like or dislike count
    IF NEW.reaction_type = 'like' THEN
      UPDATE reviews
      SET likes = likes + 1
      WHERE id = NEW.review_id;
    ELSIF NEW.reaction_type = 'dislike' THEN
      UPDATE reviews
      SET dislikes = dislikes + 1
      WHERE id = NEW.review_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle reaction type change
    IF OLD.reaction_type = 'like' AND NEW.reaction_type = 'dislike' THEN
      UPDATE reviews
      SET likes = GREATEST(likes - 1, 0),
          dislikes = dislikes + 1
      WHERE id = NEW.review_id;
    ELSIF OLD.reaction_type = 'dislike' AND NEW.reaction_type = 'like' THEN
      UPDATE reviews
      SET dislikes = GREATEST(dislikes - 1, 0),
          likes = likes + 1
      WHERE id = NEW.review_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement like or dislike count
    IF OLD.reaction_type = 'like' THEN
      UPDATE reviews
      SET likes = GREATEST(likes - 1, 0)
      WHERE id = OLD.review_id;
    ELSIF OLD.reaction_type = 'dislike' THEN
      UPDATE reviews
      SET dislikes = GREATEST(dislikes - 1, 0)
      WHERE id = OLD.review_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_review_reaction_count ON review_reactions;

-- Create trigger for review_reactions table
CREATE TRIGGER trigger_update_review_reaction_count
AFTER INSERT OR UPDATE OR DELETE ON review_reactions
FOR EACH ROW
EXECUTE FUNCTION update_review_reaction_count();

-- ============================================================================
-- 6. RECALCULATE EXISTING COUNTS (ONE-TIME FIX)
-- ============================================================================

-- Recalculate novel vote counts from existing data
UPDATE novels n
SET total_votes = (
  SELECT COUNT(*)
  FROM novel_votes nv
  WHERE nv.novel_id = n.id
);

-- Recalculate comment likes/dislikes from existing data
UPDATE comments c
SET 
  likes = (
    SELECT COUNT(*)
    FROM comment_reactions cr
    WHERE cr.comment_id = c.id AND cr.reaction_type = 'like'
  ),
  dislikes = (
    SELECT COUNT(*)
    FROM comment_reactions cr
    WHERE cr.comment_id = c.id AND cr.reaction_type = 'dislike'
  );

-- Recalculate review likes/dislikes from existing data
UPDATE reviews r
SET 
  likes = (
    SELECT COUNT(*)
    FROM review_reactions rr
    WHERE rr.review_id = r.id AND rr.reaction_type = 'like'
  ),
  dislikes = (
    SELECT COUNT(*)
    FROM review_reactions rr
    WHERE rr.review_id = r.id AND rr.reaction_type = 'dislike'
  );

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these queries to verify the fixes are working:

-- 1. Check novel vote counts
-- SELECT 
--   n.id,
--   n.title,
--   n.total_votes,
--   COUNT(nv.id) as actual_votes
-- FROM novels n
-- LEFT JOIN novel_votes nv ON n.id = nv.novel_id
-- GROUP BY n.id, n.title, n.total_votes
-- HAVING n.total_votes != COUNT(nv.id);

-- 2. Check comment reaction counts
-- SELECT 
--   c.id,
--   c.likes,
--   c.dislikes,
--   COUNT(CASE WHEN cr.reaction_type = 'like' THEN 1 END) as actual_likes,
--   COUNT(CASE WHEN cr.reaction_type = 'dislike' THEN 1 END) as actual_dislikes
-- FROM comments c
-- LEFT JOIN comment_reactions cr ON c.id = cr.comment_id
-- GROUP BY c.id, c.likes, c.dislikes
-- HAVING c.likes != COUNT(CASE WHEN cr.reaction_type = 'like' THEN 1 END)
--    OR c.dislikes != COUNT(CASE WHEN cr.reaction_type = 'dislike' THEN 1 END);

-- ============================================================================
-- DONE
-- ============================================================================

-- All triggers and functions are now in place!
-- The app should now properly track:
-- ✅ Novel votes (total_votes updates automatically)
-- ✅ Chapter views (increments when chapter is opened)
-- ✅ Novel views (increments when novel is viewed)
-- ✅ Comment likes/dislikes (updates when reactions are added/removed)
-- ✅ Review likes/dislikes (updates when reactions are added/removed)
