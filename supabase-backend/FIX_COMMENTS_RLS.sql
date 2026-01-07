-- ============================================================================
-- FIX COMMENTS AND REACTIONS RLS POLICIES
-- ============================================================================
-- This script fixes Row Level Security policies for comments and reactions
-- Run this in Supabase SQL Editor if comments/reactions are not saving
-- ============================================================================

-- Check current RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('comments', 'comment_reactions', 'reviews', 'review_reactions')
  AND schemaname = 'public';

-- Check existing policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('comments', 'comment_reactions', 'reviews', 'review_reactions');

-- ============================================================================
-- ENABLE RLS ON TABLES (if not already enabled)
-- ============================================================================

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_reactions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DROP EXISTING POLICIES (to avoid conflicts)
-- ============================================================================

DROP POLICY IF EXISTS "Users can view all comments" ON public.comments;
DROP POLICY IF EXISTS "Users can insert their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;

DROP POLICY IF EXISTS "Users can view all comment reactions" ON public.comment_reactions;
DROP POLICY IF EXISTS "Users can insert their own comment reactions" ON public.comment_reactions;
DROP POLICY IF EXISTS "Users can delete their own comment reactions" ON public.comment_reactions;

DROP POLICY IF EXISTS "Users can view all reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can insert their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;

DROP POLICY IF EXISTS "Users can view all review reactions" ON public.review_reactions;
DROP POLICY IF EXISTS "Users can insert their own review reactions" ON public.review_reactions;
DROP POLICY IF EXISTS "Users can delete their own review reactions" ON public.review_reactions;

-- ============================================================================
-- COMMENTS TABLE POLICIES
-- ============================================================================

-- Allow everyone to view comments (including unauthenticated users)
CREATE POLICY "Users can view all comments"
ON public.comments
FOR SELECT
TO public
USING (true);

-- Allow authenticated users to insert their own comments
CREATE POLICY "Users can insert their own comments"
ON public.comments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own comments
CREATE POLICY "Users can update their own comments"
ON public.comments
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own comments
CREATE POLICY "Users can delete their own comments"
ON public.comments
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================================================
-- COMMENT REACTIONS TABLE POLICIES
-- ============================================================================

-- Allow everyone to view comment reactions
CREATE POLICY "Users can view all comment reactions"
ON public.comment_reactions
FOR SELECT
TO public
USING (true);

-- Allow authenticated users to insert their own reactions
CREATE POLICY "Users can insert their own comment reactions"
ON public.comment_reactions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own reactions (for unlike/undislike)
CREATE POLICY "Users can delete their own comment reactions"
ON public.comment_reactions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================================================
-- REVIEWS TABLE POLICIES
-- ============================================================================

-- Allow everyone to view reviews
CREATE POLICY "Users can view all reviews"
ON public.reviews
FOR SELECT
TO public
USING (true);

-- Allow authenticated users to insert their own reviews
CREATE POLICY "Users can insert their own reviews"
ON public.reviews
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own reviews
CREATE POLICY "Users can update their own reviews"
ON public.reviews
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own reviews
CREATE POLICY "Users can delete their own reviews"
ON public.reviews
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================================================
-- REVIEW REACTIONS TABLE POLICIES
-- ============================================================================

-- Allow everyone to view review reactions
CREATE POLICY "Users can view all review reactions"
ON public.review_reactions
FOR SELECT
TO public
USING (true);

-- Allow authenticated users to insert their own reactions
CREATE POLICY "Users can insert their own review reactions"
ON public.review_reactions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own reactions (for unlike/undislike)
CREATE POLICY "Users can delete their own review reactions"
ON public.review_reactions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check that RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('comments', 'comment_reactions', 'reviews', 'review_reactions')
  AND schemaname = 'public';

-- Check that policies are created
SELECT 
  tablename,
  policyname,
  cmd as operation,
  roles
FROM pg_policies
WHERE tablename IN ('comments', 'comment_reactions', 'reviews', 'review_reactions')
ORDER BY tablename, cmd;

-- Test comment insert (run this as an authenticated user)
-- INSERT INTO comments (user_id, chapter_id, comment_text)
-- VALUES (auth.uid(), 'your-chapter-id-here', 'Test comment')
-- RETURNING *;

-- Test comment reaction insert (run this as an authenticated user)
-- INSERT INTO comment_reactions (user_id, comment_id, reaction_type)
-- VALUES (auth.uid(), 'your-comment-id-here', 'like')
-- RETURNING *;
