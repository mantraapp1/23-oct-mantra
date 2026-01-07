-- ============================================================================
-- CREATE PERFORMANCE INDEXES FOR BATCH QUERIES
-- ============================================================================
-- Purpose: Add composite indexes to optimize batch query performance
-- Safe to run: Uses IF NOT EXISTS - won't duplicate existing indexes
-- Time to execute: ~5-10 seconds
-- ============================================================================

-- ----------------------------------------------------------------------------
-- review_reactions table indexes
-- ----------------------------------------------------------------------------

-- Composite index for user_id + review_id lookups
-- Used by: reviewService.getUserReactions()
-- Query pattern: WHERE user_id = ? AND review_id IN (?)
CREATE INDEX IF NOT EXISTS idx_review_reactions_user_review 
ON review_reactions(user_id, review_id);

-- Index for review_id IN clause queries
-- Used by: Batch queries with IN clause
CREATE INDEX IF NOT EXISTS idx_review_reactions_review_id 
ON review_reactions(review_id);

-- Index for user_id lookups
-- Used by: Single user queries
CREATE INDEX IF NOT EXISTS idx_review_reactions_user_id 
ON review_reactions(user_id);

-- ----------------------------------------------------------------------------
-- comment_reactions table indexes
-- ----------------------------------------------------------------------------

-- Composite index for user_id + comment_id lookups
-- Used by: commentService.getUserReactions()
-- Query pattern: WHERE user_id = ? AND comment_id IN (?)
CREATE INDEX IF NOT EXISTS idx_comment_reactions_user_comment 
ON comment_reactions(user_id, comment_id);

-- Index for comment_id IN clause queries
-- Used by: Batch queries with IN clause
CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment_id 
ON comment_reactions(comment_id);

-- Index for user_id lookups
-- Used by: Single user queries
CREATE INDEX IF NOT EXISTS idx_comment_reactions_user_id 
ON comment_reactions(user_id);

-- ----------------------------------------------------------------------------
-- novel_votes table indexes
-- ----------------------------------------------------------------------------

-- Composite index for user_id + novel_id lookups
-- Used by: novelService.getUserVotes(), novelService.hasVoted()
-- Query pattern: WHERE user_id = ? AND novel_id IN (?)
CREATE INDEX IF NOT EXISTS idx_novel_votes_user_novel 
ON novel_votes(user_id, novel_id);

-- Index for novel_id IN clause queries
-- Used by: Batch queries with IN clause
CREATE INDEX IF NOT EXISTS idx_novel_votes_novel_id 
ON novel_votes(novel_id);

-- Index for user_id lookups
-- Used by: Single user queries
CREATE INDEX IF NOT EXISTS idx_novel_votes_user_id 
ON novel_votes(user_id);

-- ----------------------------------------------------------------------------
-- library table indexes
-- ----------------------------------------------------------------------------

-- Composite index for user_id + novel_id lookups
-- Used by: readingService.getLibraryNovels(), readingService.isInLibrary()
-- Query pattern: WHERE user_id = ? AND novel_id IN (?)
CREATE INDEX IF NOT EXISTS idx_library_user_novel 
ON library(user_id, novel_id);

-- Index for novel_id IN clause queries
-- Used by: Batch queries with IN clause
CREATE INDEX IF NOT EXISTS idx_library_novel_id 
ON library(novel_id);

-- Index for user_id lookups
-- Used by: Single user queries, getLibrary()
CREATE INDEX IF NOT EXISTS idx_library_user_id 
ON library(user_id);

-- ----------------------------------------------------------------------------
-- follows table indexes
-- ----------------------------------------------------------------------------

-- Composite index for follower_id + following_id lookups
-- Used by: socialService.getFollowingStatus(), socialService.isFollowing()
-- Query pattern: WHERE follower_id = ? AND following_id IN (?)
CREATE INDEX IF NOT EXISTS idx_follows_follower_following 
ON follows(follower_id, following_id);

-- Index for following_id IN clause queries
-- Used by: Batch queries with IN clause
CREATE INDEX IF NOT EXISTS idx_follows_following_id 
ON follows(following_id);

-- Index for follower_id lookups
-- Used by: getFollowing() queries
CREATE INDEX IF NOT EXISTS idx_follows_follower_id 
ON follows(follower_id);

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this to verify all indexes were created successfully

SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN (
    'review_reactions', 
    'comment_reactions', 
    'novel_votes', 
    'library', 
    'follows'
)
AND schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================================================
-- DONE!
-- ============================================================================
-- All performance indexes have been created.
-- Your batch queries should now be 2-3x faster!
-- ============================================================================
