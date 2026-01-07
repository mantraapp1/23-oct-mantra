-- ============================================================================
-- RPC Function: get_novel_market_analytics
-- ============================================================================
-- Description: 
-- Calculates advanced analytics for a novel that are difficult to do efficiently 
-- on the client side, including:
-- 1. Real reader demographics (age distribution) from reading_progress + profiles
-- 2. Estimated average reading time based on chapters read and word counts
--
-- Usage:
-- supabase.rpc('get_novel_market_analytics', { novel_id_param: 'UUID' })
-- ============================================================================

CREATE OR REPLACE FUNCTION get_novel_market_analytics(novel_id_param UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    demographics JSONB;
    reading_time_val DECIMAL;
BEGIN
    -- 1. Calculate Demographics
    -- Joins reading_progress with profiles to segment readers by age
    SELECT jsonb_agg(d) INTO demographics FROM (
        SELECT 
            CASE 
                WHEN p.age < 18 THEN 'Under 18'
                WHEN p.age BETWEEN 18 AND 24 THEN '18-24 years'
                WHEN p.age BETWEEN 25 AND 34 THEN '25-34 years'
                WHEN p.age BETWEEN 35 AND 44 THEN '35-44 years'
                ELSE '45+ years'
            END as label,
            COUNT(*)::INT as value,
            (COUNT(*)::DECIMAL / NULLIF(SUM(COUNT(*)) OVER(), 0) * 100)::DECIMAL(5,1) as percentage,
            CASE 
                WHEN p.age < 18 THEN '#fbbf24'       -- Amber
                WHEN p.age BETWEEN 18 AND 24 THEN '#0ea5e9' -- Sky Blue
                WHEN p.age BETWEEN 25 AND 34 THEN '#6366f1' -- Indigo
                WHEN p.age BETWEEN 35 AND 44 THEN '#8b5cf6' -- Violet
                ELSE '#ec4899'                       -- Pink
            END as color
        FROM public.profiles p
        JOIN public.reading_progress rp ON p.id = rp.user_id
        WHERE rp.novel_id = novel_id_param
        GROUP BY 1, 4  -- Group by Label and Color
        ORDER BY value DESC
    ) d;

    -- 2. Calculate Estimated Avg Reading Time (minutes)
    -- Formula: Average of (User's Total Chapters Read * Avg Word Count per Chapter / 200 WPM)
    SELECT AVG(
        rp.chapters_read * (
            SELECT COALESCE(AVG(word_count), 2000) / 200.0 -- 200 words per minute avg reading speed
            FROM public.chapters 
            WHERE novel_id = novel_id_param
        )
    ) INTO reading_time_val
    FROM public.reading_progress rp
    WHERE rp.novel_id = novel_id_param;

    -- 3. Build Final Result
    result = jsonb_build_object(
        'demographics', COALESCE(demographics, '[]'::jsonb),
        'avg_reading_time', COALESCE(reading_time_val, 0)
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
