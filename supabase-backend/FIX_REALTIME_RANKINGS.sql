-- ============================================================
-- FIX REALTIME RANKINGS - Calculate ranks dynamically in real-time
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_realtime_rankings(p_sort_type text)
 RETURNS TABLE(
    id uuid, 
    title text, 
    description text, 
    cover_image_url text, 
    genres text[], 
    tags text[], 
    language text, 
    is_mature boolean, 
    status text, 
    total_chapters integer, 
    total_views integer, 
    total_votes integer, 
    average_rating numeric, 
    total_reviews integer, 
    author_id uuid, 
    author jsonb, 
    position_change integer, 
    rank_position integer
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    yesterday_date DATE := CURRENT_DATE - INTERVAL '1 day';
    total_novels integer;
BEGIN
    SELECT COUNT(*)::integer INTO total_novels FROM public.novels;

    RETURN QUERY
    WITH latest_snapshot_date AS (
        -- Get the most recent snapshot date before today, falling back to yesterday
        SELECT COALESCE(max(snapshot_date), CURRENT_DATE - 1) as max_date 
        FROM public.ranking_snapshots 
        WHERE sort_type = p_sort_type 
          AND snapshot_date < CURRENT_DATE
    ),
    current_ranks AS (
        -- Calculate rank positions in real-time based on the selected sort type
        SELECT 
            n.id AS novel_id,
            ROW_NUMBER() OVER (
                ORDER BY 
                    CASE WHEN p_sort_type = 'most_voted' THEN n.total_votes ELSE 0 END DESC,
                    CASE WHEN p_sort_type = 'trending' OR p_sort_type = 'most_viewed' THEN n.total_views ELSE 0 END DESC,
                    CASE WHEN p_sort_type = 'highest_rated' THEN n.average_rating ELSE 0.0 END DESC,
                    n.id ASC -- tie-breaker for stable ranking
            )::integer AS current_rank
        FROM public.novels n
        WHERE 
            CASE WHEN p_sort_type = 'highest_rated' THEN n.total_reviews >= 1 ELSE true END
    )
    SELECT 
        n.id,
        n.title,
        n.description,
        n.cover_image_url,
        n.genres,
        n.tags,
        n.language,
        n.is_mature,
        n.status::text,
        n.total_chapters,
        n.total_views,
        n.total_votes,
        n.average_rating,
        n.total_reviews,
        n.author_id,
        jsonb_build_object(
            'id', p.id,
            'username', p.username,
            'display_name', p.display_name,
            'profile_picture_url', p.profile_picture_url
        ) AS author,
        -- Calculate position change relative to the latest historical snapshot
        (COALESCE(snap.rank_position::integer, total_novels + 1) - cr.current_rank)::integer AS position_change,
        cr.current_rank AS rank_position
    FROM public.novels n
    JOIN current_ranks cr ON cr.novel_id = n.id
    LEFT JOIN public.profiles p ON p.id = n.author_id
    CROSS JOIN latest_snapshot_date lsd
    LEFT JOIN public.ranking_snapshots snap 
        ON snap.novel_id = n.id 
        AND snap.sort_type = p_sort_type 
        AND snap.snapshot_date = lsd.max_date
    ORDER BY cr.current_rank ASC;
END;
$function$;
