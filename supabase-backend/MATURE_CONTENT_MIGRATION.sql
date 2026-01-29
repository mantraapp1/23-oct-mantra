-- ============================================================================
-- MATURE CONTENT SYSTEM - DATABASE MIGRATION
-- ============================================================================
-- Run this SQL in your Supabase SQL Editor to enable the mature content system
-- NOTE: Your database already has the `age` field in profiles table!

-- 1. Add show_mature_content column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS show_mature_content BOOLEAN DEFAULT FALSE;

-- 2. Update RLS policy for novels to allow all users to see mature content
-- (The frontend will handle age gate confirmation)
DROP POLICY IF EXISTS "Novels are viewable based on age" ON novels;

-- Allow everyone to see all novels - frontend handles age gate
CREATE POLICY "Novels are viewable by everyone"
  ON novels FOR SELECT
  USING (true);

-- ============================================================================
-- The existing can_view_mature_content() function already checks age >= 18
-- No changes needed to that function!
-- ============================================================================

-- ============================================================================
-- AFTER RUNNING THIS MIGRATION:
-- 1. All novels (including mature) will be visible to everyone
-- 2. Mature novels will show 18+ badge on covers
-- 3. Users must confirm age gate modal when accessing mature novel details
-- 4. Users can toggle "Show Mature Content" in Settings (requires age >= 18)
-- ============================================================================
