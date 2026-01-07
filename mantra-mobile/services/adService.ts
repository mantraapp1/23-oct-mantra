import { supabase } from '../config/supabase';
import { handleSupabaseError } from '../utils/supabaseHelpers';

export interface AdViewResponse {
  success: boolean;
  message: string;
}

/**
 * Ad Service
 * Handles AdMob ad view tracking and earnings
 */
class AdService {
  /**
   * Record an ad view after successful ad completion
   */
  async recordAdView(
    userId: string,
    novelId: string,
    chapterId: string,
    authorId: string,
    adUnitId: string
  ): Promise<AdViewResponse> {
    try {
      // Check if user has already watched an ad for this chapter recently (within 72 hours)
      const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
      
      const { data: recentAdView, error: checkError } = await supabase
        .from('ads_view_records')
        .select('id')
        .eq('user_id', userId)
        .eq('chapter_id', chapterId)
        .gte('viewed_at', seventyTwoHoursAgo)
        .maybeSingle();

      if (checkError) throw checkError;

      if (recentAdView) {
        return {
          success: false,
          message: 'You have already watched an ad for this chapter recently',
        };
      }

      // Record the ad view
      const { error: insertError } = await supabase
        .from('ads_view_records')
        .insert({
          user_id: userId,
          novel_id: novelId,
          chapter_id: chapterId,
          author_id: authorId,
          ad_unit_id: adUnitId,
          payment_status: 'pending',
        });

      if (insertError) throw insertError;

      return {
        success: true,
        message: 'Ad view recorded successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: handleSupabaseError(error),
      };
    }
  }

  /**
   * Get unpaid ad views for an author
   */
  async getUnpaidAdViews(authorId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('ads_view_records')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', authorId)
        .eq('payment_status', 'pending');

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting unpaid ad views:', error);
      return 0;
    }
  }

  /**
   * Get total ad views for an author
   */
  async getTotalAdViews(authorId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('ads_view_records')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', authorId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting total ad views:', error);
      return 0;
    }
  }

  /**
   * Get ad views for a specific novel
   */
  async getNovelAdViews(novelId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('ads_view_records')
        .select('*', { count: 'exact', head: true })
        .eq('novel_id', novelId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting novel ad views:', error);
      return 0;
    }
  }

  /**
   * Get ad view statistics for author dashboard
   */
  async getAuthorAdStats(authorId: string): Promise<{
    totalViews: number;
    unpaidViews: number;
    paidViews: number;
  }> {
    try {
      const totalViews = await this.getTotalAdViews(authorId);
      const unpaidViews = await this.getUnpaidAdViews(authorId);
      const paidViews = totalViews - unpaidViews;

      return {
        totalViews,
        unpaidViews,
        paidViews,
      };
    } catch (error) {
      console.error('Error getting author ad stats:', error);
      return {
        totalViews: 0,
        unpaidViews: 0,
        paidViews: 0,
      };
    }
  }
}

export default new AdService();
