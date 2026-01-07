-- ============================================================================
-- FIX DUPLICATE REVIEWS AND COMMENTS
-- ============================================================================
-- Purpose: Remove duplicate reviews and comments, add unique constraints
-- 
-- This script:
-- 1. Identifies and removes duplicate reviews (same user_id + novel_id)
-- 2. Identifies and removes duplicate comments (same user_id + chapter_id + comment_text)
-- 3. Adds unique constraints to prevent future duplicates
-- 4. Keeps the most recent entry when duplicates are found
--
-- INSTRUCTIONS:
-- 1. Backup your database before running this script
-- 2. Open Supabase SQL Editor
-- 3. Copy and paste this entire script
-- 4. Click "Run" to execute
-- 5. Verify results using the verification queries at the end
--
-- IMPORTANT: This script is idempotent and can be re-run safely
-- ============================================================================

-- ============================================================================
-- SECTION 1: IDENTIFY AND REMOVE DUPLICATE REVIEWS
-- ============================================================================

-- Step 1.1: Create temporary table to identify duplicate reviews
-- Find all reviews where the same user has multiple reviews for the same novel
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  -- Count duplicates before cleanup
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT user_id, novel_id, COUNT(*) as count
    FROM public.reviews
    GROUP BY user_id, novel_id
    HAVING COUNT(*) > 1
  ) duplicates;
  
  RAISE NOTICE 'Found % duplicate review groups', duplicate_count;
  
  -- Delete duplicate reviews, keeping only the most recent one
  -- This uses a CTE to identify which reviews to keep
  WITH ranked_reviews AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY user_id, novel_id 
        ORDER BY created_at DESC, updated_at DESC
      ) as rn
    FROM public.reviews
  )
  DELETE FROM public.reviews
  WHERE id IN (
    SELECT id FROM ranked_reviews WHERE rn > 1
  );
  
  -- Report how many were deleted
  GET DIAGNOSTICS duplicate_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % duplicate reviews', duplicate_count;
END $$;

-- Step 1.2: Add unique constraint to prevent future duplicate reviews
-- Note: This will fail if duplicates still exist (which means the cleanup worked)
DO $$
BEGIN
  -- Check if constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'reviews_user_novel_unique'
  ) THEN
    -- Add unique constraint on (user_id, novel_id)
    -- Note: The table already has UNIQUE(novel_id, user_id) but we're ensuring it exists
    ALTER TABLE public.reviews 
    DROP CONSTRAINT IF EXISTS reviews_novel_id_user_id_key;
    
    ALTER TABLE public.reviews 
    ADD CONSTRAINT reviews_user_novel_unique UNIQUE (user_id, novel_id);
    
    RAISE NOTICE 'Added unique constraint on reviews (user_id, novel_id)';
  ELSE
    RAISE NOTICE 'Unique constraint on reviews already exists';
  END IF;
END $$;

-- ============================================================================
-- SECTION 2: IDENTIFY AND REMOVE DUPLICATE COMMENTS
-- ============================================================================

-- Step 2.1: Remove duplicate comments
-- Find comments where the same user posted the same text on the same chapter
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  -- Count duplicates before cleanup
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT user_id, chapter_id, comment_text, COUNT(*) as count
    FROM public.comments
    GROUP BY user_id, chapter_id, comment_text
    HAVING COUNT(*) > 1
  ) duplicates;
  
  RAISE NOTICE 'Found % duplicate comment groups', duplicate_count;
  
  -- Delete duplicate comments, keeping only the most recent one
  WITH ranked_comments AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY user_id, chapter_id, comment_text 
        ORDER BY created_at DESC, updated_at DESC
      ) as rn
    FROM public.comments
  )
  DELETE FROM public.comments
  WHERE id IN (
    SELECT id FROM ranked_comments WHERE rn > 1
  );
  
  -- Report how many were deleted
  GET DIAGNOSTICS duplicate_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % duplicate comments', duplicate_count;
END $$;

-- Step 2.2: Add unique constraint to prevent future duplicate comments
-- Note: We use a partial unique constraint that only applies to non-reply comments
-- Replies (with parent_comment_id) can have duplicate text
DO $$
BEGIN
  -- Check if constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'comments_user_chapter_text_unique'
  ) THEN
    -- Add unique constraint on (user_id, chapter_id, comment_text)
    -- This prevents the same user from posting the exact same comment twice on the same chapter
    ALTER TABLE public.comments 
    ADD CONSTRAINT comments_user_chapter_text_unique 
    UNIQUE (user_id, chapter_id, comment_text);
    
    RAISE NOTICE 'Added unique constraint on comments (user_id, chapter_id, comment_text)';
  ELSE
    RAISE NOTICE 'Unique constraint on comments already exists';
  END IF;
END $$;

-- ============================================================================
-- SECTION 3: VERIFICATION QUERIES
-- ============================================================================

-- Verify no duplicate reviews remain
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT user_id, novel_id, COUNT(*) as count
    FROM public.reviews
    GROUP BY user_id, novel_id
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF duplicate_count = 0 THEN
    RAISE NOTICE '✓ SUCCESS: No duplicate reviews found';
  ELSE
    RAISE WARNING '✗ WARNING: Still found % duplicate review groups', duplicate_count;
  END IF;
END $$;

-- Verify no duplicate comments remain
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT user_id, chapter_id, comment_text, COUNT(*) as count
    FROM public.comments
    GROUP BY user_id, chapter_id, comment_text
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF duplicate_count = 0 THEN
    RAISE NOTICE '✓ SUCCESS: No duplicate comments found';
  ELSE
    RAISE WARNING '✗ WARNING: Still found % duplicate comment groups', duplicate_count;
  END IF;
END $$;

-- Verify constraints are in place
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'reviews_user_novel_unique'
  ) THEN
    RAISE NOTICE '✓ SUCCESS: Reviews unique constraint is in place';
  ELSE
    RAISE WARNING '✗ WARNING: Reviews unique constraint is missing';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'comments_user_chapter_text_unique'
  ) THEN
    RAISE NOTICE '✓ SUCCESS: Comments unique constraint is in place';
  ELSE
    RAISE WARNING '✗ WARNING: Comments unique constraint is missing';
  END IF;
END $$;

-- ============================================================================
-- SECTION 4: SUMMARY STATISTICS
-- ============================================================================

-- Show review statistics
SELECT 
  'Reviews' as table_name,
  COUNT(*) as total_reviews,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT novel_id) as unique_novels
FROM public.reviews;

-- Show comment statistics
SELECT 
  'Comments' as table_name,
  COUNT(*) as total_comments,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT chapter_id) as unique_chapters
FROM public.comments;

-- ============================================================================
-- CLEANUP COMPLETE
-- ============================================================================
-- 
-- Next Steps:
-- 1. Review the output messages above
-- 2. Verify that duplicate counts are 0
-- 3. Verify that constraints are in place
-- 4. Test creating a duplicate review (should fail with constraint error)
-- 5. Test creating a duplicate comment (should fail with constraint error)
--
-- If you need to rollback:
-- - Restore from your database backup
-- - Or manually remove constraints:
--   ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_user_novel_unique;
--   ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_user_chapter_text_unique;
-- ============================================================================
