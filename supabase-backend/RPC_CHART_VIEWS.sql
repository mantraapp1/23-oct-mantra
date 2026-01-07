-- ============================================================================
-- RPC Function: get_novel_views_by_period
-- ============================================================================
-- Description: 
-- Returns novel views aggregated by time period for chart display.
-- Properly groups views by ACTUAL dates, not current date buckets.
--
-- Parameters:
--   novel_id_param: UUID of the novel
--   period_param: '7d', '1m', '3m', '1y', or 'all'
--
-- Returns: JSONB array of { label: string, views: number }
--
-- Usage:
-- SELECT get_novel_views_by_period('uuid-here', '7d');
-- supabase.rpc('get_novel_views_by_period', { novel_id_param: 'UUID', period_param: '7d' })
-- ============================================================================

CREATE OR REPLACE FUNCTION get_novel_views_by_period(
  novel_id_param UUID,
  period_param TEXT
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  CASE period_param
    -- Last 7 days: GROUP BY date
    WHEN '7d' THEN
      SELECT jsonb_agg(row_to_json(d) ORDER BY d.date_order) INTO result FROM (
        SELECT 
          TO_CHAR(viewed_at, 'Mon DD') as label,
          COUNT(*)::INT as views,
          DATE(viewed_at) as date_order
        FROM public.novel_views
        WHERE novel_id = novel_id_param
          AND viewed_at >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(viewed_at), TO_CHAR(viewed_at, 'Mon DD')
        ORDER BY DATE(viewed_at)
      ) d;
      
    -- Last 30 days (1 month): GROUP BY week
    WHEN '1m' THEN
      SELECT jsonb_agg(row_to_json(d) ORDER BY d.week_order) INTO result FROM (
        SELECT 
          'Week ' || (ROW_NUMBER() OVER (ORDER BY DATE_TRUNC('week', viewed_at)))::TEXT as label,
          COUNT(*)::INT as views,
          DATE_TRUNC('week', viewed_at) as week_order
        FROM public.novel_views
        WHERE novel_id = novel_id_param
          AND viewed_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE_TRUNC('week', viewed_at)
        ORDER BY DATE_TRUNC('week', viewed_at)
      ) d;
      
    -- Last 90 days (3 months): GROUP BY month
    WHEN '3m' THEN
      SELECT jsonb_agg(row_to_json(d) ORDER BY d.month_order) INTO result FROM (
        SELECT 
          TO_CHAR(DATE_TRUNC('month', viewed_at), 'Mon YYYY') as label,
          COUNT(*)::INT as views,
          DATE_TRUNC('month', viewed_at) as month_order
        FROM public.novel_views
        WHERE novel_id = novel_id_param
          AND viewed_at >= NOW() - INTERVAL '90 days'
        GROUP BY DATE_TRUNC('month', viewed_at)
        ORDER BY DATE_TRUNC('month', viewed_at)
      ) d;
      
    -- Last 365 days (1 year): GROUP BY month
    WHEN '1y' THEN
      SELECT jsonb_agg(row_to_json(d) ORDER BY d.month_order) INTO result FROM (
        SELECT 
          TO_CHAR(DATE_TRUNC('month', viewed_at), 'Mon YYYY') as label,
          COUNT(*)::INT as views,
          DATE_TRUNC('month', viewed_at) as month_order
        FROM public.novel_views
        WHERE novel_id = novel_id_param
          AND viewed_at >= NOW() - INTERVAL '365 days'
        GROUP BY DATE_TRUNC('month', viewed_at)
        ORDER BY DATE_TRUNC('month', viewed_at)
      ) d;
      
    -- All time: GROUP BY month+year
    WHEN 'all' THEN
      SELECT jsonb_agg(row_to_json(d) ORDER BY d.month_order) INTO result FROM (
        SELECT 
          TO_CHAR(DATE_TRUNC('month', viewed_at), 'Mon YYYY') as label,
          COUNT(*)::INT as views,
          DATE_TRUNC('month', viewed_at) as month_order
        FROM public.novel_views
        WHERE novel_id = novel_id_param
        GROUP BY DATE_TRUNC('month', viewed_at)
        ORDER BY DATE_TRUNC('month', viewed_at)
      ) d;
      
    ELSE
      result := '[]'::JSONB;
  END CASE;
  
  RETURN COALESCE(result, '[]'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_novel_views_by_period(UUID, TEXT) TO authenticated;
