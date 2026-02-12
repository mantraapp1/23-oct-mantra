-- ============================================================================
-- MIGRATE_TO_VIEW_BASED_PAYMENTS.sql
-- ============================================================================
-- Run this in Supabase SQL Editor to set up view-based author payments
-- This replaces the ad-view based payment system with chapter-view tracking
-- ============================================================================

-- 1. Create chapter_views_for_payment table
-- Tracks chapter views that need to be processed for author payments
CREATE TABLE IF NOT EXISTS public.chapter_views_for_payment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    novel_id UUID NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    viewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Can be null for anonymous viewers
    viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    paid BOOLEAN NOT NULL DEFAULT false,
    paid_at TIMESTAMP WITH TIME ZONE,
    payment_amount NUMERIC(20, 7),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_chapter_views_author_paid 
    ON chapter_views_for_payment(author_id, paid);

CREATE INDEX IF NOT EXISTS idx_chapter_views_paid 
    ON chapter_views_for_payment(paid) WHERE paid = false;

CREATE INDEX IF NOT EXISTS idx_chapter_views_viewed_at 
    ON chapter_views_for_payment(viewed_at);

-- 3. Enable RLS
ALTER TABLE chapter_views_for_payment ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies first (idempotent)
DROP POLICY IF EXISTS "Authors can view their chapter views" ON chapter_views_for_payment;
DROP POLICY IF EXISTS "Anyone can insert chapter views" ON chapter_views_for_payment;
DROP POLICY IF EXISTS "Service can update chapter views" ON chapter_views_for_payment;

-- RLS Policies
-- Authors can view their own chapter views
CREATE POLICY "Authors can view their chapter views"
    ON chapter_views_for_payment FOR SELECT
    USING (auth.uid() = author_id);

-- System can insert views (uses service role in backend)
CREATE POLICY "Anyone can insert chapter views"
    ON chapter_views_for_payment FOR INSERT
    WITH CHECK (true);

-- System can update views (mark as paid)
CREATE POLICY "Service can update chapter views"
    ON chapter_views_for_payment FOR UPDATE
    USING (true);

-- 5. Create chapter_unlocks table for tracking per-user unlocks
CREATE TABLE IF NOT EXISTS public.chapter_unlocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    novel_id UUID NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    timer_start TIMESTAMP WITH TIME ZONE,
    unlocked_at TIMESTAMP WITH TIME ZONE,
    unlock_method TEXT CHECK (unlock_method IN ('timer', 'ad', 'coins')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, chapter_id)
);

-- Indexes for chapter_unlocks
CREATE INDEX IF NOT EXISTS idx_chapter_unlocks_user_chapter 
    ON chapter_unlocks(user_id, chapter_id);

-- Enable RLS for chapter_unlocks
ALTER TABLE chapter_unlocks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (idempotent)
DROP POLICY IF EXISTS "Users can view their own unlocks" ON chapter_unlocks;
DROP POLICY IF EXISTS "Users can create their own unlocks" ON chapter_unlocks;
DROP POLICY IF EXISTS "Users can update their own unlocks" ON chapter_unlocks;

-- RLS Policies for chapter_unlocks
CREATE POLICY "Users can view their own unlocks"
    ON chapter_unlocks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own unlocks"
    ON chapter_unlocks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own unlocks"
    ON chapter_unlocks FOR UPDATE
    USING (auth.uid() = user_id);

-- 6. Function to get unpaid views count by author
CREATE OR REPLACE FUNCTION get_unpaid_views_by_author()
RETURNS TABLE (
    author_id UUID,
    view_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cv.author_id,
        COUNT(*)::BIGINT as view_count
    FROM chapter_views_for_payment cv
    WHERE cv.paid = false
    GROUP BY cv.author_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON chapter_views_for_payment TO authenticated;
GRANT SELECT, INSERT, UPDATE ON chapter_views_for_payment TO service_role;
GRANT SELECT, INSERT, UPDATE ON chapter_unlocks TO authenticated;
GRANT SELECT, INSERT, UPDATE ON chapter_unlocks TO service_role;
GRANT EXECUTE ON FUNCTION get_unpaid_views_by_author TO service_role;

-- 8. Comment the tables
COMMENT ON TABLE chapter_views_for_payment IS 'Tracks chapter views for author payment processing. Views are marked paid after distribution.';
COMMENT ON TABLE chapter_unlocks IS 'Tracks per-user chapter unlock status (timer or ad-based).';

-- ============================================================================
-- DONE! Run this script in your Supabase SQL Editor
-- ============================================================================
