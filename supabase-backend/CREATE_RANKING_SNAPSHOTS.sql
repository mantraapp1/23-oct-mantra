-- ============================================================
-- RANKING SNAPSHOTS - Track real position changes over time
-- ============================================================
-- This creates a system to store daily ranking snapshots so the
-- ranking page can show real position changes like "+3 positions"
-- Run this migration in the Supabase SQL Editor.
-- ============================================================

-- 1. Create the ranking_snapshots table
CREATE TABLE IF NOT EXISTS ranking_snapshots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    novel_id UUID NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    sort_type TEXT NOT NULL CHECK (sort_type IN ('trending', 'most_viewed', 'most_voted', 'highest_rated')),
    rank_position INTEGER NOT NULL,
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_views BIGINT DEFAULT 0,
    total_votes BIGINT DEFAULT 0,
    average_rating NUMERIC(3,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Each novel can only have one rank per sort_type per day
    UNIQUE(novel_id, sort_type, snapshot_date)
);

-- 2. Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_ranking_snapshots_date ON ranking_snapshots(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_ranking_snapshots_sort_date ON ranking_snapshots(sort_type, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_ranking_snapshots_novel ON ranking_snapshots(novel_id, sort_type, snapshot_date DESC);

-- 3. Enable RLS
ALTER TABLE ranking_snapshots ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they already exist
DROP POLICY IF EXISTS "ranking_snapshots_select_policy" ON ranking_snapshots;
DROP POLICY IF EXISTS "ranking_snapshots_insert_policy" ON ranking_snapshots;

-- Everyone can read ranking snapshots (public data)
CREATE POLICY "ranking_snapshots_select_policy" 
    ON ranking_snapshots FOR SELECT 
    USING (true);

-- Only service role / functions can insert (not regular users)
CREATE POLICY "ranking_snapshots_insert_policy" 
    ON ranking_snapshots FOR INSERT 
    WITH CHECK (true);


-- 4. Function to take a ranking snapshot for all sort types
CREATE OR REPLACE FUNCTION take_ranking_snapshot()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    today DATE := CURRENT_DATE;
BEGIN
    -- Trending / Most Viewed (sorted by total_views)
    INSERT INTO ranking_snapshots (novel_id, sort_type, rank_position, snapshot_date, total_views, total_votes, average_rating)
    SELECT 
        id,
        'trending',
        ROW_NUMBER() OVER (ORDER BY total_views DESC),
        today,
        total_views,
        total_votes,
        average_rating
    FROM novels
    ORDER BY total_views DESC
    LIMIT 50
    ON CONFLICT (novel_id, sort_type, snapshot_date) 
    DO UPDATE SET 
        rank_position = EXCLUDED.rank_position,
        total_views = EXCLUDED.total_views,
        total_votes = EXCLUDED.total_votes,
        average_rating = EXCLUDED.average_rating;

    -- Also save as most_viewed (same ordering)
    INSERT INTO ranking_snapshots (novel_id, sort_type, rank_position, snapshot_date, total_views, total_votes, average_rating)
    SELECT 
        id,
        'most_viewed',
        ROW_NUMBER() OVER (ORDER BY total_views DESC),
        today,
        total_views,
        total_votes,
        average_rating
    FROM novels
    ORDER BY total_views DESC
    LIMIT 50
    ON CONFLICT (novel_id, sort_type, snapshot_date) 
    DO UPDATE SET 
        rank_position = EXCLUDED.rank_position,
        total_views = EXCLUDED.total_views,
        total_votes = EXCLUDED.total_votes,
        average_rating = EXCLUDED.average_rating;

    -- Most Voted (sorted by total_votes)
    INSERT INTO ranking_snapshots (novel_id, sort_type, rank_position, snapshot_date, total_views, total_votes, average_rating)
    SELECT 
        id,
        'most_voted',
        ROW_NUMBER() OVER (ORDER BY total_votes DESC),
        today,
        total_views,
        total_votes,
        average_rating
    FROM novels
    ORDER BY total_votes DESC
    LIMIT 50
    ON CONFLICT (novel_id, sort_type, snapshot_date) 
    DO UPDATE SET 
        rank_position = EXCLUDED.rank_position,
        total_views = EXCLUDED.total_views,
        total_votes = EXCLUDED.total_votes,
        average_rating = EXCLUDED.average_rating;

    -- Highest Rated (sorted by average_rating, needs at least 1 review)
    INSERT INTO ranking_snapshots (novel_id, sort_type, rank_position, snapshot_date, total_views, total_votes, average_rating)
    SELECT 
        id,
        'highest_rated',
        ROW_NUMBER() OVER (ORDER BY average_rating DESC),
        today,
        total_views,
        total_votes,
        average_rating
    FROM novels
    WHERE total_reviews >= 1
    ORDER BY average_rating DESC
    LIMIT 50
    ON CONFLICT (novel_id, sort_type, snapshot_date) 
    DO UPDATE SET 
        rank_position = EXCLUDED.rank_position,
        total_views = EXCLUDED.total_views,
        total_votes = EXCLUDED.total_votes,
        average_rating = EXCLUDED.average_rating;
END;
$$;


-- 5. RPC to get position changes for a given sort type
-- Returns: novel_id, current_rank, previous_rank, position_change
CREATE OR REPLACE FUNCTION get_ranking_changes(p_sort_type TEXT)
RETURNS TABLE(
    novel_id UUID,
    current_rank INTEGER,
    previous_rank INTEGER,
    position_change INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    today DATE := CURRENT_DATE;
    yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
BEGIN
    RETURN QUERY
    SELECT 
        t.novel_id,
        t.rank_position AS current_rank,
        COALESCE(y.rank_position, 0) AS previous_rank,
        CASE 
            WHEN y.rank_position IS NULL THEN 0  -- New entry, no change
            ELSE y.rank_position - t.rank_position  -- Positive = moved up
        END AS position_change
    FROM ranking_snapshots t
    LEFT JOIN ranking_snapshots y 
        ON y.novel_id = t.novel_id 
        AND y.sort_type = t.sort_type 
        AND y.snapshot_date = yesterday
    WHERE t.sort_type = p_sort_type
        AND t.snapshot_date = today
    ORDER BY t.rank_position ASC;
END;
$$;


-- 6. Take the first snapshot immediately so data is available right away
SELECT take_ranking_snapshot();


-- ============================================================
-- OPTIONAL: Auto-snapshot with pg_cron (if pg_cron is enabled)
-- This runs take_ranking_snapshot() every day at midnight UTC.
-- If pg_cron is not available, you can call take_ranking_snapshot()
-- manually or from an Edge Function on a schedule.
-- ============================================================
-- Uncomment the lines below if pg_cron extension is enabled:
--
-- SELECT cron.schedule(
--     'daily-ranking-snapshot',
--     '0 0 * * *',
--     $$SELECT take_ranking_snapshot()$$
-- );

