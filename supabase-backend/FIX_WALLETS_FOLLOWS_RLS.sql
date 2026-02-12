-- ============================================================================
-- FIX_WALLETS_FOLLOWS_RLS.sql
-- ============================================================================
-- This script adds Row Level Security policies for the `wallets` and `follows`
-- tables. The 406 error occurs because RLS is enabled but no policies exist,
-- which blocks ALL access by default.
-- 
-- Run this in Supabase SQL Editor to fix the issue.
-- ============================================================================

-- ============================================================================
-- WALLETS TABLE RLS POLICIES
-- ============================================================================
-- Enable RLS on wallets table (if not already enabled)
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own wallet
CREATE POLICY "Users can view own wallet" ON public.wallets
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to insert their own wallet (for auto-creation)
CREATE POLICY "Users can create own wallet" ON public.wallets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own wallet
CREATE POLICY "Users can update own wallet" ON public.wallets
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- FOLLOWS TABLE RLS POLICIES
-- ============================================================================
-- Enable RLS on follows table (if not already enabled)
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Anyone can view follow relationships (for follower counts, etc.)
CREATE POLICY "Anyone can view follows" ON public.follows
  FOR SELECT USING (true);

-- Users can insert their own follow relationships
CREATE POLICY "Users can follow others" ON public.follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

-- Users can delete their own follow relationships (unfollow)
CREATE POLICY "Users can unfollow" ON public.follows
  FOR DELETE USING (auth.uid() = follower_id);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running, you can verify policies exist with:
-- SELECT * FROM pg_policies WHERE tablename IN ('wallets', 'follows');
